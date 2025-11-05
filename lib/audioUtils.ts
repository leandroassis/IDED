/**
 * Utilidades para processamento de áudio
 */

// ============================================
// ⚙️ CONFIGURAÇÕES DE SIMULAÇÃO DE PROPAGAÇÃO
// ============================================
// 
// Ajuste estas constantes para calibrar a simulação:
//
// NOISE_LEVEL:
//   - Controla o ruído de fundo nos drones
//   - 0.001 = quase sem ruído (ideal)
//   - 0.01  = ruído baixo (recomendado)
//   - 0.05  = ruído alto (realista mas dificulta detecção)
//
// DRONE_AUDIO_GAIN:
//   - Amplifica o áudio captado pelos drones (NÃO afeta o som reproduzido no navegador)
//   - 1.0  = sem amplificação (muito fraco à distância)
//   - 3.0  = amplificação moderada (recomendado)
//   - 5.0  = amplificação alta (facilita detecção)
//   - 10.0 = amplificação muito alta (pode distorcer)
//
// ============================================

/**
 * Nível de ruído de fundo adicionado à captura dos drones
 * Valores típicos: 0.001 (muito baixo) a 0.05 (alto)
 * Padrão: 0.01 (1% de ruído)
 */
export const NOISE_LEVEL = 0.005;

/**
 * Amplificação aplicada ao áudio captado pelos drones
 * Útil para compensar atenuação e facilitar análise
 * NÃO afeta o áudio reproduzido no navegador (apenas drones)
 * Valores: 1.0 (sem amplificação) a 10.0 (10x mais alto)
 * Padrão: 3.0 (3x amplificação)
 */
export const DRONE_AUDIO_GAIN = 5.0;

// ============================================

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
 * Aplica atenuação baseada na distância, adiciona ruído e amplificação
 * 
 * @param originalAudio - Áudio original da fonte sonora
 * @param distance - Distância em metros entre fonte e drone
 * @param noiseLevel - Nível de ruído (opcional, usa NOISE_LEVEL se não especificado)
 * @returns Áudio captado pelo drone com propagação simulada
 */
export function simulateDroneAudioCapture(
  originalAudio: Float32Array,
  distance: number, // em metros
  noiseLevel?: number
): Float32Array {
  const SPEED_OF_SOUND = 343; // m/s a 20°C
  const sampleRate = 44100; // Hz
  
  // Use configuração global se não especificado
  const effectiveNoiseLevel = noiseLevel !== undefined ? noiseLevel : NOISE_LEVEL;
  
  // Calcula delay baseado na distância (Time Difference of Arrival - TDOA)
  const delaySeconds = distance / SPEED_OF_SOUND;
  const delaySamples = Math.round(delaySeconds * sampleRate);
  
  // Atenuação baseada na distância (lei do inverso do quadrado)
  // Adiciona distância de referência (1m) para evitar divisão por zero
  // e simular uma fonte sonora real
  const referenceDistance = 1.0; // metros
  const effectiveDistance = Math.max(distance, referenceDistance);
  const attenuation = referenceDistance / effectiveDistance;
  
  // Atenuação atmosférica adicional (absorção do ar)
  // Para distâncias maiores, o ar absorve mais energia
  const atmosphericAbsorption = Math.exp(-0.001 * distance); // Fator empírico
  
  // Atenuação total com amplificação para compensar
  const totalAttenuation = attenuation * atmosphericAbsorption * DRONE_AUDIO_GAIN;
  
  // Cria novo array com delay e atenuação
  const capturedAudio = new Float32Array(originalAudio.length + delaySamples);
  
  for (let i = 0; i < originalAudio.length; i++) {
    const targetIndex = i + delaySamples;
    if (targetIndex < capturedAudio.length) {
      // Aplica atenuação com amplificação e adiciona ruído gaussiano
      const noise = (Math.random() - 0.5) * effectiveNoiseLevel;
      const amplifiedSignal = originalAudio[i] * totalAttenuation;
      capturedAudio[targetIndex] = amplifiedSignal + noise;
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

/**
 * Converte um Buffer de arquivo WAV para Float32Array
 * Assume WAV PCM 16-bit mono ou stereo
 */
export function wavBufferToFloat32Array(buffer: Buffer): Float32Array {
  // Pula o header WAV (44 bytes padrão)
  const headerSize = 44;
  
  // Lê informações do header
  const numChannels = buffer.readUInt16LE(22);
  const sampleRate = buffer.readUInt32LE(24);
  const bitsPerSample = buffer.readUInt16LE(34);
  
  console.log(`WAV: ${numChannels} canal(is), ${sampleRate}Hz, ${bitsPerSample}-bit`);
  
  // Calcula número de samples
  const dataSize = buffer.length - headerSize;
  const bytesPerSample = bitsPerSample / 8;
  const numSamples = Math.floor(dataSize / (bytesPerSample * numChannels));
  
  const audioData = new Float32Array(numSamples);
  
  // Converte para Float32Array normalizado [-1, 1]
  if (bitsPerSample === 16) {
    for (let i = 0; i < numSamples; i++) {
      let sum = 0;
      
      // Se for stereo, faz a média dos canais para mono
      for (let ch = 0; ch < numChannels; ch++) {
        const offset = headerSize + (i * numChannels + ch) * bytesPerSample;
        const sample = buffer.readInt16LE(offset);
        sum += sample / 32768.0; // Normaliza para [-1, 1]
      }
      
      audioData[i] = sum / numChannels;
    }
  } else if (bitsPerSample === 8) {
    for (let i = 0; i < numSamples; i++) {
      let sum = 0;
      
      for (let ch = 0; ch < numChannels; ch++) {
        const offset = headerSize + (i * numChannels + ch) * bytesPerSample;
        const sample = buffer.readUInt8(offset);
        sum += (sample - 128) / 128.0; // Normaliza para [-1, 1]
      }
      
      audioData[i] = sum / numChannels;
    }
  } else if (bitsPerSample === 32) {
    // WAV 32-bit pode ser float ou int
    // Verifica o audioFormat no header (offset 20)
    const audioFormat = buffer.readUInt16LE(20);
    
    if (audioFormat === 3) {
      // IEEE Float (32-bit float já está normalizado)
      for (let i = 0; i < numSamples; i++) {
        let sum = 0;
        
        for (let ch = 0; ch < numChannels; ch++) {
          const offset = headerSize + (i * numChannels + ch) * bytesPerSample;
          const sample = buffer.readFloatLE(offset);
          sum += sample;
        }
        
        audioData[i] = sum / numChannels;
      }
    } else {
      // PCM 32-bit int
      for (let i = 0; i < numSamples; i++) {
        let sum = 0;
        
        for (let ch = 0; ch < numChannels; ch++) {
          const offset = headerSize + (i * numChannels + ch) * bytesPerSample;
          const sample = buffer.readInt32LE(offset);
          sum += sample / 2147483648.0; // Normaliza para [-1, 1]
        }
        
        audioData[i] = sum / numChannels;
      }
    }
  } else if (bitsPerSample === 24) {
    // WAV 24-bit (menos comum)
    for (let i = 0; i < numSamples; i++) {
      let sum = 0;
      
      for (let ch = 0; ch < numChannels; ch++) {
        const offset = headerSize + (i * numChannels + ch) * bytesPerSample;
        // Lê 3 bytes e converte para int32
        const byte1 = buffer.readUInt8(offset);
        const byte2 = buffer.readUInt8(offset + 1);
        const byte3 = buffer.readUInt8(offset + 2);
        
        // Combina bytes (little-endian) e converte para signed
        let sample = (byte3 << 16) | (byte2 << 8) | byte1;
        if (sample & 0x800000) {
          sample = sample - 0x1000000; // Converte para negativo se necessário
        }
        
        sum += sample / 8388608.0; // Normaliza para [-1, 1]
      }
      
      audioData[i] = sum / numChannels;
    }
  } else {
    throw new Error(`Bits per sample não suportado: ${bitsPerSample}`);
  }
  
  return audioData;
}

/**
 * Converte Float32Array para Buffer WAV
 */
export function float32ArrayToWavBuffer(audioData: Float32Array, sampleRate: number = 44100): Buffer {
  const numChannels = 1; // Mono
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = audioData.length * blockAlign;
  const bufferSize = 44 + dataSize;
  
  const buffer = Buffer.alloc(bufferSize);
  
  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(bufferSize - 8, 4);
  buffer.write('WAVE', 8);
  
  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // fmt chunk size
  buffer.writeUInt16LE(1, 20); // PCM format
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * blockAlign, 28); // byte rate
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  
  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  
  // Audio data
  for (let i = 0; i < audioData.length; i++) {
    const sample = Math.max(-1, Math.min(1, audioData[i])); // Clamp
    const intSample = Math.round(sample * 32767);
    buffer.writeInt16LE(intSample, 44 + i * bytesPerSample);
  }
  
  return buffer;
}
