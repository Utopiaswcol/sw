import React, { useState, useEffect } from 'react';
import { Terminal, Play, RefreshCw, CheckCircle2, XCircle, AlertCircle, Sparkles } from 'lucide-react';

export const PythonTerminalView: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [output, setOutput] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const runTests = async () => {
    setLoading(true);
    setStatus('idle');
    try {
      const res = await fetch('/api/compatibility/run-python-tests');
      const data = await res.json();
      if (data.success) {
        setOutput(data.stdout);
        setStatus('success');
      } else {
        setOutput((data.stdout || '') + '\n' + (data.stderr || '') + '\n' + (data.error || ''));
        setStatus('error');
      }
    } catch (err: any) {
      setOutput(`Error conectando con el servidor Python: ${err.message}`);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            Ejecución Directa del Módulo Python 3 (`relational_compatibility.py`)
          </h3>
          <p className="text-xs text-slate-400">
            Ejecuta las pruebas unitarias en el servidor Cloud Run usando NumPy puro y Type Annotations.
          </p>
        </div>

        <button
          onClick={runTests}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-emerald-950"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin text-white" />
          ) : (
            <Play className="w-4 h-4 text-white fill-current" />
          )}
          <span>{loading ? 'Ejecutando Pruebas...' : 'Ejecutar Pruebas Python'}</span>
        </button>
      </div>

      {/* Terminal Container */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-inner font-mono text-xs">
        {/* Terminal Header Bar */}
        <div className="bg-slate-900 px-4 py-2 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
            <span className="text-slate-400 text-[11px] ml-2 font-semibold">python3 relational_compatibility.py</span>
          </div>

          <div className="flex items-center space-x-2">
            {status === 'success' && (
              <span className="inline-flex items-center space-x-1 text-emerald-400 text-[10px] bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                <CheckCircle2 className="w-3 h-3" />
                <span>3/3 Pruebas Pasadas</span>
              </span>
            )}
            {status === 'error' && (
              <span className="inline-flex items-center space-x-1 text-rose-400 text-[10px] bg-rose-950 px-2 py-0.5 rounded border border-rose-800">
                <XCircle className="w-3 h-3" />
                <span>Fallo de Ejecución</span>
              </span>
            )}
          </div>
        </div>

        {/* Console Log Output */}
        <div className="p-4 max-h-[420px] overflow-y-auto text-slate-200 whitespace-pre-wrap leading-relaxed select-text font-mono">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
              <span className="text-xs">Ejecutando suite de pruebas unitarias en Python 3 + NumPy...</span>
            </div>
          ) : (
            output
          )}
        </div>
      </div>
    </div>
  );
};
