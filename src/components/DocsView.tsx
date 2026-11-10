import React from 'react';
import { DIMENSIONS } from '../data';
import { BookOpen, ShieldAlert, Scale, Calculator, Heart, Sparkles } from 'lucide-react';

export const DocsView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Intro Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
        <div className="flex items-center space-x-2 text-rose-400 font-semibold text-xs tracking-wider uppercase">
          <BookOpen className="w-4 h-4" />
          <span>Fundamentación Teórica &amp; Psicológica</span>
        </div>
        <h2 className="text-xl font-bold text-white">
          Motor Psicométrico y Teoría de Decisiones para No-Monogamia Ética (ENM Colombia)
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          En la dinámica relacional swinger y de no-monogamia ética en Colombia, los algoritmos tradicionales de recomendación basados en promedios simples fracasan al ignorar la asimetría del riesgo emocional y la existencia de límites innegociables.
        </p>
      </div>

      {/* 5D Dimensions grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          Espacio Vectorial 5D Normalizado en [-1.0, 1.0]
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DIMENSIONS.map((dim) => (
            <div key={dim.key} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                  {dim.code}
                </span>
                <span className="text-xs font-semibold text-white">{dim.shortLabel}</span>
              </div>
              <p className="text-xs text-slate-300">{dim.description}</p>
              <div className="text-[11px] text-slate-400 bg-slate-900 p-2 rounded border border-slate-800/60">
                <strong className="text-rose-400 font-medium">Contexto Colombia:</strong> {dim.colombianContext}
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-1">
                <span className="text-amber-400 font-medium">{dim.minLabel}</span>
                <span className="text-emerald-400 font-medium">{dim.maxLabel}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hard-Veto & Consensus Math */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hard Veto Engine */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
          <div className="flex items-center space-x-2 text-rose-400 font-bold text-sm">
            <ShieldAlert className="w-5 h-5" />
            <h3>1. Filtro Booleano de Límites Duros</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Evaluación preliminar $O(1)$ que actúa antes de cualquier cómputo vectorial. Si existe una incompatibilidad lógica directa (ej. Veto 'no_men' frente a la presencia o búsqueda de un participante masculino), la compatibilidad retorna de forma determinista <strong>0.0% (VETO)</strong> omitiendo el cálculo de distancia coseno.
          </p>
        </div>

        {/* Risk-Averse Consensus */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
          <div className="flex items-center space-x-2 text-purple-400 font-bold text-sm">
            <Scale className="w-5 h-5" />
            <h3>2. Consenso de Pareja Asimétrico</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Evita la "trampa del promedio simple". Si el Miembro A desea Soft Swap estricto (-0.9) y el Miembro B busca Full Swap (+0.9), el promedio aritmético engañoso da 0.0. Mediante el parámetro de aversión al riesgo ($\lambda = 0.65$), el vector de consenso resultante es $-0.585$, garantizando la protección psicológica del Miembro A.
          </p>
        </div>
      </div>

      {/* Weighted Cosine Distance */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
        <div className="flex items-center space-x-2 text-indigo-400 font-bold text-sm">
          <Calculator className="w-5 h-5" />
          <h3>3. Distancia Coseno Ponderada &amp; Escalar de Afinidad</h3>
        </div>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-200 space-y-2">
          <div>Similitud Coseno Ponderada:</div>
          <div className="text-indigo-300 bg-slate-900 p-2 rounded border border-slate-800">
            cos_sim_w = Σ (w_i * u_i * v_i) / [ sqrt(Σ w_i * u_i^2) * sqrt(Σ w_i * v_i^2) ]
          </div>
          <div>Escalar Normalizado en [0.0, 1.0]:</div>
          <div className="text-emerald-300 bg-slate-900 p-2 rounded border border-slate-800">
            Afinidad = (cos_sim_w + 1.0) / 2.0
          </div>
        </div>
      </div>
    </div>
  );
};
