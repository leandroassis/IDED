/**
 * Utilidades para cálculos geoespaciais e triangulação
 */

export interface GeoPosition {
  lon: number;
  lat: number;
}

export interface DroneAudioData {
  droneId: string;
  position: GeoPosition;
  audioFeatures: number[];
  timestamp: number;
  timeOfArrival: number; // Tempo de chegada do som (em segundos)
}

const SPEED_OF_SOUND = 343; // m/s a 20°C
const EARTH_RADIUS = 6378137; // metros

/**
 * Calcula distância em metros entre duas coordenadas WGS84
 * Usando fórmula de Haversine
 */
export function calculateDistance(pos1: GeoPosition, pos2: GeoPosition): number {
  const lat1Rad = pos1.lat * Math.PI / 180;
  const lat2Rad = pos2.lat * Math.PI / 180;
  const deltaLat = (pos2.lat - pos1.lat) * Math.PI / 180;
  const deltaLon = (pos2.lon - pos1.lon) * Math.PI / 180;

  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1Rad) * Math.cos(lat2Rad) *
            Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return EARTH_RADIUS * c;
}

/**
 * Converte offset em metros para offset em graus
 */
export function metersToGeoOffset(
  meters: number,
  centerLat: number,
  isLatitude: boolean = true
): number {
  if (isLatitude) {
    return meters / 111320; // metros por grau de latitude
  } else {
    // metros por grau de longitude depende da latitude
    const metersPerDegreeLon = (Math.PI * EARTH_RADIUS * Math.cos(centerLat * Math.PI / 180)) / 180;
    return meters / metersPerDegreeLon;
  }
}

export interface TriangulationResult {
  finalPosition: GeoPosition;
  droneEstimates: Array<{
    droneId: string;
    estimatedPosition: GeoPosition;
    weight: number;
    timeDiff: number;
  }>;
}

/**
 * Triangulação usando Time Difference of Arrival (TDOA)
 * Método simplificado usando least squares
 */
export function triangulateTDOA(droneData: DroneAudioData[]): GeoPosition | null {
  const result = triangulateTDOAWithDetails(droneData);
  return result ? result.finalPosition : null;
}

/**
 * Versão detalhada da triangulação que retorna estimativas individuais
 */
export function triangulateTDOAWithDetails(droneData: DroneAudioData[]): TriangulationResult | null {
  console.log('[TDOA] Iniciando triangulação com', droneData.length, 'drones');
  
  if (droneData.length < 3) {
    console.error('[TDOA] Necessário ao menos 3 drones para triangulação');
    return null;
  }

  // Ordena drones por tempo de chegada
  const sortedDrones = [...droneData].sort((a, b) => a.timeOfArrival - b.timeOfArrival);
  
  console.log('[TDOA] Drones ordenados por tempo de chegada:');
  sortedDrones.forEach(d => {
    console.log(`  ${d.droneId}: TOA=${d.timeOfArrival.toFixed(4)}s, pos=(${d.position.lat.toFixed(6)}, ${d.position.lon.toFixed(6)})`);
  });
  
  // Usa o primeiro drone como referência
  const referenceDrone = sortedDrones[0];
  const referenceTime = referenceDrone.timeOfArrival;

  console.log('[TDOA] Drone de referência:', referenceDrone.droneId, 'TOA:', referenceTime.toFixed(4));

  // Calcula diferenças de tempo em relação à referência
  const timeDifferences = sortedDrones.slice(1).map(drone => ({
    drone,
    timeDiff: drone.timeOfArrival - referenceTime
  }));

  console.log('[TDOA] Diferenças de tempo:');
  timeDifferences.forEach(({ drone, timeDiff }) => {
    console.log(`  ${drone.droneId}: Δt=${timeDiff.toFixed(4)}s, dist=${(timeDiff * SPEED_OF_SOUND).toFixed(2)}m`);
  });

  // Método simplificado: weighted centroid baseado em time differences
  let totalWeight = 0;
  let weightedLon = 0;
  let weightedLat = 0;
  const droneEstimates: TriangulationResult['droneEstimates'] = [];

  for (const { drone, timeDiff } of timeDifferences) {
    // Distância adicional percorrida pelo som
    const additionalDistance = timeDiff * SPEED_OF_SOUND;
    
    // Peso inversamente proporcional ao tempo (drone que recebeu primeiro tem mais peso)
    const weight = 1 / (1 + timeDiff);
    
    // Calcula direção aproximada da fonte em relação ao drone
    const direction = calculateDirection(referenceDrone.position, drone.position);
    
    // Estima posição ao longo da direção
    const estimatedPos = projectPoint(
      drone.position,
      direction + Math.PI, // direção oposta
      additionalDistance
    );
    
    console.log(`[TDOA] ${drone.droneId}: peso=${weight.toFixed(3)}, estimatedPos=(${estimatedPos.lat.toFixed(6)}, ${estimatedPos.lon.toFixed(6)})`);
    
    droneEstimates.push({
      droneId: drone.droneId,
      estimatedPosition: estimatedPos,
      weight: weight,
      timeDiff: timeDiff
    });
    
    weightedLon += estimatedPos.lon * weight;
    weightedLat += estimatedPos.lat * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) {
    console.warn('[TDOA] Peso total zero, retornando posição do drone de referência');
    return {
      finalPosition: referenceDrone.position,
      droneEstimates: []
    };
  }

  const finalPosition = {
    lon: weightedLon / totalWeight,
    lat: weightedLat / totalWeight
  };

  console.log('[TDOA] Posição final calculada:', finalPosition);
  
  return {
    finalPosition,
    droneEstimates
  };
}

/**
 * Calcula ângulo (bearing) entre dois pontos
 */
function calculateDirection(from: GeoPosition, to: GeoPosition): number {
  const lat1 = from.lat * Math.PI / 180;
  const lat2 = to.lat * Math.PI / 180;
  const deltaLon = (to.lon - from.lon) * Math.PI / 180;

  const y = Math.sin(deltaLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) -
            Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);
  
  return Math.atan2(y, x);
}

/**
 * Projeta um ponto a uma distância em uma direção
 */
function projectPoint(
  point: GeoPosition,
  bearing: number,
  distance: number
): GeoPosition {
  const lat1 = point.lat * Math.PI / 180;
  const lon1 = point.lon * Math.PI / 180;
  
  const angularDistance = distance / EARTH_RADIUS;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance) +
    Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing)
  );

  const lon2 = lon1 + Math.atan2(
    Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
    Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2)
  );

  return {
    lat: lat2 * 180 / Math.PI,
    lon: lon2 * 180 / Math.PI
  };
}

/**
 * Método alternativo: Triangulação por interseção de círculos
 * Cada drone define um círculo de raio = distância calculada
 */
export function triangulateByIntersection(droneData: DroneAudioData[]): GeoPosition | null {
  if (droneData.length < 3) return null;

  // Usa três drones com maior energia de sinal (mais próximos)
  const topDrones = [...droneData]
    .sort((a, b) => {
      const energyA = a.audioFeatures.reduce((sum, val) => sum + val, 0);
      const energyB = b.audioFeatures.reduce((sum, val) => sum + val, 0);
      return energyB - energyA;
    })
    .slice(0, 3);

  // Calcula centróide ponderado
  let sumLon = 0;
  let sumLat = 0;
  let totalWeight = 0;

  for (const drone of topDrones) {
    const energy = drone.audioFeatures.reduce((sum, val) => sum + val, 0);
    const weight = energy;
    
    sumLon += drone.position.lon * weight;
    sumLat += drone.position.lat * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return topDrones[0].position;

  return {
    lon: sumLon / totalWeight,
    lat: sumLat / totalWeight
  };
}
