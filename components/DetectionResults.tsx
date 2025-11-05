'use client'

interface DetectionResult {
  isGunshot: boolean;
  confidence: number;
  gunshotDetections: number;
  totalDrones: number;
  calculatedPosition?: {
    lat: number;
    lon: number;
  };
}

interface GeoPosition {
  lon: number;
  lat: number;
}

interface DetectionResultsProps {
  detectionResult: DetectionResult | null;
  gunshotPosition: GeoPosition | null;
  ambientPosition: GeoPosition | null;
}

export default function DetectionResults({ 
  detectionResult, 
  gunshotPosition, 
  ambientPosition 
}: DetectionResultsProps) {
  const hasResult = Boolean(detectionResult);

  return (
    <div className={`backdrop-blur-sm rounded-xl p-5 border-2 shadow-xl ${
      hasResult
        ? (detectionResult!.isGunshot ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30')
        : 'bg-slate-800/10 border-slate-600/20'
    }`}>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-white text-base">Resultado</h3>
          <span className={`text-xs font-medium px-2 py-1 rounded ${
            hasResult
              ? (detectionResult!.isGunshot ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300')
              : 'bg-slate-700/20 text-slate-300'
          }`}>
            {hasResult ? (detectionResult!.isGunshot ? 'DISPARO' : 'SEM DISPARO') : 'SEM RESULTADO'}
          </span>
        </div>

        {hasResult ? (
          // Barra de confiança
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Confiança</span>
              <span className="font-mono">{(detectionResult!.confidence * 100).toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  detectionResult!.isGunshot ? 'bg-red-500' : 'bg-green-500'
                }`}
                style={{ width: `${detectionResult!.confidence * 100}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-400">Nenhum resultado. Simule um disparo ou som ambiente para ver a análise aqui.</div>
        )}
      </div>

      {hasResult && (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between bg-slate-800/40 rounded-lg p-2">
            <span className="text-slate-400">Drones confirmaram</span>
            <span className="text-white font-mono">
              {detectionResult!.gunshotDetections}/{detectionResult!.totalDrones}
            </span>
          </div>

          {detectionResult!.calculatedPosition && (gunshotPosition || ambientPosition) && (
            <div className="bg-slate-800/40 rounded-lg p-2 mt-2">
              <p className="text-xs text-slate-400 mb-1.5">Coordenadas</p>
              <div className="space-y-1 text-xs font-mono">
                <div className="flex items-center text-slate-300">
                  <span className={`w-2 h-2 rounded-full mr-2 ${gunshotPosition ? 'bg-red-400' : 'bg-amber-400'}`}></span>
                  <span className="text-slate-500 w-16">Real:</span>
                  <span>
                    {gunshotPosition ? gunshotPosition.lat.toFixed(6) : ambientPosition?.lat.toFixed(6)}, 
                    {gunshotPosition ? gunshotPosition.lon.toFixed(6) : ambientPosition?.lon.toFixed(6)}
                  </span>
                </div>
                <div className="flex items-center text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-green-400 mr-2"></span>
                  <span className="text-slate-500 w-16">Calc:</span>
                  <span>
                    {detectionResult!.calculatedPosition.lat.toFixed(6)}, 
                    {detectionResult!.calculatedPosition.lon.toFixed(6)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
