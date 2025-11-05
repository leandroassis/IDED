'use client'

interface ConfigPanelProps {
  radius: number;
  onRadiusChange: (value: number) => void;
  droneCount: number;
  onDroneCountChange: (value: number) => void;
  noiseLevel: number;
  onNoiseLevelChange: (value: number) => void;
  droneGain: number;
  onDroneGainChange: (value: number) => void;
}

export default function ConfigPanel({
  radius,
  onRadiusChange,
  droneCount,
  onDroneCountChange,
  noiseLevel,
  onNoiseLevelChange,
  droneGain,
  onDroneGainChange,
}: ConfigPanelProps) {
  return (
    <div className="bg-slate-800/70 backdrop-blur-sm rounded-xl p-5 border border-slate-700 shadow-xl">
      <h3 className="text-white font-semibold mb-4 text-base">Configuração</h3>
      
      <div className="space-y-4">
        {/* Raio */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm text-slate-300">Raio</label>
            <span className="text-xs font-mono bg-slate-700/50 px-2 py-1 rounded text-slate-200">
              {radius} m
            </span>
          </div>
          <input
            type="range"
            min="100"
            max="1000"
            step="50"
            value={radius}
            onChange={(e) => onRadiusChange(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        {/* Quantidade de Drones */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm text-slate-300">Drones</label>
            <span className="text-xs font-mono bg-slate-700/50 px-2 py-1 rounded text-slate-200">
              {droneCount}
            </span>
          </div>
          <input
            type="range"
            min="3"
            max="12"
            step="1"
            value={droneCount}
            onChange={(e) => onDroneCountChange(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        {/* Nível de Ruído */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm text-slate-300">Ruído</label>
            <span className="text-xs font-mono bg-slate-700/50 px-2 py-1 rounded text-slate-200">
              {(noiseLevel * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="0.1"
            step="0.005"
            value={noiseLevel}
            onChange={(e) => onNoiseLevelChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        {/* Ganho de Áudio */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm text-slate-300">Ganho</label>
            <span className="text-xs font-mono bg-slate-700/50 px-2 py-1 rounded text-slate-200">
              {droneGain.toFixed(1)}x
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            step="0.5"
            value={droneGain}
            onChange={(e) => onDroneGainChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
      </div>

      <p className="text-xs text-slate-500 mt-4 leading-relaxed">
        Ajuste o raio da área de patrulha e o número de drones para simular diferentes cenários. 
        O ruído e ganho afetam a detecção.
      </p>
    </div>
  );
}
