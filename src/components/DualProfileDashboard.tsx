import React, { useState } from 'react';
import { RadarChart5D } from './RadarChart5D';
import { AsyncKycModal } from './AsyncKycModal';
import { MediaVaultManager } from './MediaVaultManager';
import { SecretInviteModal } from './SecretInviteModal';
import { ProfileReputationAndCreatorSection } from './ProfileReputationAndCreatorSection';
import { haptics } from '../services/hapticsService';
import { DIMENSIONS } from '../data';
import {
  Users,
  User,
  ShieldCheck,
  Heart,
  Lock,
  Sparkles,
  Key,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Eye,
  Globe,
  Shield,
  Edit3,
  Camera,
  Check,
  Plus,
  Trash2,
  MapPin,
  FileText,
  LockKeyhole
} from 'lucide-react';

interface DualProfileDashboardProps {
  isPinLockEnabled?: boolean;
  setIsPinLockEnabled?: (enabled: boolean) => void;
  userPin?: string;
  setUserPin?: (pin: string) => void;
}

export const DualProfileDashboard: React.FC<DualProfileDashboardProps> = ({
  isPinLockEnabled = true,
  setIsPinLockEnabled,
  userPin = '1234',
  setUserPin
}) => {
  const [activeIdentityMode, setActiveIdentityMode] = useState<'couple' | 'single_female' | 'single_male'>('couple');
  const [editStudioMode, setEditStudioMode] = useState<'live_preview' | 'direct_edit'>('live_preview');
  const [viewerPerspective, setViewerPerspective] = useState<'couple' | 'single_female' | 'single_male'>('couple');
  const [newPin, setNewPin] = useState<string>('');
  const [pinChangeMsg, setPinChangeMsg] = useState<string | null>(null);
  const [isKycModalOpen, setIsKycModalOpen] = useState<boolean>(false);
  const [showSaveToast, setShowSaveToast] = useState<boolean>(false);
  const [showVaultManagerModal, setShowVaultManagerModal] = useState<boolean>(false);
  const [showSecretInviteModal, setShowSecretInviteModal] = useState<boolean>(false);

  // Alias Change Reason, Cooldown & Admin Approval state
  const [aliasReason, setAliasReason] = useState<string>('');
  const [aliasNotice, setAliasNotice] = useState<string | null>(null);
  const [pendingAliasApproval, setPendingAliasApproval] = useState<{ requestedAlias: string; reason: string; submittedAt: string } | null>(null);

  // Weaknesses Fix States
  const [liveAvailabilityStatus, setLiveAvailabilityStatus] = useState<'connect_today' | 'weekend_plans' | 'discreet_passive'>('connect_today');
  const [ageConsentVerified, setAgeConsentVerified] = useState<boolean>(true);

  // Curated Spicy Desires & Expectations List
  const availableSpicyOptions = [
    '🔥 Lencería & Juego Sensual',
    '🌶️ Tríos HFF / MMF en Consenso',
    '🎭 Mascaradas & Fiestas Privadas',
    '🧘 Tantra & Slow Sex',
    '🔐 Juego de Bóveda & Intercambio Cifrado',
    '✈️ Escapadas Románticas VIP',
    '🍾 Coctelería Nocturna & Charla Privada',
    '💎 No Monogamia Ética Guiada'
  ];

  // Curated System Hobbies Chips List
  const availableHobbiesOptions = [
    '🍷 Vinos & Catas',
    '🍣 Gastronomía Alta',
    '🎨 Arte Moderno',
    '🍸 Coctelería de Autor',
    '🍾 Fiestas Privadas',
    '✈️ Escapadas Fin de Semana',
    '🧘 Yoga & Mindfulness',
    '🚴 Ciclismo / Fitness',
    '🎧 Música Electrónica / Deep House',
    '⛵ Náutica & Vela',
    '📸 Fotografía & Cine',
    '📚 Lectura & Filosofía'
  ];

  // Perfiles Editables en Vivo
  const [profilesState, setProfilesState] = useState({
    couple: {
      alias: 'Carlos & Sofía',
      roleTitle: 'Pareja Verificada VIP',
      relationshipType: 'No Monogamia Ética / Abierta en Consenso',
      location: 'Medellín / Bogotá D.C.',
      bio: 'Carlos (33) y Sofía (30). Pareja con acuerdo de consenso ético en ENM Colombia. Buscamos conexiones reales con unicornios y parejas afines en un ambiente de absoluto respeto.',
      hobbies: 'Gastronomía, Vinos & Ciclismo (Carlos) • Arte Moderno, Fotografía & Yoga (Sofía)',
      publicImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
      vector5D: [0.35, -0.75, 0.20, -0.40, 0.50] as [number, number, number, number, number],
      vaultCount: 5,
      hardVetoes: { no_single_men: true, condom_mandatory: true, no_home_visits: false },
      badge: 'Verificación Dual Biométrica OK'
    },
    single_female: {
      alias: 'Camila V.',
      roleTitle: 'Chica Sola / Unicornio VIP',
      relationshipType: 'Exploración Bisexual & Parejas Seleccionadas',
      location: 'Medellín (El Poblado)',
      bio: 'Camila (27). Mujer independiente y exploradora de dinámicas poliamorosas. Disfruto química genuina con parejas verificadas y respetuosas.',
      hobbies: 'Fotografía, Coctelería de Autor & Yoga',
      publicImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      vector5D: [0.80, 0.50, 0.90, -0.20, 0.70] as [number, number, number, number, number],
      vaultCount: 6,
      hardVetoes: { condom_mandatory: true, no_single_men: true },
      badge: 'Unicornio Verificada VIP'
    },
    single_male: {
      alias: 'Alejandro M.',
      roleTitle: 'Hombre Solo / Bull VIP',
      relationshipType: 'Single Calificado con Pase Wompi VIP',
      location: 'Bogotá (Chapinero)',
      bio: 'Alejandro (34). Hombre solo con acreditación Wompi VIP activa. Discreto, deportista y enfocado en la experiencia y el ritmo que establezca la pareja.',
      hobbies: 'Fitness, Tenis & Música Electrónica',
      publicImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
      vector5D: [0.20, -0.80, -0.30, 0.40, 0.20] as [number, number, number, number, number],
      vaultCount: 3,
      hardVetoes: { condom_mandatory: true },
      badge: 'Pase Wompi VIP Activo'
    }
  });

  const activeData = profilesState[activeIdentityMode];

  // Helper para modificar el perfil actual
  const updateActiveProfile = (fields: Partial<typeof activeData>) => {
    setProfilesState((prev) => ({
      ...prev,
      [activeIdentityMode]: {
        ...prev[activeIdentityMode],
        ...fields
      }
    }));
    triggerSaveToast();
  };

  // Helper para modificar un eje vectorial del perfil actual
  const updateVectorDimension = (index: number, val: number) => {
    const updatedVector = [...activeData.vector5D] as [number, number, number, number, number];
    updatedVector[index] = val;
    updateActiveProfile({ vector5D: updatedVector });
  };

  const triggerSaveToast = () => {
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 2000);
  };

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4 || !/^\d{4}$/.exec(newPin)) {
      haptics.warning();
      setPinChangeMsg('El PIN debe contener exactamente 4 dígitos numéricos.');
      return;
    }

    if (setUserPin) {
      setUserPin(newPin);
      haptics.success();
      setPinChangeMsg('¡PIN de seguridad actualizado correctamente!');
      setNewPin('');
      setTimeout(() => setPinChangeMsg(null), 3000);
    }
  };

  // Preset Avatar Photos Selection
  const avatarPresets = {
    couple: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80'
    ],
    single_female: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80'
    ],
    single_male: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80'
    ]
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 select-none relative">
      {/* Save Notification Toast */}
      {showSaveToast && (
        <div className="fixed top-20 right-5 z-50 bg-emerald-950/95 border border-emerald-500/60 text-emerald-300 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md flex items-center space-x-2 font-mono text-xs animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Cambios guardados en tu Perfil en Vivo</span>
        </div>
      )}

      {/* Top Banner & Identity Switcher */}
      <div className="bg-[#0e0e14] border border-white/[0.08] rounded-3xl p-5 shadow-2xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-rose-400 font-bold text-xs tracking-wider uppercase">
              <Sparkles className="w-4 h-4" />
              <span>Estudio de Perfil &amp; Ajustes en Vivo</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <span>{activeData.alias}</span>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                {activeData.badge}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              {activeData.relationshipType} • {activeData.location}
            </p>
          </div>

          {/* Identity Switcher */}
          <div className="bg-[#070709] p-1.5 rounded-2xl border border-white/[0.08] flex items-center space-x-1 shrink-0 shadow-inner overflow-x-auto no-scrollbar">
            <button
              onClick={() => {
                haptics.selection();
                setActiveIdentityMode('couple');
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeIdentityMode === 'couple'
                  ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Pareja (Carlos &amp; Sofía)</span>
            </button>

            <button
              onClick={() => {
                haptics.selection();
                setActiveIdentityMode('single_female');
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                activeIdentityMode === 'single_female'
                  ? 'bg-purple-950 text-purple-200 border border-purple-500/60 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5 text-purple-400" />
              <span>Mujer Sola (Camila)</span>
            </button>

            <button
              onClick={() => {
                haptics.selection();
                setActiveIdentityMode('single_male');
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                activeIdentityMode === 'single_male'
                  ? 'bg-blue-950 text-blue-200 border border-blue-500/60 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5 text-blue-400" />
              <span>Hombre Solo (Alejandro)</span>
            </button>
          </div>
        </div>

        {/* Master Studio Mode Switcher Bar */}
        <div className="bg-[#070709] p-3 rounded-2xl border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
            <span className="text-xs font-mono font-bold text-slate-200">
              Modo de Trabajo en tu Perfil:
            </span>
          </div>

          <div className="bg-[#0e0e14] p-1 rounded-xl border border-white/10 flex items-center space-x-1 w-full sm:w-auto">
            <button
              onClick={() => {
                haptics.selection();
                setEditStudioMode('live_preview');
              }}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                editStudioMode === 'live_preview'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>👁️ Vista Previa Pública (Live)</span>
            </button>

            <button
              onClick={() => {
                haptics.selection();
                setEditStudioMode('direct_edit');
              }}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                editStudioMode === 'direct_edit'
                  ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 text-slate-950 shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>✏️ Modo Edición Directa</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Unified Profile Studio Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (5 Cols): Master Profile Card with Role Chromatic Background */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-20">
          <div
            className={`relative rounded-[28px] overflow-hidden shadow-2xl flex flex-col border transition-all duration-300 ${
              activeIdentityMode === 'couple'
                ? 'bg-gradient-to-b from-[#1c1408] via-[#0f0c07] to-[#070604] border-amber-500/40 shadow-[0_10px_35px_rgba(245,158,11,0.18)]'
                : activeIdentityMode === 'single_female'
                ? 'bg-gradient-to-b from-[#180a26] via-[#0f0818] to-[#08050e] border-purple-500/40 shadow-[0_10px_35px_rgba(168,85,247,0.18)]'
                : 'bg-gradient-to-b from-[#0a152a] via-[#070e1c] to-[#040810] border-blue-500/40 shadow-[0_10px_35px_rgba(59,130,246,0.18)]'
            }`}
          >
            {/* Card Main Image */}
            <div className="relative h-[380px] w-full bg-[#070709] overflow-hidden group">
              <img
                src={activeData.publicImage}
                alt={activeData.alias}
                className="w-full h-full object-cover object-center filter contrast-[1.05]"
              />

              {/* Edit Photo Overlay in Direct Edit Mode */}
              {editStudioMode === 'direct_edit' && (
                <div className="absolute inset-x-3 top-3 z-20 bg-slate-950/90 border border-amber-400/50 p-2.5 rounded-2xl shadow-2xl backdrop-blur-md space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
                    <span className="flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5 text-amber-400" />
                      <span>Cambiar Foto Pública del Perfil:</span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pt-0.5">
                    {avatarPresets[activeIdentityMode].map((url, idx) => (
                      <button
                        key={idx}
                        onClick={() => updateActiveProfile({ publicImage: url })}
                        className={`h-10 w-10 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                          activeData.publicImage === url
                            ? 'border-amber-400 scale-105 shadow-md'
                            : 'border-white/20 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Dark Gradient Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e14] via-[#0e0e14]/40 to-transparent pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent pointer-events-none" />

              {/* Top Location & Badge Row */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10 pointer-events-none">
                <div className="backdrop-blur-md bg-black/75 border border-emerald-500/40 px-2.5 py-1 rounded-full flex items-center space-x-1 shadow-xl">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-[10px] font-bold text-emerald-300 font-mono uppercase tracking-wider truncate">
                    {activeData.location}
                  </span>
                </div>

                <div className="backdrop-blur-md bg-black/75 border border-amber-500/40 px-2.5 py-1 rounded-full flex items-center space-x-1 shadow-xl">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span className="text-[11px] font-black text-amber-300 font-mono tracking-wide">
                    Tu Perfil en Vivo
                  </span>
                </div>
              </div>

              {/* Bottom Identity Label */}
              <div className="absolute bottom-3 left-4 right-4 space-y-1.5 pointer-events-none">
                <div className="flex items-center space-x-2">
                  <h3
                    className={`text-2xl font-black tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)] ${
                      activeIdentityMode === 'couple'
                        ? 'text-amber-300'
                        : activeIdentityMode === 'single_female'
                        ? 'text-purple-300'
                        : 'text-blue-300'
                    }`}
                  >
                    {activeData.alias}
                  </h3>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm" />
                </div>
                <p className="text-xs text-slate-300 line-clamp-2 drop-shadow-md font-medium">
                  {activeData.bio}
                </p>
              </div>
            </div>

            {/* Bóveda Strip in Card */}
            <div className="p-4 space-y-3">
              <div className="bg-[#070709] p-3.5 rounded-2xl border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-amber-950/50 text-amber-400 border border-amber-800/60 shrink-0">
                    <Lock className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-white block">
                      Bóveda Privada del Perfil
                    </span>
                    <span className="text-[10px] text-amber-200/80 font-mono font-bold block">
                      {activeData.vaultCount} Archivos Cifrados • 4 Álbumes
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    haptics.selection();
                    setShowVaultManagerModal(true);
                  }}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>⚙️ Gestor &amp; Subir Fotos</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (7 Cols): Direct Interactive Controls or Live Radar 5D */}
        <div className="lg:col-span-7 space-y-5">
          {/* Section 1: Vector 5D Interactive Calibration Studio */}
          <div className="bg-[#0e0e14] border border-amber-500/20 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                  <Sliders className="w-4 h-4" />
                  <span>Matriz Vectorial 5D en Vivo</span>
                </div>
                <h3 className="text-base font-black text-white">
                  Calibración de Afinidades &amp; Deseos (E1 - E5)
                </h3>
              </div>

              {editStudioMode === 'direct_edit' && (
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-700/60 animate-pulse">
                  Deslizadores Activos
                </span>
              )}
            </div>

            {/* Radar Chart Display */}
            <div className="bg-[#070709] p-4 rounded-2xl border border-white/[0.08]">
              <RadarChart5D
                vectorA={activeData.vector5D}
                vectorB={activeData.vector5D}
                labelA={activeData.alias}
                labelB="Tu Matriz Actual"
              />
            </div>

            {/* Interactive Sliders in Direct Edit Mode */}
            {editStudioMode === 'direct_edit' && (
              <div className="space-y-3 bg-[#070709] p-4 rounded-2xl border border-amber-500/20">
                <h4 className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider border-b border-white/5 pb-2">
                  Ajusta tus 5 Dimensiones Relacionales:
                </h4>

                <div className="space-y-3 text-xs">
                  {DIMENSIONS.map((dim, idx) => {
                    const currentVal = activeData.vector5D[idx];
                    return (
                      <div key={dim.key} className="space-y-1">
                        <div className="flex items-center justify-between font-medium">
                          <span className="text-slate-200 font-bold">
                            {dim.code}: {dim.shortLabel}
                          </span>
                          <span className="font-mono text-amber-300 font-bold">
                            {currentVal > 0 ? `+${currentVal.toFixed(2)}` : currentVal.toFixed(2)}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="-1"
                          max="1"
                          step="0.05"
                          value={currentVal}
                          onChange={(e) => updateVectorDimension(idx, parseFloat(e.target.value))}
                          className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                        />
                        <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono">
                          <span>{dim.minLabel}</span>
                          <span>{dim.maxLabel}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Bio, Gustos & Límites Duros (Direct Editable Fields) */}
          <div className="bg-[#0e0e14] border border-white/[0.08] rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <FileText className="w-4 h-4" />
                <span>Información Pública &amp; Límites Duros</span>
              </div>

              {editStudioMode === 'direct_edit' ? (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                  Edición Habilitada
                </span>
              ) : (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Guardado
                </span>
              )}
            </div>

            {/* Editable Fields */}
            <div className="space-y-3 text-xs">
              {/* Unique Handle & Alias Admin Approval Area */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-400 font-mono text-[10px] uppercase font-bold block">
                      Alias Personalizado (Sin @ tipo redes sociales):
                    </label>
                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                      🟢 Alias Único &amp; Disponible
                    </span>
                  </div>
                  {editStudioMode === 'direct_edit' ? (
                    <div className="space-y-2 bg-[#070709] p-3 rounded-2xl border border-amber-500/40">
                      <div className="flex items-center justify-between text-[10px] text-amber-300 font-bold">
                        <span>⚠️ Solicitud de Cambio Sujeta a Auditoría Admin (24h)</span>
                      </div>
                      <input
                        type="text"
                        value={activeData.alias}
                        onChange={(e) => updateActiveProfile({ alias: e.target.value })}
                        placeholder="Escribe tu alias de perfil único..."
                        className="w-full bg-slate-950 border border-amber-500/40 rounded-xl px-3 py-2 text-white font-bold outline-none focus:border-amber-400"
                      />
                      <input
                        type="text"
                        value={aliasReason}
                        onChange={(e) => setAliasReason(e.target.value)}
                        placeholder="Motivo obligatorio para la administración (Ej. Cambio de dinámica)"
                        className="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-amber-200 outline-none focus:border-amber-500/50"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!aliasReason.trim()) {
                            haptics.warning();
                            setAliasNotice('⚠️ Debes especificar el motivo del cambio para enviar a revisión de administración.');
                            setTimeout(() => setAliasNotice(null), 3000);
                            return;
                          }
                          haptics.success();
                          setPendingAliasApproval({
                            requestedAlias: activeData.alias,
                            reason: aliasReason,
                            submittedAt: 'Hace 1 min'
                          });
                          setAliasNotice('✅ Solicitud enviada a Administración. Tiempo estimado de autorización: 24 horas.');
                          setTimeout(() => setAliasNotice(null), 4000);
                        }}
                        className="w-full py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer shadow-md"
                      >
                        Enviar a Aprobación por Administración (24h)
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="p-2.5 bg-[#070709] rounded-xl text-white font-bold border border-white/5 flex items-center justify-between">
                        <span>{activeData.alias}</span>
                        <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                          AETHEL VIP PASS
                        </span>
                      </div>
                      
                      {/* Secret Invite Share Trigger Button */}
                      <button
                        type="button"
                        onClick={() => {
                          haptics.selection();
                          setShowSecretInviteModal(true);
                        }}
                        className="w-full py-2 px-3 bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-rose-500/30 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95 shadow-lg"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                        <span>✨ Compartir Pase Secreto de Invitación VIP</span>
                      </button>

                      {pendingAliasApproval && (
                        <div className="mt-1.5 p-2 bg-amber-950/80 border border-amber-500/40 rounded-xl text-[11px] text-amber-200 space-y-0.5">
                          <p className="font-bold flex items-center space-x-1">
                            <span>🕒 Cambio a "{pendingAliasApproval.requestedAlias}" en revisión</span>
                          </p>
                          <p className="text-[10px] text-amber-300/80">Motivo: {pendingAliasApproval.reason} • Estado: Auditoría 24h</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Disponibilidad En Vivo & Ubicación */}
                <div className="space-y-1">
                  <label className="text-slate-400 font-mono text-[10px] uppercase font-bold block">
                    Ubicación &amp; Estado de Disponibilidad:
                  </label>
                  {editStudioMode === 'direct_edit' ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={activeData.location}
                        onChange={(e) => updateActiveProfile({ location: e.target.value })}
                        className="w-full bg-[#070709] border border-amber-500/40 rounded-xl px-3 py-2 text-white font-bold outline-none focus:border-amber-400"
                      />
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setLiveAvailabilityStatus('connect_today')}
                          className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                            liveAvailabilityStatus === 'connect_today'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                              : 'bg-slate-900 text-slate-400 border-white/10'
                          }`}
                        >
                          🟢 Conecta Hoy
                        </button>
                        <button
                          type="button"
                          onClick={() => setLiveAvailabilityStatus('weekend_plans')}
                          className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                            liveAvailabilityStatus === 'weekend_plans'
                              ? 'bg-purple-950 text-purple-300 border-purple-500'
                              : 'bg-slate-900 text-slate-400 border-white/10'
                          }`}
                        >
                          ✈️ Escapada FDS
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-[#070709] rounded-xl text-white font-bold border border-white/5 flex items-center justify-between">
                      <span>{activeData.location}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {liveAvailabilityStatus === 'connect_today' ? '🟢 Conecta Hoy' : '✈️ Escapada FDS'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-1">
                <label className="text-slate-400 font-mono text-[10px] uppercase font-bold block">
                  Presentación &amp; Estilo Relacional:
                </label>
                {editStudioMode === 'direct_edit' ? (
                  <textarea
                    rows={3}
                    value={activeData.bio}
                    onChange={(e) => updateActiveProfile({ bio: e.target.value })}
                    className="w-full bg-[#070709] border border-amber-500/40 rounded-xl p-3 text-slate-200 outline-none focus:border-amber-400 leading-relaxed resize-none"
                  />
                ) : (
                  <p className="p-3 bg-[#070709] rounded-xl text-slate-200 border border-white/5 leading-relaxed">
                    {activeData.bio}
                  </p>
                )}
              </div>

              {/* Gustos, Hobbies & Aficiones (Categorías del Sistema Obligatorias) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-400 font-mono text-[10px] uppercase font-bold block">
                    Gustos &amp; Aficiones (Obligatorio Mínimo 3):
                  </label>
                  <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                    Base de Datos Enriquecida
                  </span>
                </div>

                {editStudioMode === 'direct_edit' ? (
                  <div className="bg-[#070709] p-3 rounded-2xl border border-amber-500/30 space-y-2">
                    <p className="text-[11px] text-slate-400">
                      Selecciona las aficiones que definen a tu perfil (nada de espacios vacíos):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {availableHobbiesOptions.map((hobby) => {
                        const isSelected = activeData.hobbies.includes(hobby);
                        return (
                          <button
                            key={hobby}
                            type="button"
                            onClick={() => {
                              haptics.selection();
                              let updated = activeData.hobbies;
                              if (isSelected) {
                                // Don't allow less than 3
                                const count = updated.split('•').filter(Boolean).length;
                                if (count <= 3) {
                                  haptics.warning();
                                  setAliasNotice('⚠️ Debes mantener al menos 3 aficiones seleccionadas para un perfil completo.');
                                  setTimeout(() => setAliasNotice(null), 3000);
                                  return;
                                }
                                updated = updated.replace(hobby, '').replace(/••/g, '•').trim();
                              } else {
                                updated = updated ? `${updated} • ${hobby}` : hobby;
                              }
                              updateActiveProfile({ hobbies: updated });
                            }}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                              isSelected
                                ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-md'
                                : 'bg-slate-900 text-slate-400 border-white/10 hover:bg-slate-800'
                            }`}
                          >
                            {hobby}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="p-2.5 bg-[#070709] rounded-xl text-amber-300 font-bold border border-white/5">
                    {activeData.hobbies}
                  </p>
                )}
              </div>

              {/* Deseos & Expectativas Picantes (Selección Distinta / Picante) */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <label className="text-rose-400 font-mono text-[10px] uppercase font-bold block flex items-center gap-1">
                    <span>🔥 Deseos &amp; Expectativas Picantes (Mínimo 2):</span>
                  </label>
                  <span className="text-[9px] font-mono text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800">
                    Distinto &amp; Sensual
                  </span>
                </div>

                {editStudioMode === 'direct_edit' ? (
                  <div className="bg-[#0e0c14] p-3 rounded-2xl border border-rose-500/40 space-y-2">
                    <p className="text-[11px] text-rose-200/80">
                      Selecciona qué tipo de química y vivencias buscan compartir:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {availableSpicyOptions.map((spicyItem) => {
                        const isSelected = activeData.hobbies.includes(spicyItem);
                        return (
                          <button
                            key={spicyItem}
                            type="button"
                            onClick={() => {
                              haptics.selection();
                              let updated = activeData.hobbies;
                              if (isSelected) {
                                updated = updated.replace(spicyItem, '').replace(/••/g, '•').trim();
                              } else {
                                updated = updated ? `${updated} • ${spicyItem}` : spicyItem;
                              }
                              updateActiveProfile({ hobbies: updated });
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                              isSelected
                                ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white border-rose-400 font-extrabold shadow-md'
                                : 'bg-slate-900/90 text-slate-400 border-white/10 hover:border-rose-500/40'
                            }`}
                          >
                            {spicyItem}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 bg-[#0e0c14] rounded-xl text-rose-300 font-bold border border-rose-500/20 text-xs">
                    ✨ Experiencias Picantes Preferidas Seleccionadas
                  </div>
                )}
              </div>

              {aliasNotice && (
                <div className="p-2.5 bg-amber-950/90 border border-amber-500/50 rounded-xl text-amber-200 text-xs font-bold animate-in fade-in">
                  {aliasNotice}
                </div>
              )}

              {/* Reputation Badges, Social Vouches & Creator Section */}
              <ProfileReputationAndCreatorSection
                alias={activeData.alias}
                inPersonVouchesCount={3}
                vouchedByCouples={['Felipe & Juliana (VIP)', 'Andrés & Mónica (VIP)', 'Daniel & Andrea (VIP)']}
                eventsOrganizedCount={2}
                eventsAttendedCount={6}
                isCommunityVouched={true}
                isHostBadge={true}
                isAmbassador={true}
                creatorExternalLink={activeData.tagline?.includes('http') ? activeData.tagline : 'https://fanvue.com/carlos_sofia_official'}
                isEditable={editStudioMode === 'direct_edit'}
              />

              {/* Hard Vetoes Checklist */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <span className="text-rose-300 font-mono text-[10px] uppercase font-bold block">
                  Límites Duros &amp; Vetoes Innegociables:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="p-2.5 bg-[#070709] rounded-xl border border-white/5 flex items-center space-x-2 cursor-pointer hover:border-rose-500/30">
                    <input
                      type="checkbox"
                      checked={activeData.hardVetoes.condom_mandatory}
                      onChange={(e) =>
                        updateActiveProfile({
                          hardVetoes: {
                            ...activeData.hardVetoes,
                            condom_mandatory: e.target.checked
                          }
                        })
                      }
                      disabled={editStudioMode !== 'direct_edit'}
                      className="accent-rose-500 rounded cursor-pointer"
                    />
                    <span className="text-[11px] text-slate-200 font-medium">
                      Preservativo Obligatorio (100%)
                    </span>
                  </label>

                  <label className="p-2.5 bg-[#070709] rounded-xl border border-white/5 flex items-center space-x-2 cursor-pointer hover:border-rose-500/30">
                    <input
                      type="checkbox"
                      checked={activeData.hardVetoes.no_single_men}
                      onChange={(e) =>
                        updateActiveProfile({
                          hardVetoes: {
                            ...activeData.hardVetoes,
                            no_single_men: e.target.checked
                          }
                        })
                      }
                      disabled={editStudioMode !== 'direct_edit'}
                      className="accent-rose-500 rounded cursor-pointer"
                    />
                    <span className="text-[11px] text-slate-200 font-medium">
                      Filtrar Hombres Solos No Verificados
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Ciberseguridad & Bloqueo Anti-Espía (PIN Lock) Settings */}
          <div className="bg-[#0e0e14] border border-amber-500/20 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-amber-950/60 text-amber-400 border border-amber-500/30">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <span>PIN Anti-Espía &amp; Pantalla Senuelo</span>
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800">
                      Activo
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Protección inmediata tras salir de la app o al voltear la pantalla.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  haptics.toggle();
                  if (setIsPinLockEnabled) setIsPinLockEnabled(!isPinLockEnabled);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  isPinLockEnabled
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span>{isPinLockEnabled ? 'PIN Activado' : 'PIN Desactivado'}</span>
              </button>
            </div>

            {isPinLockEnabled && (
              <div className="bg-[#070709] p-4 rounded-2xl border border-white/[0.08] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-slate-300 space-y-1">
                    <p className="font-bold">
                      PIN Actual Configurado:{' '}
                      <span className="font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
                        {userPin}
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Ingresa 4 dígitos numéricos para cambiar tu PIN anti-miradas.
                    </p>
                  </div>

                  <form onSubmit={handleUpdatePin} className="flex items-center space-x-2 shrink-0">
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="Nuevo PIN"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      className="w-24 bg-[#0e0e14] border border-white/[0.1] rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-amber-300 text-center outline-none focus:border-amber-500"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      Cambiar PIN
                    </button>
                  </form>
                </div>

                {pinChangeMsg && (
                  <div className="text-xs font-bold px-3 py-2 rounded-xl bg-slate-900 border border-amber-500/30 text-amber-300 flex items-center space-x-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{pinChangeMsg}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Async KYC Biometric Verification Modal */}
      {isKycModalOpen && <AsyncKycModal onClose={() => setIsKycModalOpen(false)} />}

      {/* Media Vault Manager & Upload Studio Modal */}
      {showVaultManagerModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl p-4 md:p-8 overflow-y-auto animate-in fade-in duration-200">
          <div className="max-w-5xl mx-auto">
            <MediaVaultManager
              initialTab="albums"
              onCloseModal={() => setShowVaultManagerModal(false)}
            />
          </div>
        </div>
      )}

      {/* Secret Invitation VIP Passport Share Modal */}
      {showSecretInviteModal && (
        <SecretInviteModal
          alias={activeData.alias}
          role={activeIdentityMode}
          onClose={() => setShowSecretInviteModal(false)}
        />
      )}
    </div>
  );
};
