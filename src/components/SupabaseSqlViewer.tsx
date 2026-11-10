import React, { useEffect, useState } from 'react';
import { Database, Copy, Check, ShieldCheck, Download, Server, Key, Table } from 'lucide-react';

export const SupabaseSqlViewer: React.FC = () => {
  const [sqlContent, setSqlContent] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    fetch('/api/supabase/schema-sql')
      .then((res) => res.json())
      .then((data) => setSqlContent(data.sql || ''))
      .catch(() => setSqlContent('-- Error al cargar el archivo SQL.'));
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([sqlContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'schema_supabase_pgvector.sql';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs tracking-wider uppercase">
            <Database className="w-4 h-4" />
            <span>Arquitectura Supabase PostgreSQL + pgvector (Sprint 1.3)</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-all border border-slate-700"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'SQL Copiado' : 'Copiar Script SQL'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-all shadow-md shadow-emerald-950/50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar .sql</span>
            </button>
          </div>
        </div>

        <h2 className="text-xl font-bold text-white">
          Esquema DDL Definitivo: Anti-Clasismo, Consentimiento RLS y Short-Circuit 5D
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          Script SQL versión 3.0 para el <strong>SQL Editor de Supabase</strong>. Calibrado con principios éticos: remoción de sesgos de barrio, switches de pausa/consentimiento de pareja (`paused_by_couple`) en RLS y cortocircuito estricto de Vetoes antes de distancia coseno exacto para $d=5$.
        </p>
      </div>

      {/* Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold">
            <Table className="w-4 h-4" />
            <span>Sin Clasismo Territorial</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Perfiles restringidos únicamente a `city` (ej. 'Medellín', 'Bogotá') eliminando persistencia de barrios fijos.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center space-x-2 text-purple-400 text-xs font-bold">
            <Server className="w-4 h-4" />
            <span>Short-Circuit Vectorial</span>
          </div>
          <p className="text-[11px] text-slate-400">
            RPC calcula distancia coseno exacto ({'<=>'}) únicamente sobre los candidatos que superaron el filtro previo de Vetoes.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center space-x-2 text-rose-400 text-xs font-bold">
            <Key className="w-4 h-4" />
            <span>RLS Pausa de Pareja</span>
          </div>
          <p className="text-[11px] text-slate-400">
            `paused_by_couple` bloquea nuevos mensajes en RLS conservando el historial sin destruir pases ni canales.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Membresía & Pagos</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Seguimiento riguroso de `current_period_end` (fecha de corte Wompi/Bold) y método de pago en `subscriptions`.
          </p>
        </div>
      </div>

      {/* SQL Code Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800 pb-2">
          <span>/schema_supabase_pgvector.sql</span>
          <span>PostgreSQL 15+ / Supabase SQL Editor</span>
        </div>

        <div className="bg-slate-950 rounded-xl border border-slate-800/80 p-4 font-mono text-xs text-slate-200 overflow-x-auto whitespace-pre leading-relaxed max-h-[600px] overflow-y-auto">
          {sqlContent}
        </div>
      </div>
    </div>
  );
};
