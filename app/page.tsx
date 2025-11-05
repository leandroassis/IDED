'use client'

import { useEffect, useState, FC, useMemo, useCallback } from "react";
import Map from 'ol/Map';
import Map1 from "@/components/map";
import 'ol-ext/dist/ol-ext.css';
import { playAudioFromBase64 } from '@/lib/audioPlayer';
import { calculateDistance } from '@/lib/geoUtils';
import { uploadDroneAudioBatch, pollAnalysisResult } from '@/lib/performanceUtils';

import { fromLonLat, toLonLat } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
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
  const [noiseLevel, setNoiseLevel] = useState<number>(0.01); // 1% de ruído
  const [droneGain, setDroneGain] = useState<number>(3.0); // Ganho de áudio
  const [operationCenter, setOperationCenter] = useState<GeoPosition | null>(null);
  const [gunshotPosition, setGunshotPosition] = useState<GeoPosition | null>(null);
  const [ambientPosition, setAmbientPosition] = useState<GeoPosition | null>(null);
  const [calculatedPosition, setCalculatedPosition] = useState<GeoPosition | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [detectionResult, setDetectionResult] = useState<any>(null);
  const [mode, setMode] = useState<'idle' | 'settingArea' | 'settingGunshot' | 'settingAmbient'>('idle');
  const [droneAudioBuffers, setDroneAudioBuffers] = useState<Array<{ droneId: string; audioData: string; distance: number }>>([]);
  const [showDebugPanel, setShowDebugPanel] = useState<boolean>(true); // Modo demo
  const hasResult = Boolean(detectionResult);

  // Memoiza estilo dos drones para evitar recriação
  const droneStyle = useMemo(() => new Style({
    image: new Icon({
      anchor: [0.5, 0.5],
      anchorXUnits: 'fraction',
      anchorYUnits: 'fraction',
      scale: 0.3,
      src: '/drone_icon.svg',
    }),
  }), []);

  // Memoiza estilo do círculo de área
  const circleStyle = useMemo(() => new Style({
    stroke: new Stroke({
      color: 'rgba(0, 123, 255, 0.8)',
      width: 2,
    }),
    fill: new Fill({
      color: 'rgba(0, 123, 255, 0.1)',
    }),
  }), []);

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

    const vectorSource = new VectorSource({ features });
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: droneStyle, // Usa estilo memoizado
    });

    vectorLayer.set('name', 'droneLayer');
    map1Object.addLayer(vectorLayer);

  }, [dronePositions, map1Object, droneStyle]);

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

    const vectorSource = new VectorSource({ features: [circle] });
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: circleStyle, // Usa estilo memoizado
    });

    vectorLayer.set('name', 'operationArea');
    map1Object.addLayer(vectorLayer);

  }, [operationCenter, radius, map1Object, circleStyle]);

  // Renderiza estimativas individuais de cada drone (só se for disparo)
  useEffect(() => {
    if (!map1Object || !detectionResult?.droneEstimates || detectionResult.droneEstimates.length === 0 || !detectionResult.isGunshot) return;

    // Remove camada anterior
    const layersToRemove: any[] = [];
    map1Object.getLayers().forEach(layer => {
      if (layer && typeof layer.get === 'function' && layer.get('name') === 'droneEstimates') {
        layersToRemove.push(layer);
      }
    });
    layersToRemove.forEach(layer => map1Object.removeLayer(layer));

    const features: Feature[] = [];
    
    // Paleta de cores consistente para cada drone (baseada no droneId)
    const getColorForDrone = (droneId: string) => {
      // Gera hash simples do droneId para cor consistente
      let hash = 0;
      for (let i = 0; i < droneId.length; i++) {
        hash = droneId.charCodeAt(i) + ((hash << 5) - hash);
      }
      
      // Converte hash em cor HSL (varia o hue, mantém saturação e luminosidade)
      const hue = Math.abs(hash % 360);
      return `hsl(${hue}, 70%, 50%)`;
    };

    detectionResult.droneEstimates.forEach((estimate: any) => {
      const marker = new Feature({
        geometry: new Point(fromLonLat([estimate.estimatedPosition.lon, estimate.estimatedPosition.lat])),
        name: `Estimate ${estimate.droneId}`,
      });
      
      const color = getColorForDrone(estimate.droneId);
      
      marker.setStyle(new Style({
        image: new CircleStyle({
          radius: 5,
          fill: new Fill({ color: color }),
          stroke: new Stroke({ color: 'rgba(255, 255, 255, 0.8)', width: 1.5 }),
        }),
      }));
      
      features.push(marker);

      // Linha conectando drone à sua estimativa
      const dronePos = dronePositions.find(d => d.droneId === estimate.droneId);
      if (dronePos) {
        const line = new Feature({
          geometry: new LineString([
            fromLonLat([dronePos.lon, dronePos.lat]),
            fromLonLat([estimate.estimatedPosition.lon, estimate.estimatedPosition.lat])
          ]),
          name: `Line ${estimate.droneId}`,
        });
        
        line.setStyle(new Style({
          stroke: new Stroke({
            color: color.replace('50%', '30%'), // Versão mais transparente
            width: 1,
            lineDash: [3, 3]
          }),
        }));
        
        features.push(line);
      }
    });

    if (features.length > 0) {
      const vectorSource = new VectorSource({ features });
      const vectorLayer = new VectorLayer({ source: vectorSource });
      vectorLayer.set('name', 'droneEstimates');
      map1Object.addLayer(vectorLayer);
    }

  }, [detectionResult, dronePositions, map1Object]);

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

    // Posição calculada (verde) - só mostra se for detectado como disparo
    if (calculatedPosition && detectionResult?.isGunshot) {
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
      
      // Linha de erro conectando posição real e calculada
      const realPos = gunshotPosition || ambientPosition;
      if (realPos) {
        const errorLine = new Feature({
          geometry: new LineString([
            fromLonLat([realPos.lon, realPos.lat]),
            fromLonLat([calculatedPosition.lon, calculatedPosition.lat])
          ]),
          name: 'Error Line',
        });
        errorLine.setStyle(new Style({
          stroke: new Stroke({
            color: 'rgba(255, 255, 255, 0.6)',
            width: 2,
            lineDash: [5, 5]
          }),
        }));
        features.push(errorLine);
      }
    }

    if (features.length > 0) {
      const vectorSource = new VectorSource({ features });
      const vectorLayer = new VectorLayer({ source: vectorSource });
      vectorLayer.set('name', 'gunshotMarkers');
      map1Object.addLayer(vectorLayer);
    }

  }, [gunshotPosition, ambientPosition, calculatedPosition, detectionResult, map1Object]);

  const changeCoverArea = useCallback(() => {
    if (!map1Object) return;

    setMode('settingArea');
    const mapElement = map1Object.getTargetElement();
    mapElement.style.cursor = 'crosshair';

    map1Object.once('singleclick', async (evt) => {
      mapElement.style.cursor = '';
      setMode('idle');

      const coords_mercator = evt.coordinate;
      const coords_lonlat = toLonLat(coords_mercator);

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
        
      } catch (error) {
        console.error('Failed to send position to server:', error);
      }
    });
  }, [map1Object, droneCount, radius]);

  const setGunshot = useCallback(() => {
    if (!map1Object) return;

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
            })),
            noiseLevel: noiseLevel,
            droneGain: droneGain
          }),
        });

        if (!simulateResponse.ok) {
          throw new Error('Falha ao simular disparo');
        }

        const simulateData = await simulateResponse.json();

        // CRÍTICO: Criar cópia local ANTES de setState para evitar race condition
        const droneAudioList = [...simulateData.droneAudioData];

        // Armazena áudios dos drones para reprodução debug
        setDroneAudioBuffers(simulateData.droneAudioData);

        // Reproduz o áudio original no navegador
        if (simulateData.originalAudio) {
          playAudioFromBase64(simulateData.originalAudio, 0.5).catch(() => {});
        }

        // Envia áudio de cada drone para análise EM PARALELO (lotes de 10)
        const sessionId = `session-${Date.now()}`;
        await uploadDroneAudioBatch(sessionId, droneAudioList, 10);

        // Polling otimizado com backoff exponencial
        const analysisData = await pollAnalysisResult(sessionId, dronePositions.length);
        
        if (analysisData) {
          setDetectionResult(analysisData);
          
          if (analysisData.calculatedPosition) {
            setCalculatedPosition(analysisData.calculatedPosition);
          }
        }

        setIsAnalyzing(false);

      } catch (error) {
        setIsAnalyzing(false);
      }
    });
  }, [map1Object, dronePositions, noiseLevel, droneGain]);

  const setAmbient = useCallback(() => {
    if (!map1Object) return;

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
            })),
            noiseLevel: noiseLevel,
            droneGain: droneGain
          }),
        });

        if (!simulateResponse.ok) {
          throw new Error('Falha ao simular som ambiente');
        }

        const simulateData = await simulateResponse.json();

        // CRÍTICO: Criar cópia local ANTES de setState para evitar race condition
        const droneAudioList = [...simulateData.droneAudioData];

        // Armazena áudios dos drones para reprodução debug
        setDroneAudioBuffers(simulateData.droneAudioData);

        // Reproduz o áudio original no navegador
        if (simulateData.originalAudio) {
          playAudioFromBase64(simulateData.originalAudio, 0.5).catch(() => {});
        }

        // Envia áudio de cada drone para análise EM PARALELO (lotes de 10)
        const sessionId = `session-${Date.now()}`;
        await uploadDroneAudioBatch(sessionId, droneAudioList, 10);

        // Polling otimizado com backoff exponencial
        const analysisData = await pollAnalysisResult(sessionId, dronePositions.length);
        
        if (analysisData) {
          setDetectionResult(analysisData);
          
          if (analysisData.calculatedPosition) {
            setCalculatedPosition(analysisData.calculatedPosition);
          }
        }

        setIsAnalyzing(false);

      } catch (error) {
        setIsAnalyzing(false);
      }
    });
  }, [map1Object, dronePositions, noiseLevel, droneGain]);

  return (
    <div className="flex h-[100vh] bg-gradient-to-br from-slate-100 to-slate-200">
      <div className='flex-1 border-r-2 border-slate-300 shadow-inner'>
        <Map1 onMapCreated={setMap1Object} />
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
                  Raio de Operação (km)
                </label>
                <input
                  id="radiusInput"
                  type="number"
                  value={radius}
                  onChange={(e) => {
                    const v = e.target.value;
                    setRadius(v === '' ? 0 : Number(v));
                  }}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg shadow-sm p-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  min={0.1}
                  step={0.1}
                />
              </div>

              <div>
                <label htmlFor="droneCountInput" className="block text-sm font-medium text-slate-300 mb-1.5">
                  Quantidade de Drones
                </label>
                <input
                  id="droneCountInput"
                  type="number"
                  value={droneCount}
                  onChange={(e) => {
                    const v = e.target.value;
                    setDroneCount(v === '' ? 0 : Number(v));
                  }}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg shadow-sm p-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  min={1}
                  step={1}
                />
              </div>

              <div>
                <label htmlFor="noiseLevelInput" className="block text-sm font-medium text-slate-300 mb-1.5">
                  Nível de Ruído (%)
                </label>
                <input
                  id="noiseLevelInput"
                  type="number"
                  value={Number((noiseLevel * 100).toFixed(1))}
                  onChange={(e) => {
                    const v = e.target.value;
                    setNoiseLevel(v === '' ? 0 : Number(v) / 100);
                  }}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg shadow-sm p-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  min={0}
                  max={100}
                  step={0.1}
                />
              </div>

              <div>
                <label htmlFor="droneGainInput" className="block text-sm font-medium text-slate-300 mb-1.5">
                  Ganho de Áudio (x)
                </label>
                <input
                  id="droneGainInput"
                  type="number"
                  value={droneGain}
                  onChange={(e) => {
                    const v = e.target.value;
                    setDroneGain(v === '' ? 1 : Number(v));
                  }}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg shadow-sm p-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  min={0}
                  step={0.1}
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
                    ? 'bg-blue-600 text-white ring-2 ring-blue-400' 
                    : 'bg-blue-500 text-white hover:bg-blue-600 active:scale-[0.98]'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                disabled={mode === 'settingGunshot'}
              >
                {mode === 'settingArea' ? 'Clique no mapa...' : 'Definir Área de Operação'}
              </button>
              
              <button 
                onClick={setGunshot} 
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 shadow-md ${
                  mode === 'settingGunshot' 
                    ? 'bg-red-600 text-white ring-2 ring-red-400' 
                    : 'bg-red-500 text-white hover:bg-red-600 active:scale-[0.98]'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                disabled={dronePositions.length === 0 || mode === 'settingArea' || isAnalyzing}
              >
                {mode === 'settingGunshot' ? 'Clique na posição...' : 'Simular Disparo'}
              </button>

              <button 
                onClick={setAmbient} 
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 shadow-md ${
                  mode === 'settingAmbient' 
                    ? 'bg-amber-600 text-white ring-2 ring-amber-400' 
                    : 'bg-amber-500 text-white hover:bg-amber-600 active:scale-[0.98]'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                disabled={dronePositions.length === 0 || mode === 'settingArea' || isAnalyzing}
              >
                {mode === 'settingAmbient' ? 'Clique na posição...' : 'Simular Som Ambiente'}
              </button>
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
          <div className={`backdrop-blur-sm rounded-lg p-4 border-2 shadow-xl ${
            hasResult
              ? (detectionResult.isGunshot 
                  ? 'bg-gradient-to-br from-red-500/20 to-red-600/20 border-red-500/60 shadow-red-500/20' 
                  : 'bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-500/60 shadow-green-500/20')
              : 'bg-slate-800/20 border-slate-600/30'
          }`}>
            <div className="flex items-center mb-3">
              <div className={`w-1 h-5 rounded-full mr-2 ${hasResult ? (detectionResult.isGunshot ? 'bg-red-500' : 'bg-green-500') : 'bg-slate-500'}`}></div>
              <h3 className="font-semibold text-white text-lg">Resultado da Análise</h3>
            </div>

            {hasResult ? (
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
                
                {detectionResult.calculatedPosition && detectionResult.isGunshot && (gunshotPosition || ambientPosition) && (
                  <>
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
                    
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300 font-medium">Erro de posição:</span>
                        <span className="text-orange-400 font-bold">
                          {(() => {
                            const realPos = gunshotPosition || ambientPosition!;
                            const error = calculateDistance(realPos, detectionResult.calculatedPosition);
                            return error.toFixed(2);
                          })()} m
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="text-slate-400 text-sm">Nenhum resultado. Simule um disparo ou som ambiente para ver a análise aqui.</div>
            )}
          </div>

          {/* Painel Debug - Áudio dos Drones (Modo Demo) */}
          {showDebugPanel && droneAudioBuffers.length > 0 && (
            <div className="bg-slate-700/50 backdrop-blur-sm rounded-lg p-4 border border-slate-600/50 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-1 h-5 bg-purple-500 rounded-full mr-2"></div>
                  <h3 className="font-semibold text-white text-lg">Áudio Capturado pelos Drones</h3>
                </div>
                <button
                  onClick={() => setShowDebugPanel(false)}
                  className="text-slate-400 hover:text-white transition-colors text-xl leading-none"
                  title="Fechar painel"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                {droneAudioBuffers
                  .sort((a, b) => a.distance - b.distance)
                  .map((drone, idx) => (
                  <div 
                    key={idx}
                    className="bg-slate-800/60 rounded-lg p-3 border border-slate-600/40 hover:border-slate-500 transition-all"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-semibold">{drone.droneId}</span>
                          <span className="text-slate-400 text-sm font-mono">
                            {drone.distance.toFixed(1)}m
                          </span>
                        </div>
                        <div className="text-xs text-slate-400">
                          Áudio de 4s com propagação física
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          playAudioFromBase64(drone.audioData, 0.7).catch(() => {});
                        }}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg font-medium transition-colors active:scale-95"
                      >
                        ▶ Reproduzir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-3 pt-3 border-t border-slate-600/50">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    Ordenado por distância • Áudio inclui propagação real
                  </span>
                  <span className="text-purple-400 font-medium">
                    {droneAudioBuffers.length} drone(s)
                  </span>
                </div>
              </div>
            </div>
          )}

          {!showDebugPanel && droneAudioBuffers.length > 0 && (
            <button
              onClick={() => setShowDebugPanel(true)}
              className="w-full py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/50 rounded-lg text-purple-300 text-sm font-medium transition-all"
            >
              🎧 Mostrar Painel de Debug
            </button>
          )}

          {/* Legenda */}
          <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-3 border border-slate-700 shadow-md">
            <h3 className="font-semibold text-white text-xs mb-2 uppercase tracking-wide">Legenda do Mapa</h3>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center">
                <span className="text-blue-400 font-bold text-lg mr-2">●</span>
                <span className="text-slate-100">Área de operação</span>
              </div>
              <div className="flex items-center">
                <span className="text-red-500 font-bold text-lg mr-2">●</span>
                <span className="text-slate-100">Posição real do disparo</span>
              </div>
              <div className="flex items-center">
                <span className="text-amber-400 font-bold text-lg mr-2">●</span>
                <span className="text-slate-100">Posição do som ambiente</span>
              </div>
              <div className="flex items-center">
                <span className="text-green-500 font-bold text-lg mr-2">●</span>
                <span className="text-slate-100">Posição calculada</span>
              </div>
              <div className="flex items-center">
                <span className="text-white/80 font-bold text-lg mr-2">---</span>
                <span className="text-slate-100">Linha de erro</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MapPage;