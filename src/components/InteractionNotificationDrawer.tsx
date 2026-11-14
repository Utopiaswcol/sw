import React, { useState, useEffect } from 'react';
import { X, Bell, Key, Heart, MessageSquare, CheckCircle2 } from 'lucide-react';
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
    setActionFeedback(`${plainName(notif.senderAlias)} ya puede seguir.`);
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
    <div className="fixed inset-0 z-50 flex justify-center bg-black text-white">
      <div className="flex h-full w-full max-w-md flex-col">
        <div className="flex items-start justify-between px-4 pb-3 pt-4">
          <div>
            <h2 className="font-sway text-4xl text-[#d06a45]">Avisos</h2>
            <p className="mt-1 text-sm text-white/60">Lo que llega se queda dentro de SWAY.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-full border border-white/15 p-2 text-[#c4a574]">
            <X className="h-4 w-4" />
          </button>
        </div>

        {actionFeedback && (
          <p className="mx-4 mb-3 rounded-2xl border border-[#c4a574]/40 px-3 py-2 text-sm text-[#c4a574]">{actionFeedback}</p>
        )}

        <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-8">
          {notifications.length === 0 ? (
            <div className="py-16 text-center">
              <Bell className="mx-auto h-6 w-6 text-[#c4a574]" />
              <p className="mt-3 text-sm text-white/60">Todavía no llega nada.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <article key={notif.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-3">
                <div className="flex gap-3">
                  <span className="relative h-12 w-12 shrink-0">
                    <img
                      src={notif.senderAvatar}
                      alt=""
                      onError={(event) => {
                        event.currentTarget.style.display = 'none';
                        const fallback = event.currentTarget.nextElementSibling as HTMLElement | null;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                      className="sway-ring h-12 w-12 rounded-full object-cover"
                    />
                    <span className="sway-ring hidden h-12 w-12 items-center justify-center rounded-full bg-[#3a241c] font-sway text-lg text-[#c4a574]">
                      {plainName(notif.senderAlias).slice(0, 1)}
                    </span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-base">{plainName(notif.senderAlias)}</p>
                      <span className="shrink-0 text-[11px] text-white/40">{notif.timestamp}</span>
                    </div>
                    <p className="mt-1 flex items-center gap-1 text-sm text-white/70">
                      {notif.type === 'KEY_REQUEST' && <Key className="h-3.5 w-3.5 text-[#c4a574]" />}
                      {(notif.type === 'REACTION_LIKE' || notif.type === 'REACTION_FLIRT') && <Heart className="h-3.5 w-3.5 text-[#d06a45]" />}
                      {notif.type === 'CHAT_INVITE' && <MessageSquare className="h-3.5 w-3.5 text-[#c4a574]" />}
                      {noticeText(notif.type)}
                    </p>
                  </div>
                </div>

                {notif.type === 'KEY_REQUEST' && (
                  <div className="mt-3 flex gap-2">
                    {notif.status === 'accepted' ? (
                      <p className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-[#c4a574]/50 py-2 text-sm text-[#c4a574]">
                        <CheckCircle2 className="h-4 w-4" />
                        Aceptado
                      </p>
                    ) : notif.status === 'declined' ? (
                      <p className="w-full rounded-2xl border border-white/10 py-2 text-center text-sm text-white/45">Quedó fuera</p>
                    ) : (
                      <>
                        <button type="button" onClick={() => handleAcceptKey(notif)} className="sway-clay h-10 flex-1 rounded-2xl text-sm">
                          Aceptar
                        </button>
                        <button type="button" onClick={() => handleDeclineKey(notif)} className="h-10 rounded-2xl border border-white/15 px-4 text-sm text-white/70">
                          Ahora no
                        </button>
                      </>
                    )}
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2 text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      onNavigateToTab('explore');
                      onClose();
                    }}
                    className="text-white/60"
                  >
                    Ver en Explorar
                  </button>
                  <button type="button" onClick={() => handleStartChat(notif)} className="text-[#d06a45]">
                    Mensaje
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

function plainName(alias: string) {
  return alias.split('(')[0].replace(/\s+(VIP|Bull)\b/gi, '').trim();
}

function noticeText(type: InteractionNotification['type']) {
  if (type === 'KEY_REQUEST') return 'Pide abrir el álbum. Hace falta que los dos hayan escrito.';
  if (type === 'CHAT_INVITE') return 'Te escribió.';
  return 'Pasó por tu perfil.';
}
