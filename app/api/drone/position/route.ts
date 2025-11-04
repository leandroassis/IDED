// app/api/drone/position/route.ts
import { NextResponse, NextRequest } from 'next/server';

export async function POST(request: NextRequest)  {
  try {
    const body = await request.json();
    const { position, drone_count, radius } = body;

    if (!position || !Array.isArray(position) || position.length !== 2 || drone_count <= 0 || radius <= 0) {
      return NextResponse.json({ error: 'Invalid position, drone count, or radius' }, { status: 400 });
    }

    const [center_lon, center_lat] = position;

    // Earth radius in meters
    const EARTH_RADIUS = 6378137;

    // Conversion factors for the given latitude
    const metersPerDegreeLat = 111320; // Approximate
    const metersPerDegreeLon = (Math.PI * EARTH_RADIUS * Math.cos(center_lat * Math.PI / 180)) / 180;

    const angleSpacing = (2 * Math.PI) / drone_count;
    
    const positions: { lon: number, lat: number }[] = [];

    for (let i = 0; i < drone_count; i++) {
      const angle = angleSpacing * i;
      
      // Calculate offset in meters
      const x_offset_meters = radius * Math.cos(angle);
      const y_offset_meters = radius * Math.sin(angle);

      // Convert meter offsets to degree offsets
      const lon_offset_deg = x_offset_meters / metersPerDegreeLon;
      const lat_offset_deg = y_offset_meters / metersPerDegreeLat;

      // Calculate new WGS84 coordinates
      const lon = center_lon + lon_offset_deg;
      const lat = center_lat + lat_offset_deg;
      
      positions.push({ lon, lat });
    }

    // For consistency with the original output format, we can separate them
    const x_coords = positions.map(p => p.lon);
    const y_coords = positions.map(p => p.lat);

    return NextResponse.json({ x: x_coords, y: y_coords });

  } catch (error) {
    console.error("Erro na API de login:", error);
    return NextResponse.json({ error: 'Falha na autenticação' }, { status: 500 });
  }
}