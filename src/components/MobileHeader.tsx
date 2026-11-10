import React, { useState } from 'react';
import { MainAppTab } from './BottomNav';
import { haptics } from '../services/hapticsService';
import { useDecoy } from './DecoyScreen';
import { notificationService } from '../services/notificationService';
import {
  HeartHandshake,
  Users2,
  User,
  ShieldCheck,
  ChevronDown,
  Cpu,
  Terminal,
  Code2,
  Database,
  BookOpen,
  X,
  EyeOff,
  Bell,
  KeyRound
} from 'lucide-react';
import { LuxeIcon } from './common/LuxeIcon';

interface MobileHeaderProps {
  activeTab: MainAppTab;
  setActiveTab: (tab: MainAppTab) => void;
  isCoupleMode: boolean;
  setIsCoupleMode: (isCouple: boolean) => void;
  activeAlias?: string;
  isDevMode?: boolean;
  toggleDevMode?: () => void;
  onOpenQuickSwitch?: () => void;
  onOpenNotifications?: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  activeTab,
  setActiveTab,
  isCoupleMode,
  setIsCoupleMode,
  activeAlias = 'Carlos & Sofia (Medellín Bi)',
  isDevMode = false,
  toggleDevMode,
  onOpenQuickSwitch,
  onOpenNotifications
}) => {
  const [showIdentityMenu, setShowIdentityMenu] = useState<boolean>(false);
  const [showDevMenu, setShowDevMenu] = useState<boolean>(false);
  const [logoClickCount, setLogoClickCount] = useState<number>(0);
  const { triggerDecoyPanic } = useDecoy();
  const unreadCount = notificationService.getUnreadCount();

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

  return (
    <header className="sticky top-0 z-40 bg-neutral-950/95 backdrop-blur-xl border-b border-neutral-900/80 pt-safe px-4 py-3 md:hidden">
      <div className="max-w-md mx-auto flex items-center justify-between gap-2">
        {/* Brand Logo & Secret Dev Trigger */}
        <div className="flex items-center space-x-2.5 min-w-0">
          <button
            onClick={handleLogoClick}
            className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-300 p-0.5 flex items-center justify-center shadow-lg shadow-amber-950/30 shrink-0 active:scale-95 transition-transform cursor-pointer"
            title="Aethel Vault"
          >
            <div className="w-full h-full bg-neutral-950 rounded-[14px] flex items-center justify-center">
              <LuxeIcon icon={HeartHandshake} active={true} variant="gold" size={18} strokeWidth={1.5} />
            </div>
          </button>

          {/* Identity Quick Switch Badge */}
          <button
            onClick={() => {
              haptics.selection();
              if (onOpenQuickSwitch) onOpenQuickSwitch();
            }}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-neutral-900/90 border border-neutral-800 text-left hover:border-amber-500/40 transition-all active:scale-95 min-w-0 cursor-pointer"
            title="Cambiar Perfil (PINs: 1234, 1235, 1236)"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <div className="truncate text-xs font-bold text-neutral-100 max-w-[110px] sm:max-w-[150px]">
              {activeAlias}
            </div>
            <KeyRound className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1.5">
          {/* Notifications Inbox Bell Button */}
          {onOpenNotifications && (
            <button
              onClick={() => {
                haptics.selection();
                onOpenNotifications();
              }}
              title="Notificaciones & Solicitudes de Llave"
              className="relative p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition-all active:scale-95 shrink-0 cursor-pointer"
            >
              <LuxeIcon icon={Bell} active={unreadCount > 0} variant="gold" size={16} strokeWidth={1.5} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[9px] font-mono font-bold flex items-center justify-center animate-pulse shadow">
                  {unreadCount}
                </span>
              )}
            </button>
          )}

          {onOpenQuickSwitch && (
            <button
              onClick={() => {
                haptics.selection();
                onOpenQuickSwitch();
              }}
              title="Cambiar Perfil (PINs: 1234, 1235, 1236)"
              className="px-2.5 py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/40 text-amber-300 transition-all active:scale-95 flex items-center space-x-1.5 text-xs font-bold shrink-0 cursor-pointer"
            >
              <LuxeIcon icon={KeyRound} active={true} variant="gold" size={14} strokeWidth={1.5} />
              <span className="font-mono text-[10px]">PIN</span>
            </button>
          )}

          {/* Stealth Panic Button */}
          <button
            onClick={() => {
              triggerDecoyPanic();
            }}
            title="Activar Pantalla Señuelo (Salida Rápida)"
            className="px-2 py-1.5 rounded-xl bg-rose-950/50 hover:bg-rose-900/70 border border-rose-800/50 text-rose-300 transition-all active:scale-95 flex items-center space-x-1 text-xs cursor-pointer"
          >
            <LuxeIcon icon={EyeOff} active={true} variant="rose" size={16} strokeWidth={1.5} />
            <span className="font-semibold text-[10px]">Salida</span>
          </button>

          {/* Dev Mode Menu Button */}
          {isDevMode && (
            <div className="relative">
              <button
                onClick={() => {
                  haptics.selection();
                  setShowDevMenu(!showDevMenu);
                }}
                className="p-1.5 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-300 hover:bg-amber-900/80 transition-all active:scale-95 flex items-center space-x-1 text-xs cursor-pointer"
              >
                <LuxeIcon icon={Cpu} active={true} variant="gold" size={16} strokeWidth={1.5} />
                <span className="font-mono font-bold text-[10px]">Dev</span>
              </button>

              {/* Dev Tools Drawer Dropdown */}
              {showDevMenu && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-neutral-900 border border-amber-500/30 rounded-2xl shadow-2xl p-2 z-50 space-y-1">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider border-b border-neutral-800 flex justify-between items-center">
                    <span>Modo Desarrollador:</span>
                    <button
                      onClick={() => {
                        haptics.selection();
                        setShowDevMenu(false);
                      }}
                      className="text-neutral-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      haptics.selection();
                      setActiveTab('simulator');
                      setShowDevMenu(false);
                    }}
                    className={`w-full text-left p-2 rounded-xl text-xs font-medium flex items-center space-x-2 transition-colors cursor-pointer ${
                      activeTab === 'simulator' ? 'bg-rose-600 text-white' : 'text-neutral-300 hover:bg-neutral-800'
                    }`}
                  >
                    <Cpu className="w-4 h-4 text-amber-400" />
                    <span>Simulador 5D Aversión</span>
                  </button>

                  <button
                    onClick={() => {
                      haptics.selection();
                      setActiveTab('terminal');
                      setShowDevMenu(false);
                    }}
                    className={`w-full text-left p-2 rounded-xl text-xs font-medium flex items-center space-x-2 transition-colors cursor-pointer ${
                      activeTab === 'terminal' ? 'bg-purple-600 text-white' : 'text-neutral-300 hover:bg-neutral-800'
                    }`}
                  >
                    <Terminal className="w-4 h-4 text-purple-400" />
                    <span>Pruebas Unitarias Python</span>
                  </button>

                  <button
                    onClick={() => {
                      haptics.selection();
                      setActiveTab('code');
                      setShowDevMenu(false);
                    }}
                    className={`w-full text-left p-2 rounded-xl text-xs font-medium flex items-center space-x-2 transition-colors cursor-pointer ${
                      activeTab === 'code' ? 'bg-indigo-600 text-white' : 'text-neutral-300 hover:bg-neutral-800'
                    }`}
                  >
                    <Code2 className="w-4 h-4 text-indigo-400" />
                    <span>Código Fuente Python</span>
                  </button>

                  <button
                    onClick={() => {
                      haptics.selection();
                      setActiveTab('sql');
                      setShowDevMenu(false);
                    }}
                    className={`w-full text-left p-2 rounded-xl text-xs font-medium flex items-center space-x-2 transition-colors cursor-pointer ${
                      activeTab === 'sql' ? 'bg-emerald-600 text-white' : 'text-neutral-300 hover:bg-neutral-800'
                    }`}
                  >
                    <Database className="w-4 h-4 text-emerald-400" />
                    <span>Supabase pgvector DDL</span>
                  </button>

                  <button
                    onClick={() => {
                      haptics.selection();
                      setActiveTab('docs');
                      setShowDevMenu(false);
                    }}
                    className={`w-full text-left p-2 rounded-xl text-xs font-medium flex items-center space-x-2 transition-colors cursor-pointer ${
                      activeTab === 'docs' ? 'bg-neutral-800 text-white' : 'text-neutral-300 hover:bg-neutral-800'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 text-blue-400" />
                    <span>Documentación Matemática</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
