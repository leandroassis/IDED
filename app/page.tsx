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
import Circle from 'ol/geom/Circle';
import { Style, Icon, Fill, Stroke, Circle as CircleStyle } from 'ol/style';

interface DronePosition {
  lon: number;
  lat: number;
  droneId: string;
}

interface GeoPosition {
  lon: number;
  lat: number;
}

const MapPage: FC = () => {
  const [map1Object, setMap1Object] = useState<Map | null>(null);
  const [dronePositions, setDronePositions] = useState<DronePosition[]>([]);
  const [radius, setRadius] = useState<number>(0.3); // Raio em km
  const [droneCount, setDroneCount] = useState<number>(5);
  const [operationCenter, setOperationCenter] = useState<GeoPosition | null>(null);
  const [gunshotPosition, setGunshotPosition] = useState<GeoPosition | null>(null);
  const [ambientPosition, setAmbientPosition] = useState<GeoPosition | null>(null);
  const [calculatedPosition, setCalculatedPosition] = useState<GeoPosition | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [detectionResult, setDetectionResult] = useState<any>(null);
  const [mode, setMode] = useState<'idle' | 'settingArea' | 'settingGunshot' | 'settingAmbient'>('idle');

  // Renderiza drones no mapa
  useEffect(() => {
    if (!map1Object || dronePositions.length === 0) return;

    // Remove camadas anteriores de drones
    const layersToRemove: any[] = [];
    map1Object.getLayers().forEach(layer => {
      if (layer && typeof layer.get === 'function' && layer.get('name') === 'droneLayer') {
        layersToRemove.push(layer);
      }
    });
    layersToRemove.forEach(layer => map1Object.removeLayer(layer));

    const features = dronePositions.map((pos, index) => {
      return new Feature({
        geometry: new Point(fromLonLat([pos.lon, pos.lat])),
        name: `Drone ${index + 1}`,
      });
    });

    const droneStyle = new Style({
      image: new Icon({
        anchor: [0.5, 0.5],
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction',
        scale: 0.3,
        src: '/drone_icon.svg',
      }),
    });

    const vectorSource = new VectorSource({ features });
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: droneStyle,
    });

    vectorLayer.set('name', 'droneLayer');
    map1Object.addLayer(vectorLayer);

  }, [dronePositions, map1Object]);

  // Renderiza área de operação
  useEffect(() => {
    if (!map1Object || !operationCenter) return;

    // Remove camada anterior
    const layersToRemove: any[] = [];
    map1Object.getLayers().forEach(layer => {
      if (layer && typeof layer.get === 'function' && layer.get('name') === 'operationArea') {
        layersToRemove.push(layer);
      }
    });
    layersToRemove.forEach(layer => map1Object.removeLayer(layer));

    const center = fromLonLat([operationCenter.lon, operationCenter.lat]);
    const radiusInMeters = radius * 1000;

    const circle = new Feature({
      geometry: new Circle(center, radiusInMeters),
    });

    const circleStyle = new Style({
      stroke: new Stroke({
        color: 'rgba(0, 123, 255, 0.8)',
        width: 2,
      }),
      fill: new Fill({
        color: 'rgba(0, 123, 255, 0.1)',
      }),
    });

    const vectorSource = new VectorSource({ features: [circle] });
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: circleStyle,
    });

    vectorLayer.set('name', 'operationArea');
    map1Object.addLayer(vectorLayer);

  }, [operationCenter, radius, map1Object]);

  // Renderiza posições de disparo e ambiente
  useEffect(() => {
    if (!map1Object) return;

    // Remove marcadores anteriores
    const layersToRemove: any[] = [];
    map1Object.getLayers().forEach(layer => {
      if (layer && typeof layer.get === 'function' && layer.get('name') === 'gunshotMarkers') {
        layersToRemove.push(layer);
      }
    });
    layersToRemove.forEach(layer => map1Object.removeLayer(layer));

    const features: Feature[] = [];

    // Posição real do disparo (vermelho)
    if (gunshotPosition) {
      const realMarker = new Feature({
        geometry: new Point(fromLonLat([gunshotPosition.lon, gunshotPosition.lat])),
        name: 'Real Gunshot',
      });
      realMarker.setStyle(new Style({
        image: new CircleStyle({
          radius: 8,
          fill: new Fill({ color: 'rgba(255, 0, 0, 0.8)' }),
          stroke: new Stroke({ color: 'white', width: 2 }),
        }),
      }));
      features.push(realMarker);
    }

    // Posição de som ambiente (amarelo)
    if (ambientPosition) {
      const ambientMarker = new Feature({
        geometry: new Point(fromLonLat([ambientPosition.lon, ambientPosition.lat])),
        name: 'Ambient Sound',
      });
      ambientMarker.setStyle(new Style({
        image: new CircleStyle({
          radius: 8,
          fill: new Fill({ color: 'rgba(255, 193, 7, 0.8)' }),
          stroke: new Stroke({ color: 'white', width: 2 }),
        }),
      }));
      features.push(ambientMarker);
    }

    // Posição calculada (verde)
    if (calculatedPosition) {
      const calcMarker = new Feature({
        geometry: new Point(fromLonLat([calculatedPosition.lon, calculatedPosition.lat])),
        name: 'Calculated Gunshot',
      });
      calcMarker.setStyle(new Style({
        image: new CircleStyle({
          radius: 8,
          fill: new Fill({ color: 'rgba(0, 255, 0, 0.8)' }),
          stroke: new Stroke({ color: 'white', width: 2 }),
        }),
      }));
      features.push(calcMarker);
    }

    if (features.length > 0) {
      const vectorSource = new VectorSource({ features });
      const vectorLayer = new VectorLayer({ source: vectorSource });
      vectorLayer.set('name', 'gunshotMarkers');
      map1Object.addLayer(vectorLayer);
    }

  }, [gunshotPosition, ambientPosition, calculatedPosition, map1Object]);

  const changeCoverArea = () => {
    if (!map1Object) {
      console.error("Map object not initialized");
      return;
    }

    setMode('settingArea');
    const mapElement = map1Object.getTargetElement();
    mapElement.style.cursor = 'crosshair';

    map1Object.once('singleclick', async (evt) => {
      mapElement.style.cursor = '';
      setMode('idle');

      const coords_mercator = evt.coordinate;
      const coords_lonlat = toLonLat(coords_mercator);
      
      console.log('Posição do centro de operação (Lon/Lat):', coords_lonlat);

      try {
        const response = await fetch('/api/drone/position', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            position: coords_lonlat, 
            drone_count: droneCount,
            radius: radius
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
          droneId: `drone-${index}`
        }));

        setDronePositions(positions);
        setOperationCenter({ lon: coords_lonlat[0], lat: coords_lonlat[1] });
        setGunshotPosition(null);
        setCalculatedPosition(null);
        setDetectionResult(null);
        
        console.log('Drones posicionados:', positions);
        
      } catch (error) {
        console.error('Failed to send position to server:', error);
      }
    });
  };

  const setGunshot = () => {
    if (!map1Object) {
      console.error("Map object not initialized");
      return;
    }

    if (dronePositions.length === 0) {
      alert('Configure a área de operação primeiro!');
      return;
    }

    setMode('settingGunshot');
    const mapElement = map1Object.getTargetElement();
    mapElement.style.cursor = 'crosshair';

    map1Object.once('singleclick', async (evt) => {
      mapElement.style.cursor = '';
      setMode('idle');

      const coords_mercator = evt.coordinate;
      const coords_lonlat = toLonLat(coords_mercator);
      
      const shotPos = { lon: coords_lonlat[0], lat: coords_lonlat[1] };
      setGunshotPosition(shotPos);
      setCalculatedPosition(null);
      setIsAnalyzing(true);

      console.log('Posição do disparo:', shotPos);

      try {
        // Simula o disparo e gera áudio para cada drone
        const simulateResponse = await fetch('/api/audio/simulate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            gunshotPosition: shotPos,
            dronePositions: dronePositions.map(pos => ({
              droneId: pos.droneId,
              position: { lon: pos.lon, lat: pos.lat }
            }))
          }),
        });

        if (!simulateResponse.ok) {
          throw new Error('Falha ao simular disparo');
        }

        const simulateData = await simulateResponse.json();
        console.log('Áudio simulado:', simulateData);

        // Envia áudio de cada drone para análise
        const sessionId = `session-${Date.now()}`;
        
        for (const droneAudio of simulateData.droneAudioData) {
          await fetch('/api/audio/analyze', {
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
        }

        // Aguarda análise completa
        let analysisReady = false;
        let attempts = 0;
        const maxAttempts = 20;

        while (!analysisReady && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const analysisResponse = await fetch(
            `/api/audio/analyze?sessionId=${sessionId}&expectedDrones=${dronePositions.length}`
          );

          const analysisData = await analysisResponse.json();
          
          if (analysisData.ready) {
            analysisReady = true;
            setDetectionResult(analysisData);
            
            if (analysisData.calculatedPosition) {
              setCalculatedPosition(analysisData.calculatedPosition);
              console.log('Posição calculada:', analysisData.calculatedPosition);
            }
          }
          
          attempts++;
        }

        setIsAnalyzing(false);

      } catch (error) {
        console.error('Erro ao processar disparo:', error);
        setIsAnalyzing(false);
      }
    });
  };

  const setAmbient = () => {
    if (!map1Object) {
      console.error("Map object not initialized");
      return;
    }

    if (dronePositions.length === 0) {
      alert('Configure a área de operação primeiro!');
      return;
    }

    setMode('settingAmbient');
    const mapElement = map1Object.getTargetElement();
    mapElement.style.cursor = 'crosshair';

    map1Object.once('singleclick', async (evt) => {
      mapElement.style.cursor = '';
      setMode('idle');

      const coords_mercator = evt.coordinate;
      const coords_lonlat = toLonLat(coords_mercator);
      
      const ambientPos = { lon: coords_lonlat[0], lat: coords_lonlat[1] };
      setAmbientPosition(ambientPos);
      setCalculatedPosition(null);
      setIsAnalyzing(true);

      console.log('Posição do som ambiente:', ambientPos);

      try {
        // Simula o som ambiente e gera áudio para cada drone
        const simulateResponse = await fetch('/api/audio/simulate-ambient', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ambientPosition: ambientPos,
            dronePositions: dronePositions.map(pos => ({
              droneId: pos.droneId,
              position: { lon: pos.lon, lat: pos.lat }
            }))
          }),
        });

        if (!simulateResponse.ok) {
          throw new Error('Falha ao simular som ambiente');
        }

        const simulateData = await simulateResponse.json();
        console.log('Áudio ambiente simulado:', simulateData);

        // Envia áudio de cada drone para análise
        const sessionId = `session-${Date.now()}`;
        
        for (const droneAudio of simulateData.droneAudioData) {
          await fetch('/api/audio/analyze', {
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
        }

        // Aguarda análise completa
        let analysisReady = false;
        let attempts = 0;
        const maxAttempts = 20;

        while (!analysisReady && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const analysisResponse = await fetch(
            `/api/audio/analyze?sessionId=${sessionId}&expectedDrones=${dronePositions.length}`
          );

          const analysisData = await analysisResponse.json();
          
          if (analysisData.ready) {
            analysisReady = true;
            setDetectionResult(analysisData);
            
            if (analysisData.calculatedPosition) {
              setCalculatedPosition(analysisData.calculatedPosition);
              console.log('Posição calculada:', analysisData.calculatedPosition);
            }
          }
          
          attempts++;
        }

        setIsAnalyzing(false);

      } catch (error) {
        console.error('Erro ao processar som ambiente:', error);
        setIsAnalyzing(false);
      }
    });
  };

  return (
    <div className="flex h-[100vh] bg-gradient-to-br from-slate-100 to-slate-200">
      <div className='flex-1 border-r-2 border-slate-300 shadow-inner'>
        <Map1 setMap1Object={setMap1Object} />
      </div>
      <div className='w-96 bg-gradient-to-b from-slate-800 to-slate-900 p-6 overflow-y-auto shadow-2xl'>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">
            Simulador de Detecção
          </h2>
          <p className="text-slate-400 text-sm">Sistema de Enxame de Drones</p>
        </div>
        
        <div className="flex flex-col space-y-4">
          {/* Configurações */}
          <div className="bg-slate-700/50 backdrop-blur-sm rounded-lg p-4 border border-slate-600/50 shadow-lg">
            <div className="flex items-center mb-3">
              <div className="w-1 h-5 bg-blue-500 rounded-full mr-2"></div>
              <h3 className="font-semibold text-white text-lg">Configurações</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="radiusInput" className="block text-sm font-medium text-slate-300 mb-1.5">
                  🎯 Raio de Operação (km)
                </label>
                <input
                  id="radiusInput"
                  type="number"
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg shadow-sm p-2.5 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  min="0.1"
                  step="0.1"
                />
              </div>

              <div>
                <label htmlFor="droneCountInput" className="block text-sm font-medium text-slate-300 mb-1.5">
                  🚁 Quantidade de Drones
                </label>
                <input
                  id="droneCountInput"
                  type="number"
                  value={droneCount}
                  onChange={(e) => setDroneCount(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg shadow-sm p-2.5 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  min="3"
                />
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="bg-slate-700/50 backdrop-blur-sm rounded-lg p-4 border border-slate-600/50 shadow-lg">
            <div className="flex items-center mb-3">
              <div className="w-1 h-5 bg-green-500 rounded-full mr-2"></div>
              <h3 className="font-semibold text-white text-lg">Ações</h3>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={changeCoverArea} 
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 shadow-md ${
                  mode === 'settingArea' 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-blue-500/50 ring-2 ring-blue-400 scale-[0.98]' 
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-lg hover:shadow-blue-500/50 active:scale-[0.98]'
                } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md`}
                disabled={mode === 'settingGunshot'}
              >
                {mode === 'settingArea' ? '📍 Clique no mapa...' : '🗺️ Definir Área de Operação'}
              </button>
              
              <button 
                onClick={setGunshot} 
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 shadow-md ${
                  mode === 'settingGunshot' 
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-red-500/50 ring-2 ring-red-400 scale-[0.98]' 
                    : 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 hover:shadow-lg hover:shadow-red-500/50 active:scale-[0.98]'
                } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md`}
                disabled={dronePositions.length === 0 || mode === 'settingArea' || isAnalyzing}
              >
                {mode === 'settingGunshot' ? '🎯 Clique na posição...' : '🔫 Simular Disparo'}
              </button>

              <button 
                onClick={setAmbient} 
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 shadow-md ${
                  mode === 'settingAmbient' 
                    ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-amber-500/50 ring-2 ring-amber-400 scale-[0.98]' 
                    : 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white hover:from-amber-600 hover:to-yellow-600 hover:shadow-lg hover:shadow-amber-500/50 active:scale-[0.98]'
                } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md`}
                disabled={dronePositions.length === 0 || mode === 'settingArea' || isAnalyzing}
              >
                {mode === 'settingAmbient' ? '🎯 Clique na posição...' : '🔊 Simular Som Ambiente'}
              </button>
            </div>
          </div>

          {/* Status */}
          <div className="bg-slate-700/50 backdrop-blur-sm rounded-lg p-4 border border-slate-600/50 shadow-lg">
            <div className="flex items-center mb-3">
              <div className="w-1 h-5 bg-purple-500 rounded-full mr-2"></div>
              <h3 className="font-semibold text-white text-lg">Status do Sistema</h3>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center bg-slate-800/50 rounded p-2">
                <span className="text-slate-300">Drones ativos:</span>
                <span className="text-white font-bold bg-blue-600 px-2.5 py-0.5 rounded-full">{dronePositions.length}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-800/50 rounded p-2">
                <span className="text-slate-300">Centro de operação:</span>
                <span className={`font-bold ${operationCenter ? 'text-green-400' : 'text-red-400'}`}>
                  {operationCenter ? '✓ Definido' : '✗ Não definido'}
                </span>
              </div>
              <div className="flex justify-between items-center bg-slate-800/50 rounded p-2">
                <span className="text-slate-300">Raio atual:</span>
                <span className="text-white font-bold">{radius} km</span>
              </div>
            </div>
          </div>

          {/* Análise em progresso */}
          {isAnalyzing && (
            <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-sm rounded-lg p-4 border-2 border-amber-500/50 shadow-lg animate-pulse">
              <div className="flex items-center">
                <div className="mr-3">
                  <div className="w-5 h-5 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-amber-100 font-semibold text-sm">⏳ Analisando áudio dos drones...</p>
              </div>
            </div>
          )}

          {/* Resultados */}
          {detectionResult && (
            <div className={`backdrop-blur-sm rounded-lg p-4 border-2 shadow-xl ${
              detectionResult.isGunshot 
                ? 'bg-gradient-to-br from-red-500/20 to-red-600/20 border-red-500/60 shadow-red-500/20' 
                : 'bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-500/60 shadow-green-500/20'
            }`}>
              <div className="flex items-center mb-3">
                <div className={`w-1 h-5 rounded-full mr-2 ${detectionResult.isGunshot ? 'bg-red-500' : 'bg-green-500'}`}></div>
                <h3 className="font-semibold text-white text-lg">Resultado da Análise</h3>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 font-medium">Detecção:</span>
                    <span className={`font-bold text-lg ${detectionResult.isGunshot ? 'text-red-400' : 'text-green-400'}`}>
                      {detectionResult.isGunshot ? '🔴 DISPARO DETECTADO' : '🟢 Sem disparo'}
                    </span>
                  </div>
                </div>
                
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 font-medium">Confiança:</span>
                    <div className="flex items-center">
                      <div className="w-32 h-2 bg-slate-700 rounded-full mr-2 overflow-hidden">
                        <div 
                          className={`h-full ${detectionResult.isGunshot ? 'bg-red-500' : 'bg-green-500'} rounded-full`}
                          style={{ width: `${detectionResult.confidence * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-white font-bold">{(detectionResult.confidence * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 font-medium">Drones confirmaram:</span>
                    <span className="text-white font-bold">
                      {detectionResult.gunshotDetections}/{detectionResult.totalDrones}
                    </span>
                  </div>
                </div>
                
                {detectionResult.calculatedPosition && (gunshotPosition || ambientPosition) && (
                  <div className="bg-slate-800/50 rounded-lg p-3 mt-2">
                    <p className="font-semibold text-white mb-2">📍 Coordenadas:</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center">
                        <span className={`font-bold mr-2 ${gunshotPosition ? 'text-red-400' : 'text-amber-400'}`}>
                          ● {gunshotPosition ? 'Real (Disparo):' : 'Real (Ambiente):'}
                        </span>
                        <span className="text-slate-300 font-mono">
                          ({gunshotPosition ? gunshotPosition.lat.toFixed(6) : ambientPosition?.lat.toFixed(6)}, {gunshotPosition ? gunshotPosition.lon.toFixed(6) : ambientPosition?.lon.toFixed(6)})
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-green-400 font-bold mr-2">● Calculada:</span>
                        <span className="text-slate-300 font-mono">
                          ({detectionResult.calculatedPosition.lat.toFixed(6)}, {detectionResult.calculatedPosition.lon.toFixed(6)})
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Legenda */}
          <div className="bg-slate-700/30 backdrop-blur-sm rounded-lg p-3 border border-slate-600/30 shadow-md">
            <h3 className="font-semibold text-slate-300 text-xs mb-2 uppercase tracking-wide">Legenda do Mapa</h3>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center">
                <span className="text-blue-400 font-bold text-lg mr-2">●</span>
                <span className="text-slate-300">Área de operação</span>
              </div>
              <div className="flex items-center">
                <span className="text-red-500 font-bold text-lg mr-2">●</span>
                <span className="text-slate-300">Posição real do disparo</span>
              </div>
              <div className="flex items-center">
                <span className="text-amber-400 font-bold text-lg mr-2">●</span>
                <span className="text-slate-300">Posição do som ambiente</span>
              </div>
              <div className="flex items-center">
                <span className="text-green-500 font-bold text-lg mr-2">●</span>
                <span className="text-slate-300">Posição calculada</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MapPage;