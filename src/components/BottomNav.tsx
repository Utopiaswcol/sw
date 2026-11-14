import React from 'react';
import { Bell, Home, Plus, Search, User } from 'lucide-react';
import { haptics } from '../services/hapticsService';

export type MainAppTab =
  | 'explore'
  | 'agenda'
  | 'chat'
  | 'media'
  | 'onboarding'
  | 'dual_profile'
  | 'simulator'
  | 'terminal'
  | 'code'
  | 'sql'
  | 'docs';

interface BottomNavProps {
  activeTab: MainAppTab;
  setActiveTab: (tab: MainAppTab) => void;
  onNotify?: () => void;
  onPropose?: () => void;
  onLeave?: () => void;
  doorActive?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  onNotify,
  onPropose,
  onLeave,
  doorActive = false
}) => {
  const go = (tab: MainAppTab) => {
    haptics.selection();
    onLeave?.();
    setActiveTab(tab);
  };

  const item = (tab: MainAppTab, label: string, icon: typeof Home) => {
    const on = !doorActive && activeTab === tab;
    const Icon = icon;
    return (
      <button type="button" onClick={() => go(tab)} className="flex flex-1 flex-col items-center gap-1 py-1">
        <Icon className={`h-5 w-5 ${on ? 'text-[#d06a45]' : 'text-white/55'}`} strokeWidth={1.6} />
        <span className={`text-[10px] ${on ? 'text-[#d06a45]' : 'text-white/45'}`}>{label}</span>
        <span className={`h-1 w-1 rounded-full ${on ? 'bg-[#c4a574]' : 'bg-transparent'}`} />
      </button>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#c4a574]/25 bg-gradient-to-t from-black via-black to-black/80 pb-safe pt-2 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-end px-2">
        <button type="button" onClick={() => go('explore')} className="flex flex-1 flex-col items-center gap-1 py-1">
          <Home className="h-5 w-5 text-white/55" strokeWidth={1.6} />
          <span className="text-[10px] text-white/45">Inicio</span>
          <span className="h-1 w-1 rounded-full bg-transparent" />
        </button>
        {item('explore', 'Explorar', Search)}
        <button
          type="button"
          onClick={() => {
            haptics.selection();
            onPropose?.();
          }}
          className={`sway-clay -mt-7 flex h-14 w-14 items-center justify-center rounded-full ring-4 ${doorActive ? 'ring-[#c4a574]' : 'ring-black'}`}
          aria-label="La puerta"
        >
          <Plus className="h-7 w-7 text-[#f7f1ea]" />
        </button>
        <button type="button" onClick={() => { haptics.selection(); onNotify?.(); }} className="flex flex-1 flex-col items-center gap-1 py-1">
          <Bell className="h-5 w-5 text-white/55" strokeWidth={1.6} />
          <span className="text-[10px] text-white/45">Avisos</span>
          <span className="h-1 w-1 rounded-full bg-transparent" />
        </button>
        {item('dual_profile', 'Perfil', User)}
      </div>
    </nav>
  );
};
