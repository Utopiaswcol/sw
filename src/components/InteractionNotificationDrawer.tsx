import React, { useState, useEffect } from 'react';
import { X, Bell, Key, Heart, Flame, MessageSquare, CheckCircle2, ShieldCheck, UserCheck, Sparkles, Eye, ArrowRight } from 'lucide-react';
import { notificationService, InteractionNotification } from '../services/notificationService';
import { haptics } from '../services/hapticsService';
import { MainAppTab } from './BottomNav';

interface InteractionNotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab: (tab: MainAppTab) => void;
  onSelectChatCandidate?: (candidateId: string, alias: string) => void;
}

export const InteractionNotificationDrawer: React.FC<InteractionNotificationDrawerProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
  onSelectChatCandidate
}) => {
  const [notifications, setNotifications] = useState<InteractionNotification[]>([]);

  useEffect(() => {
    if (isOpen) {
      setNotifications(notificationService.getNotifications());
      notificationService.markAllAsRead();
    }
  }, [isOpen]);

  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAcceptKey = (notif: InteractionNotification) => {
    haptics.success();
    notificationService.updateStatus(notif.id, 'accepted');
    setNotifications(notificationService.getNotifications());
    setActionFeedback(`🔑 ¡Llave de Bóveda concedida para ${notif.senderAlias}! Acceso mutuo activado.`);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleDeclineKey = (notif: InteractionNotification) => {
    haptics.selection();
    notificationService.updateStatus(notif.id, 'declined');
    setNotifications(notificationService.getNotifications());
  };

  const handleStartChat = (notif: InteractionNotification) => {
    haptics.success();
    if (onSelectChatCandidate) {
      onSelectChatCandidate(notif.senderId, notif.senderAlias);
    }
    onNavigateToTab('chat');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#090a10] h-full border-l border-white/10 flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-[#0d0e17] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-1.5">
                Bandeja de Interacción
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Me Gusta, Conexiones &amp; Llaves Privadas
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {actionFeedback && (
          <div className="p-3 bg-emerald-950/90 border-b border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* Quiet In-App Reassurance Banner */}
        <div className="p-3 bg bg-gradient-to-r from-amber-950/40 via-slate-900 to-rose-950/40 border-b border-amber-500/20 text-xs space-y-1">
          <div className="flex items-center space-x-1.5 text-amber-300 font-bold">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span>100% Privado Dentro de la App</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-snug">
            Sin avisos ni alertas emergentes en tu celular. Las notificaciones solo son visibles cuando abres la aplicación.
          </p>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
                <Bell className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-400">No tienes notificaciones pendientes por ahora.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                  notif.status === 'accepted'
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : notif.type === 'KEY_REQUEST'
                    ? 'bg-[#0f101a] border-amber-500/40 shadow-lg'
                    : 'bg-[#0e0f18] border-white/10'
                }`}
              >
                <div className="flex items-start space-x-3">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <img
                      src={notif.senderAvatar}
                      alt={notif.senderAlias}
                      className="w-11 h-11 rounded-2xl object-cover border border-white/20"
                    />
                    <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-slate-950 border border-white/20">
                      {notif.type === 'KEY_REQUEST' && <Key className="w-3 h-3 text-amber-400" />}
                      {notif.type === 'REACTION_FLIRT' && <Flame className="w-3 h-3 text-rose-500" />}
                      {notif.type === 'REACTION_LIKE' && <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />}
                      {notif.type === 'CHAT_INVITE' && <MessageSquare className="w-3 h-3 text-purple-400" />}
                    </div>
                  </div>

                  {/* Body Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white truncate">{notif.senderAlias}</h4>
                      <span className="text-[10px] text-slate-500 font-mono">{notif.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug mt-0.5">
                      {notif.message}
                    </p>
                  </div>
                </div>

                {/* Actions for Key Request */}
                {notif.type === 'KEY_REQUEST' && (
                  <div className="pt-1 flex items-center gap-2">
                    {notif.status === 'accepted' ? (
                      <div className="w-full py-2 bg-emerald-950/80 border border-emerald-700/80 rounded-xl text-center text-xs font-mono font-bold text-emerald-300 flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Llave Intercambiada Exitosamente</span>
                      </div>
                    ) : notif.status === 'declined' ? (
                      <div className="w-full py-2 bg-slate-900 border border-slate-800 rounded-xl text-center text-xs font-mono text-slate-400">
                        Solicitud Rechazada
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleAcceptKey(notif)}
                          className="flex-1 py-2 bg-gradient-to-r from-amber-500 to-rose-600 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center space-x-1"
                        >
                          <Key className="w-3.5 h-3.5 text-amber-300" />
                          <span>Aceptar Llave</span>
                        </button>

                        <button
                          onClick={() => handleDeclineKey(notif)}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                        >
                          Declinar
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* Direct Action Buttons for All */}
                <div className="flex items-center justify-between border-t border-white/5 pt-2 text-[11px]">
                  <button
                    onClick={() => {
                      onNavigateToTab('explore');
                      onClose();
                    }}
                    className="text-slate-400 hover:text-white flex items-center space-x-1 font-mono font-bold cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    <span>Ver Perfil</span>
                  </button>

                  <button
                    onClick={() => handleStartChat(notif)}
                    className="text-amber-400 hover:text-amber-300 font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <span>Abrir Chat Efímero</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Info */}
        <div className="p-3 bg-[#07070c] border-t border-white/10 text-center">
          <p className="text-[10px] text-slate-500 font-mono">
            Interacciones 100% Discretas &amp; Cifradas • Aethel Vault ENM Colombia
          </p>
        </div>
      </div>
    </div>
  );
};
