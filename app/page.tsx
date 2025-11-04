'use client'

import { useEffect, useState, FC } from "react";
import Map from 'ol/Map';
import Map1 from "@/components/map";
import 'ol-ext/dist/ol-ext.css';

import { fromLonLat, toLonLat } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Style, Icon, Text, Fill } from 'ol/style'; // Importe Icon

interface DronePosition {
  lon: number;
  lat: number;
}

const MapPage: FC = () => {
  const [map1Object, setMap1Object] = useState<Map | null>(null);
  const [dronePositions, setDronePositions] = useState<DronePosition[]>([]);
  const [radius, setRadius] = useState<number>(10); // Novo estado para o raio, valor inicial 10
  const [droneCount, setDroneCount] = useState<number>(5); // Novo estado para a quantidade de drones, valor inicial 5

  useEffect(() => {
    if (!map1Object || dronePositions.length === 0) return;

    map1Object.getLayers().forEach(layer => {
      if (layer.get('name') === 'droneLayer') {
        map1Object.removeLayer(layer);
      }
    });

    const features = dronePositions.map(pos => {
      return new Feature({
        geometry: new Point(fromLonLat([pos.lon, pos.lat])),
      });
    });

    // --- CORREÇÃO: Usando Icon Style para o PNG do drone ---
    const droneStyle = new Style({
      image: new Icon({
        anchor: [0.5, 0.5], // Âncora no centro do ícone
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction',
        scale: 1, // Ajuste a escala conforme necessário para o tamanho do seu ícone
        src: 'drone_icon.png', // O caminho para o seu arquivo PNG do drone
      }),
      // Opcional: Se quiser adicionar texto junto com o ícone, pode usar
      // text: new Text({
      //   text: '✈️', // Ou algum identificador
      //   offsetY: -20, // Ajusta a posição do texto acima do ícone
      //   font: '14px Arial',
      //   fill: new Fill({ color: 'blue' })
      // })
    });
    // --- FIM DA CORREÇÃO ---

    const vectorSource = new VectorSource({
      features,
    });

    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: droneStyle,
    });

    vectorLayer.set('name', 'droneLayer');
    map1Object.addLayer(vectorLayer);

  }, [dronePositions, map1Object]);

  const changeCoverArea = () => {
    if (!map1Object) {
      console.error("Map object not initialized");
      return;
    }

    const mapElement = map1Object.getTargetElement();
    mapElement.style.cursor = 'move';

    map1Object.once('singleclick', async (evt) => {
      mapElement.style.cursor = '';

      const coords_mercator = evt.coordinate;
      const coords_lonlat = toLonLat(coords_mercator);
      
      console.log('Posição do clique (Lon/Lat):', coords_lonlat);

      try {
        const response = await fetch('/api/drone/position', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            position: coords_lonlat, 
            drone_count: droneCount, // Usando o estado droneCount
            radius: radius // Usando o estado radius
          }),
        });

        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Server response:', result);

        const positions: DronePosition[] = result.x.map((lon: number, index: number) => ({
          lon,
          lat: result.y[index],
        }));

        setDronePositions(positions);
        console.log('Calculated drone positions:', positions);
        
      } catch (error) {
        console.error('Failed to send position to server:', error);
      }
    });
  };

  const setDispair = () => {
    // Placeholder for setDispair logic
    console.log('setDispair triggered');
  };

  return (
    <div className="flex h-[100vh] gap-[2px] bg-white/70">
      <div className='border border-transparent'>
        <Map1 setMap1Object={setMap1Object} />
      </div>
      <div className='relative w-1/4 border border-transparent p-4 ml-auto'>
        <div className="flex flex-col space-y-2">
          {/* --- NOVOS CAMPOS DE ENTRADA --- */}
          <label htmlFor="radiusInput" className="block text-sm font-medium text-gray-700">
            Raio de Dispersão (km):
          </label>
          <input
            id="radiusInput"
            type="number"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            min="1"
          />

          <label htmlFor="droneCountInput" className="block text-sm font-medium text-gray-700">
            Quantidade de Drones:
          </label>
          <input
            id="droneCountInput"
            type="number"
            value={droneCount}
            onChange={(e) => setDroneCount(Number(e.target.value))}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            min="1"
          />
          {/* --- FIM DOS NOVOS CAMPOS --- */}

          <button 
            onClick={changeCoverArea} 
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Change Cover Area
          </button>
          <button 
            onClick={setDispair} 
            className="bg-red-500 text-white p-2 rounded hover:bg-red-600"
          >
            Set Dispair
          </button>
        </div>
      </div>
    </div>
  );
}

export default MapPage;