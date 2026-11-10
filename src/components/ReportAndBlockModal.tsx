import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, EyeOff, Ban, CheckCircle2, X } from 'lucide-react';
import { haptics } from '../services/hapticsService';

interface ReportAndBlockModalProps {
  targetAlias: string;
  targetId: string;
  onClose: () => void;
  onConfirmBlock: (reason: string, blockMode: 'shadow_block' | 'report_only') => void;
}

export const ReportAndBlockModal: React.FC<ReportAndBlockModalProps> = ({
  targetAlias,
  targetId,
  onClose,
  onConfirmBlock
}) => {
  const [selectedReason, setSelectedReason] = useState<string>('veto_violation');
  const [customComments, setCustomComments] = useState<string>('');
  const [blockMode, setBlockMode] = useState<'shadow_block' | 'report_only'>('shadow_block');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const reportReasons = [
    { id: 'veto_violation', label: '🚫 Incumplimiento de Límites Duros / Acuerdos' },
    { id: 'fake_profile', label: '👤 Perfil Falso / Suplantación / Catfish' },
    { id: 'inappropriate_language', label: '💬 Lenguaje Inadecuado o Falta de Respeto' },
    { id: 'spam_commercial', label: '📢 Spam / Oferta Comercial No Solicitada' },
    { id: 'privacy_breach', label: '📸 Intento de Captura / Violación de Privacidad' }
  ];

  const handleSubmit = () => {
    haptics.warning();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      haptics.success();
      setTimeout(() => {
        onConfirmBlock(selectedReason, blockMode);
        onClose();
      }, 1500);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl p-4 flex items-center justify-center animate-in fade-in duration-200">
      <div className="bg-[#0e0e14] border border-rose-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-white/10 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-white">Reporte Registrado con Éxito</h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
              El perfil <strong className="text-amber-300">{targetAlias}</strong> ha sido bloqueado en <strong className="text-rose-400">Modo Sombra Mutuo</strong>. Ya no podrán ver sus actividades, bóvedas ni mensajes.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center space-x-3 border-b border-white/10 pb-4">
              <div className="p-3 rounded-2xl bg-rose-950/80 text-rose-400 border border-rose-800/60 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Reportar &amp; Bloquear Perfil</h3>
                <span className="text-xs font-mono font-bold text-amber-300 block">
                  Perfil Objetivo: {targetAlias}
                </span>
              </div>
            </div>

            {/* Reason Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">Motivo del Reporte:</label>
              <div className="space-y-1.5">
                {reportReasons.map((reason) => (
                  <button
                    key={reason.id}
                    type="button"
                    onClick={() => {
                      haptics.selection();
                      setSelectedReason(reason.id);
                    }}
                    className={`w-full text-left p-3 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center justify-between ${
                      selectedReason === reason.id
                        ? 'bg-rose-950/60 text-white border-rose-500/80 shadow-md'
                        : 'bg-slate-900/60 text-slate-400 border-white/10 hover:bg-slate-800'
                    }`}
                  >
                    <span>{reason.label}</span>
                    {selectedReason === reason.id && <span className="w-2 h-2 rounded-full bg-rose-500" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Comment Field */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Detalles Adicionales (Opcional):
              </label>
              <textarea
                value={customComments}
                onChange={(e) => setCustomComments(e.target.value)}
                placeholder="Escribe brevemente la razón de la alerta..."
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:border-rose-500 outline-none h-20 resize-none"
              />
            </div>

            {/* Master Strategy Option: Modo Sombra Mutuo */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-purple-500/30 space-y-2">
              <div className="flex items-center space-x-2 text-purple-300 font-bold text-xs">
                <EyeOff className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Acción de Privacidad Recomendada:</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                <strong className="text-white">Modo Sombra Mutuo (Invisible):</strong> Oculta ambos perfiles totalmente en la aplicación. Ninguno podrá ver publicaciones, mapa ni chat del otro.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-2xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-black rounded-2xl shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5"
              >
                {isSubmitting ? (
                  <span className="font-mono text-xs">Procesando...</span>
                ) : (
                  <>
                    <Ban className="w-4 h-4" />
                    <span>Bloquear &amp; Alertas</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
