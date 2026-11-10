import React, { useState } from 'react';
import { DIMENSIONS } from '../data';
import { BarChart3, Activity, Info, CheckCircle2 } from 'lucide-react';

interface RadarChart5DProps {
  vectorA: number[];
  vectorB?: number[];
  labelA?: string;
  labelB?: string;
  isVetoed?: boolean;
}

export const RadarChart5D: React.FC<RadarChart5DProps> = ({
  vectorA = [0, 0, 0, 0, 0],
  vectorB,
  labelA = 'Tu Perfil Vectorial',
  labelB = 'Candidato Objetivo',
  isVetoed = false
}) => {
  const [viewMode, setViewMode] = useState<'radar' | 'bars'>('bars');

  const safeVectorA = Array.isArray(vectorA) ? vectorA : [0, 0, 0, 0, 0];
  const safeVectorB = Array.isArray(vectorB) ? vectorB : safeVectorA;

  const width = 340;
  const height = 300;
  const centerX = width / 2;
  const centerY = height / 2 - 10;
  const radius = 95;

  // Convert normalized value in [-1, 1] to radius distance [0, radius]
  const valToDist = (val: number) => {
    const norm = (val + 1) / 2; // [0, 1]
    return norm * radius;
  };

  // Get point coordinates for dimension index i (0..4) and value val (-1..1)
  const getCoordinates = (index: number, val: number) => {
    const angle = (Math.PI * 2 * index) / 5 - Math.PI / 2;
    const dist = valToDist(val);
    const x = centerX + dist * Math.cos(angle);
    const y = centerY + dist * Math.sin(angle);
    return { x, y };
  };

  // Concentric polygon points for grid rings (e.g. at -1, -0.5, 0, 0.5, 1)
  const rings = [-1.0, -0.5, 0.0, 0.5, 1.0];

  const pointsA = safeVectorA.map((val, idx) => getCoordinates(idx, val));
  const pointsB = safeVectorB.map((val, idx) => getCoordinates(idx, val));

  const pathA = pointsA.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  const pathB = pointsB.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  // Short descriptive axis labels for radar chart
  const shortAxisLabels = [
    'E1: Intercambio',
    'E2: Integrantes',
    'E3: Participación',
    'E4: Vínculo',
    'E5: Acuerdos'
  ];

  return (
    <div className="bg-[#0e0e14] border border-white/[0.09] rounded-2xl p-4 flex flex-col items-center relative overflow-hidden shadow-xl">
      {/* Header & View Switcher */}
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-white/[0.08]">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
              <span>Vector de Afinidad 5D</span>
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">Comparación Psicométrica Directa</p>
          </div>
        </div>

        {/* Toggle Buttons */}
        <div className="flex items-center bg-[#070709] border border-white/[0.1] p-1 rounded-xl gap-1 self-stretch sm:self-auto">
          <button
            onClick={() => setViewMode('radar')}
            className={`flex-1 sm:flex-initial px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer ${
              viewMode === 'radar'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3 h-3" />
            <span>Radial 5D</span>
          </button>
          <button
            onClick={() => setViewMode('bars')}
            className={`flex-1 sm:flex-initial px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer ${
              viewMode === 'bars'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3 h-3" />
            <span>Barras (%)</span>
          </button>
        </div>
      </div>

      {isVetoed && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center z-10 p-4 text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center mb-2 animate-bounce">
            🚫
          </div>
          <span className="text-sm font-bold text-red-400 uppercase tracking-wide">
            Cómputo Vectorial Anulado
          </span>
          <p className="text-xs text-slate-300 max-w-xs mt-1">
            Incompatibilidad de veto directo. El motor omitió la afinidad coseno debido a límites innegociables.
          </p>
        </div>
      )}

      {/* VIEW 1: RADAR CHART */}
      {viewMode === 'radar' ? (
        <div className="flex flex-col items-center w-full">
          <svg width={width} height={height} className="overflow-visible">
            {/* Background Grid Rings */}
            {rings.map((ringVal, rIdx) => {
              const ringPoints = Array.from({ length: 5 }).map((_, idx) => getCoordinates(idx, ringVal));
              const ringPath = ringPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
              return (
                <path
                  key={`ring-${rIdx}`}
                  d={ringPath}
                  fill={ringVal === 0 ? 'rgba(244, 63, 94, 0.03)' : 'none'}
                  stroke={ringVal === 0 ? '#f43f5e' : '#334155'}
                  strokeWidth={ringVal === 0 ? 1.5 : 0.75}
                  strokeDasharray={ringVal === 0 ? 'none' : '3 3'}
                />
              );
            })}

            {/* Axis Lines & Descriptive Labels */}
            {DIMENSIONS.map((dim, idx) => {
              const outer = getCoordinates(idx, 1.0);
              const inner = getCoordinates(idx, -1.0);
              const labelText = shortAxisLabels[idx];

              return (
                <g key={`axis-${idx}`}>
                  <line
                    x1={inner.x}
                    y1={inner.y}
                    x2={outer.x}
                    y2={outer.y}
                    stroke="#475569"
                    strokeWidth={1}
                  />
                  {/* Clear Axis Label with Title */}
                  <text
                    x={outer.x + (outer.x - centerX) * 0.32}
                    y={outer.y + (outer.y - centerY) * 0.32}
                    fill="#e2e8f0"
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="font-mono drop-shadow-md"
                  >
                    {labelText}
                  </text>
                </g>
              );
            })}

            {/* Vector A Polygon (Tu Perfil) */}
            <path
              d={pathA}
              fill="rgba(244, 63, 94, 0.25)"
              stroke="#f43f5e"
              strokeWidth={2.5}
              className="transition-all duration-300"
            />
            {pointsA.map((p, idx) => (
              <circle key={`ptA-${idx}`} cx={p.x} cy={p.y} r={4} fill="#f43f5e" stroke="#0f172a" strokeWidth={1.5} />
            ))}

            {/* Vector B Polygon (Target) */}
            <path
              d={pathB}
              fill="rgba(99, 102, 241, 0.25)"
              stroke="#6366f1"
              strokeWidth={2}
              strokeDasharray="4 2"
              className="transition-all duration-300"
            />
            {pointsB.map((p, idx) => (
              <circle key={`ptB-${idx}`} cx={p.x} cy={p.y} r={3.5} fill="#6366f1" stroke="#0f172a" strokeWidth={1.5} />
            ))}
          </svg>

          {/* Legend */}
          <div className="flex items-center justify-center space-x-6 mt-2 text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded bg-rose-500/80 border border-rose-400 inline-block"></span>
              <span className="text-slate-200 font-bold">{labelA}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded bg-indigo-500/80 border border-indigo-400 border-dashed inline-block"></span>
              <span className="text-slate-200 font-bold">{labelB}</span>
            </div>
          </div>
        </div>
      ) : (
        /* VIEW 2: PERCENTAGE BARS BREAKDOWN (CLEAN, COMPACT & UNBOXED LIKE FEED CARD) */
        <div className="w-full space-y-2.5 py-1 px-1">
          {DIMENSIONS.map((dim, idx) => {
            const valA = safeVectorA[idx] ?? 0;
            const valB = safeVectorB[idx] ?? 0;

            const diff = Math.abs(valA - valB); // [0..2]
            const dimMatchPct = Math.round((1 - diff / 2) * 100);

            let barColor = 'bg-amber-400';
            let textColor = 'text-amber-300';
            if (dimMatchPct < 60) {
              barColor = 'bg-amber-600';
              textColor = 'text-amber-400/90';
            } else if (dimMatchPct >= 90) {
              barColor = 'bg-amber-300';
              textColor = 'text-amber-200';
            }

            return (
              <div key={dim.key} className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                  <span className="text-slate-200 font-sans font-semibold">
                    <strong className="text-amber-400 font-mono mr-1.5">{dim.code}</strong>
                    {dim.shortLabel}
                  </span>
                  <span className={`font-mono font-extrabold text-xs ${textColor}`}>
                    {dimMatchPct}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden border border-white/10 relative">
                  <div
                    className={`h-full ${barColor} rounded-full transition-all duration-500`}
                    style={{ width: `${dimMatchPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
