'use client'

interface ActionButtonsProps {
  isAnalyzing: boolean;
  onPositionGunshot: () => void;
  onPositionAmbient: () => void;
  onAnalyze: () => void;
  onClear: () => void;
  hasGunshotPosition: boolean;
  hasAmbientPosition: boolean;
}

export default function ActionButtons({
  isAnalyzing,
  onPositionGunshot,
  onPositionAmbient,
  onAnalyze,
  onClear,
  hasGunshotPosition,
  hasAmbientPosition,
}: ActionButtonsProps) {
  return (
    <div className="bg-slate-800/70 backdrop-blur-sm rounded-xl p-5 border border-slate-700 shadow-xl">
      <h3 className="text-white font-semibold mb-4 text-base">Ações</h3>
      
      <div className="space-y-2.5">
        <button
          onClick={onPositionGunshot}
          disabled={isAnalyzing}
          className="w-full bg-red-600 hover:bg-red-500 disabled:bg-red-600/40 text-white py-2.5 px-4 rounded-lg transition-colors disabled:cursor-not-allowed text-sm font-medium shadow-lg"
        >
          Posicionar Disparo
        </button>

        <button
          onClick={onPositionAmbient}
          disabled={isAnalyzing}
          className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-amber-600/40 text-white py-2.5 px-4 rounded-lg transition-colors disabled:cursor-not-allowed text-sm font-medium shadow-lg"
        >
          Posicionar Ambiente
        </button>

        <button
          onClick={onAnalyze}
          disabled={isAnalyzing || (!hasGunshotPosition && !hasAmbientPosition)}
          className="w-full bg-green-600 hover:bg-green-500 disabled:bg-slate-600/40 text-white py-2.5 px-4 rounded-lg transition-colors disabled:cursor-not-allowed text-sm font-medium shadow-lg"
        >
          {isAnalyzing ? 'Analisando...' : 'Analisar Áudio'}
        </button>

        <button
          onClick={onClear}
          disabled={isAnalyzing}
          className="w-full bg-slate-600 hover:bg-slate-500 disabled:bg-slate-600/40 text-white py-2.5 px-4 rounded-lg transition-colors disabled:cursor-not-allowed text-sm font-medium"
        >
          Limpar
        </button>
      </div>

      <div className="mt-4 space-y-1.5 text-xs text-slate-400">
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full bg-red-400 mr-2"></div>
          <span>Vermelho: posição de disparo simulado</span>
        </div>
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full bg-amber-400 mr-2"></div>
          <span>Amarelo: posição de som ambiente</span>
        </div>
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full bg-green-400 mr-2"></div>
          <span>Verde: posição calculada (TDOA)</span>
        </div>
      </div>
    </div>
  );
}
