import { EncryptedPayload, destroySessionKey, isEncryptedPayload } from './cryptoEngine.js';

export interface EphemeralMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: 'solo_male' | 'solo_female' | 'couple';
  senderAlias: string;
  encryptedPayload: EncryptedPayload;
  type: 'text' | 'vault_request' | 'vault_granted' | 'vault_media';
  mediaId?: string;
  expiresAt: number; // Unix timestamp ms
  ttlSeconds: number;
  isBurned: boolean;
  createdAt: string;
}

export interface ReciprocalVaultState {
  conversationId: string;
  userA: string;
  userB: string;
  userAGrantedToB: boolean;
  userBGrantedToA: boolean;
  isReciprocalUnlocked: boolean;
  updatedAt: string;
}

// Almacén en memoria efímera de mensajes cifrados (Cero Persistencia de Texto Plano)
const conversationMessagesStore = new Map<string, EphemeralMessage[]>();
const reciprocalVaultsStore = new Map<string, ReciprocalVaultState>();

/**
 * 1. Generar o Recuperar Estado de Consentimiento Recíproco de Bóveda
 */
export function getReciprocalVaultStatus(
  conversationId: string,
  userA: string,
  userB: string
): ReciprocalVaultState {
  let state = reciprocalVaultsStore.get(conversationId);
  if (!state) {
    state = {
      conversationId,
      userA,
      userB,
      userAGrantedToB: false,
      userBGrantedToA: false,
      isReciprocalUnlocked: false,
      updatedAt: new Date().toISOString()
    };
    reciprocalVaultsStore.set(conversationId, state);
  }
  return state;
}

/**
 * 2. Otorgar Consentimiento en el Protocolo Recíproco
 */
export function grantReciprocalVaultConsent(
  conversationId: string,
  grantorUserId: string,
  targetUserId: string
): ReciprocalVaultState {
  const state = getReciprocalVaultStatus(conversationId, grantorUserId, targetUserId);

  if (grantorUserId === state.userA) {
    state.userAGrantedToB = true;
  } else {
    state.userBGrantedToA = true;
  }

  // Se desbloquea cuando ambos han aceptado explícitamente
  state.isReciprocalUnlocked = state.userAGrantedToB && state.userBGrantedToA;
  state.updatedAt = new Date().toISOString();

  reciprocalVaultsStore.set(conversationId, state);
  return state;
}

/**
 * 3. Enviar Mensaje Efímero Cifrado con TTL de Autodestrucción
 * Rechaza activamente cualquier intento de enviar texto plano.
 */
export function sendEphemeralMessage(
  conversationId: string,
  senderId: string,
  senderRole: 'solo_male' | 'solo_female' | 'couple',
  senderAlias: string,
  encryptedPayload: EncryptedPayload,
  type: 'text' | 'vault_request' | 'vault_granted' | 'vault_media' = 'text',
  mediaId?: string,
  ttlSeconds: number = 86400 // Default 24 horas (o burn-on-read)
): { success: boolean; message?: EphemeralMessage; error?: string } {
  // Verificación estricta anti-texto plano
  if (!isEncryptedPayload(encryptedPayload)) {
    return {
      success: false,
      error: 'UNENCRYPTED_PLAINTEXT_REJECTED: El mensaje enviado no está cifrado con AES-256-GCM. Rechazo en capa de aplicación.'
    };
  }

  // Validación de Protocolo Recíproco para Envío de Fotos de Bóveda
  if (type === 'vault_media') {
    if (senderRole === 'solo_male') {
      const parts = conversationId.split('_vs_');
      const targetUser = parts.find((p) => p !== senderId) || 'target_user';
      const status = getReciprocalVaultStatus(conversationId, senderId, targetUser);

      if (!status.isReciprocalUnlocked) {
        return {
          success: false,
          error:
            'PROTOCOL_VIOLATION: Se requiere que ambas partes acepten la Llave de Intercambio Recíproco de Bóveda antes de compartir imágenes privadas.'
        };
      }
    }
  }

  const expiresAt = Date.now() + ttlSeconds * 1000;
  const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const newMessage: EphemeralMessage = {
    id: msgId,
    conversationId,
    senderId,
    senderRole,
    senderAlias,
    encryptedPayload,
    type,
    mediaId,
    expiresAt,
    ttlSeconds,
    isBurned: false,
    createdAt: new Date().toISOString()
  };

  const existingList = conversationMessagesStore.get(conversationId) || [];
  existingList.push(newMessage);
  conversationMessagesStore.set(conversationId, existingList);

  return {
    success: true,
    message: newMessage
  };
}

/**
 * 4. Obtener Mensajes Activos de la Conversación (Purga Destructiva Inmediata)
 */
export function getActiveMessages(conversationId: string, viewerUserId: string): EphemeralMessage[] {
  const allMessages = conversationMessagesStore.get(conversationId) || [];
  const now = Date.now();

  // Eliminar físicamente los caducados o quemados (Crypto-Shredding)
  const activeMessages = allMessages.filter((msg) => !msg.isBurned && msg.expiresAt > now);

  if (activeMessages.length === 0) {
    conversationMessagesStore.delete(conversationId);
  } else {
    conversationMessagesStore.set(conversationId, activeMessages);
  }

  return activeMessages;
}

/**
 * 5. Marcar mensaje como Leído y Autodestruido Físicamente (Burn-On-Read)
 */
export function burnMessageOnRead(conversationId: string, messageId: string): { success: boolean; purged: boolean } {
  const messages = conversationMessagesStore.get(conversationId) || [];
  const remaining = messages.filter((m) => m.id !== messageId);
  
  if (remaining.length === 0) {
    conversationMessagesStore.delete(conversationId);
  } else {
    conversationMessagesStore.set(conversationId, remaining);
  }

  return { success: true, purged: true };
}

/**
 * 6. Tarea de Purga Global Destructiva (Crypto-Shredding)
 * Elimina físicamente registros expirados y destruye claves de sesión huérfanas
 */
export function purgeAllExpiredMessages(): { purgedCount: number; activeConversations: number } {
  const now = Date.now();
  let purgedCount = 0;

  for (const [convId, messages] of conversationMessagesStore.entries()) {
    const validMessages = messages.filter((m) => !m.isBurned && m.expiresAt > now);
    const removedInConv = messages.length - validMessages.length;
    purgedCount += removedInConv;

    if (validMessages.length === 0) {
      conversationMessagesStore.delete(convId);
      destroySessionKey(convId);
    } else {
      conversationMessagesStore.set(convId, validMessages);
    }
  }

  return {
    purgedCount,
    activeConversations: conversationMessagesStore.size
  };
}

/**
 * 7. Destruir Conversación y Claves de Sesión (Crypto-Shredding bajo demanda)
 */
export function destroyConversationSession(conversationId: string): { success: boolean; purged: boolean } {
  const existed = conversationMessagesStore.has(conversationId);
  conversationMessagesStore.delete(conversationId);
  destroySessionKey(conversationId);
  reciprocalVaultsStore.delete(conversationId);

  return {
    success: true,
    purged: existed
  };
}

// Ejecución periódica automática del Crypto-Shredding cada 30 segundos
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    purgeAllExpiredMessages();
  }, 30000);
}
