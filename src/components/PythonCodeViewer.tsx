import React, { useState, useEffect } from 'react';
import { Code2, Copy, Check, Download, FileCode } from 'lucide-react';

export const PythonCodeViewer: React.FC = () => {
  const [code, setCode] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    fetch('/api/compatibility/python-code')
      .then((res) => res.json())
      .then((data) => setCode(data.code || ''))
      .catch(() => setCode('# Error al cargar el archivo Python.'));
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'relational_compatibility.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileCode className="w-4 h-4 text-indigo-400" />
            Código Fuente Python Completo (`relational_compatibility.py`)
          </h3>
          <p className="text-xs text-slate-400">
            Módulo independiente y listo para producción, usando únicamente NumPy y Type Annotations.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-all border border-slate-700"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado' : 'Copiar Código'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-all shadow-md shadow-indigo-950"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar .py</span>
          </button>
        </div>
      </div>

      <div className="bg-slate-950 rounded-xl border border-slate-800/80 p-4 font-mono text-xs text-slate-300 max-h-[550px] overflow-y-auto whitespace-pre leading-relaxed select-text">
        {code}
      </div>
    </div>
  );
};
