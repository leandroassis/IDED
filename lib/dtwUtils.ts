/**
 * Implementação de Dynamic Time Warping para comparação de áudio
 */

import DynamicTimeWarping from 'dynamic-time-warping';

/**
 * Calcula a distância DTW entre duas sequências
 */
export function calculateDTW(series1: number[], series2: number[]): number {
  const dtw = new DynamicTimeWarping(series1, series2, euclideanDistance);
  return dtw.getDistance();
}

/**
 * Distância euclidiana entre dois pontos
 */
function euclideanDistance(x: number, y: number): number {
  return Math.abs(x - y);
}

/**
 * Normaliza a distância DTW pelo comprimento das séries
 */
export function normalizedDTW(series1: number[], series2: number[]): number {
  const distance = calculateDTW(series1, series2);
  const maxLength = Math.max(series1.length, series2.length);
  return distance / maxLength;
}

/**
 * Compara um áudio de entrada com múltiplos templates
 * Retorna a distância mínima e o índice do template mais similar
 */
export function compareWithTemplates(
  inputFeatures: number[],
  templates: number[][]
): { minDistance: number; bestMatchIndex: number; allDistances: number[] } {
  let minDistance = Infinity;
  let bestMatchIndex = -1;
  const allDistances: number[] = [];

  for (let i = 0; i < templates.length; i++) {
    const distance = normalizedDTW(inputFeatures, templates[i]);
    allDistances.push(distance);
    
    if (distance < minDistance) {
      minDistance = distance;
      bestMatchIndex = i;
    }
  }

  return { minDistance, bestMatchIndex, allDistances };
}

/**
 * Classifica áudio como disparo ou não baseado em threshold
 */
export function classifyGunshot(
  inputFeatures: number[],
  gunshotTemplates: number[][],
  ambientTemplates: number[][],
  threshold: number = 0.5
): { isGunshot: boolean; confidence: number; gunshotDistance: number; ambientDistance: number } {
  const gunshotResult = compareWithTemplates(inputFeatures, gunshotTemplates);
  const ambientResult = compareWithTemplates(inputFeatures, ambientTemplates);

  const gunshotDistance = gunshotResult.minDistance;
  const ambientDistance = ambientResult.minDistance;

  // Se a distância para disparos é menor que para ambiente, provavelmente é um disparo
  const isGunshot = gunshotDistance < ambientDistance && gunshotDistance < threshold;
  
  // Confiança baseada na diferença relativa entre as distâncias
  const totalDistance = gunshotDistance + ambientDistance;
  const confidence = totalDistance > 0 ? Math.abs(ambientDistance - gunshotDistance) / totalDistance : 0;

  return {
    isGunshot,
    confidence,
    gunshotDistance,
    ambientDistance
  };
}
