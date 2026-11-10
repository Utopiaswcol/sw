import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Lock, Sparkles, Key, AlertCircle, ArrowRight, CheckCircle2, ShieldAlert, LogOut, Download } from 'lucide-react';
import { haptics } from '../services/hapticsService';
import { notificationService } from '../services/notificationService';

interface DeveloperVerificationGateProps {
  children: React.ReactNode;
}

const REQUIRED_CODE = '821227';
const ACTIVE_SESSION_KEY = 'sexosfera_dev_active_session_v3';

export const DeveloperVerificationGate: React.FC<DeveloperVerificationGateProps> = ({ children }) => {
  // Always force-close old session keys on startup
  const [isVerified, setIsVerified] = useState<boolean>(() => {
    try {
      localStorage.removeItem('sexosfera_dev_verified');
      localStorage.removeItem('sexosfera_dev_session_v2');
      return sessionStorage.getItem(ACTIVE_SESSION_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Listen to cross-tab storage events or global lock events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sexosfera_dev_global_lock' || e.key === ACTIVE_SESSION_KEY) {
        setIsVerified(false);
        sessionStorage.removeItem(ACTIVE_SESSION_KEY);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Focus first input on mount if not verified
  useEffect(() => {
    if (!isVerified && inputRefs.current[0]) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 300);
    }
  }, [isVerified]);

  const lockAllSessions = () => {
    haptics.toggle();
    sessionStorage.removeItem(ACTIVE_SESSION_KEY);
    localStorage.removeItem(ACTIVE_SESSION_KEY);
    localStorage.setItem('sexosfera_dev_global_lock', Date.now().toString());
    setIsVerified(false);
    setDigits(['', '', '', '', '', '']);
    notificationService.info('Sesión de desarrollador cerrada. Acceso bloqueado.');
  };

  const verifyCode = (codeToVerify: string) => {
    if (codeToVerify === REQUIRED_CODE) {
      haptics.success();
      notificationService.success('Acceso de Desarrollador Sexosfera.com Verificado');
      sessionStorage.setItem(ACTIVE_SESSION_KEY, 'true');
      setIsVerified(true);
      setErrorMsg(null);
    } else {
      haptics.error();
      setErrorMsg('Clave de desarrollador incorrecta. Acceso denegado.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 600);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleChange = (index: number, value: string) => {
    // Only accept numeric input
    const cleaned = value.replace(/[^0-9]/g, '');
    if (!cleaned) {
      const newDigits = [...digits];
      newDigits[index] = '';
      setDigits(newDigits);
      return;
    }

    // Handle full string paste (e.g. 821227)
    if (cleaned.length >= 6) {
      const pastedDigits = cleaned.slice(0, 6).split('');
      setDigits(pastedDigits);
      pastedDigits.forEach((d, idx) => {
        if (inputRefs.current[idx]) inputRefs.current[idx]!.value = d;
      });
      verifyCode(pastedDigits.join(''));
      return;
    }

    const lastChar = cleaned[cleaned.length - 1];
    const newDigits = [...digits];
    newDigits[index] = lastChar;
    setDigits(newDigits);
    setErrorMsg(null);

    // Auto-advance focus
    if (index < 5 && lastChar) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit on 6th digit
    const fullCode = newDigits.join('');
    if (fullCode.length === 6 && !fullCode.includes('')) {
      verifyCode(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else {
        const newDigits = [...digits];
        newDigits[index] = '';
        setDigits(newDigits);
      }
    } else if (e.key === 'Enter') {
      const fullCode = digits.join('');
      if (fullCode.length === 6) {
        verifyCode(fullCode);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (pastedData) {
      const newDigits = pastedData.split('');
      while (newDigits.length < 6) newDigits.push('');
      setDigits(newDigits);
      if (pastedData.length === 6) {
        verifyCode(pastedData);
      } else {
        inputRefs.current[pastedData.length]?.focus();
      }
    }
  };

  const handleVirtualKeyClick = (key: string) => {
    haptics.selection();
    if (key === 'CLEAR') {
      setDigits(['', '', '', '', '', '']);
      setErrorMsg(null);
      inputRefs.current[0]?.focus();
      return;
    }

    if (key === 'DELETE') {
      const lastIndexWithDigit = [...digits].map(d => d !== '').lastIndexOf(true);
      if (lastIndexWithDigit !== -1) {
        const newDigits = [...digits];
        newDigits[lastIndexWithDigit] = '';
        setDigits(newDigits);
        inputRefs.current[lastIndexWithDigit]?.focus();
      }
      return;
    }

    // Numeric key
    const nextEmptyIndex = digits.findIndex(d => d === '');
    if (nextEmptyIndex !== -1) {
      handleChange(nextEmptyIndex, key);
    }
  };

  // If already verified, render main app with quick lock trigger and download backup
  if (isVerified) {
    return (
      <>
        {children}
        <div className="fixed bottom-3 left-3 z-[9990] flex items-center space-x-2">
          <button
            onClick={lockAllSessions}
            title="Cerrar Sesión de Desarrollador en Todos los Dispositivos (Sexosfera.com)"
            className="bg-black/80 hover:bg-rose-950/90 text-amber-400 hover:text-white border border-amber-500/30 hover:border-rose-500/60 px-2.5 py-1.5 rounded-full text-[10px] font-mono font-bold flex items-center space-x-1.5 shadow-2xl backdrop-blur-md transition-all cursor-pointer opacity-50 hover:opacity-100 group"
          >
            <Lock className="w-3 h-3 text-amber-400 group-hover:text-rose-400" />
            <span>Bloquear App</span>
            <LogOut className="w-3 h-3 text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          <a
            href="/sexosfera-app-backup.zip"
            download="sexosfera-app-completa.zip"
            title="Descargar archivo ZIP con todo el código fuente de la app"
            className="bg-amber-950/80 hover:bg-amber-600 text-amber-300 hover:text-black border border-amber-500/40 px-2.5 py-1.5 rounded-full text-[10px] font-mono font-bold flex items-center space-x-1.5 shadow-2xl backdrop-blur-md transition-all cursor-pointer opacity-70 hover:opacity-100"
          >
            <Download className="w-3 h-3 shrink-0" />
            <span>Descargar ZIP</span>
          </a>
        </div>
      </>
    );
  }

  // Verification Screen
  return (
    <div className="fixed inset-0 z-[9999] bg-[#07070a] text-white flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Verification Card */}
      <div className={`relative w-full max-w-md bg-[#0e0e14]/90 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(245,158,11,0.15)] backdrop-blur-2xl text-center space-y-6 ${isShaking ? 'animate-bounce' : ''}`}>
        
        {/* Header Icon Badge */}
        <div className="relative mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-rose-600 flex items-center justify-center shadow-xl border border-white/20">
          <ShieldCheck className="w-9 h-9 text-slate-950 stroke-[2.5]" />
          <div className="absolute -bottom-1 -right-1 p-1 bg-black rounded-full border border-amber-400">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
          </div>
        </div>

        {/* Title & Prompt Text */}
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-[11px] font-mono font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Sexosfera.com • Portal Desarrollador</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Verificación de Desarrollador
          </h2>

          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-medium pt-1 px-1">
            Para poder seguir debes verificar que eres desarrollador de <strong className="text-amber-300 font-bold">Sexosfera.com</strong>. Agrega tu clave de seis dígitos:
          </p>
        </div>

        {/* Error Alert Message */}
        {errorMsg && (
          <div className="p-3 bg-rose-950/80 border border-rose-500/60 rounded-xl text-rose-200 text-xs font-mono font-bold flex items-center justify-center space-x-2 animate-in fade-in">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 6 Digit Input Boxes */}
        <div className="flex justify-center items-center gap-2 sm:gap-2.5 my-2" onPaste={handlePaste}>
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => (inputRefs.current[idx] = el)}
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-mono font-black rounded-xl bg-black/80 border transition-all outline-none ${
                digit
                  ? 'border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)] bg-amber-950/20'
                  : 'border-white/15 text-neutral-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30'
              }`}
            />
          ))}
        </div>

        {/* Submit Button */}
        <button
          onClick={() => verifyCode(digits.join(''))}
          disabled={digits.join('').length < 6}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 via-amber-600 to-rose-600 hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100 text-slate-950 font-black text-sm rounded-xl shadow-xl transition-all cursor-pointer flex items-center justify-center space-x-2 active:scale-95 border border-white/20"
        >
          <Key className="w-4 h-4 text-slate-950 shrink-0" />
          <span>Verificar Acceso de Desarrollador</span>
          <ArrowRight className="w-4 h-4 text-slate-950 shrink-0" />
        </button>

        {/* On-Screen Virtual Numeric Keypad for Mobile / Convenience */}
        <div className="pt-2 border-t border-white/10 space-y-2">
          <p className="text-[10px] text-neutral-400 font-mono uppercase tracking-wider">
            Teclado Numérico Discreto
          </p>

          <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleVirtualKeyClick(num)}
                className="py-2.5 bg-neutral-900/90 hover:bg-neutral-800 border border-white/10 active:bg-amber-500 active:text-slate-950 rounded-xl text-base font-mono font-extrabold text-neutral-200 transition-all cursor-pointer shadow-md"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleVirtualKeyClick('CLEAR')}
              className="py-2.5 bg-neutral-900/90 hover:bg-rose-950/60 border border-white/10 text-rose-300 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer"
            >
              Borrar
            </button>
            <button
              type="button"
              onClick={() => handleVirtualKeyClick('0')}
              className="py-2.5 bg-neutral-900/90 hover:bg-neutral-800 border border-white/10 active:bg-amber-500 active:text-slate-950 rounded-xl text-base font-mono font-extrabold text-neutral-200 transition-all cursor-pointer shadow-md"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => handleVirtualKeyClick('DELETE')}
              className="py-2.5 bg-neutral-900/90 hover:bg-amber-950/60 border border-white/10 text-amber-300 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer"
            >
              ⌫
            </button>
          </div>
        </div>

        {/* Footer Security Badge */}
        <div className="pt-2 text-center text-[10px] text-neutral-400 font-mono flex items-center justify-center space-x-1">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Acceso Cifrado SSL • Protección de Producción Sexosfera.com</span>
        </div>
      </div>
    </div>
  );
};
