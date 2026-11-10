import crypto from 'crypto';

const MEDIA_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.MEDIA_SECRET_KEY || 'secret_vault_key_enm_colombia_2026';

export interface TokenPayload {
  mediaId: string;
  viewerId: string;
  expiresAt: number;
  ipHash: string;
}

export interface SignedTokenResult {
  token: string;
  signature: string;
  expiresAt: number;
  expiresInSeconds: number;
  signedUrl: string;
}

/**
 * Servicio 2: Tokens HMAC-SHA256 y URLs Firmadas con Expiración Corta (TTL 60s).
 */
export function generateSecureMediaToken(
  mediaId: string,
  viewerId: string,
  ipHash: string = '0.0.0.0',
  ttlSeconds: number = 60
): SignedTokenResult {
  const expiresAt = Date.now() + ttlSeconds * 1000;

  const payload: TokenPayload = {
    mediaId,
    viewerId,
    expiresAt,
    ipHash
  };

  const jsonPayloadStr = JSON.stringify(payload);
  const base64Payload = Buffer.from(jsonPayloadStr).toString('base64url');

  // Firma Criptográfica HMAC-SHA256
  const signature = crypto
    .createHmac('sha256', MEDIA_SECRET)
    .update(base64Payload)
    .digest('hex');

  const token = `${base64Payload}.${signature}`;
  const signedUrl = `/api/media/view/${mediaId}?token=${token}&viewerId=${viewerId}`;

  return {
    token,
    signature,
    expiresAt,
    expiresInSeconds: ttlSeconds,
    signedUrl
  };
}

/**
 * Valida la autenticidad, vigencia y destinatario de un token de visualización.
 */
export function verifySecureMediaToken(
  tokenString: string,
  expectedViewerId: string,
  currentIpHash: string = '0.0.0.0'
): { valid: boolean; error?: string; payload?: TokenPayload } {
  if (!tokenString || !tokenString.includes('.')) {
    return { valid: false, error: 'Formato de token de visualización inválido.' };
  }

  const [base64Payload, signature] = tokenString.split('.');

  // 1. Verificar firma HMAC-SHA256
  const expectedSignature = crypto
    .createHmac('sha256', MEDIA_SECRET)
    .update(base64Payload)
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return { valid: false, error: 'Firma HMAC del token manipulada o no autorizada.' };
  }

  // 2. Decodificar payload
  let payload: TokenPayload;
  try {
    const jsonStr = Buffer.from(base64Payload, 'base64url').toString('utf-8');
    payload = JSON.parse(jsonStr);
  } catch (err) {
    return { valid: false, error: 'No se pudo decodificar la carga útil del token.' };
  }

  // 3. Verificar expiración TTL
  if (Date.now() > payload.expiresAt) {
    return { valid: false, error: 'El token de visualización temporal ha expirado (TTL exedido).' };
  }

  // 4. Verificar vinculación con el usuario espectador
  if (payload.viewerId !== expectedViewerId) {
    return { valid: false, error: 'El token no pertenece al usuario que solicita la visualización.' };
  }

  return { valid: true, payload };
}
