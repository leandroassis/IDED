/**
 * API para processar áudio dos drones e detectar disparos
 */
import { NextResponse, NextRequest } from 'next/server';
import { extractAudioFeatures, normalize, base64ToFloat32Array } from '@/lib/audioUtils';
import { classifyGunshot } from '@/lib/dtwUtils';
import { DroneAudioData, triangulateTDOA, triangulateTDOAWithDetails, GeoPosition } from '@/lib/geoUtils';

// Armazena dados de áudio recebidos de múltiplos drones
// Em produção, isso seria um database ou cache (Redis)
const audioBuffers: Map<string, Map<string, DroneAudioData>> = new Map();

// Timeout para considerar que todos os drones enviaram dados
const SYNC_TIMEOUT_MS = 5000;

// Threshold para ativar votação ponderada (5% dos drones com detecção)
const WEIGHTED_VOTE_THRESHOLD = 0.05;

// Peso máximo para drones mais próximos (exponencial decay)
const DISTANCE_WEIGHT_DECAY = 0.1; // Menor = decay mais agressivo

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

/**
 * Calcula distância entre drone e posição estimada (Haversine)
 */
function calculateDistance(
  pos1: { lon: number; lat: number },
  pos2: { lon: number; lat: number }
): number {
  const R = 6371000; // Raio da Terra em metros
  const φ1 = (pos1.lat * Math.PI) / 180;
  const φ2 = (pos2.lat * Math.PI) / 180;
  const Δφ = ((pos2.lat - pos1.lat) * Math.PI) / 180;
  const Δλ = ((pos2.lon - pos1.lon) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calcula peso baseado na distância (exponencial decay)
 * Drones mais próximos têm peso maior
 */
function calculateDistanceWeight(distance: number): number {
  // Peso = e^(-decay × distance)
  // Exemplo: distance=0m → weight=1.0
  //          distance=100m → weight≈0.37
  //          distance=500m → weight≈0.007
  return Math.exp(-DISTANCE_WEIGHT_DECAY * distance);
}

/**
 * Decisão ponderada por distância
 * Retorna true se votação ponderada indica disparo
 */
function weightedVoteDecision(
  droneDataArray: DroneAudioData[],
  classifications: Array<{ isGunshot: boolean; confidence: number }>,
  estimatedPosition: GeoPosition
): { isGunshot: boolean; weightedScore: number; totalWeight: number } {
  let gunshotWeightedScore = 0;
  let totalWeight = 0;

  console.log('[WEIGHTED VOTE] Iniciando votação ponderada por distância');
  console.log(`[WEIGHTED VOTE] Posição estimada: lat=${estimatedPosition.lat.toFixed(6)}, lon=${estimatedPosition.lon.toFixed(6)}`);

  for (let i = 0; i < droneDataArray.length; i++) {
    const drone = droneDataArray[i];
    const classification = classifications[i];

    // Calcula distância do drone à posição estimada
    const distance = calculateDistance(drone.position, estimatedPosition);
    
    // Calcula peso baseado na distância
    const weight = calculateDistanceWeight(distance);

    // Se o drone detectou disparo, adiciona o peso
    if (classification.isGunshot) {
      gunshotWeightedScore += weight * classification.confidence;
    }

    totalWeight += weight;

    console.log(
      `[WEIGHTED VOTE] ${drone.droneId}: ` +
      `isGunshot=${classification.isGunshot}, ` +
      `confidence=${classification.confidence.toFixed(3)}, ` +
      `distance=${distance.toFixed(2)}m, ` +
      `weight=${weight.toFixed(4)}`
    );
  }

  // Normaliza score (0 a 1)
  const normalizedScore = totalWeight > 0 ? gunshotWeightedScore / totalWeight : 0;
  
  // Threshold: considera disparo se score normalizado > 0.5
  const isGunshot = normalizedScore > 0.5;

  console.log(
    `[WEIGHTED VOTE] Resultado: ` +
    `score=${normalizedScore.toFixed(4)}, ` +
    `isGunshot=${isGunshot}`
  );

  return {
    isGunshot,
    weightedScore: normalizedScore,
    totalWeight
  };
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

    // Conta quantos drones detectaram disparo
    const gunshotDetections = classifications.filter(c => c.isGunshot).length;
    const detectionRate = gunshotDetections / droneDataArray.length;

    console.log(`[ANALYZE] Gunshot detections: ${gunshotDetections}/${droneDataArray.length} (${(detectionRate * 100).toFixed(1)}%)`);

    // Decide se usa votação ponderada
    const useWeightedVote = detectionRate >= WEIGHTED_VOTE_THRESHOLD;
    
    let isGunshot = false;
    let calculatedPosition: GeoPosition | null = null;
    let weightedScore = 0;
    let decisionMethod = 'simple_majority';
    let droneEstimates: any[] = [];

    if (useWeightedVote) {
      console.log(`[ANALYZE] ✅ ${(detectionRate * 100).toFixed(1)}% detectaram disparo (≥ ${(WEIGHTED_VOTE_THRESHOLD * 100)}%) - Usando votação PONDERADA por distância`);
      
      // Primeiro, faz triangulação preliminar para ter posição estimada COM detalhes
      const triangulationResult = triangulateTDOAWithDetails(droneDataArray);
      
      if (triangulationResult) {
        calculatedPosition = triangulationResult.finalPosition;
        droneEstimates = triangulationResult.droneEstimates;
        
        // Usa votação ponderada por distância
        const weightedResult = weightedVoteDecision(
          droneDataArray,
          classifications,
          calculatedPosition
        );
        
        isGunshot = weightedResult.isGunshot;
        weightedScore = weightedResult.weightedScore;
        decisionMethod = 'weighted_by_distance';
        
        console.log(`[ANALYZE] Decisão ponderada: isGunshot=${isGunshot}, score=${weightedScore.toFixed(4)}`);
      } else {
        console.warn('[ANALYZE] ⚠️ Triangulação falhou, voltando para voto simples');
        isGunshot = gunshotDetections >= Math.ceil(droneDataArray.length / 2);
        decisionMethod = 'simple_majority_fallback';
      }
    } else {
      console.log(`[ANALYZE] ℹ️ ${(detectionRate * 100).toFixed(1)}% detectaram disparo (< ${(WEIGHTED_VOTE_THRESHOLD * 100)}%) - Usando voto SIMPLES`);
      
      // Voto simples (maioria)
      isGunshot = gunshotDetections >= Math.ceil(droneDataArray.length / 2);
      
      // Se detectou disparo, triangula posição COM detalhes
      if (isGunshot) {
        console.log('[ANALYZE] Triangulating position...');
        const triangulationResult = triangulateTDOAWithDetails(droneDataArray);
        if (triangulationResult) {
          calculatedPosition = triangulationResult.finalPosition;
          droneEstimates = triangulationResult.droneEstimates;
        }
        console.log('[ANALYZE] Calculated position:', calculatedPosition);
      }
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
      droneEstimates, // Adicionado: estimativas individuais de cada drone
      decisionMethod, // 'simple_majority', 'weighted_by_distance', ou 'simple_majority_fallback'
      weightedScore: useWeightedVote ? weightedScore : undefined,
      detectionRate: detectionRate,
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
