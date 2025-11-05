/**
 * API para processar áudio dos drones e detectar disparos
 */
import { NextResponse, NextRequest } from 'next/server';
import { extractAudioFeatures, normalize, base64ToFloat32Array } from '@/lib/audioUtils';
import { classifyGunshot } from '@/lib/dtwUtils';
import { DroneAudioData, triangulateTDOA, GeoPosition } from '@/lib/geoUtils';

// Armazena dados de áudio recebidos de múltiplos drones
// Em produção, isso seria um database ou cache (Redis)
const audioBuffers: Map<string, Map<string, DroneAudioData>> = new Map();

// Timeout para considerar que todos os drones enviaram dados
const SYNC_TIMEOUT_MS = 5000;

// Templates carregados (simulação - em produção viria do database)
let gunshotTemplates: number[][] = [];
let ambientTemplates: number[][] = [];

/**
 * Inicializa templates (simulação)
 * Em produção, isso carregaria arquivos WAV do database
 */
function initializeTemplates() {
  if (gunshotTemplates.length === 0) {
    // Simula templates de disparos (features normalizadas)
    for (let i = 0; i < 5; i++) {
      const template: number[] = [];
      for (let j = 0; j < 50; j++) {
        // Padrão característico: pico rápido de energia
        template.push(Math.exp(-Math.pow(j - 10, 2) / 20) + Math.random() * 0.1);
      }
      gunshotTemplates.push(normalize(template));
    }

    // Simula templates de sons ambiente
    for (let i = 0; i < 5; i++) {
      const template: number[] = [];
      for (let j = 0; j < 50; j++) {
        // Padrão mais uniforme
        template.push(0.3 + Math.random() * 0.2);
      }
      ambientTemplates.push(normalize(template));
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    initializeTemplates();

    const body = await request.json();
    const { sessionId, droneId, audioData, position, timestamp } = body;

    console.log(`[ANALYZE POST] Recebido - SessionId: ${sessionId}, DroneId: ${droneId}`);

    if (!sessionId || !droneId || !audioData || !position) {
      console.error(`[ANALYZE POST] Campos faltando - sessionId: ${!!sessionId}, droneId: ${!!droneId}, audioData: ${!!audioData}, position: ${!!position}`);
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Converte áudio base64 para Float32Array
    const audioFloat32 = base64ToFloat32Array(audioData);
    console.log(`[ANALYZE POST] Áudio convertido - ${audioFloat32.length} samples`);

    // Extrai features do áudio
    const features = extractAudioFeatures(audioFloat32);
    const normalizedEnergy = normalize(features.energy);

    // Detecta o pico de energia (momento de chegada do som)
    const maxEnergyIndex = normalizedEnergy.indexOf(Math.max(...normalizedEnergy));
    const timeOfArrival = (maxEnergyIndex * 512) / 44100; // convertendo índice para segundos

    console.log(`[ANALYZE POST] ${droneId} - TOA: ${timeOfArrival.toFixed(4)}s, maxEnergy @ index ${maxEnergyIndex}`);

    // Armazena dados do drone
    if (!audioBuffers.has(sessionId)) {
      audioBuffers.set(sessionId, new Map());
      console.log(`[ANALYZE POST] Nova sessão criada: ${sessionId}`);
    }

    const sessionData = audioBuffers.get(sessionId)!;
    
    // Verifica se já existe este droneId (previne duplicatas)
    if (sessionData.has(droneId)) {
      console.warn(`[ANALYZE POST] ⚠️ DUPLICATA DETECTADA: ${droneId} já foi armazenado nesta sessão! Ignorando...`);
      return NextResponse.json({
        success: true,
        droneId,
        message: 'Duplicate drone ignored',
        dronesReceived: sessionData.size,
        isDuplicate: true
      });
    }
    
    sessionData.set(droneId, {
      droneId,
      position,
      audioFeatures: normalizedEnergy,
      timestamp,
      timeOfArrival
    });

    console.log(`[ANALYZE POST] ${droneId} armazenado. Total na sessão: ${sessionData.size}`);

    return NextResponse.json({
      success: true,
      droneId,
      message: 'Audio data received',
      dronesReceived: sessionData.size
    });

  } catch (error) {
    console.error('[ANALYZE POST] Erro ao processar áudio:', error);
    return NextResponse.json({ error: 'Failed to process audio' }, { status: 500 });
  }
}

/**
 * Endpoint GET para verificar se há detecção de disparo
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const expectedDrones = parseInt(searchParams.get('expectedDrones') || '0');

    console.log(`[ANALYZE GET] SessionId: ${sessionId}, Expected: ${expectedDrones}`);

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    const sessionData = audioBuffers.get(sessionId);
    
    if (!sessionData || sessionData.size < expectedDrones) {
      console.log(`[ANALYZE GET] Not ready - Received: ${sessionData?.size || 0}/${expectedDrones}`);
      return NextResponse.json({
        ready: false,
        dronesReceived: sessionData?.size || 0,
        expectedDrones
      });
    }

    console.log(`[ANALYZE GET] All drones received, processing...`);

    // Todos os drones enviaram dados - processa
    const droneDataArray = Array.from(sessionData.values());

    // Classifica cada áudio
    const classifications = droneDataArray.map(droneData => {
      const result = classifyGunshot(
        droneData.audioFeatures,
        gunshotTemplates,
        ambientTemplates,
        0.3 // threshold
      );
      console.log(`[CLASSIFY] ${droneData.droneId}: isGunshot=${result.isGunshot}, confidence=${result.confidence.toFixed(3)}, gunshot_dist=${result.gunshotDistance.toFixed(3)}, ambient_dist=${result.ambientDistance.toFixed(3)}`);
      return result;
    });

    // Verifica se maioria dos drones detectou disparo
    const gunshotDetections = classifications.filter(c => c.isGunshot).length;
    const isGunshot = gunshotDetections >= Math.ceil(droneDataArray.length / 2);

    console.log(`[ANALYZE] Gunshot detections: ${gunshotDetections}/${droneDataArray.length}, isGunshot: ${isGunshot}`);

    let calculatedPosition: GeoPosition | null = null;

    if (isGunshot) {
      // Triangula posição usando TDOA
      console.log('[ANALYZE] Triangulating position...');
      calculatedPosition = triangulateTDOA(droneDataArray);
      console.log('[ANALYZE] Calculated position:', calculatedPosition);
    } else {
      console.log('[ANALYZE] No gunshot detected, skipping triangulation');
    }

    // Limpa buffer da sessão
    audioBuffers.delete(sessionId);

    const response = {
      ready: true,
      isGunshot,
      confidence: classifications.reduce((sum, c) => sum + c.confidence, 0) / classifications.length,
      gunshotDetections,
      totalDrones: droneDataArray.length,
      calculatedPosition,
      classifications: classifications.map((c, i) => ({
        droneId: droneDataArray[i].droneId,
        isGunshot: c.isGunshot,
        confidence: c.confidence
      }))
    };

    console.log('[ANALYZE] Response:', JSON.stringify(response, null, 2));

    return NextResponse.json(response);

  } catch (error) {
    console.error('Erro ao analisar detecção:', error);
    return NextResponse.json({ error: 'Failed to analyze detection' }, { status: 500 });
  }
}
