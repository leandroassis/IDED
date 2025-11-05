/**
 * API para simular um disparo e gerar áudio para os drones
 * Usa arquivos WAV reais do database
 */
import { NextResponse, NextRequest } from 'next/server';
import { simulateDroneAudioCapture, float32ArrayToBase64, wavBufferToFloat32Array } from '@/lib/audioUtils';
import { calculateDistance, GeoPosition } from '@/lib/geoUtils';
import { getRandomValidationFile, readAudioFile } from '@/lib/databaseUtils';

/**
 * Carrega áudio de disparo real do database
 */
function loadGunshotAudio(): { audio: Float32Array; filename: string } | null {
  const filename = getRandomValidationFile('gunshot');
  
  if (!filename) {
    console.error('Nenhum arquivo de gunshot encontrado no database');
    return null;
  }
  
  const buffer = readAudioFile(filename);
  
  if (!buffer) {
    console.error(`Falha ao ler arquivo: ${filename}`);
    return null;
  }
  
  const audio = wavBufferToFloat32Array(buffer);
  console.log(`Áudio de disparo carregado: ${filename} (${audio.length} samples)`);
  
  return { audio, filename };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gunshotPosition, dronePositions } = body;

    if (!gunshotPosition || !dronePositions || !Array.isArray(dronePositions)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const shotPos: GeoPosition = gunshotPosition;

    // Carrega áudio real de disparo do database
    const audioData = loadGunshotAudio();
    
    if (!audioData) {
      return NextResponse.json({ error: 'Failed to load gunshot audio' }, { status: 500 });
    }
    
    const { audio: originalAudio, filename } = audioData;

    // Simula captura por cada drone
    const droneAudioData = dronePositions.map((dronePos: any) => {
      const distance = calculateDistance(shotPos, dronePos.position);
      
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

    // Converte áudio original para base64 para reprodução no navegador
    const originalAudioBase64 = float32ArrayToBase64(originalAudio);

    return NextResponse.json({
      success: true,
      gunshotPosition: shotPos,
      droneAudioData,
      originalAudio: originalAudioBase64,
      filename,
      message: 'Gunshot simulated successfully'
    });

  } catch (error) {
    console.error('Erro ao simular disparo:', error);
    return NextResponse.json({ error: 'Failed to simulate gunshot' }, { status: 500 });
  }
}