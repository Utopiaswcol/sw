import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  Lock,
  Clock,
  X,
  EyeOff,
  AlertOctagon,
  Key,
  ShieldCheck,
  RefreshCw,
  CameraOff,
  Cpu
} from 'lucide-react';
import { haptics } from '../services/hapticsService';
import { MemoryProtectedImage } from './MemoryProtectedImage';
import { useAntiTamper } from '../services/antiTamperService';

interface SecureMediaViewerProps {
  mediaId: string;
  mediaTitle?: string;
  viewerUserId: string;
  viewerRole: 'solo_female' | 'solo_male' | 'couple_member';
  onClose: () => void;
}

export const SecureMediaViewer: React.FC<SecureMediaViewerProps> = ({
  mediaId,
  mediaTitle = 'Foto de Bóveda Privada',
  viewerUserId,
  viewerRole,
  onClose
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [mediaData, setMediaData] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isPrivacyCurtainActive, setIsPrivacyCurtainActive] = useState<boolean>(false);
  const [screenshotAttempted, setScreenshotAttempted] = useState<boolean>(false);

  // Sistema Anti-Tamper / DevTools Detección
  const antiTamperStatus = useAntiTamper();

  // Gesture state for Swipe-Down-To-Close
  const [dragY, setDragY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const touchStartYRef = useRef<number>(0);

  // 1. Cargar imagen con URL firmada desde el endpoint backend
  useEffect(() => {
    let isMounted = true;

    async function fetchSecureMedia() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/media/view/${mediaId}?viewerUserId=${viewerUserId}&viewerRole=${viewerRole}`
        );
        const data = await res.json();

        if (isMounted) {
          if (!data.allowed) {
            setError(data.error || 'Acceso denegado a este recurso multimedia.');
            haptics.warning();
          } else {
            setMediaData(data);
            setTimeLeft(data.expiresInSeconds || 60);
            haptics.success();
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError('Error de comunicación con el servidor de medios.');
          haptics.warning();
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchSecureMedia();

    return () => {
      isMounted = false;
    };
  }, [mediaId, viewerUserId, viewerRole]);

  // 2. Contador Regresivo TTL de Expiración del Enlace
  useEffect(() => {
    if (!mediaData || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setError('El enlace seguro de la imagen ha expirado por tiempo de vida (TTL 60s).');
          haptics.warning();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [mediaData, timeLeft]);

  // 3. Cortina de Privacidad Instantánea (Pérdida de Foco / Cambio de Pestaña / Detección DevTools)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPrivacyCurtainActive(true);
        haptics.warning();
      }
    };

    const handleBlur = () => {
      setIsPrivacyCurtainActive(true);
      haptics.warning();
    };

    const handleFocus = () => {
      if (!antiTamperStatus.isDevToolsOpen) {
        setIsPrivacyCurtainActive(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [antiTamperStatus.isDevToolsOpen]);

  // 4. Intercepción de Teclas Anti-Captura de Pantalla
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
        e.preventDefault();
        setScreenshotAttempted(true);
        setIsPrivacyCurtainActive(true);
        haptics.warning();
        setTimeout(() => setScreenshotAttempted(false), 3000);
      }

      if (
        (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5' || e.key === 's')) ||
        (e.ctrlKey && e.shiftKey && (e.key === 'S' || e.key === 's' || e.key === 'I' || e.key === 'i')) ||
        e.key === 'F12'
      ) {
        e.preventDefault();
        setScreenshotAttempted(true);
        setIsPrivacyCurtainActive(true);
        haptics.warning();
        setTimeout(() => setScreenshotAttempted(false), 3000);
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  // Handlers para Gestos Táctiles (Swipe-Down-To-Close)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartYRef.current;

    if (deltaY > 0) {
      const resistanceDrag = Math.pow(deltaY, 0.95);
      setDragY(resistanceDrag);
    } else {
      const upwardResistance = deltaY * 0.25;
      setDragY(upwardResistance);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (dragY > 120) {
      haptics.selection();
      setDragY(500);
      setTimeout(() => {
        onClose();
      }, 150);
    } else {
      setDragY(0);
    }
  };

  const nowTimestamp = new Date().toISOString();
  const backdropOpacity = Math.max(0.2, 1 - Math.min(Math.abs(dragY) / 350, 0.75));

  const shouldBlockScreen = isPrivacyCurtainActive || antiTamperStatus.isDevToolsOpen;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 select-none transition-colors duration-200"
      style={{
        backgroundColor: `rgba(7, 7, 9, ${backdropOpacity * 0.95})`,
        backdropFilter: `blur(${Math.max(2, 16 - (Math.abs(dragY) / 30))}px)`
      }}
    >
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateY(${dragY}px) translateZ(0)`,
          willChange: 'transform',
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
        className="relative w-full max-w-2xl bg-[#0e0e14] border border-white/[0.09] rounded-3xl shadow-2xl overflow-hidden flex flex-col touch-manipulation"
      >
        {/* Drag Handle Bar Minimalista */}
        <div className="w-full bg-[#070709] pt-2.5 pb-1 flex justify-center items-center cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 rounded-full bg-slate-700/80 hover:bg-slate-500 transition-colors" />
        </div>

        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.08] bg-[#070709]">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <span className="truncate max-w-[150px] sm:max-w-[280px]">{mediaTitle}</span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 shrink-0 flex items-center gap-1">
                  <Cpu className="w-3 h-3" /> RAM CANVAS
                </span>
              </h3>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                Renderizado volátil en Canvas HTML5 sin URLs blob persistentes en DOM
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              haptics.selection();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Area */}
        <div className="relative min-h-[340px] bg-[#070709] flex items-center justify-center overflow-hidden">
          {/* Alerta de intento de captura de pantalla */}
          {screenshotAttempted && (
            <div className="absolute top-4 left-4 right-4 z-40 bg-rose-950/95 border border-rose-600 p-3 rounded-2xl text-xs text-rose-200 flex items-center space-x-2 animate-bounce shadow-xl">
              <CameraOff className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <strong className="block font-bold">¡Intento de Captura Detectado!</strong>
                <span>Se ha activado la cortina de privacidad y la alerta háptica.</span>
              </div>
            </div>
          )}

          {/* Cortina de Privacidad Instantánea / Detección DevTools */}
          {shouldBlockScreen && !error && !loading && (
            <div className="absolute inset-0 z-30 bg-[#070709]/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center space-y-3">
              <div className="p-4 rounded-full bg-rose-950/60 border border-rose-800/80 text-rose-400 animate-pulse">
                <EyeOff className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-white">Cortina de Privacidad de Seguridad</h4>
              <p className="text-xs text-slate-300 max-w-md leading-relaxed">
                {antiTamperStatus.isDevToolsOpen
                  ? `Se han detectado Herramientas de Desarrollador activas (${antiTamperStatus.reason || 'DevTools'}). El contenido privado se oculta automáticamente.`
                  : 'La imagen se ha ocultado automáticamente porque la ventana perdió el foco.'}
              </p>
            </div>
          )}

          {/* Estado de Carga */}
          {loading && (
            <div className="flex flex-col items-center space-y-3 p-8 text-center">
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
              <p className="text-xs font-mono text-slate-400">Validando políticas de acceso y token HMAC...</p>
            </div>
          )}

          {/* Estado de Error o Acceso Denegado */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 max-w-md">
              <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-400">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-bold text-white">Acceso Restringido o Enlace Expirado</h4>
              <p className="text-xs text-slate-300 leading-relaxed bg-[#0e0e14] p-3 rounded-xl border border-white/[0.08] font-mono">
                {error}
              </p>
              <button
                onClick={() => {
                  haptics.selection();
                  onClose();
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all active:scale-95"
              >
                Cerrar Visor
              </button>
            </div>
          )}

          {/* Renderizador de Imagen en Memoria Volátil (MemoryProtectedImage) */}
          {!loading && !error && mediaData && (
            <div className="relative w-full h-full flex items-center justify-center p-4">
              <MemoryProtectedImage
                src={mediaData.signedUrl || '/placeholder.png'}
                alt="Vault Content"
                className="max-h-[320px] sm:max-h-[380px] w-auto rounded-2xl border border-white/[0.08] shadow-2xl"
                watermarkText={`CONFIDENTIAL • USER: ${viewerUserId} • ${nowTimestamp.substring(0, 10)}`}
              />
            </div>
          )}
        </div>

        {/* Modal Bottom Footer bar with TTL & Security Info */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3 border-t border-white/[0.08] bg-[#070709] text-xs gap-2">
          <div className="flex items-center space-x-2 text-slate-400 font-mono">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Expiración TTL:</span>
            <span
              className={`font-bold px-2 py-0.5 rounded ${
                timeLeft <= 10 ? 'bg-rose-950 text-rose-400 border border-rose-800 animate-pulse' : 'bg-[#0e0e14] text-amber-300'
              }`}
            >
              {timeLeft}s
            </span>
          </div>

          <div className="flex items-center space-x-2 text-[10px] sm:text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>EXIF Purged • RAM Canvas • Anti-Tamper Enabled</span>
          </div>
        </div>
      </div>
    </div>
  );
};
