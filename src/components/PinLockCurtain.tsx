import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShieldCheck, Delete, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { CipherLockIcon } from './ui/AethelIcons';
import { haptics } from '../services/hapticsService';

interface PinLockCurtainProps {
  children: React.ReactNode;
  isEnabled: boolean;
  userPin?: string;
  onPinSuccess?: () => void;
  onSwitchProfileByPin?: (pin: string) => void;
}

export const PinLockCurtain: React.FC<PinLockCurtainProps> = ({
  children,
  isEnabled,
  userPin = '1234',
  onPinSuccess,
  onSwitchProfileByPin
}) => {
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPin, setShowPin] = useState<boolean>(false);
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset inactivity timer (60 segundos)
  const resetInactivityTimer = useCallback(() => {
    if (!isEnabled) return;

    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }

    activityTimeoutRef.current = setTimeout(() => {
      setIsLocked(true);
      setEnteredPin('');
      setErrorMsg(null);
    }, 60000); // 60 segundos de inactividad
  }, [isEnabled]);

  // Escuchar eventos de inactividad y cambio de visibilidad (segundo plano)
  useEffect(() => {
    if (!isEnabled) {
      setIsLocked(false);
      return;
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsLocked(true);
        setEnteredPin('');
        setErrorMsg(null);
      }
    };

    const handleUserActivity = () => {
      if (!isLocked) {
        resetInactivityTimer();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('touchstart', handleUserActivity);
    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);

    resetInactivityTimer();

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('touchstart', handleUserActivity);
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
    };
  }, [isEnabled, isLocked, resetInactivityTimer]);

  const handleKeyPress = (num: string) => {
    if (enteredPin.length >= 4) return;
    haptics.selection();
    const nextPin = enteredPin + num;
    setEnteredPin(nextPin);
    setErrorMsg(null);

    // Auto-validar al ingresar 4 dígitos
    if (nextPin.length === 4) {
      const isValidPin = nextPin === userPin || nextPin === '1234' || nextPin === '1235' || nextPin === '1236';

      if (isValidPin) {
        haptics.success();
        setIsLocked(false);
        setEnteredPin('');
        if (onSwitchProfileByPin) {
          onSwitchProfileByPin(nextPin);
        }
        if (onPinSuccess) onPinSuccess();
        resetInactivityTimer();
      } else {
        haptics.warning();
        setErrorMsg('PIN incorrecto. Usa 1234 (Pareja), 1235 (Mujer Sola) o 1236 (Hombre Solo)');
        setTimeout(() => {
          setEnteredPin('');
        }, 500);
      }
    }
  };

  const handleDelete = () => {
    if (enteredPin.length > 0) {
      haptics.selection();
      setEnteredPin((prev) => prev.slice(0, -1));
      setErrorMsg(null);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#070709] overflow-hidden">
      {/* Contenido de la Aplicación (Completamente desenfocado si está bloqueado) */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isLocked ? 'filter blur-2xl opacity-10 pointer-events-none select-none' : 'blur-0 opacity-100'
        }`}
      >
        {children}
      </div>

      {/* Cortina de Seguridad Anti-Snoop Lock */}
      {isLocked && (
        <div className="fixed inset-0 z-[9999] bg-[#070709]/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-white select-none animate-fadeIn">
          <div className="w-full max-w-xs flex flex-col items-center space-y-6">
            {/* Logo e Icono de Bloqueo Sobrio */}
            <div className="relative">
              <CipherLockIcon size="xl" glow={true} />
              <span className="absolute -bottom-1 -right-1 p-1 bg-emerald-950 border border-emerald-500/50 rounded-full text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-xl font-black tracking-tight text-white">Bóveda Protegida</h2>
              <p className="text-xs text-slate-400">
                Ingresa tu PIN de 4 dígitos (1234 Pareja • 1235 Mujer • 1236 Hombre)
              </p>
            </div>

            {/* Indicador de Dígitos */}
            <div className="flex items-center space-x-4 my-2">
              {[0, 1, 2, 3].map((index) => {
                const filled = enteredPin.length > index;
                return (
                  <div
                    key={index}
                    className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                      filled
                        ? 'bg-amber-400 border-amber-300 scale-110 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                        : 'border-slate-700 bg-slate-900/80'
                    }`}
                  />
                );
              })}
            </div>

            {errorMsg && (
              <div className="flex items-center space-x-1.5 text-xs text-rose-400 bg-rose-950/60 border border-rose-800/80 px-3 py-1.5 rounded-xl font-medium animate-bounce">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Teclado Numérico Oscuro Minimalista */}
            <div className="grid grid-cols-3 gap-4 w-full max-w-[240px]">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  onClick={() => handleKeyPress(num)}
                  className="w-16 h-16 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] active:bg-amber-500/20 border border-white/[0.08] text-xl font-bold text-white transition-all shadow-md active:scale-95 flex items-center justify-center mx-auto"
                >
                  {num}
                </button>
              ))}

              <button
                onClick={() => setShowPin(!showPin)}
                className="w-16 h-16 rounded-2xl bg-transparent text-slate-500 hover:text-slate-300 transition-all flex items-center justify-center mx-auto text-xs"
                title="Mostrar/Ocultar dígitos"
              >
                {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>

              <button
                onClick={() => handleKeyPress('0')}
                className="w-16 h-16 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] active:bg-amber-500/20 border border-white/[0.08] text-xl font-bold text-white transition-all shadow-md active:scale-95 flex items-center justify-center mx-auto"
              >
                0
              </button>

              <button
                onClick={handleDelete}
                className="w-16 h-16 rounded-2xl bg-white/[0.04] hover:bg-rose-950/40 border border-white/[0.08] text-slate-400 hover:text-rose-300 transition-all active:scale-95 flex items-center justify-center mx-auto"
                title="Borrar dígito"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            <div className="pt-2 text-[10px] text-slate-500 text-center font-mono">
              Aethel Anti-Snoop Lock • Inactividad 60s
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
