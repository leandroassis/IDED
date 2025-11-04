// app/api/drone/position/route.ts
import { NextResponse, NextRequest } from 'next/server';

/**
 * Gera posições aleatórias de drones dentro de um raio sem sobreposição
 * Usa algoritmo de Poisson Disk Sampling simplificado
 */
function generateRandomPositions(
  center_lon: number,
  center_lat: number,
  radius_meters: number,
  drone_count: number,
  min_distance_meters: number = 30 // Distância mínima entre drones
): { lon: number, lat: number }[] {
  const EARTH_RADIUS = 6378137;
  const metersPerDegreeLat = 111320;
  const metersPerDegreeLon = (Math.PI * EARTH_RADIUS * Math.cos(center_lat * Math.PI / 180)) / 180;

  const positions: { lon: number, lat: number }[] = [];
  const maxAttempts = 1000; // Máximo de tentativas para evitar loop infinito

  for (let i = 0; i < drone_count; i++) {
    let attempts = 0;
    let validPosition = false;
    let lon = 0, lat = 0;

    while (!validPosition && attempts < maxAttempts) {
      // Gera posição aleatória dentro do círculo
      const angle = Math.random() * 2 * Math.PI;
      const r = Math.sqrt(Math.random()) * radius_meters; // sqrt para distribuição uniforme

      const x_offset_meters = r * Math.cos(angle);
      const y_offset_meters = r * Math.sin(angle);

      const lon_offset_deg = x_offset_meters / metersPerDegreeLon;
      const lat_offset_deg = y_offset_meters / metersPerDegreeLat;

      lon = center_lon + lon_offset_deg;
      lat = center_lat + lat_offset_deg;

      // Verifica se não há sobreposição com drones existentes
      validPosition = true;
      for (const pos of positions) {
        const dx = (lon - pos.lon) * metersPerDegreeLon;
        const dy = (lat - pos.lat) * metersPerDegreeLat;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < min_distance_meters) {
          validPosition = false;
          break;
        }
      }

      attempts++;
    }

    if (validPosition) {
      positions.push({ lon, lat });
    } else {
      console.warn(`Não foi possível posicionar drone ${i + 1} após ${maxAttempts} tentativas`);
    }
  }

  return positions;
}

export async function POST(request: NextRequest)  {
  try {
    const body = await request.json();
    const { position, drone_count, radius } = body;

    if (!position || !Array.isArray(position) || position.length !== 2 || drone_count <= 0 || radius <= 0) {
      return NextResponse.json({ error: 'Invalid position, drone count, or radius' }, { status: 400 });
    }

    const [center_lon, center_lat] = position;

    // Converte raio de km para metros (assumindo que o frontend envia em km)
    const radius_meters = radius * 1000;

    // Gera posições aleatórias sem sobreposição
    const positions = generateRandomPositions(center_lon, center_lat, radius_meters, drone_count);

    // Para consistência com o formato original
    const x_coords = positions.map(p => p.lon);
    const y_coords = positions.map(p => p.lat);

    return NextResponse.json({ 
      x: x_coords, 
      y: y_coords,
      center: { lon: center_lon, lat: center_lat },
      radius: radius_meters
    });

  } catch (error) {
    console.error("Erro na API de posição dos drones:", error);
    return NextResponse.json({ error: 'Falha ao calcular posições' }, { status: 500 });
  }
}