import React from 'react';
import { Vector5D } from '../types';
import { DIMENSIONS } from '../data';
import { computeCoupleConsensus, vectorToArray } from '../utils';
import { ShieldCheck, ArrowRight, Scale } from 'lucide-react';

interface ConsensusMathViewProps {
  memberA: Vector5D;
  memberB: Vector5D;
  riskAversion: number;
  onRiskAversionChange: (val: number) => void;
}

export const ConsensusMathView: React.FC<ConsensusMathViewProps> = ({
  memberA,
  memberB,
  riskAversion,
  onRiskAversionChange
}) => {
  const vA = vectorToArray(memberA);
  const vB = vectorToArray(memberB);
  const consensus = computeCoupleConsensus(memberA, memberB, riskAversion);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Scale className="w-4 h-4 text-purple-400" />
            Consenso Asimétrico de Pareja con Aversión al Riesgo
          </h3>
          <p className="text-xs text-slate-400">
            Pondera las 5 dimensiones priorizando el confort del miembro más cauteloso o restringido.
          </p>
        </div>

        {/* Risk Aversion Slider */}
        <div className="bg-slate-950 p-2.5 rounded-xl border border-purple-900/40 min-w-[220px]">
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="font-semibold text-purple-300">Aversión al Riesgo (λ):</span>
            <span className="font-mono font-bold text-purple-400">{riskAversion.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.0"
            max="1.0"
            step="0.05"
            value={riskAversion}
            onChange={(e) => onRiskAversionChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
          <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
            <span>Promedio Aritmético (λ=0)</span>
            <span>Mínimo Estricto (λ=1)</span>
          </div>
        </div>
      </div>

      {/* Formula Explanation Callout */}
      <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 space-y-1">
        <div className="text-purple-400 font-bold font-sans">Fórmula Matemática Aplicada:</div>
        <div className="text-slate-200 bg-slate-900/90 p-2 rounded border border-slate-800">
          C_i = (1 - λ) × [(A_i + B_i) / 2] + λ × min(A_i, B_i)
        </div>
        <div className="text-[11px] text-slate-400 font-sans">
          Con λ = {riskAversion.toFixed(2)}, el {Math.round(riskAversion * 100)}% de la decisión se ancla en el límite más conservador, protegiendo al miembro de menor tolerancia al riesgo.
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
              <th className="py-2 px-2">Dimensión 5D</th>
              <th className="py-2 px-2 text-center text-rose-400">Miembro A</th>
              <th className="py-2 px-2 text-center text-indigo-400">Miembro B</th>
              <th className="py-2 px-2 text-center text-slate-400">Promedio Simple</th>
              <th className="py-2 px-2 text-center text-purple-400 font-bold">Consenso Protegido</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {DIMENSIONS.map((dim, idx) => {
              const a = vA[idx];
              const b = vB[idx];
              const arithmetic = (a + b) / 2;
              const finalVal = consensus[idx];
              const protectedDiff = Math.abs(finalVal - arithmetic);

              return (
                <tr key={dim.code} className="hover:bg-slate-800/30">
                  <td className="py-2 px-2 font-sans font-medium text-slate-200">
                    <span className="text-purple-400 font-mono font-bold mr-1.5">{dim.code}</span>
                    {dim.shortLabel}
                  </td>
                  <td className="py-2 px-2 text-center font-bold text-rose-300">
                    {a >= 0 ? `+${a.toFixed(2)}` : a.toFixed(2)}
                  </td>
                  <td className="py-2 px-2 text-center font-bold text-indigo-300">
                    {b >= 0 ? `+${b.toFixed(2)}` : b.toFixed(2)}
                  </td>
                  <td className="py-2 px-2 text-center text-slate-400 line-through decoration-rose-500/50">
                    {arithmetic >= 0 ? `+${arithmetic.toFixed(2)}` : arithmetic.toFixed(2)}
                  </td>
                  <td className="py-2 px-2 text-center font-bold text-purple-300 bg-purple-950/30 rounded">
                    <span className="inline-flex items-center gap-1">
                      {finalVal >= 0 ? `+${finalVal.toFixed(2)}` : finalVal.toFixed(2)}
                      {protectedDiff > 0.1 && (
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-400" title="Límite protegido contra dilución" />
                      )}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
