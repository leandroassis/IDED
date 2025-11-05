// components/Map1.tsx
'use client'

import { useEffect, useRef, FC } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map'; // A classe Map também serve como o tipo
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';

/**
 * Define a interface para as propriedades do componente Map1.
 */
interface Map1Props {
  /**
   * Função de callback para definir o objeto do mapa no estado pai.
   * Aceita um objeto Map do OpenLayers ou null.
   */
  onMapCreated: (map: Map | null) => void;
  /**
   * Função de callback para lidar com cliques no mapa.
   */
  onMapClick?: (event: any) => void;
}

/**
 * Componente Map1 tipado com React.FC (Functional Component)
 */
const Map1: FC<Map1Props> = ({ onMapCreated, onMapClick }) => {
  
  /**
   * Tipa a referência do container do mapa.
   * Ela apontará para um HTMLDivElement e é inicializada como null.
   */
  const map1Container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);

  // Create map only once on mount
  useEffect(() => {
    
    // Garante que o container do mapa esteja renderizado antes de usá-lo
    if (!map1Container.current) {
      return;
    }

    const map1 = new Map({
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        //Coordinate System: WGS 84 /   
        center: [-4813774.578567, -2614619.776711], // Longitude, Latitude
        zoom: 15,
      }),
    });

    map1.setTarget(map1Container.current);
    mapRef.current = map1;
    onMapCreated(map1);

    // on component unmount remove the map refrences to avoid unexpected behaviour
    return () => {
      map1.setTarget(undefined);
      mapRef.current = null;
      onMapCreated(null);
    };
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle click events separately
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !onMapClick) return;

    map.on('click', onMapClick);

    return () => {
      map.un('click', onMapClick);
    };
  }, [onMapClick]);

  return (
    <>
      <div ref={map1Container} className="absolute inset-0"></div>
    </>
  );
};

export default Map1;