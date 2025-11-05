/**
 * Utilitários para reprodução de áudio no navegador
 */

/**
 * Converte base64 para AudioBuffer para reprodução
 */
export async function base64ToAudioBuffer(
  base64: string, 
  audioContext: AudioContext
): Promise<AudioBuffer> {
  // Decodifica base64 para Float32Array
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const float32Array = new Float32Array(bytes.buffer);
  
  // Cria AudioBuffer
  const sampleRate = 44100;
  const audioBuffer = audioContext.createBuffer(1, float32Array.length, sampleRate);
  const channelData = audioBuffer.getChannelData(0);
  
  for (let i = 0; i < float32Array.length; i++) {
    channelData[i] = float32Array[i];
  }
  
  return audioBuffer;
}

/**
 * Reproduz um áudio a partir de base64
 */
export async function playAudioFromBase64(
  base64: string,
  volume: number = 1.0
): Promise<void> {
  try {
    const audioContext = new AudioContext();
    const audioBuffer = await base64ToAudioBuffer(base64, audioContext);
    
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    
    // Controle de volume
    const gainNode = audioContext.createGain();
    gainNode.gain.value = volume;
    
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    source.start(0);
    
    // Retorna uma Promise que resolve quando o áudio terminar
    return new Promise((resolve) => {
      source.onended = () => {
        audioContext.close();
        resolve();
      };
    });
  } catch (error) {
    console.error('Erro ao reproduzir áudio:', error);
    throw error;
  }
}

/**
 * Para qualquer áudio em reprodução (fecha todos os contextos)
 */
export function stopAllAudio() {
  // Note: Não há uma maneira direta de parar todos os AudioContexts
  // Cada reprodução deve ser gerenciada individualmente
  console.log('Stop all audio - implement track individual sources if needed');
}
