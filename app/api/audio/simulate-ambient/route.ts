/**
 * API para simular um som ambiente (não-disparo) e gerar áudio para os drones
 */
import { NextResponse, NextRequest } from 'next/server';
import { simulateDroneAudioCapture, float32ArrayToBase64 } from '@/lib/audioUtils';
import { calculateDistance, GeoPosition } from '@/lib/geoUtils';

/**
 * Gera um sinal de áudio sintético simulando som ambiente
 */
function generateAmbientAudio(sampleRate: number = 44100, duration: number = 0.5): Float32Array {
  const numSamples = Math.floor(sampleRate * duration);
  const audio = new Float32Array(numSamples);

  // Simula som ambiente: ruído consistente sem pico abrupto
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    
    // Envelope suave (sem pico rápido)
    const amplitude = 0.3 + Math.sin(2 * Math.PI * 0.5 * t) * 0.1; // Variação lenta
    
    // Ruído branco de baixa intensidade
    const noise = (Math.random() - 0.5) * 0.4;
    
    // Componentes de frequência típicas de ambiente urbano
    const lowFreq = Math.sin(2 * Math.PI * 60 * t) * 0.2; // Ruído de fundo
    const midFreq = Math.sin(2 * Math.PI * 200 * t) * 0.15; // Vozes, etc
    
    // Combina componentes
    audio[i] = amplitude * (0.5 * noise + 0.3 * lowFreq + 0.2 * midFreq);
  }

  return audio;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ambientPosition, dronePositions } = body;

    if (!ambientPosition || !dronePositions || !Array.isArray(dronePositions)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const soundPos: GeoPosition = ambientPosition;

    // Gera áudio base de som ambiente
    const originalAudio = generateAmbientAudio();

    // Simula captura por cada drone
    const droneAudioData = dronePositions.map((dronePos: any) => {
      const distance = calculateDistance(soundPos, dronePos.position);
      
      // Simula captura com atenuação e delay baseado na distância
      const capturedAudio = simulateDroneAudioCapture(originalAudio, distance, 0.08); // Mais ruído
      
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
      ambientPosition: soundPos,
      droneAudioData,
      message: 'Ambient sound simulated successfully'
    });

  } catch (error) {
    console.error('Erro ao simular som ambiente:', error);
    return NextResponse.json({ error: 'Failed to simulate ambient sound' }, { status: 500 });
  }
}
