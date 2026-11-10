import React, { useState, useEffect, createContext, useContext } from 'react';
import { haptics } from '../services/hapticsService';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Briefcase,
  Search,
  Bell,
  Globe,
  Calculator,
  Newspaper,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Lock,
  Key
} from 'lucide-react';

interface DecoyContextType {
  isDecoyActive: boolean;
  triggerDecoyPanic: () => void;
  deactivateDecoy: () => void;
}

const DecoyContext = createContext<DecoyContextType>({
  isDecoyActive: false,
  triggerDecoyPanic: () => {},
  deactivateDecoy: () => {}
});

export const useDecoy = () => useContext(DecoyContext);

interface DecoyScreenProps {
  children: React.ReactNode;
  userPin?: string;
}

export const DecoyScreenProvider: React.FC<DecoyScreenProps> = ({ children, userPin = '1234' }) => {
  const [isDecoyActive, setIsDecoyActive] = useState<boolean>(false);
  const [decoyMode, setDecoyMode] = useState<'calculator' | 'financial'>('calculator');
  const [escapeKeyTimes, setEscapeKeyTimes] = useState<number[]>([]);
  const [twoFingerTaps, setTwoFingerTaps] = useState<number[]>([]);

  // Calculator State
  const [calcDisplay, setCalcDisplay] = useState<string>('0');
  const [calcMemory, setCalcMemory] = useState<number | null>(null);
  const [calcOp, setCalcOp] = useState<string | null>(null);
  const [waitingForNext, setWaitingForNext] = useState<boolean>(false);
  const [cPressTimes, setCPressTimes] = useState<number[]>([]);
  const [calcHistory, setCalcHistory] = useState<string[]>([]);

  // Unlock Modal State
  const [showUnlockModal, setShowUnlockModal] = useState<boolean>(false);
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [unlockError, setUnlockError] = useState<boolean>(false);

  const triggerDecoyPanic = () => {
    setIsDecoyActive(true);
    haptics.warning();
  };

  const deactivateDecoy = () => {
    setIsDecoyActive(false);
    setShowUnlockModal(false);
    setEnteredPin('');
    setCalcDisplay('0');
    setCalcMemory(null);
    setCalcOp(null);
    haptics.success();
  };

  // Keyboard Trigger: Double-press Escape key (< 400ms)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const now = Date.now();
        setEscapeKeyTimes((prev) => {
          const recent = [...prev, now].filter((t) => now - t < 400);
          if (recent.length >= 2) {
            triggerDecoyPanic();
            return [];
          }
          return recent;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Multi-Touch Trigger: Triple tap with 2+ fingers (< 800ms)
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length >= 2) {
        const now = Date.now();
        setTwoFingerTaps((prev) => {
          const recent = [...prev, now].filter((t) => now - t < 800);
          if (recent.length >= 3) {
            triggerDecoyPanic();
            return [];
          }
          return recent;
        });
      }
    };

    window.addEventListener('touchstart', handleTouchStart);
    return () => window.removeEventListener('touchstart', handleTouchStart);
  }, []);

  // Calculator Logic
  const handleCalcDigit = (digit: string) => {
    haptics.selection();
    if (waitingForNext) {
      setCalcDisplay(digit);
      setWaitingForNext(false);
    } else {
      setCalcDisplay(calcDisplay === '0' ? digit : calcDisplay + digit);
    }
  };

  const handleCalcClear = () => {
    haptics.selection();
    setCalcDisplay('0');
    setCalcOp(null);
    setCalcMemory(null);
    setWaitingForNext(false);

    // Check double 'C' press for secret unlock
    const now = Date.now();
    const recent = [...cPressTimes, now].filter((t) => now - t < 700);
    if (recent.length >= 2) {
      setShowUnlockModal(true);
      setCPressTimes([]);
    } else {
      setCPressTimes(recent);
    }
  };

  const handleCalcOperation = (op: string) => {
    haptics.selection();
    const currentNum = parseFloat(calcDisplay);
    if (calcMemory === null) {
      setCalcMemory(currentNum);
    } else if (calcOp) {
      const result = executeOperation(calcMemory, currentNum, calcOp);
      setCalcMemory(result);
      setCalcDisplay(String(result));
    }
    setCalcOp(op);
    setWaitingForNext(true);
  };

  const executeOperation = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '×': return a * b;
      case '÷': return b !== 0 ? a / b : 0;
      default: return b;
    }
  };

  const handleCalcEquals = () => {
    haptics.selection();

    // Secret PIN check on calculator: if display is userPin or '1234'
    if (calcDisplay === userPin || calcDisplay === '1234') {
      deactivateDecoy();
      return;
    }

    if (calcMemory !== null && calcOp) {
      const currentNum = parseFloat(calcDisplay);
      const res = executeOperation(calcMemory, currentNum, calcOp);
      const expression = `${calcMemory} ${calcOp} ${currentNum} = ${res}`;
      setCalcHistory((prev) => [expression, ...prev.slice(0, 4)]);
      setCalcDisplay(String(res));
      setCalcMemory(null);
      setCalcOp(null);
      setWaitingForNext(true);
    }
  };

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPin === userPin || enteredPin === '1234') {
      deactivateDecoy();
    } else {
      haptics.warning();
      setUnlockError(true);
      setTimeout(() => setUnlockError(false), 2000);
    }
  };

  return (
    <DecoyContext.Provider value={{ isDecoyActive, triggerDecoyPanic, deactivateDecoy }}>
      {isDecoyActive ? (
        <div className="fixed inset-0 z-[100] bg-slate-950 text-slate-100 font-sans select-none overflow-hidden flex flex-col justify-between">
          {/* Top Decoy Header Bar */}
          <header className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                {decoyMode === 'calculator' ? 'Calculadora de Oficina v4.2' : 'BVC • Terminal Financiera en Vivo'}
              </span>
            </div>

            {/* Mode Switcher & Secret Exit Launcher */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  haptics.selection();
                  setDecoyMode('calculator');
                }}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all text-[11px] flex items-center space-x-1 ${
                  decoyMode === 'calculator'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Calculadora</span>
              </button>

              <button
                onClick={() => {
                  haptics.selection();
                  setDecoyMode('financial');
                }}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all text-[11px] flex items-center space-x-1 ${
                  decoyMode === 'financial'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Newspaper className="w-3.5 h-3.5" />
                <span>Noticias Bolsa</span>
              </button>

              {/* Discrete Secret Unlock Key Button */}
              <button
                onClick={() => {
                  haptics.selection();
                  setShowUnlockModal(true);
                }}
                title="Desbloqueo de Seguridad"
                className="p-1.5 rounded-lg bg-slate-800 text-slate-500 hover:text-slate-300 transition-all ml-1"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
            </div>
          </header>

          {/* DECOY MODE 1: Interactive Office Calculator */}
          {decoyMode === 'calculator' && (
            <div className="flex-1 flex flex-col justify-center items-center p-4 max-w-sm mx-auto w-full">
              <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
                {/* Calculator Display */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-right space-y-1">
                  <div className="text-[10px] font-mono text-slate-500 h-4 truncate">
                    {calcOp ? `${calcMemory} ${calcOp}` : calcHistory[0] || 'Listo'}
                  </div>
                  <div className="text-3xl font-mono font-bold text-emerald-400 tracking-wider truncate">
                    {calcDisplay}
                  </div>
                </div>

                {/* Calculator Keypad */}
                <div className="grid grid-cols-4 gap-2.5 text-sm font-mono font-bold">
                  <button
                    onClick={handleCalcClear}
                    className="p-4 bg-rose-950/80 hover:bg-rose-900 text-rose-300 rounded-2xl border border-rose-800 active:scale-95 transition-all"
                  >
                    C
                  </button>
                  <button
                    onClick={() => handleCalcOperation('÷')}
                    className="p-4 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-2xl border border-slate-700 active:scale-95 transition-all"
                  >
                    ÷
                  </button>
                  <button
                    onClick={() => handleCalcOperation('×')}
                    className="p-4 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-2xl border border-slate-700 active:scale-95 transition-all"
                  >
                    ×
                  </button>
                  <button
                    onClick={() => handleCalcOperation('-')}
                    className="p-4 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-2xl border border-slate-700 active:scale-95 transition-all"
                  >
                    -
                  </button>

                  <button
                    onClick={() => handleCalcDigit('7')}
                    className="p-4 bg-slate-950 hover:bg-slate-800 text-white rounded-2xl border border-slate-800 active:scale-95 transition-all"
                  >
                    7
                  </button>
                  <button
                    onClick={() => handleCalcDigit('8')}
                    className="p-4 bg-slate-950 hover:bg-slate-800 text-white rounded-2xl border border-slate-800 active:scale-95 transition-all"
                  >
                    8
                  </button>
                  <button
                    onClick={() => handleCalcDigit('9')}
                    className="p-4 bg-slate-950 hover:bg-slate-800 text-white rounded-2xl border border-slate-800 active:scale-95 transition-all"
                  >
                    9
                  </button>
                  <button
                    onClick={() => handleCalcOperation('+')}
                    className="p-4 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-2xl border border-slate-700 active:scale-95 transition-all row-span-2 flex items-center justify-center"
                  >
                    +
                  </button>

                  <button
                    onClick={() => handleCalcDigit('4')}
                    className="p-4 bg-slate-950 hover:bg-slate-800 text-white rounded-2xl border border-slate-800 active:scale-95 transition-all"
                  >
                    4
                  </button>
                  <button
                    onClick={() => handleCalcDigit('5')}
                    className="p-4 bg-slate-950 hover:bg-slate-800 text-white rounded-2xl border border-slate-800 active:scale-95 transition-all"
                  >
                    5
                  </button>
                  <button
                    onClick={() => handleCalcDigit('6')}
                    className="p-4 bg-slate-950 hover:bg-slate-800 text-white rounded-2xl border border-slate-800 active:scale-95 transition-all"
                  >
                    6
                  </button>

                  <button
                    onClick={() => handleCalcDigit('1')}
                    className="p-4 bg-slate-950 hover:bg-slate-800 text-white rounded-2xl border border-slate-800 active:scale-95 transition-all"
                  >
                    1
                  </button>
                  <button
                    onClick={() => handleCalcDigit('2')}
                    className="p-4 bg-slate-950 hover:bg-slate-800 text-white rounded-2xl border border-slate-800 active:scale-95 transition-all"
                  >
                    2
                  </button>
                  <button
                    onClick={() => handleCalcDigit('3')}
                    className="p-4 bg-slate-950 hover:bg-slate-800 text-white rounded-2xl border border-slate-800 active:scale-95 transition-all"
                  >
                    3
                  </button>
                  <button
                    onClick={handleCalcEquals}
                    className="p-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-black shadow-lg active:scale-95 transition-all row-span-2 flex items-center justify-center"
                  >
                    =
                  </button>

                  <button
                    onClick={() => handleCalcDigit('0')}
                    className="p-4 bg-slate-950 hover:bg-slate-800 text-white rounded-2xl border border-slate-800 active:scale-95 transition-all col-span-2"
                  >
                    0
                  </button>
                  <button
                    onClick={() => handleCalcDigit('.')}
                    className="p-4 bg-slate-950 hover:bg-slate-800 text-white rounded-2xl border border-slate-800 active:scale-95 transition-all"
                  >
                    .
                  </button>
                </div>

                <div className="text-[10px] font-mono text-slate-500 text-center">
                  💡 Pista: Presiona <span className="text-amber-400 font-bold">C</span> dos veces o ingresa tu PIN para salir.
                </div>
              </div>
            </div>
          )}

          {/* DECOY MODE 2: Live Financial News & Stock Ticker Portal */}
          {decoyMode === 'financial' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl mx-auto w-full">
              {/* Financial Market Ticker Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[10px]">COLCAP (BVC)</span>
                  <div className="flex items-center justify-between font-bold text-emerald-400">
                    <span>1,348.20</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[9px] text-emerald-500 font-bold">+0.84%</span>
                </div>

                <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[10px]">TRM USD/COP</span>
                  <div className="flex items-center justify-between font-bold text-rose-400">
                    <span>$3,924.50</span>
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[9px] text-rose-500 font-bold">-0.32%</span>
                </div>

                <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[10px]">ECOPETROL</span>
                  <div className="flex items-center justify-between font-bold text-emerald-400">
                    <span>$2,410</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[9px] text-emerald-500 font-bold">+1.25%</span>
                </div>

                <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[10px]">S&amp;P 500</span>
                  <div className="flex items-center justify-between font-bold text-emerald-400">
                    <span>5,482.10</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[9px] text-emerald-500 font-bold">+0.45%</span>
                </div>
              </div>

              {/* Financial News Stream */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Newspaper className="w-4 h-4 text-emerald-400" />
                    Titulares de Economía &amp; Mercados Financieros
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500">Actualizado hace 2 min</span>
                </div>

                <div className="space-y-3">
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1 hover:border-slate-700 transition-colors">
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">BANCO DE LA REPÚBLICA</span>
                    <h4 className="text-xs font-bold text-slate-200">
                      Junta directiva proyecta ajuste progresivo de tasas de interés de intervención para el Q4.
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Analistas del mercado prevén una estabilización de la inflación anual situándose en rangos meta.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1 hover:border-slate-700 transition-colors">
                    <span className="text-[10px] font-mono text-amber-400 font-bold">MATERIAS PRIMAS</span>
                    <h4 className="text-xs font-bold text-slate-200">
                      Precios del crudo Brent sostienen tendencia al alza impulsados por inventarios globales.
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Exportaciones energéticas de la región andina registran superávit comercial en el último mes.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1 hover:border-slate-700 transition-colors">
                    <span className="text-[10px] font-mono text-indigo-400 font-bold">TECNOLOGÍA &amp; CAPITAL</span>
                    <h4 className="text-xs font-bold text-slate-200">
                      Aumento del 28% en inversión de fondos Venture Capital para startups de fintech en Colombia.
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Ecosistemas de pagos locales PSE y Nequi consolidan adopción masiva en transacciones digitales.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Discrete Bottom Bar */}
          <footer className="bg-slate-900 border-t border-slate-800 px-4 py-2 text-[10px] font-mono text-slate-500 flex items-center justify-between shrink-0">
            <span>Terminal Financiera Corporativa • Modo Seguro Activo</span>
            <button
              onClick={() => setShowUnlockModal(true)}
              className="text-amber-400 hover:text-amber-300 font-bold underline"
            >
              Restaurar Sesión
            </button>
          </footer>

          {/* Unlock Secret PIN Modal */}
          {showUnlockModal && (
            <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 animate-fadeIn">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xs w-full text-center space-y-4 shadow-2xl">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6" />
                </div>

                <div>
                  <h3 className="text-sm font-black text-white">Desbloqueo de Seguridad</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Ingresa el PIN local de 4 dígitos para salir de la pantalla señuelo.
                  </p>
                </div>

                <form onSubmit={handleUnlockSubmit} className="space-y-3">
                  <input
                    type="password"
                    maxLength={4}
                    autoFocus
                    placeholder="••••"
                    value={enteredPin}
                    onChange={(e) => setEnteredPin(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-center text-xl font-mono font-bold text-amber-300 outline-none focus:border-amber-500 tracking-widest"
                  />

                  {unlockError && (
                    <p className="text-xs text-rose-400 font-bold animate-shake">
                      PIN incorrecto. Intenta de nuevo.
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowUnlockModal(false)}
                      className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="py-2.5 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 rounded-xl text-xs font-black shadow-lg transition-all"
                    >
                      Desbloquear
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : (
        children
      )}
    </DecoyContext.Provider>
  );
};
