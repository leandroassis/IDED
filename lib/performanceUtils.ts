/**
 * Utilitários de performance para operações com múltiplos drones
 */

interface DroneAudioData {
  droneId: string;
  audioData: string;
  position: { lon: number; lat: number };
  distance: number;
}

interface UploadResult {
  success: boolean;
  droneId: string;
}

/**
 * Envia áudio de múltiplos drones em paralelo com controle de concorrência
 * Evita sobrecarga do servidor limitando requisições simultâneas
 */
export async function uploadDroneAudioBatch(
  sessionId: string,
  droneAudioList: DroneAudioData[],
  maxConcurrent: number = 10
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];
  
  // Divide em lotes para não sobrecarregar o servidor
  for (let i = 0; i < droneAudioList.length; i += maxConcurrent) {
    const batch = droneAudioList.slice(i, i + maxConcurrent);
    
    const batchPromises = batch.map(async (droneAudio) => {
      try {
        const response = await fetch('/api/audio/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            droneId: droneAudio.droneId,
            audioData: droneAudio.audioData,
            position: droneAudio.position,
            timestamp: Date.now()
          }),
        });
        
        return {
          success: response.ok,
          droneId: droneAudio.droneId
        };
      } catch (error) {
        return {
          success: false,
          droneId: droneAudio.droneId
        };
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Polling otimizado com backoff exponencial
 * Reduz carga do servidor e melhora responsividade
 */
export async function pollAnalysisResult(
  sessionId: string,
  expectedDrones: number,
  maxAttempts: number = 15
): Promise<any | null> {
  let attempts = 0;
  let pollInterval = 200; // Começa com 200ms
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, pollInterval));
    
    try {
      const response = await fetch(
        `/api/audio/analyze?sessionId=${sessionId}&expectedDrones=${expectedDrones}`
      );
      
      const data = await response.json();
      
      if (data.ready) {
        return data;
      }
      
      attempts++;
      // Backoff exponencial: 200ms -> 240ms -> 288ms ... até max 1000ms
      pollInterval = Math.min(pollInterval * 1.2, 1000);
      
    } catch (error) {
      attempts++;
      // Em caso de erro, aumenta mais o intervalo
      pollInterval = Math.min(pollInterval * 1.5, 2000);
    }
  }
  
  return null;
}

/**
 * Debounce para evitar múltiplas chamadas rápidas
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle para limitar frequência de execução
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  
  return function(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
