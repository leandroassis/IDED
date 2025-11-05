'use client'

import { playAudioFromBase64 } from '@/lib/audioPlayer';

interface DroneAudio {
  droneId: string;
  audioData: string;
  distance: number;
}

interface DroneAudioListProps {
  droneAudioBuffers: DroneAudio[];
}

export default function DroneAudioList({ droneAudioBuffers }: DroneAudioListProps) {
  if (droneAudioBuffers.length === 0) return null;

  // Ordena por distância (mais próximo primeiro)
  const sortedDrones = [...droneAudioBuffers].sort((a, b) => a.distance - b.distance);

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50 shadow-lg">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="font-semibold text-white text-base">Áudio dos Drones</h3>
        <span className="text-xs text-slate-400">{sortedDrones.length} drone(s)</span>
      </div>
      
      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {sortedDrones.map((drone, idx) => (
          <div 
            key={idx}
            className="bg-slate-700/50 rounded-lg p-3 border border-slate-600/30 hover:border-slate-500/50 transition-colors group"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-slate-300 truncate">
                    {drone.droneId}
                  </span>
                  <span className="text-xs text-slate-500">
                    {drone.distance.toFixed(1)}m
                  </span>
                </div>
                <div className="h-1 bg-slate-600/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500/70 rounded-full transition-all"
                    style={{ 
                      width: `${Math.max(10, 100 - (drone.distance / 2))}%` 
                    }}
                  />
                </div>
              </div>
              <button
                onClick={() => {
                  playAudioFromBase64(drone.audioData, 0.7).catch(err => {
                    console.error('Erro ao reproduzir:', err);
                  });
                }}
                className="flex-shrink-0 px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white text-xs rounded-md transition-colors active:scale-95"
              >
                Play
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-3 pt-3 border-t border-slate-700/50">
        <p className="text-xs text-slate-400">
          Ordenado por distância • Volume inclui propagação real
        </p>
      </div>
    </div>
  );
}
