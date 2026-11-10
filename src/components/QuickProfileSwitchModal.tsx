import React, { useState } from 'react';
import { SPECIAL_TEST_PROFILES, TestProfile } from '../data/profilesData';
import { haptics } from '../services/hapticsService';
import { Users, User, ShieldCheck, Key, Lock, CheckCircle2, Sparkles, X, ArrowRight } from 'lucide-react';

interface QuickProfileSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeUsername: string;
  onSwitchProfile: (profile: TestProfile) => void;
}

export const QuickProfileSwitchModal: React.FC<QuickProfileSwitchModalProps> = ({
  isOpen,
  onClose,
  activeUsername,
  onSwitchProfile
}) => {
  const [selectedKey, setSelectedKey] = useState<'pareja1' | 'unicornio1' | 'bull1'>('pareja1');
  const [inputPin, setInputPin] = useState<string>('1234');
  const [pinError, setPinError] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = (key: 'pareja1' | 'unicornio1' | 'bull1') => {
    haptics.selection();
    const targetProfile = SPECIAL_TEST_PROFILES[key];

    // Check if inputPin matches target profile pin OR any valid profile pin
    if (inputPin !== targetProfile.pin && inputPin !== '1234' && inputPin !== '1235' && inputPin !== '1236') {
      setPinError(true);
      haptics.error();
      setTimeout(() => setPinError(false), 2000);
      return;
    }

    // Determine actual profile based on PIN typed if user typed a specific profile PIN
    let actualProfile = targetProfile;
    if (inputPin === '1234') actualProfile = SPECIAL_TEST_PROFILES.pareja1;
    else if (inputPin === '1235') actualProfile = SPECIAL_TEST_PROFILES.unicornio1;
    else if (inputPin === '1236') actualProfile = SPECIAL_TEST_PROFILES.bull1;

    setSuccessMsg(`¡Sesión iniciada como ${actualProfile.alias}!`);
    haptics.success();

    setTimeout(() => {
      onSwitchProfile(actualProfile);
      setSuccessMsg(null);
      onClose();
    }, 600);
  };

  // Auto-switch selected card if inputPin matches a profile PIN
  const handlePinInputChange = (val: string) => {
    setInputPin(val);
    if (val === '1234') setSelectedKey('pareja1');
    else if (val === '1235') setSelectedKey('unicornio1');
    else if (val === '1236') setSelectedKey('bull1');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0e0e14] border border-white/10 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-rose-400 font-mono text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-rose-400" />
            <span>Acceso Multiperfil de Pruebas ENM</span>
          </div>
          <h2 className="text-xl font-black text-white">Seleccionar Perfil de Evaluación</h2>
          <p className="text-xs text-slate-400">
            Alterna libremente entre los 3 perfiles maestros para experimentar la plataforma desde cada rol.
          </p>
        </div>

        {/* PINs Callout Banner */}
        <div className="p-3 bg-[#070709] rounded-2xl border border-amber-500/30 space-y-2 text-xs">
          <div className="flex items-center space-x-2 text-amber-300 font-mono font-bold">
            <Key className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Claves de Acceso Directo por Rol:</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center font-mono text-[11px]">
            <div className="p-1.5 bg-amber-950/60 rounded-xl border border-amber-500/40">
              <span className="text-amber-300 block font-bold">Pareja</span>
              <span className="text-white font-black text-xs">1234</span>
            </div>
            <div className="p-1.5 bg-purple-950/60 rounded-xl border border-purple-500/40">
              <span className="text-purple-300 block font-bold">Mujer Sola</span>
              <span className="text-white font-black text-xs">1235</span>
            </div>
            <div className="p-1.5 bg-blue-950/60 rounded-xl border border-blue-500/40">
              <span className="text-blue-300 block font-bold">Hombre Solo</span>
              <span className="text-white font-black text-xs">1236</span>
            </div>
          </div>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl text-emerald-300 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Profile Selection Cards */}
        <div className="space-y-3">
          {Object.entries(SPECIAL_TEST_PROFILES).map(([key, profile]) => {
            const isCurrent = activeUsername === key;
            const profileKey = key as 'pareja1' | 'unicornio1' | 'bull1';

            return (
              <div
                key={key}
                onClick={() => setSelectedKey(profileKey)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  selectedKey === profileKey
                    ? 'bg-[#151520] border-rose-500/60 shadow-lg'
                    : 'bg-[#070709] border-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10">
                    <img src={profile.publicImage} alt={profile.alias} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20" />
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-black text-white truncate">{profile.alias}</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/40 shrink-0">
                        PIN: {profile.pin}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 shrink-0">
                          Activo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate">{profile.roleTitle} • {profile.location}</p>
                    <span className="text-[10px] font-mono text-slate-500 block truncate">
                      ID: {profile.username}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedKey(profileKey);
                    handleLogin(profileKey);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center space-x-1 cursor-pointer ${
                    selectedKey === profileKey
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md'
                      : 'bg-white/10 hover:bg-white/20 text-slate-300'
                  }`}
                >
                  <span>Ingresar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* PIN Entry Field */}
        <div className="space-y-2 pt-2 border-t border-white/[0.08]">
          <label className="text-xs font-mono text-slate-400 block">
            Ingresa PIN de Confirmación:
          </label>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <input
                type="password"
                maxLength={4}
                value={inputPin}
                onChange={(e) => handlePinInputChange(e.target.value)}
                placeholder="1234"
                className={`w-full bg-[#070709] border rounded-xl px-3 py-2.5 text-center font-mono text-lg tracking-widest text-white focus:outline-none ${
                  pinError ? 'border-rose-500 bg-rose-950/20' : 'border-white/10 focus:border-rose-500'
                }`}
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
            </div>

            <button
              onClick={() => handleLogin(selectedKey)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
            >
              Iniciar Sesión
            </button>
          </div>

          {pinError && (
            <p className="text-[11px] font-mono text-rose-400 text-center font-bold">
              ❌ PIN Incorrecto. Usa la clave unificada 1234.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
