export interface AudienceVisibilityState {
  couples: boolean;
  single_females: boolean;
  single_males: boolean;
}

export const MEDIA_GOVERNANCE_CONFIG = {
  VIDEO: {
    MAX_DURATION_SECONDS: 15, // Calibrado para bucle de dopamina y retención
    OPTIMAL_BITRATE_KBPS: 3500, // 3.5 Mbps max
    MAX_FILE_SIZE_MB: 15, // Archivo liviano para descifrado ultrarrápido en RAM
    ASPECT_RATIO: '9:16',
    ALLOWED_MIME_TYPES: ['video/mp4', 'video/webm'],
    CRYPTO_CHUNK_SIZE_KB: 512, // Fragmentación AES-GCM para móviles
  },
  AUDIENCE_SWITCHER: {
    DEFAULT: { couples: true, single_females: true, single_males: false } as AudienceVisibilityState,
    MIN_ACTIVE_AUDIENCES: 1,
    PAUSE_ACTIVE_CHATS_ON_HIDE: true, // Pon los chats en pausa discreta sin destruir el pase pagado
  },
  AGE_VERIFICATION: {
    MIN_LEGAL_AGE: 18,
    AI_CONFIDENCE_THRESHOLD: 0.98,
    PURGE_DOCUMENT_AFTER_VALIDATION_MS: 3000, // Destrucción inmediata de Cédula en RAM
    ALLOW_ACCOUNT_KYC_BYPASS: true, // Si el titular ya verificó Cédula, no se le vuelve a pedir
  }
};
