import React from 'react';
import { VetoesDict, PracticesDict } from '../types';
import { VETO_LABELS, PRACTICE_LABELS } from '../data';
import { ShieldAlert, CheckSquare, Square } from 'lucide-react';

interface HardVetoEditorProps {
  vetoesA: VetoesDict;
  onChangeVetoesA: (vetoes: VetoesDict) => void;
  practicesB: PracticesDict;
  onChangePracticesB: (practices: PracticesDict) => void;
  labelPartyA?: string;
  labelPartyB?: string;
}

export const HardVetoEditor: React.FC<HardVetoEditorProps> = ({
  vetoesA,
  onChangeVetoesA,
  practicesB,
  onChangePracticesB,
  labelPartyA = 'Parte A (Pareja o Perfil evaluador)',
  labelPartyB = 'Parte B (Perfil objetivo)'
}) => {
  const [vetoNotice, setVetoNotice] = React.useState<string | null>(null);

  const toggleVeto = (key: keyof VetoesDict) => {
    const activeCount = Object.values(vetoesA).filter(Boolean).length;
    // If currently active and user tries to disable it when activeCount <= 2
    if (vetoesA[key] && activeCount <= 2) {
      setVetoNotice('⚠️ Debes mantener al menos 2 Límites Duros (Vetoes Innegociables) seleccionados para enriquecer la base de datos y proteger tu experiencia.');
      setTimeout(() => setVetoNotice(null), 4000);
      return;
    }
    setVetoNotice(null);
    onChangeVetoesA({
      ...vetoesA,
      [key]: !vetoesA[key]
    });
  };

  const togglePractice = (key: keyof PracticesDict) => {
    onChangePracticesB({
      ...practicesB,
      [key]: !practicesB[key]
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
      <div className="flex items-center space-x-2 pb-3 mb-4 border-b border-slate-800">
        <ShieldAlert className="w-5 h-5 text-rose-500 animate-pulse" />
        <div>
          <h3 className="text-sm font-bold text-white">Filtro Booleano de Límites Duros (Hard-Veto Engine)</h3>
          <p className="text-xs text-slate-400">
            Reglas innegociables: Si existe colisión categórica directa, el score de compatibilidad es 0.0% inmediato.
          </p>
        </div>
      </div>

      {vetoNotice && (
        <div className="mb-4 p-3 bg-rose-950/90 border border-rose-500/50 rounded-xl text-rose-200 text-xs font-bold animate-in fade-in">
          {vetoNotice}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Vetoes A */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-rose-900/30">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              Vetoes Innegociables ({labelPartyA})
            </h4>
            <span className="text-[10px] text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800/40">
              {Object.values(vetoesA).filter(Boolean).length} Activos
            </span>
          </div>

          <div className="space-y-2">
            {(Object.keys(VETO_LABELS) as (keyof VetoesDict)[]).map((key) => {
              const active = vetoesA[key];
              const meta = VETO_LABELS[key];

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleVeto(key)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition-all flex items-start space-x-2 border ${
                    active
                      ? 'bg-rose-950/50 border-rose-600/60 text-white shadow-sm'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="mt-0.5">
                    {active ? (
                      <CheckSquare className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold">{meta.label}</div>
                    <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{meta.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Practices B */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-indigo-900/30">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              Prácticas y Perfil ({labelPartyB})
            </h4>
            <span className="text-[10px] text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/40">
              {Object.values(practicesB).filter(Boolean).length} Presentes
            </span>
          </div>

          <div className="space-y-2">
            {(Object.keys(PRACTICE_LABELS) as (keyof PracticesDict)[]).map((key) => {
              const active = practicesB[key];
              const meta = PRACTICE_LABELS[key];

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => togglePractice(key)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition-all flex items-start space-x-2 border ${
                    active
                      ? 'bg-indigo-950/50 border-indigo-600/60 text-white shadow-sm'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="mt-0.5">
                    {active ? (
                      <CheckSquare className="w-4 h-4 text-indigo-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold">{meta.label}</div>
                    <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{meta.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
