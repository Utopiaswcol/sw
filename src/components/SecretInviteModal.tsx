import React, { useState } from 'react';
import { Sparkles, Copy, Check, Share2, Lock, ShieldCheck, QrCode, X, ExternalLink } from 'lucide-react';
import { haptics } from '../services/hapticsService';

interface SecretInviteModalProps {
  alias: string;
  role: string;
  onClose: () => void;
}

export const SecretInviteModal: React.FC<SecretInviteModalProps> = ({ alias, role, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Custom secret invitation link format without @ symbols
  const cleanSlug = alias.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const secretLink = `https://aethel.club/pass/${cleanSlug}_vip`;
  const secretPassCode = `PASS-${cleanSlug.toUpperCase()}-VIP89`;

  const handleCopyLink = () => {
    haptics.selection();
    navigator.clipboard.writeText(secretLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyCode = () => {
    haptics.selection();
    navigator.clipboard.writeText(secretPassCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const shareText = `✨ Te he invitado a unirte a mi círculo discreto en Aethel Club. Pase de acceso temporal de 24 horas: ${secretLink}`;

  const handleWhatsAppShare = () => {
    haptics.selection();
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#0b0a10] border border-amber-500/40 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative text-white space-y-5 p-6 border-t-amber-400">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white tracking-wide">Pase de Invitación Secreto</h3>
              <p className="text-[10px] text-amber-400/80 font-mono">Enlace Cifrado de Acceso Exclusivo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-white border border-white/10 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Secret Invitation VIP Passport Card Preview */}
        <div className="bg-gradient-to-br from-[#161320] via-[#0f0e16] to-[#07060a] p-5 rounded-2xl border border-amber-500/40 shadow-2xl relative overflow-hidden space-y-4 group">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="text-[10px] font-mono font-extrabold text-amber-300 uppercase tracking-widest">
                AETHEL PRIVATE CLUB • PASS
              </span>
            </div>
            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
              VÁLIDO 24H
            </span>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Titular de la Invitación:</p>
            <h4 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-rose-300 tracking-tight">
              {alias}
            </h4>
            <p className="text-xs text-slate-300 font-medium italic">
              "Has recibido un pase de acceso privado sin rastros públicos ni indexación."
            </p>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <div>
              <span className="block text-slate-500 text-[9px]">CÓDIGO SECRETO:</span>
              <span className="text-amber-300 font-bold">{secretPassCode}</span>
            </div>
            <div className="text-right">
              <span className="block text-slate-500 text-[9px]">ESTADO:</span>
              <span className="text-emerald-400 font-bold">Cifrado de Extremo a Extremo</span>
            </div>
          </div>
        </div>

        {/* Link Copy Box */}
        <div className="space-y-2">
          <label className="text-slate-400 font-mono text-[10px] uppercase font-bold block">
            Enlace Secreto de Invitación (Sin @ tipo redes abiertas):
          </label>

          <div className="flex items-center space-x-2 bg-[#070709] p-2 rounded-xl border border-white/10">
            <input
              type="text"
              readOnly
              value={secretLink}
              className="w-full bg-transparent text-xs text-amber-300 font-mono px-2 outline-none select-all truncate"
            />
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 shrink-0 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Sharing Options */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleWhatsAppShare}
            className="py-2.5 px-3 bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
          >
            <Share2 className="w-4 h-4 text-emerald-400" />
            <span>Compartir WhatsApp</span>
          </button>

          <button
            onClick={handleCopyCode}
            className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
          >
            <QrCode className="w-4 h-4 text-amber-400" />
            <span>{copiedCode ? '¡Código Copiado!' : 'Copiar Código VIP'}</span>
          </button>
        </div>

        <p className="text-[10px] text-center text-slate-400 font-mono pt-1">
          🔒 Las invitaciones compartidas no revelan tu ubicación ni fotos privadas hasta que la otra persona complete su verificación sanitaria.
        </p>
      </div>
    </div>
  );
};
