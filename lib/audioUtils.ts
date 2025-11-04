/**
 * Utilidades para processamento de áudio
 */

export interface AudioFeatures {
  mfcc?: number[];
  energy: number[];
  zeroCrossingRate: number[];
  spectralCentroid?: number[];
}

/**
 * Extrai features de um sinal de áudio
 */
export function extractAudioFeatures(audioData: Float32Array, sampleRate: number = 44100): AudioFeatures {
  const frameSize = 2048;
  const hopSize = 512;
  const numFrames = Math.floor((audioData.length - frameSize) / hopSize);

  const energy: number[] = [];
  const zeroCrossingRate: number[] = [];

  for (let i = 0; i < numFrames; i++) {
    const start = i * hopSize;
    const end = start + frameSize;
    const frame = audioData.slice(start, end);

    // Calcula energia do frame
    let frameEnergy = 0;
    for (let j = 0; j < frame.length; j++) {
      frameEnergy += frame[j] * frame[j];
    }
    energy.push(frameEnergy / frame.length);

    // Calcula Zero Crossing Rate
    let crossings = 0;
    for (let j = 1; j < frame.length; j++) {
      if ((frame[j] >= 0 && frame[j - 1] < 0) || (frame[j] < 0 && frame[j - 1] >= 0)) {
        crossings++;
      }
    }
    zeroCrossingRate.push(crossings / frame.length);
  }

  return { energy, zeroCrossingRate };
}

/**
 * Normaliza um array de valores
 */
export function normalize(data: number[]): number[] {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;
  
  if (range === 0) return data.map(() => 0);
  
  return data.map(v => (v - min) / range);
}

/**
 * Simula captura de áudio por um drone considerando distância
 * Aplica atenuação baseada na distância e adiciona ruído
 */
export function simulateDroneAudioCapture(
  originalAudio: Float32Array,
  distance: number, // em metros
  noiseLevel: number = 0.05
): Float32Array {
  const SPEED_OF_SOUND = 343; // m/s
  const sampleRate = 44100; // Hz
  
  // Calcula delay baseado na distância (Time of Arrival)
  const delaySeconds = distance / SPEED_OF_SOUND;
  const delaySamples = Math.round(delaySeconds * sampleRate);
  
  // Atenuação baseada na distância (lei do inverso do quadrado)
  const attenuation = 1 / (1 + distance / 100);
  
  // Cria novo array com delay e atenuação
  const capturedAudio = new Float32Array(originalAudio.length + delaySamples);
  
  for (let i = 0; i < originalAudio.length; i++) {
    const targetIndex = i + delaySamples;
    if (targetIndex < capturedAudio.length) {
      // Aplica atenuação e adiciona ruído gaussiano
      const noise = (Math.random() - 0.5) * noiseLevel;
      capturedAudio[targetIndex] = originalAudio[i] * attenuation + noise;
    }
  }
  
  return capturedAudio;
}

/**
 * Converte base64 para Float32Array
 */
export function base64ToFloat32Array(base64: string): Float32Array {
  const binaryString = Buffer.from(base64, 'base64').toString('binary');
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const float32Array = new Float32Array(bytes.buffer);
  return float32Array;
}

/**
 * Converte Float32Array para base64
 */
export function float32ArrayToBase64(float32Array: Float32Array): string {
  const bytes = new Uint8Array(float32Array.buffer);
  let binaryString = '';
  
  for (let i = 0; i < bytes.length; i++) {
    binaryString += String.fromCharCode(bytes[i]);
  }
  
  return Buffer.from(binaryString, 'binary').toString('base64');
}
