import React from 'react';
import { Cpu, Terminal, Code2, Sparkles, ShieldCheck, HeartHandshake, Users, Search, Flame } from 'lucide-react';

interface HeaderProps {
  activeTab: 'simulator' | 'onboarding' | 'explore' | 'dual_profile' | 'chat' | 'media' | 'terminal' | 'code' | 'sql' | 'docs';
  setActiveTab: (tab: 'simulator' | 'onboarding' | 'explore' | 'dual_profile' | 'chat' | 'media' | 'terminal' | 'code' | 'sql' | 'docs') => void;
  isBackendConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, isBackendConnected }) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-md bg-opacity-90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-purple-600 to-indigo-600 p-0.5 flex items-center justify-center shadow-lg shadow-rose-950/40">
            <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
              <HeartHandshake className="w-5 h-5 text-rose-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight text-white">
                ENM Colombia <span className="text-rose-400 font-semibold">Relational Engine</span>
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                v1.0 Python 5D
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Motor Psicométrico &amp; Algoritmo Vectorial de No-Monogamia Ética
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80 overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('explore')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
              activeTab === 'explore'
                ? 'bg-rose-600 text-white shadow-sm shadow-rose-900/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-rose-300" />
            <span>Explorar &amp; Match</span>
          </button>

          <button
            onClick={() => setActiveTab('dual_profile')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
              activeTab === 'dual_profile'
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-900/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-purple-300" />
            <span>Mi Perfil Dual</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
              activeTab === 'chat'
                ? 'bg-amber-600 text-white shadow-sm shadow-amber-900/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Chat Efímero &amp; Wompi</span>
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
              activeTab === 'simulator'
                ? 'bg-rose-600 text-white shadow-sm shadow-rose-900/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Simulador 5D</span>
          </button>

          <button
            onClick={() => setActiveTab('onboarding')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
              activeTab === 'onboarding'
                ? 'bg-rose-600 text-white shadow-sm shadow-rose-900/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Onboarding 6D</span>
          </button>

          <button
            onClick={() => setActiveTab('media')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
              activeTab === 'media'
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-900/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
            <span>Bóveda Privada</span>
          </button>

          <button
            onClick={() => setActiveTab('terminal')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
              activeTab === 'terminal'
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-900/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Tests Python</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
              activeTab === 'code'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-900/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Código Python</span>
          </button>

          <button
            onClick={() => setActiveTab('sql')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
              activeTab === 'sql'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span>Supabase pgvector SQL</span>
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
              activeTab === 'docs'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Matemática</span>
          </button>
        </div>

        {/* Backend Status Indicator */}
        <div className="hidden lg:flex items-center space-x-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-slate-300 font-mono">NumPy 5D Engine Ready</span>
        </div>

      </div>
    </header>
  );
};
