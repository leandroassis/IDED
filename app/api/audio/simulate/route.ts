/**
 * API para simular um disparo e gerar áudio para os drones
 */
import { NextResponse, NextRequest } from 'next/server';
import { simulateDroneAudioCapture, float32ArrayToBase64, extractAudioFeatures } from '@/lib/audioUtils';
import { calculateDistance, GeoPosition } from '@/lib/geoUtils';

/**
 * Gera um sinal de áudio sintético simulando um disparo
 */
function generateGunshotAudio(sampleRate: number = 44100, duration: number = 0.5): Float32Array {
  const numSamples = Math.floor(sampleRate * duration);
  const audio = new Float32Array(numSamples);

  // Simula disparo: pico rápido seguido de decaimento exponencial
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    
    // Envelope: pico rápido (0-0.01s) seguido de decaimento exponencial
    let amplitude;
    if (t < 0.01) {
      // Ataque rápido
      amplitude = t / 0.01;
    } else {
      // Decaimento exponencial
      amplitude = Math.exp(-10 * (t - 0.01));
    }

    // Adiciona componentes de frequência (ruído branco filtrado)
    const noise = (Math.random() - 0.5) * 2;
    
    // Componente de baixa frequência (explosão)
    const lowFreq = Math.sin(2 * Math.PI * 100 * t);
    
    // Combina
    audio[i] = amplitude * (0.7 * noise + 0.3 * lowFreq);
  }

  return audio;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gunshotPosition, dronePositions } = body;

    if (!gunshotPosition || !dronePositions || !Array.isArray(dronePositions)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const shotPos: GeoPosition = gunshotPosition;

    // Gera áudio base do disparo
    const originalAudio = generateGunshotAudio();

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

    return NextResponse.json({
      success: true,
      gunshotPosition: shotPos,
      droneAudioData,
      message: 'Gunshot simulated successfully'
    });

  } catch (error) {
    console.error('Erro ao simular disparo:', error);
    return NextResponse.json({ error: 'Failed to simulate gunshot' }, { status: 500 });
  }
}
