import { useState, useEffect, useRef, useCallback } from 'react';

export type PresenceMode = 'active_now' | 'recently_active' | 'invisible';

export interface VaultSignalEvent {
  type: 'VAULT_KEY_REQUESTED' | 'VAULT_KEY_GRANTED' | 'VAULT_KEY_REVOKED';
  conversationId: string;
  payload: {
    grantorUserId?: string;
    targetUserId?: string;
    vaultMediaId?: string;
    timestamp?: string;
  };
}

export interface UseRealtimeSocketProps {
  userId: string;
  conversationId?: string;
  autoConnect?: boolean;
}

export function useRealtimeSocket({
  userId,
  conversationId,
  autoConnect = true
}: UseRealtimeSocketProps) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [presenceMode, setPresenceMode] = useState<PresenceMode>('active_now');
  const [presenceLabel, setPresenceLabel] = useState<string>('Activo en sesión');
  const [latestVaultSignal, setLatestVaultSignal] = useState<VaultSignalEvent | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);

  const connectSocket = useCallback(() => {
    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;

        // Autenticación por Ticket/UserId
        socket.send(
          JSON.stringify({
            type: 'AUTH',
            userId,
            payload: { mode: presenceMode }
          })
        );

        // Suscribirse a la sala si hay conversationId
        if (conversationId) {
          socket.send(
            JSON.stringify({
              type: 'JOIN_ROOM',
              conversationId
            })
          );
        }
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'AUTH_SUCCESS') {
            setIsConnected(true);
          } else if (data.type === 'PRESENCE_UPDATE') {
            if (data.payload?.statusLabel) {
              setPresenceLabel(data.payload.statusLabel);
            }
          } else if (
            data.type === 'VAULT_KEY_REQUESTED' ||
            data.type === 'VAULT_KEY_GRANTED' ||
            data.type === 'VAULT_KEY_REVOKED'
          ) {
            setLatestVaultSignal(data);
          } else if (data.type === 'CHAT_MESSAGE') {
            setUnreadCount((prev) => prev + 1);
          }
        } catch (e) {
          console.warn('Error recibiendo mensaje WS:', e);
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
        attemptReconnect();
      };

      socket.onerror = () => {
        setIsConnected(false);
      };
    } catch (err) {
      console.warn('Fallo abriendo conexión WebSocket:', err);
      attemptReconnect();
    }
  }, [userId, conversationId, presenceMode]);

  const attemptReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);

    if (reconnectAttemptsRef.current < 5) {
      const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
      reconnectAttemptsRef.current += 1;
      reconnectTimeoutRef.current = setTimeout(() => {
        connectSocket();
      }, delay);
    }
  }, [connectSocket]);

  // Cambiar modo de presencia ("active_now" | "recently_active" | "invisible")
  const updatePresenceMode = useCallback((mode: PresenceMode) => {
    setPresenceMode(mode);
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'PRESENCE_UPDATE',
          payload: { mode }
        })
      );
    }
  }, []);

  // Enviar evento de señalización de bóveda
  const sendVaultSignal = useCallback(
    (
      type: 'VAULT_KEY_REQUESTED' | 'VAULT_KEY_GRANTED' | 'VAULT_KEY_REVOKED',
      targetConvId: string,
      payload: any
    ) => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type,
            conversationId: targetConvId,
            payload
          })
        );
      }
    },
    []
  );

  // Manejo de visibilidad de ventana para desconexión limpia en segundo plano
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (socketRef.current) {
          socketRef.current.close();
        }
      } else if (autoConnect) {
        connectSocket();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [autoConnect, connectSocket]);

  useEffect(() => {
    if (autoConnect) {
      connectSocket();
    }

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [autoConnect, connectSocket]);

  return {
    isConnected,
    presenceMode,
    presenceLabel,
    latestVaultSignal,
    unreadCount,
    setUnreadCount,
    updatePresenceMode,
    sendVaultSignal,
    reconnect: connectSocket
  };
}
