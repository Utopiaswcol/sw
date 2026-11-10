import React, { useState } from 'react';
import { DILEMMAS_CATALOG_UI } from '../data';
import { SupabasePayload } from '../types';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Database,
  Copy,
  Check,
  ArrowRight,
  RefreshCw,
  Layers,
  Users,
  Search,
  Server
} from 'lucide-react';

export const OnboardingFlow: React.FC = () => {
  const [userId, setUserId] = useState<string>('usr_unicorn_colombia_99');
  const [alias, setAlias] = useState<string>('Camila (Unicornio Medellín)');
  const [isCouple, setIsCouple] = useState<boolean>(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({
    D1_PHYSICAL_LIMITS: 'D1_OPT_FULL_SWAP',
    D2_GENDER_ORIENTATION: 'D2_OPT_UNICORN_BI',
    D3_POWER_JEALOUSY: 'D3_OPT_SAFE_WORD_PAUSE',
    D4_EMOTIONAL_ATTACHMENT: 'D4_OPT_PURE_RECREATIONAL',
    D5_SEXUAL_HEALTH: 'D5_OPT_CONDOM_ALWAYS',
    D6_LOGISTICS_AFTERMATH: 'D6_OPT_NEUTRAL_HOTEL'
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [payloadResult, setPayloadResult] = useState<SupabasePayload | null>(null);
  const [saveStatus, setSaveStatus] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [integrationTestResult, setIntegrationTestResult] = useState<any>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const handleSelectOption = (dilemmaId: string, optionId: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [dilemmaId]: optionId
    }));
  };

  const processAndSaveOnboarding = async () => {
    setLoading(true);
    setSaveStatus(null);
    try {
      // 1. Process via Python Situational Engine
      const resEngine = await fetch('/api/situational/process-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          isCouple,
          userAnswers
        })
      });
      const engineData: SupabasePayload = await resEngine.json();

      if (engineData && engineData.vector_5d_json) {
        setPayloadResult(engineData);

        // 2. Save profile into Supabase DB
        const resSave = await fetch('/api/supabase/save-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: engineData.user_id,
            role: isCouple ? 'couple_member' : 'solo_female',
            isCouple: engineData.is_couple,
            alias: alias,
            vector5D: engineData.vector_5d_json,
            hardVetoes: engineData.hard_vetoes,
            declaredPractices: engineData.declared_practices,
            consistencyIndex: engineData.consistency_index
          })
        });
        const saveResData = await resSave.json();
        setSaveStatus(saveResData);

        // 3. Query Real-Time Candidates via Supabase RPC / pgvector
        const resCandidates = await fetch('/api/matching/find-candidates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            queryVector: engineData.vector_5d_json,
            callerVetoes: engineData.hard_vetoes,
            matchLimit: 10
          })
        });
        const candidatesData = await resCandidates.json();
        if (candidatesData.success) {
          setCandidates(candidatesData.candidates || []);
        }
      } else {
        alert('Error ejecutando motor Python');
      }
    } catch (err: any) {
      alert('Error en conexión: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const runIntegrationTest = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/supabase/test-integration');
      const data = await res.json();
      setIntegrationTestResult(data);
    } catch (err: any) {
      alert('Error ejecutando prueba de integración: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPresetCase = (type: 'unicorn' | 'contradictory') => {
    if (type === 'unicorn') {
      setUserId('usr_unicorn_colombia_99');
      setAlias('Camila (Unicornio Medellín)');
      setIsCouple(false);
      setUserAnswers({
        D1_PHYSICAL_LIMITS: 'D1_OPT_FULL_SWAP',
        D2_GENDER_ORIENTATION: 'D2_OPT_UNICORN_BI',
        D3_POWER_JEALOUSY: 'D3_OPT_SAFE_WORD_PAUSE',
        D4_EMOTIONAL_ATTACHMENT: 'D4_OPT_PURE_RECREATIONAL',
        D5_SEXUAL_HEALTH: 'D5_OPT_CONDOM_ALWAYS',
        D6_LOGISTICS_AFTERMATH: 'D6_OPT_NEUTRAL_HOTEL'
      });
    } else {
      setUserId('usr_erratic_test_00');
      setAlias('Usuario Errático (Test Incoherencia)');
      setIsCouple(false);
      setUserAnswers({
        D1_PHYSICAL_LIMITS: 'D1_OPT_SOFT_ONLY',
        D2_GENDER_ORIENTATION: 'D2_OPT_UNICORN_BI',
        D3_POWER_JEALOUSY: 'D3_OPT_CUCKOLD_VOYEUR',
        D4_EMOTIONAL_ATTACHMENT: 'D4_OPT_POLYAMORY_ROMANTIC',
        D5_SEXUAL_HEALTH: 'D5_OPT_CONDOM_ALWAYS',
        D6_LOGISTICS_AFTERMATH: 'D6_OPT_GHOSTING_BYE'
      });
    }
  };

  const copyPayloadJSON = () => {
    if (!payloadResult) return;
    navigator.clipboard.writeText(JSON.stringify(payloadResult, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-rose-400 font-bold text-xs tracking-wider uppercase">
            <Sparkles className="w-4 h-4" />
            <span>Onboarding Situacional &amp; Persistencia Supabase pgvector</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => loadPresetCase('unicorn')}
              className="text-xs px-3 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900 transition-all font-medium"
            >
              Cargar Caso A (Unicornio Lúdica)
            </button>
            <button
              onClick={() => loadPresetCase('contradictory')}
              className="text-xs px-3 py-1 rounded-lg bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900 transition-all font-medium"
            >
              Cargar Caso B (Contradictorio)
            </button>
          </div>
        </div>

        <h2 className="text-xl font-bold text-white">
          Ingesta Situacional, Vectorización 5D e Inserción Supabase
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          Traduce las respuestas del usuario hacia el vector continuo en $[-1.0, 1.0]^5$, persiste el perfil en PostgreSQL e invoca el procedimiento almacenado <code className="text-emerald-300">match_candidates</code> RPC para matching en tiempo real.
        </p>
      </div>

      {/* User Form & Actions Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-300 font-mono">User ID:</span>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:border-rose-500 outline-none w-48"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-300 font-mono">Alias:</span>
            <input
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:border-rose-500 outline-none w-52"
            />
          </div>

          <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={isCouple}
              onChange={(e) => setIsCouple(e.target.checked)}
              className="rounded bg-slate-950 border-slate-800 text-rose-600 focus:ring-rose-500"
            />
            <span className="font-semibold">Pareja (`is_couple = true`)</span>
          </label>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={runIntegrationTest}
            disabled={loading}
            className="flex items-center space-x-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all"
          >
            <Server className="w-4 h-4 text-purple-400" />
            <span>Test Integración End-to-End</span>
          </button>

          <button
            onClick={processAndSaveOnboarding}
            disabled={loading}
            className="flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-rose-600 via-purple-600 to-emerald-600 hover:from-rose-500 hover:to-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            <span>{loading ? 'Procesando e Insertando...' : 'Procesar + Persistir + Match Supabase'}</span>
          </button>
        </div>
      </div>

      {/* Integration Test Result Display */}
      {integrationTestResult && (
        <div className="bg-slate-900 border border-purple-800/80 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-purple-800/50 pb-2">
            <h3 className="text-sm font-bold text-purple-300 flex items-center gap-2">
              <Server className="w-4 h-4 text-purple-400" />
              Resultado de Prueba Integrada End-to-End
            </h3>
            <span className="text-[10px] font-mono text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800">
              Modo: {integrationTestResult.isSupabaseConnected ? 'Supabase Real' : 'Emulación Local'}
            </span>
          </div>

          <p className="text-xs text-slate-300 font-semibold">{integrationTestResult.summary}</p>

          <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto max-h-48 whitespace-pre">
            {JSON.stringify(integrationTestResult, null, 2)}
          </div>
        </div>
      )}

      {/* 6 Dilemma Scenarios List */}
      <div className="space-y-4">
        {DILEMMAS_CATALOG_UI.map((dilemma, idx) => {
          const selectedOptionId = userAnswers[dilemma.dilemma_id];

          return (
            <div key={dilemma.dilemma_id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 font-mono text-xs flex items-center justify-center font-bold">
                    {idx + 1}
                  </span>
                  {dilemma.title}
                </h3>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {dilemma.dilemma_id}
                </span>
              </div>

              <p className="text-xs text-slate-300 italic">{dilemma.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {dilemma.options.map((opt) => {
                  const isSelected = selectedOptionId === opt.option_id;

                  return (
                    <button
                      key={opt.option_id}
                      onClick={() => handleSelectOption(dilemma.dilemma_id, opt.option_id)}
                      className={`text-left p-3 rounded-xl border text-xs transition-all flex flex-col justify-between space-y-2 ${
                        isSelected
                          ? 'bg-rose-950/60 border-rose-500 text-white ring-1 ring-rose-500 shadow-md'
                          : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between space-x-2">
                        <span className="font-medium leading-relaxed">{opt.text}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-slate-800/50 text-slate-400">
                        <span>ΔE: [{opt.delta_vector.map((v) => (v >= 0 ? `+${v.toFixed(2)}` : v.toFixed(2))).join(', ')}]</span>
                        {opt.vetoes && Object.keys(opt.vetoes).length > 0 && (
                          <span className="text-rose-400 font-bold">Veto: {Object.keys(opt.vetoes).join(', ')}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Payload & Real-time Candidates View */}
      {payloadResult && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Column 1: Supabase Saved Record */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                Registro Persistido en Supabase
              </h3>
              <button
                onClick={copyPayloadJSON}
                className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded transition-all border border-slate-700"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>

            {saveStatus && (
              <div className="bg-emerald-950/40 border border-emerald-800/60 p-3 rounded-xl text-xs text-emerald-300 flex items-start space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Respuesta de Inserción (`/api/supabase/save-profile`):</span>
                  <span>{saveStatus.message}</span>
                </div>
              </div>
            )}

            <div className="space-y-2 text-xs font-mono">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between">
                <span className="text-slate-400">pgvector String:</span>
                <span className="text-purple-300 font-bold">{payloadResult.vector_5d_pgvector}</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between">
                <span className="text-slate-400">Índice Consistencia:</span>
                <span className={payloadResult.is_calibrated ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {payloadResult.consistency_index.toFixed(4)} ({payloadResult.is_calibrated ? 'Calibrado' : 'Errático'})
                </span>
              </div>
            </div>

            <div className="bg-slate-950 rounded-xl border border-slate-800/80 p-3 font-mono text-[11px] text-slate-300 overflow-x-auto whitespace-pre max-h-64">
              {JSON.stringify(payloadResult, null, 2)}
            </div>
          </div>

          {/* Column 2: Real-time Matching RPC Results */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-rose-400" />
                Candidatos Invocados vía `match_candidates` RPC
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {candidates.length} Perfiles Compatibles
              </span>
            </div>

            {candidates.length === 0 ? (
              <div className="text-xs text-slate-400 italic p-4 text-center">
                No se encontraron candidatos libres de vetos en la base de datos.
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {candidates.map((cand, idx) => (
                  <div
                    key={cand.candidate_id || idx}
                    className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between space-x-3 hover:border-slate-700 transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-white">{cand.alias}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 uppercase font-mono">
                          {cand.candidate_type}
                        </span>
                      </div>
                      <p className="text-[10px] font-mono text-slate-400">
                        Vector: [{cand.vector_5d ? cand.vector_5d.map((v: number) => v.toFixed(2)).join(', ') : ''}]
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-black text-emerald-400 font-mono">
                        {cand.affinity_percentage}
                      </div>
                      <span className="text-[9px] text-slate-500 uppercase font-bold">
                        Afinidad Coseno
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
