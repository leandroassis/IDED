/**
 * API para simular um som ambiente (não-disparo) e gerar áudio para os drones
 * Usa arquivos WAV reais do database
 */
import { NextResponse, NextRequest } from 'next/server';
import { simulateDroneAudioCapture, float32ArrayToBase64, wavBufferToFloat32Array } from '@/lib/audioUtils';
import { calculateDistance, GeoPosition } from '@/lib/geoUtils';
import { getRandomValidationFile, readAudioFile } from '@/lib/databaseUtils';

/**
 * Carrega áudio ambiente real do database
 */
function loadAmbientAudio(): { audio: Float32Array; filename: string } | null {
  const filename = getRandomValidationFile('ambient');
  
  if (!filename) {
    console.error('Nenhum arquivo ambient encontrado no database');
    return null;
  }
  
  const buffer = readAudioFile(filename);
  
  if (!buffer) {
    console.error(`Falha ao ler arquivo: ${filename}`);
    return null;
  }
  
  const audio = wavBufferToFloat32Array(buffer);
  console.log(`Áudio ambiente carregado: ${filename} (${audio.length} samples)`);
  
  return { audio, filename };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ambientPosition, dronePositions } = body;

    console.log(`[SIMULATE AMBIENT] Recebido - Drones: ${dronePositions?.length || 0}`);
    console.log(`[SIMULATE AMBIENT] DroneIds recebidos:`, dronePositions.map((d: any, idx: number) => `[${idx}]=${d.droneId}`));

    if (!ambientPosition || !dronePositions || !Array.isArray(dronePositions)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const soundPos: GeoPosition = ambientPosition;

    // Carrega áudio ambiente real do database
    const audioData = loadAmbientAudio();
    
    if (!audioData) {
      return NextResponse.json({ error: 'Failed to load ambient audio' }, { status: 500 });
    }
    
    const { audio: originalAudio, filename } = audioData;

    console.log(`[SIMULATE AMBIENT] Processando ${dronePositions.length} drones...`);

    // Simula captura por cada drone
    const droneAudioData = dronePositions.map((dronePos: any) => {
      const distance = calculateDistance(soundPos, dronePos.position);
      
      console.log(`[SIMULATE AMBIENT] ${dronePos.droneId} - Distância: ${distance.toFixed(2)}m`);
      
      // Simula captura com atenuação e delay baseado na distância
      const capturedAudio = simulateDroneAudioCapture(originalAudio, distance);
      
      // Converte para base64
      const audioBase64 = float32ArrayToBase64(capturedAudio);

      return {
        droneId: dronePos.droneId,
        audioData: audioBase64,
        distance,
        position: dronePos.position
      };
    });

    console.log(`[SIMULATE AMBIENT] Simulação completa. Áudios gerados: ${droneAudioData.length}`);
    console.log(`[SIMULATE AMBIENT] DroneIds gerados:`, droneAudioData.map((d: any, idx: number) => `[${idx}]=${d.droneId}`));

    // Converte áudio original para base64 para reprodução no navegador
    const originalAudioBase64 = float32ArrayToBase64(originalAudio);

    return NextResponse.json({
      success: true,
      ambientPosition: soundPos,
      droneAudioData,
      originalAudio: originalAudioBase64,
      filename,
      message: 'Ambient sound simulated successfully'
    });

  } catch (error) {
    console.error('[SIMULATE AMBIENT] Erro ao simular som ambiente:', error);
    return NextResponse.json({ error: 'Failed to simulate ambient sound' }, { status: 500 });
  }
}
