import React from 'react';
import { Lock } from 'lucide-react';

interface SwayCoverProps {
  onEnter: () => void;
  onCreate: () => void;
}

export const SwayCover: React.FC<SwayCoverProps> = ({ onEnter, onCreate }) => {
  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0">
        <SwayMural />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/25 to-black" />
      </div>

      <div className="relative z-10 mt-auto flex flex-col items-center px-8 pb-10 pt-6">
        <h1 className="font-sway text-[4.6rem] leading-none tracking-[0.08em] text-white sm:text-7xl">
          SWAY
        </h1>
        <span className="mt-3 h-px w-28 bg-gradient-to-r from-transparent via-[#c4a574] to-transparent" />
        <p className="mt-5 text-[1.05rem] tracking-[0.01em] text-white/95">
          Privado. Claro. Deseado.
        </p>

        <button
          type="button"
          onClick={onCreate}
          className="sway-clay mt-9 h-14 w-full max-w-sm rounded-2xl text-[1.05rem] font-medium text-[#f7f1ea]"
        >
          Crear cuenta
        </button>
        <button
          type="button"
          onClick={onEnter}
          className="mt-3 h-14 w-full max-w-sm rounded-2xl border border-[#c4a574]/70 bg-black/40 text-[1.05rem] font-medium text-white"
        >
          Entrar
        </button>

        <p className="mt-8 flex items-center gap-2 text-[0.8rem] text-[#c4a574]">
          <Lock className="h-3.5 w-3.5" strokeWidth={1.75} />
          Privacidad y seguridad garantizadas
        </p>
        <div className="mt-4 flex w-36 items-center gap-3 text-[#c4a574]">
          <span className="h-px flex-1 bg-[#c4a574]/50" />
          <CrownMark />
          <span className="h-px flex-1 bg-[#c4a574]/50" />
        </div>
        <p className="mt-2 text-sm tracking-[0.2em] text-[#c4a574]">+18</p>
      </div>
    </div>
  );
};

function CrownMark() {
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true">
      <path d="M1 11.5 L3.2 4.2 L6.4 8.2 L9 2.2 L11.6 8.2 L14.8 4.2 L17 11.5 Z" stroke="#c4a574" strokeWidth="1" fill="none" />
    </svg>
  );
}

export function SwayMural({ className = 'h-[68%] w-full' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 390 640"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <rect width="390" height="640" fill="#070605" />
      <g stroke="#d7b07a" strokeWidth="1.1" fill="none" opacity="0.9">
        <path d="M40 80 C90 40, 150 70, 170 140 C190 210, 150 280, 120 340 C90 400, 70 470, 80 540" />
        <path d="M70 120 C110 90, 160 110, 175 170" />
        <path d="M118 168 C140 150, 168 160, 176 196 C184 232, 160 250, 132 246 C104 242, 96 210, 118 168 Z" />
        <path d="M132 198 C140 194, 156 194, 166 200" />
        <path d="M124 230 C140 238, 160 236, 172 222" />
        <path d="M150 250 L146 290 L168 286" />
        <path d="M200 70 C250 30, 330 60, 350 150 C370 240, 340 320, 300 390 C260 460, 240 520, 250 600" />
        <path d="M230 130 C270 100, 320 120, 338 180" />
        <path d="M248 176 C278 150, 324 168, 332 214 C340 260, 300 286, 262 274 C224 262, 220 210, 248 176 Z" />
        <path d="M268 214 C278 208, 300 208, 318 216" />
        <path d="M258 248 C280 260, 310 256, 328 238" />
        <path d="M300 280 L310 340 L286 360" />
        <circle cx="300" cy="430" r="36" />
        <circle cx="300" cy="430" r="14" />
        <path d="M250 430 h100" />
      </g>
      <g stroke="#a56a45" strokeWidth="0.7" fill="none" opacity="0.55">
        <path d="M20 40 L90 160 L40 240 L120 300 L60 420" />
        <path d="M180 20 L210 140 L250 90 L300 200 L360 80 L380 220" />
        <path d="M30 300 L140 260 L200 340 L120 390" />
        <path d="M220 360 L280 320 L340 400 L260 470" />
        <path d="M10 500 L80 460 L160 520 L90 580" />
      </g>
    </svg>
  );
}
