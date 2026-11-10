import React, { useState } from 'react';
import {
  AudienceVisibilityState,
  MEDIA_GOVERNANCE_CONFIG
} from '../config/mediaGovernance';
import { haptics } from '../services/hapticsService';
import { Users2, Sparkles, Shield } from 'lucide-react';
import { LuxeIcon } from './common/LuxeIcon';

interface MoodSwitcherBarProps {
  visibility: AudienceVisibilityState;
  onChangeVisibility: (newVisibility: AudienceVisibilityState) => void;
  userRole?: 'solo_male' | 'couple' | 'single_woman';
}

export const MoodSwitcherBar: React.FC<MoodSwitcherBarProps> = ({
  visibility,
  onChangeVisibility,
  userRole = 'couple'
}) => {
  const [shakeKey, setShakeKey] = useState<string | null>(null);
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);

  const handleToggle = (key: keyof AudienceVisibilityState) => {
    haptics.toggle();

    // Check count of currently active audiences
    const activeCount = Object.values(visibility).filter(Boolean).length;

    // Rule: Cannot turn off all audiences
    if (visibility[key] && activeCount <= MEDIA_GOVERNANCE_CONFIG.AUDIENCE_SWITCHER.MIN_ACTIVE_AUDIENCES) {
      haptics.warning();
      setShakeKey(key);
      setNoticeMsg('Mantén al menos una conexión activa');
      setTimeout(() => setShakeKey(null), 500);
      setTimeout(() => setNoticeMsg(null), 2200);
      return;
    }

    const nextState = {
      ...visibility,
      [key]: !visibility[key]
    };

    onChangeVisibility(nextState);
  };

  return (
    <div className="bg-[#09090b]/95 backdrop-blur-xl p-3 rounded-2xl border border-amber-500/20 shadow-2xl space-y-2.5 select-none">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-neutral-400 flex items-center gap-1.5">
          <LuxeIcon icon={Sparkles} active={true} variant="gold" size={13} strokeWidth={1.35} />
          <span>Conectar hoy con</span>
        </span>

        {noticeMsg && (
          <span className="text-[10px] font-mono font-medium text-amber-300 bg-amber-950/80 border border-amber-500/40 px-2.5 py-0.5 rounded-full">
            {noticeMsg}
          </span>
        )}
      </div>

      {/* Micro-chip Toggle Selector */}
      <div className="grid grid-cols-3 gap-2">
        {/* Parejas Chip */}
        <button
          type="button"
          onClick={() => handleToggle('couples')}
          className={`py-2 px-2.5 rounded-xl text-xs font-medium tracking-wider uppercase transition-all duration-200 flex items-center justify-center space-x-1.5 cursor-pointer ${
            shakeKey === 'couples' ? 'animate-bounce border-rose-500' : ''
          } ${
            visibility.couples
              ? 'bg-neutral-900 text-amber-200 border border-amber-400/40 shadow-[inset_0_1px_1px_rgba(245,158,11,0.2)] ring-1 ring-amber-400/20'
              : 'bg-neutral-950/80 hover:bg-neutral-900/80 text-neutral-500 border border-neutral-800/80'
          }`}
        >
          <LuxeIcon
            icon={Users2}
            active={visibility.couples}
            variant="gold"
            size={13}
            strokeWidth={1.35}
          />
          <span className="whitespace-nowrap">Parejas</span>
        </button>

        {/* Chicas Chip */}
        <button
          type="button"
          onClick={() => handleToggle('single_females')}
          className={`py-2 px-2.5 rounded-xl text-xs font-medium tracking-wider uppercase transition-all duration-200 flex items-center justify-center space-x-1.5 cursor-pointer ${
            shakeKey === 'single_females' ? 'animate-bounce border-rose-500' : ''
          } ${
            visibility.single_females
              ? 'bg-neutral-900 text-amber-200 border border-amber-400/40 shadow-[inset_0_1px_1px_rgba(245,158,11,0.2)] ring-1 ring-amber-400/20'
              : 'bg-neutral-950/80 hover:bg-neutral-900/80 text-neutral-500 border border-neutral-800/80'
          }`}
        >
          <LuxeIcon
            icon={Sparkles}
            active={visibility.single_females}
            variant="gold"
            size={13}
            strokeWidth={1.35}
          />
          <span className="whitespace-nowrap">Chicas</span>
        </button>

        {/* Hombres Chip */}
        <button
          type="button"
          onClick={() => handleToggle('single_males')}
          className={`py-2 px-2.5 rounded-xl text-xs font-medium tracking-wider uppercase transition-all duration-200 flex items-center justify-center space-x-1.5 cursor-pointer ${
            shakeKey === 'single_males' ? 'animate-bounce border-rose-500' : ''
          } ${
            visibility.single_males
              ? 'bg-neutral-900 text-amber-200 border border-amber-400/40 shadow-[inset_0_1px_1px_rgba(245,158,11,0.2)] ring-1 ring-amber-400/20'
              : 'bg-neutral-950/80 hover:bg-neutral-900/80 text-neutral-500 border border-neutral-800/80'
          }`}
        >
          <LuxeIcon
            icon={Shield}
            active={visibility.single_males}
            variant="gold"
            size={13}
            strokeWidth={1.35}
          />
          <span className="whitespace-nowrap">Hombres</span>
        </button>
      </div>
    </div>
  );
};
