import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Info,
  X,
  Send,
  ExternalLink
} from 'lucide-react';
import {
  VouchShieldIcon,
  PartyHostIcon,
  EventBraceletIcon,
  AmbassadorBadgeIcon,
  CreatorLinkIcon
} from './ui/AethelIcons';
import { haptics } from '../services/hapticsService';

interface ProfileReputationAndCreatorSectionProps {
  alias: string;
  inPersonVouchesCount?: number;
  vouchedByCouples?: string[];
  eventsOrganizedCount?: number;
  eventsAttendedCount?: number;
  isCommunityVouched?: boolean;
  isHostBadge?: boolean;
  isAmbassador?: boolean;
  creatorExternalLink?: string;
  isEditable?: boolean;
  onUpdateCreatorLink?: (link: string) => void;
}

export const ProfileReputationAndCreatorSection: React.FC<ProfileReputationAndCreatorSectionProps> = ({
  alias,
  inPersonVouchesCount = 3,
  vouchedByCouples = ['Felipe & Juliana (VIP)', 'Andrés & Mónica (VIP)', 'Daniel & Andrea (VIP)'],
  eventsOrganizedCount = 2,
  eventsAttendedCount = 6,
  isCommunityVouched = true,
  isHostBadge = true,
  isAmbassador = true,
  creatorExternalLink = 'https://fanvue.com/carlos_sofia_official',
  isEditable = false,
  onUpdateCreatorLink
}) => {
  const [showVouchModal, setShowVouchModal] = useState<boolean>(false);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [editingLink, setEditingLink] = useState<string>(creatorExternalLink || '');
  const [vouchCodeInput, setVouchCodeInput] = useState<string>('');
  const [vouchSuccessMsg, setVouchSuccessMsg] = useState<string | null>(null);

  const handleRequestVouch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vouchCodeInput.trim()) return;
    haptics.success();
    setVouchSuccessMsg(`¡Solicitud enviada a ${vouchCodeInput}! Al ser aceptada en persona, tu medalla física se actualizará.`);
    setVouchCodeInput('');
  };

  return (
    <div className="space-y-2.5 bg-[#0a0910]/90 p-3.5 sm:p-4 rounded-2xl border border-amber-500/20 shadow-lg relative overflow-hidden backdrop-blur-md">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-1.5 pb-2 border-b border-white/[0.08]">
        <div className="flex items-center space-x-1.5">
          <AmbassadorBadgeIcon size="xs" />
          <h3 className="text-[11px] font-semibold text-neutral-200 tracking-[0.15em] uppercase">
            Estatus &amp; Reputación
          </h3>
          <button
            type="button"
            onClick={() => {
              haptics.selection();
              setShowExplanation(!showExplanation);
            }}
            className="text-amber-400 hover:text-amber-200 transition-colors ml-0.5 cursor-pointer"
            title="¿Qué es Estatus y Reputación?"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>

        {isAmbassador && (
          <span className="bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[9px] font-mono font-medium px-2 py-0.5 rounded-full">
            Embajador VIP
          </span>
        )}
      </div>

      {/* Compact Badge Strip - Single Horizontal Row */}
      <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
        <div className="flex items-center space-x-1 bg-neutral-900/90 border border-amber-500/25 px-2 py-0.5 rounded-md text-[10px] shrink-0 font-mono">
          <VouchShieldIcon size="xs" />
          <span className="text-amber-300 font-bold">{inPersonVouchesCount} Avales</span>
        </div>

        {isHostBadge && (
          <div className="flex items-center space-x-1 bg-neutral-900/90 border border-amber-500/25 px-2 py-0.5 rounded-md text-[10px] shrink-0 font-mono">
            <PartyHostIcon size="xs" />
            <span className="text-amber-300 font-bold">Anfitrión ({eventsOrganizedCount})</span>
          </div>
        )}

        <div className="flex items-center space-x-1 bg-neutral-900/90 border border-amber-500/25 px-2 py-0.5 rounded-md text-[10px] shrink-0 font-mono">
          <EventBraceletIcon size="xs" />
          <span className="text-amber-300 font-bold">{eventsAttendedCount} Eventos</span>
        </div>
      </div>

      {/* Request Vouch action bar */}
      <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-white/[0.05] text-[10px]">
        <span className="text-neutral-400 font-mono text-[9px]">
          Verificación cruzada de conducta en eventos
        </span>

        <button
          type="button"
          onClick={() => {
            haptics.selection();
            setShowVouchModal(true);
          }}
          className="text-[10px] text-amber-400 hover:text-amber-200 font-mono font-semibold underline cursor-pointer shrink-0"
        >
          + Solicitar Aval
        </button>
      </div>

      {/* Clear Instruction & Meaning Box */}
      {showExplanation && (
        <div className="p-2.5 bg-slate-950 border border-amber-500/30 rounded-xl space-y-1 text-xs text-slate-300 animate-in fade-in duration-200">
          <div className="flex items-center space-x-1.5 text-amber-400 font-mono font-bold text-[11px]">
            <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>¿Qué es el Aval en Persona?</span>
          </div>
          <p className="text-[10px] text-slate-300 leading-relaxed">
            Es la confirmación física cruzada que otorgan otras parejas VIP tras compartir eventos contigo, garantizando máxima confianza y estatus dentro de la comunidad.
          </p>
        </div>
      )}

      {/* Creador / Proyecto Externo Link */}
      {creatorExternalLink && (
        <div className="pt-1.5 border-t border-white/[0.05] flex items-center justify-between text-[10px]">
          <div className="flex items-center space-x-1.5 min-w-0">
            <ExternalLink className="w-3 h-3 text-purple-400 shrink-0" />
            <span className="text-neutral-400 font-mono text-[9px] uppercase font-semibold shrink-0">Proyecto:</span>
            <span className="text-purple-300 font-mono truncate max-w-[150px] sm:max-w-[200px]">{creatorExternalLink}</span>
          </div>
          <a
            href={creatorExternalLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => haptics.selection()}
            className="px-2 py-0.5 bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-200 rounded text-[9px] font-mono font-bold transition-all flex items-center space-x-1 shrink-0"
          >
            <span>Ir</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      )}

      {/* Modal for In-Person Vouch Request */}
      {showVouchModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0b0a10] border border-amber-500/30 rounded-3xl max-w-md w-full p-5 text-white space-y-3 relative shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">Solicitar Aval de Conexión Real</h3>
              </div>
              <button
                onClick={() => setShowVouchModal(false)}
                className="p-1 rounded-full bg-slate-900 text-slate-400 hover:text-white border border-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              Ingresa el alias o código de la pareja VIP con la que compartiste un evento real para solicitar su confirmación.
            </p>

            <form onSubmit={handleRequestVouch} className="space-y-3">
              <div>
                <input
                  type="text"
                  value={vouchCodeInput}
                  onChange={(e) => setVouchCodeInput(e.target.value)}
                  placeholder="Ej. Felipe & Juliana"
                  className="w-full bg-slate-950 border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 font-medium"
                />
              </div>

              {vouchSuccessMsg && (
                <div className="p-2 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 font-medium">
                  {vouchSuccessMsg}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs transition-all cursor-pointer shadow-lg flex items-center justify-center space-x-1.5"
              >
                <Send className="w-3.5 h-3.5 text-slate-950" />
                <span>Enviar Solicitud</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
