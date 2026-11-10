import React, { useRef, useEffect, useState } from 'react';
import { Eye, Unlock, Sparkles, ShieldAlert, Flame } from 'lucide-react';

export type RevealPhase = 1 | 2 | 3;

export interface BlindRevealProps {
  src: string;
  alt?: string;
  className?: string;
  phase?: RevealPhase; // 1: Public Blur (28px), 2: Chat Active (12px), 3: Key Granted (0px)
  vector5D?: [number, number, number, number, number]; // [E1, E2, E3, E4, E5], E3 is modesty (-1) to exhibitionism (+1 or -0.6 threshold)
  optOutBlindReveal?: boolean;
  viewerUserId?: string;
  alias?: string;
  hasActiveChat?: boolean;
  hasConsentSigned?: boolean;
  hasVaultKey?: boolean;
  isUnregisteredExternal?: boolean; // True when viewed outside network without active session
  onPhaseChange?: (phase: RevealPhase, isOptOut: boolean) => void;
}

export const BlindRevealImage: React.FC<BlindRevealProps> = ({
  src,
  alt = 'Fotografía Protegida Aethel Vault',
  className = '',
  phase: explicitPhase,
  vector5D = [0, 0, 0, 0, 0],
  optOutBlindReveal = false,
  viewerUserId = 'usr_anonymous_viewer',
  alias = 'Perfil Protegido',
  hasActiveChat = false,
  hasConsentSigned = false,
  hasVaultKey = false,
  isUnregisteredExternal = false,
  onPhaseChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<boolean>(false);

  // Exhibitionist Opt-Out Rule: E3 <= -0.6 or explicit optOut flag
  // E3 axis in 5D Vector: Index 2. E3 <= -0.6 indicates high exhibitionist preference
  const isExhibitionistOptOut = Boolean(
    optOutBlindReveal || (vector5D && vector5D[2] !== undefined && vector5D[2] <= -0.6)
  );

  // Determine actual current phase
  let currentPhase: RevealPhase = 1;
  if (explicitPhase !== undefined) {
    currentPhase = explicitPhase;
  } else if (hasVaultKey) {
    currentPhase = 3;
  } else if (hasActiveChat && hasConsentSigned) {
    currentPhase = 2;
  } else {
    currentPhase = 1;
  }

  // Calculate blur radius in pixels
  let blurPx = 28; // Phase 1: Heavy blur for facial anonymization
  if (isExhibitionistOptOut) {
    blurPx = 0; // Exhibitionist mode bypasses blur
  } else if (currentPhase === 3) {
    blurPx = 0; // Phase 3: Vault Key granted
  } else if (currentPhase === 2) {
    blurPx = 12; // Phase 2: Medium blur for verified chat
  }

  useEffect(() => {
    if (onPhaseChange) {
      onPhaseChange(currentPhase, isExhibitionistOptOut);
    }
  }, [currentPhase, isExhibitionistOptOut]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Hardened anti-extraction protection: Override toDataURL & toBlob
    try {
      const securityErrorMsg = '🔒 AETHEL VAULT SECURITY: Canvas extraction blocked by memory protection protocol.';
      canvas.toDataURL = function () {
        console.warn(securityErrorMsg);
        return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      };
      canvas.toBlob = function (callback) {
        console.warn(securityErrorMsg);
        if (callback) {
          callback(new Blob([], { type: 'image/png' }));
        }
      };
    } catch (e) {
      // Ignore if non-configurable
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;

    img.onload = () => {
      setImageLoaded(true);
      setLoadError(false);

      // Set internal canvas resolution
      const width = img.naturalWidth || 800;
      const height = img.naturalHeight || 1000;
      canvas.width = width;
      canvas.height = height;

      ctx.clearRect(0, 0, width, height);

      // Apply Canvas Context Filter for Gaussian Blur before drawing to canvas memory
      if (blurPx > 0) {
        ctx.filter = `blur(${blurPx}px) brightness(0.95) contrast(1.05)`;
      } else {
        ctx.filter = 'none';
      }

      // Draw image onto Canvas
      ctx.drawImage(img, 0, 0, width, height);

      // Reset filter for watermark overlay
      ctx.filter = 'none';

      // Phase 3 Forensic Steganographic Watermark Overlay
      if (currentPhase === 3 || isExhibitionistOptOut) {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.font = `bold ${Math.max(12, Math.floor(width / 35))}px monospace`;
        ctx.textBaseline = 'bottom';

        const timestampStr = new Date().toISOString().substring(0, 19).replace('T', ' ');
        const watermarkText = `AETHEL VAULT FORENSIC • VIEWER: ${viewerUserId} • ${timestampStr}`;

        // Repeat watermark across canvas at angle
        ctx.translate(width / 2, height / 2);
        ctx.rotate((-25 * Math.PI) / 180);

        const stepY = Math.max(80, Math.floor(height / 6));
        for (let y = -height; y < height; y += stepY) {
          ctx.fillText(watermarkText, -width / 1.2, y);
        }
        ctx.restore();
      }

      // Discrete Corner Security Stamp
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(10, height - 35, 280, 25);
      ctx.fillStyle = blurPx === 0 ? '#34d399' : '#f59e0b';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(
        blurPx === 0 ? '✓ BLIND REVEAL: NÍTIDO (FASE 3)' : `🔒 BLIND REVEAL: BLUR ${blurPx}px`,
        18,
        height - 18
      );
    };

    img.onerror = () => {
      setLoadError(true);
      setImageLoaded(false);
    };
  }, [src, blurPx, currentPhase, isExhibitionistOptOut, viewerUserId]);

  // External Unregistered Access Protection (Zero Leakage Outside App)
  if (isUnregisteredExternal) {
    return (
      <div className={`relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#0e0c18] via-[#07060a] to-[#120f20] border border-amber-500/30 p-6 flex flex-col items-center justify-center text-center space-y-3 select-none ${className}`}>
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-xl animate-pulse">
          <ShieldAlert className="w-7 h-7 text-amber-400" />
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-mono font-extrabold text-amber-300 uppercase tracking-widest block">
            AETHEL CIPHERSHIELD • FOTO PRIVADA
          </span>
          <h4 className="text-sm font-black text-white">
            Acceso Exclusivo para Miembros Inscritos
          </h4>
          <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto">
            Las imágenes de {alias} están totalmente blindadas frente a la red pública. Registrate o inicia sesión para verificar tu acceso.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            window.location.href = '#login';
          }}
          className="mt-2 py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 text-slate-950 font-black text-xs hover:brightness-110 transition-all shadow-lg cursor-pointer"
        >
          Iniciar Sesión / Registrarse para Desbloquear
        </button>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-[24px] bg-[#070709] select-none ${className}`}>
      {/* HTML5 Canvas Element */}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover object-center pointer-events-none transition-opacity duration-500"
        aria-label={alt}
      />

      {/* Loading Placeholder */}
      {!imageLoaded && !loadError && (
        <div className="absolute inset-0 bg-[#0e0e14] animate-pulse flex flex-col items-center justify-center p-4 text-center space-y-2">
          <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
          <span className="text-[10px] font-mono text-slate-400">Procesando Desenfoque Gaussiano Volátil...</span>
        </div>
      )}

      {/* Fallback Error View */}
      {loadError && (
        <div className="absolute inset-0 bg-[#0e0e14] flex flex-col items-center justify-center p-4 text-center space-y-2 text-slate-400">
          <ShieldAlert className="w-8 h-8 text-rose-500" />
          <span className="text-xs font-bold text-white">Fotografía no disponible</span>
          <span className="text-[10px] text-slate-500">Cifrado de bóveda activo</span>
        </div>
      )}

      {/* Phase Badge Indicator */}
      <div className="absolute top-3 left-3 z-10">
        {isExhibitionistOptOut ? (
          <span className="backdrop-blur-md bg-rose-950/80 border border-rose-500/50 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold text-rose-300 flex items-center space-x-1 shadow-lg">
            <Flame className="w-3 h-3 text-rose-400 animate-pulse" />
            <span>Exhibicionismo Activo (Nítido)</span>
          </span>
        ) : currentPhase === 1 ? (
          <span className="backdrop-blur-md bg-black/70 border border-amber-500/40 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold text-amber-300 flex items-center space-x-1 shadow-lg">
            <Eye className="w-3 h-3 text-amber-400" />
            <span>Fase 1: Silueta Protegida (28px)</span>
          </span>
        ) : currentPhase === 2 ? (
          <span className="backdrop-blur-md bg-purple-950/80 border border-purple-500/50 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold text-purple-300 flex items-center space-x-1 shadow-lg">
            <Unlock className="w-3 h-3 text-purple-400" />
            <span>Fase 2: Conexión Aprobada (12px)</span>
          </span>
        ) : (
          <span className="backdrop-blur-md bg-emerald-950/80 border border-emerald-500/50 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold text-emerald-300 flex items-center space-x-1 shadow-lg">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>Fase 3: Revelado Nítido</span>
          </span>
        )}
      </div>
    </div>
  );
};
