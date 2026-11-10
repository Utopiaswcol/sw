import React, { useState } from 'react';
import { MainAppTab } from './BottomNav';
import { haptics } from '../services/hapticsService';
import { useDecoy } from './DecoyScreen';
import { notificationService } from '../services/notificationService';
import {
  Compass,
  CalendarDays,
  KeyRound,
  MessageCircle,
  Users2,
  HeartHandshake,
  EyeOff,
  MapPin,
  Cpu,
  Terminal,
  Code2,
  Database,
  BookOpen,
  Sparkles,
  Bell
} from 'lucide-react';
import { LuxeIcon } from './common/LuxeIcon';

interface DesktopSidebarProps {
  activeTab: MainAppTab;
  setActiveTab: (tab: MainAppTab) => void;
  isCoupleMode: boolean;
  setIsCoupleMode: (isCouple: boolean) => void;
  unreadChatCount?: number;
  isDevMode?: boolean;
  toggleDevMode?: () => void;
  activeAlias?: string;
  onOpenQuickSwitch?: () => void;
  onOpenNotifications?: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  activeTab,
  setActiveTab,
  isCoupleMode,
  setIsCoupleMode,
  unreadChatCount = 1,
  isDevMode = false,
  toggleDevMode,
  activeAlias = 'Carlos & Sofia (Medellín Bi)',
  onOpenQuickSwitch,
  onOpenNotifications
}) => {
  const [logoClickCount, setLogoClickCount] = useState<number>(0);
  const { triggerDecoyPanic } = useDecoy();
  const unreadNotifications = notificationService.getUnreadCount();

  // Triple-click on logo toggles dev mode secretly
  const handleLogoClick = () => {
    haptics.selection();
    const newCount = logoClickCount + 1;
    setLogoClickCount(newCount);
    if (newCount >= 3) {
      if (toggleDevMode) toggleDevMode();
      haptics.success();
      setLogoClickCount(0);
    } else {
      setTimeout(() => setLogoClickCount(0), 1200);
    }
  };

  const mainNavItems = [
    { id: 'explore' as MainAppTab, label: 'Explorar Afinidad', icon: Compass, badge: null },
    { id: 'agenda' as MainAppTab, label: 'Agenda & Eventos', icon: CalendarDays, badge: 'NUEVO' },
    { id: 'media' as MainAppTab, label: 'Bóveda Cifrada', icon: KeyRound, badge: null },
    { id: 'chat' as MainAppTab, label: 'Mensajes Efímeros', icon: MessageCircle, badge: unreadChatCount > 0 ? unreadChatCount : null },
    { id: 'dual_profile' as MainAppTab, label: 'Perfil Dual Pareja', icon: Users2, badge: null }
  ];

  const devNavItems = [
    { id: 'simulator' as MainAppTab, label: 'Simulador 5D Aversión', icon: Cpu },
    { id: 'terminal' as MainAppTab, label: 'Pruebas Unitarias Python', icon: Terminal },
    { id: 'code' as MainAppTab, label: 'Código Fuente Python', icon: Code2 },
    { id: 'sql' as MainAppTab, label: 'Supabase pgvector DDL', icon: Database },
    { id: 'docs' as MainAppTab, label: 'Documentación Matemática', icon: BookOpen }
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-neutral-950 border-r border-neutral-900 h-screen p-5 shrink-0 select-none overflow-y-auto scrollbar-none justify-between">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleLogoClick}
              className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-300 p-0.5 flex items-center justify-center shadow-lg shadow-amber-950/30 shrink-0 active:scale-95 transition-transform cursor-pointer"
              title="Aethel Vault (Triple-clic para Modo Desarrollador)"
            >
              <div className="w-full h-full bg-neutral-950 rounded-[14px] flex items-center justify-center">
                <LuxeIcon icon={HeartHandshake} active={true} variant="gold" size={20} strokeWidth={1.5} />
              </div>
            </button>

            <div>
              <h1 className="text-base font-black text-white tracking-wide flex items-center gap-1.5">
                <span>AETHEL</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60 uppercase">
                  VAULT
                </span>
              </h1>
              <p className="text-[10px] text-neutral-400 font-medium">Club Social ENM Colombia</p>
            </div>
          </div>

          {/* In-App Notifications Bell Icon Button for Desktop */}
          {onOpenNotifications && (
            <button
              onClick={() => {
                haptics.selection();
                onOpenNotifications();
              }}
              title="Notificaciones & Peticiones en la App"
              className="relative p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition-all active:scale-95 cursor-pointer"
            >
              <LuxeIcon icon={Bell} active={unreadNotifications > 0} variant="gold" size={16} strokeWidth={1.5} />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[9px] font-mono font-bold flex items-center justify-center animate-pulse shadow">
                  {unreadNotifications}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Location & Identity Selector */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 space-y-2.5">
          {/* Active Location Indicator */}
          <div className="flex items-center justify-between text-xs text-neutral-300">
            <div className="flex items-center space-x-1.5 text-amber-400 font-semibold text-[11px]">
              <LuxeIcon icon={MapPin} active={true} variant="gold" size={14} strokeWidth={1.5} />
              <span>Medellín • El Poblado</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          {/* Identity Quick Switcher */}
          <div className="space-y-2">
            <button
              onClick={() => {
                haptics.selection();
                if (onOpenQuickSwitch) onOpenQuickSwitch();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-neutral-950 border border-amber-500/30 hover:border-amber-400 transition-all text-left cursor-pointer group"
            >
              <div className="flex items-center space-x-2 truncate">
                <LuxeIcon icon={Users2} active={true} variant="gold" size={16} strokeWidth={1.5} />
                <div className="truncate">
                  <div className="text-xs font-bold text-white truncate">
                    {activeAlias}
                  </div>
                  <div className="text-[10px] text-amber-300/80 font-mono font-bold flex items-center gap-1">
                    <KeyRound className="w-3 h-3 text-amber-400" />
                    <span>PINs: 1234 • 1235 • 1236</span>
                  </div>
                </div>
              </div>
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          <div className="px-3 py-1 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
            Navegación Principal
          </div>
          {mainNavItems.map((item) => {
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  haptics.selection();
                  setActiveTab(item.id);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all group cursor-pointer ${
                  isActive
                    ? 'bg-neutral-900 text-white border border-amber-500/40 shadow-md'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <LuxeIcon
                    icon={item.icon}
                    active={isActive}
                    variant="gold"
                    size={18}
                    strokeWidth={1.5}
                  />
                  <span className={isActive ? 'text-amber-400 font-bold' : ''}>{item.label}</span>
                </div>

                {item.badge !== null && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-black font-mono ${
                      typeof item.badge === 'number'
                        ? 'bg-rose-600 text-white animate-bounce'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Developer Tools Section */}
        {isDevMode && (
          <div className="space-y-1.5 pt-4 border-t border-amber-500/20">
            <div className="px-3 py-1 text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
              <span>Modo Desarrollador</span>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            </div>
            {devNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    haptics.selection();
                    setActiveTab(item.id);
                  }}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-950/80 text-amber-200 border border-amber-500/40'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  <Icon className="w-4 h-4 text-amber-400" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Footer Section */}
      <div className="space-y-3 pt-4 border-t border-neutral-900">
        {/* Stealth Decoy Panic Button */}
        <button
          onClick={() => {
            triggerDecoyPanic();
          }}
          className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 text-xs font-bold transition-all shadow-lg active:scale-95 cursor-pointer"
        >
          <LuxeIcon icon={EyeOff} active={true} variant="rose" size={16} strokeWidth={1.5} />
          <span>Modo Discreto (Salida Rápida)</span>
        </button>

        <div className="text-[10px] text-neutral-500 text-center font-mono">
          Aethel Vault • ENM Cifrado 256-bit
        </div>
      </div>
    </aside>
  );
};
