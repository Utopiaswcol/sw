import React, { useState, useEffect } from 'react';
import {
  getDensityRadarMetrics,
  DensityRadarSummary,
  runDensityRadarTestSuite
} from '../services/densityRadarService';
import { BlindRevealImage } from './BlindRevealImage';
import { haptics } from '../services/hapticsService';
import {
  Radar,
  Sparkles,
  ShieldCheck,
  Zap,
  MapPin,
  Lock,
  MessageSquare,
  Key,
  Users,
  Flame,
  CheckCircle2,
  Play,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface DensityRadarViewProps {
  userId?: string;
  userRole?: 'solo_male' | 'couple' | 'single_woman';
  onOpenCheckoutModal: (candidate?: {
    id: string;
    alias: string;
    avatarUrl: string;
    affinityScore: number;
    primaryZone: string;
  }) => void;
}

export const DensityRadarView: React.FC<DensityRadarViewProps> = ({
  userId = 'usr_male_unpaid_11',
  userRole = 'solo_male',
  onOpenCheckoutModal
}) => {
  const [selectedZones, setSelectedZones] = useState<string[]>([
    'Toda Bogotá',
    'Toda Medellín'
  ]);
  const [metrics, setMetrics] = useState<DensityRadarSummary | null>(null);
  const [testSuiteOutput, setTestSuiteOutput] = useState<{
    passed: boolean;
    details: string;
    testResults: any[];
  } | null>(null);

  useEffect(() => {
    const data = getDensityRadarMetrics(selectedZones);
    setMetrics(data);
  }, [selectedZones]);

  const handleZoneToggle = (zone: string) => {
    haptics.selection();
    if (selectedZones.includes(zone)) {
      if (selectedZones.length > 1) {
        setSelectedZones(selectedZones.filter((z) => z !== zone));
      }
    } else {
      setSelectedZones([...selectedZones, zone]);
    }
  };

  const handleRunTestSuite = () => {
    haptics.toggle();
    const result = runDensityRadarTestSuite();
    setTestSuiteOutput(result);
  };

  const allAvailableZones = [
    'Toda Bogotá',
    'Bogotá • Zona Norte',
    'Toda Medellín',
    'Medellín • Zona Sur',
    'Toda Cali',
    'Escapada: Anapoima / Girardot',
    'Escapada: Guatapé / Peñol',
    'Escapada: Cartagena / Santa Marta'
  ];

  if (!metrics) return null;

  return (
    <div className="space-y-6 text-slate-100 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-[#0a0a10] to-[#120f1d] p-6 border border-amber-500/30 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold mb-3 shadow-lg">
              <Radar className="w-3.5 h-3.5 animate-spin text-amber-400" />
              <span>RADAR DE DENSIDAD DE CONEXIONES EN TIEMPO REAL</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Ecosistema Activo en tus Zonas Elásticas
            </h2>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Agregación 100% anonimizada de parejas verificadas y unicornios en Colombia.
              Sin geolocalización invasiva ni filtrado de coordenadas exactas.
            </p>
          </div>

          <button
            onClick={handleRunTestSuite}
            className="self-start md:self-auto px-4 py-2.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold flex items-center space-x-2 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg"
          >
            <Play className="w-4 h-4 fill-amber-300" />
            <span>Ejecutar Test Unitario (Sprint 4)</span>
          </button>
        </div>

        {/* Zone Selector Filter */}
        <div className="mt-5 pt-4 border-t border-white/10">
          <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Zonas Elásticas Seleccionadas:
          </span>
          <div className="flex flex-wrap gap-2">
            {allAvailableZones.map((zone) => {
              const isSelected = selectedZones.includes(zone);
              return (
                <button
                  key={zone}
                  onClick={() => handleZoneToggle(zone)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold shadow-lg shadow-amber-500/20'
                      : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/10'
                  }`}
                >
                  <MapPin className="w-3 h-3" />
                  <span>{zone}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Test Suite Output Display (if run) */}
      {testSuiteOutput && (
        <div
          className={`p-4 rounded-2xl border ${
            testSuiteOutput.passed
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex items-center space-x-2 font-mono font-bold text-sm mb-2">
            {testSuiteOutput.passed ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400" />
            )}
            <span>{testSuiteOutput.details}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
            {testSuiteOutput.testResults.map((tr, idx) => (
              <div
                key={idx}
                className="bg-black/50 p-2.5 rounded-xl text-xs font-mono border border-white/10"
              >
                <p className="font-bold text-white">{tr.testName}</p>
                <p
                  className={
                    tr.passed ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'
                  }
                >
                  {tr.passed ? '✓ PASADO' : '❌ FALLADO'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Radar Widget & Statistics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Radar Graphic Widget */}
        <div className="lg:col-span-6 bg-[#0a0a0f] p-6 rounded-3xl border border-amber-500/20 flex flex-col items-center justify-center text-center relative overflow-hidden">
          {/* Subtle Radar Pulse Rings */}
          <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center my-4">
            {/* Outer Ring */}
            <div className="absolute inset-0 rounded-full border border-amber-500/20 animate-ping opacity-20 pointer-events-none" />
            <div className="absolute inset-4 rounded-full border border-amber-500/30" />
            <div className="absolute inset-12 rounded-full border border-amber-500/20" />
            <div className="absolute inset-20 rounded-full border border-amber-500/10" />

            {/* Radar Crosshair Lines */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-full h-[1px] bg-amber-500/20" />
              <div className="h-full w-[1px] bg-amber-500/20" />
            </div>

            {/* Rotating Radar Sweep Line */}
            <div className="absolute w-1/2 h-1/2 top-0 right-0 origin-bottom-left animate-spin [animation-duration:6s] pointer-events-none">
              <div className="w-full h-full bg-gradient-to-br from-amber-500/25 to-transparent rounded-tr-full" />
            </div>

            {/* Simulated Radar Dots */}
            <div className="absolute top-12 left-16 w-3 h-3 rounded-full bg-amber-400 animate-pulse shadow-lg shadow-amber-400/80" />
            <div className="absolute bottom-16 right-12 w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping shadow-lg shadow-purple-400/80" />
            <div className="absolute top-20 right-20 w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/80" />
            <div className="absolute bottom-12 left-20 w-2 h-2 rounded-full bg-amber-300 animate-pulse" />

            {/* Central Counter Display */}
            <div className="relative z-10 bg-[#060609]/90 border border-amber-500/50 p-5 rounded-3xl backdrop-blur-md shadow-2xl max-w-[200px]">
              <div className="flex items-center justify-center space-x-1 text-amber-400 mb-1">
                <Users className="w-4 h-4" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
                  Disponibles Ahora
                </span>
              </div>
              <p className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 font-mono">
                {metrics.totalCouplesInRange + metrics.totalUnicornsInRange}
              </p>
              <p className="text-[11px] text-slate-300 font-semibold mt-1">
                {metrics.totalCouplesInRange} Parejas • {metrics.totalUnicornsInRange} Unicornios
              </p>
            </div>
          </div>

          <div className="mt-2 p-3 bg-amber-950/30 rounded-2xl border border-amber-500/30 text-xs text-amber-200/90 font-medium max-w-md">
            ✨ <strong className="text-white font-bold">{metrics.highAffinityMatchCount} coincidencias</strong> tienen más del 85% de afinidad psicométrica vectorial en tus zonas seleccionadas.
          </div>
        </div>

        {/* Interests & Ecosystem Distribution Breakdown */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-[#0a0a0f] p-5 rounded-3xl border border-white/10 space-y-4">
            <div className="flex items-center space-x-2 text-purple-400 text-xs font-mono font-bold uppercase tracking-wider">
              <TrendingUp className="w-4 h-4" />
              <span>Distribución de Intereses en Zonas Elásticas</span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-300">Soft Swap Respetuoso (Límites Físicos)</span>
                  <span className="text-amber-400 font-mono font-bold">65%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-500 to-amber-300 h-full w-[65%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-300">Preservativo 100% Obligatorio (Salud Sexual)</span>
                  <span className="text-emerald-400 font-mono font-bold">94%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500 to-emerald-300 h-full w-[94%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-300">Tríos MFF / Integración de Unicornio</span>
                  <span className="text-purple-400 font-mono font-bold">52%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-500 to-purple-300 h-full w-[52%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-300">Full Swap Completo con Penetración</span>
                  <span className="text-rose-400 font-mono font-bold">35%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-rose-500 to-rose-300 h-full w-[35%]" />
                </div>
              </div>
            </div>
          </div>

          {/* Privacy & Discretion Guarantee Card */}
          <div className="bg-gradient-to-br from-amber-950/30 to-purple-950/20 p-5 rounded-3xl border border-amber-500/30 space-y-2">
            <div className="flex items-center space-x-2 text-amber-300 font-bold text-sm">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <span>Garantía de Privacidad y Anonimato Aethel</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Tus búsquedas y métricas de radar son 100% privadas. Ningún usuario puede ver tu dirección IP, coordenadas exactas o identidad real. Tu extracto bancario dirá exclusivamente <strong className="text-white">"SERVICIOS DIGITALES S.A.S."</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Teaser Candidate Cards ("Tarjetas de Muestra") */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Flame className="w-5 h-5 text-amber-400" />
              <span>Vista Previa de Coincidencias de Alta Afinidad</span>
            </h3>
            <p className="text-xs text-slate-400">
              Perfiles protegidos con Blind Reveal Fase 1 (Silueta Difusa)
            </p>
          </div>
          <span className="text-xs font-mono text-amber-400 font-bold">
            Mostrando 3 de {metrics.highAffinityMatchCount}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {metrics.teaserProfiles.map((candidate) => (
            <div
              key={candidate.id}
              className="bg-[#08080d] p-4 rounded-3xl border border-white/10 hover:border-amber-500/40 transition-all space-y-3 group shadow-xl flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Image Container with Blind Reveal */}
                <div className="relative h-56 rounded-2xl overflow-hidden border border-white/10">
                  <BlindRevealImage
                    src={candidate.avatarUrl}
                    alt={candidate.alias}
                    vector5D={candidate.vector5D}
                    optOutBlindReveal={candidate.optOutBlindReveal}
                    phase={1}
                    alias={candidate.alias}
                    className="w-full h-full"
                  />

                  {/* Affinity Score Overlay Badge */}
                  <div className="absolute bottom-3 right-3 backdrop-blur-md bg-slate-950/90 border border-amber-500/50 px-3 py-1 rounded-full text-xs font-mono font-extrabold text-amber-300 shadow-xl flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>{candidate.affinityScore}% Afinidad</span>
                  </div>
                </div>

                {/* Profile Details */}
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-base group-hover:text-amber-300 transition-colors">
                      {candidate.alias}
                    </h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {candidate.role === 'couple' ? 'Pareja VIP' : 'Unicornio'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-amber-400" />
                    <span>{candidate.primaryZone}</span>
                  </p>
                </div>

                {/* Hard Vetoes & Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {candidate.hardVetoesSummary.map((veto, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-amber-950/50 text-amber-300 border border-amber-500/30"
                    >
                      🛡️ {veto}
                    </span>
                  ))}
                  {candidate.verifiedBadges.map((badge, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-emerald-950/50 text-emerald-300 border border-emerald-500/30"
                    >
                      ✓ {badge}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Trigger Buttons */}
              <div className="pt-2 border-t border-white/10 space-y-2">
                <button
                  onClick={() => {
                    haptics.toggle();
                    onOpenCheckoutModal({
                      id: candidate.id,
                      alias: candidate.alias,
                      avatarUrl: candidate.avatarUrl,
                      affinityScore: candidate.affinityScore,
                      primaryZone: candidate.primaryZone
                    });
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-lg cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Iniciar Chat Efímero ($19.000 COP)</span>
                </button>

                <button
                  onClick={() => {
                    haptics.toggle();
                    onOpenCheckoutModal({
                      id: candidate.id,
                      alias: candidate.alias,
                      avatarUrl: candidate.avatarUrl,
                      affinityScore: candidate.affinityScore,
                      primaryZone: candidate.primaryZone
                    });
                  }}
                  className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center justify-center space-x-1 transition-all cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>Solicitar Llave de Bóveda</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
