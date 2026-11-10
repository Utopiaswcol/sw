import React from 'react';
import { Compass, CalendarDays, KeyRound, MessageCircle, Users2 } from 'lucide-react';
import { LuxeIcon } from './common/LuxeIcon';
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
  unreadChatCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  unreadChatCount = 1
}) => {
  const navItems = [
    {
      id: 'explore' as MainAppTab,
      label: 'Explorar',
      icon: Compass,
      badge: null
    },
    {
      id: 'agenda' as MainAppTab,
      label: 'Agenda',
      icon: CalendarDays,
      badge: null
    },
    {
      id: 'media' as MainAppTab,
      label: 'Bóveda',
      icon: KeyRound,
      badge: null
    },
    {
      id: 'chat' as MainAppTab,
      label: 'Mensajes',
      icon: MessageCircle,
      badge: unreadChatCount > 0 ? unreadChatCount : null
    },
    {
      id: 'dual_profile' as MainAppTab,
      label: 'Perfil Dual',
      icon: Users2,
      badge: null
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/90 backdrop-blur-2xl border-t border-neutral-900/80 pb-safe pt-2 px-3 shadow-2xl">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                haptics.selection();
                setActiveTab(item.id);
              }}
              className="relative flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all group active:scale-95 touch-manipulation cursor-pointer"
            >
              {/* Active Glow Micro Indicator Bar */}
              {isActive && (
                <span className="absolute -top-2 w-8 h-1 bg-gradient-to-r from-amber-500 to-rose-500 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.8)] animate-pulse" />
              )}

              {/* Icon Container with Badge */}
              <div className="relative p-1">
                <LuxeIcon
                  icon={item.icon}
                  active={isActive}
                  variant="gold"
                  size={20}
                  strokeWidth={1.5}
                />

                {item.badge !== null && (
                  <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-neutral-950 shadow-sm animate-bounce">
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[10px] font-medium mt-0.5 tracking-tight transition-colors duration-300 ${
                  isActive ? 'text-amber-400 font-bold drop-shadow-[0_0_6px_rgba(245,158,11,0.3)]' : 'text-neutral-400 group-hover:text-neutral-200'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
