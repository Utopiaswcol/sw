export interface EncryptedPayload {
  ciphertext: string; // Hex representation of encrypted data
  iv: string;         // Hex representation of 12-byte IV
  authTag: string;    // Hex representation of 16-byte GCM AuthTag
  algorithm: 'AES-256-GCM';
  timestamp: number;
}

// Almacén de claves de sesión efímeras por conversación (Destrucción en memoria)
const sessionKeyMap = new Map<string, string>();

/**
 * Convierte Uint8Array a cadena Hexadecimal
 */
export function bufferToHex(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convierte cadena Hexadecimal a Uint8Array
 */
export function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Deriva una clave AES-256-GCM de 256 bits a partir de un secreto y salt usando PBKDF2 (WebCrypto API)
 */
export async function deriveKey(secretKey: string, saltStr: string = 'e2ee_dark_luxe_salt'): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const secretBuffer = encoder.encode(secretKey);
  const saltBuffer = encoder.encode(saltStr);

  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('CRITICAL_CRYPTO_ERROR: Web Crypto API no está disponible en este entorno.');
  }

  const baseKey = await subtle.importKey(
    'raw',
    secretBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Cifra un texto plano usando AES-256-GCM e IV único de 12 bytes
 */
export async function encryptMessage(
  plaintext: string,
  secretKey: string
): Promise<EncryptedPayload> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('CRITICAL_CRYPTO_ERROR: Web Crypto API no está disponible.');
  }

  const key = await deriveKey(secretKey);
  const encoder = new TextEncoder();
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12)); // 96 bits GCM IV

  const encryptedBuffer = await subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  );

  const fullBytes = new Uint8Array(encryptedBuffer);
  // En WebCrypto AES-GCM, los últimos 16 bytes corresponden al AuthTag
  const ciphertextBytes = fullBytes.slice(0, fullBytes.length - 16);
  const authTagBytes = fullBytes.slice(fullBytes.length - 16);

  return {
    ciphertext: bufferToHex(ciphertextBytes),
    iv: bufferToHex(iv),
    authTag: bufferToHex(authTagBytes),
    algorithm: 'AES-256-GCM',
    timestamp: Date.now()
  };
}

/**
 * Descifra un payload cifrado AES-256-GCM verificando su integridad (AuthTag)
 */
export async function decryptMessage(
  payload: EncryptedPayload,
  secretKey: string
): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('CRITICAL_CRYPTO_ERROR: Web Crypto API no está disponible.');
  }

  if (!payload || !payload.ciphertext || !payload.iv || !payload.authTag) {
    throw new Error('INVALID_PAYLOAD_FORMAT: Faltan componentes obligatorios en el payload cifrado.');
  }

  const key = await deriveKey(secretKey);
  const iv = hexToBuffer(payload.iv);
  const ciphertextBytes = hexToBuffer(payload.ciphertext);
  const authTagBytes = hexToBuffer(payload.authTag);

  // Reconstruir el buffer completo [ciphertext + authTag] requerido por WebCrypto
  const fullBytes = new Uint8Array(ciphertextBytes.length + authTagBytes.length);
  fullBytes.set(ciphertextBytes, 0);
  fullBytes.set(authTagBytes, ciphertextBytes.length);

  try {
    const decryptedBuffer = await subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      fullBytes
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (err) {
    throw new Error('INTEGRITY_VERIFICATION_FAILED: Descifrado fallido. El mensaje ha sido alterado o la clave de sesión es inválida.');
  }
}

/**
 * Genera o recupera una clave de sesión efímera por conversación
 */
export function getOrCreateSessionKey(conversationId: string): string {
  let sessionKey = sessionKeyMap.get(conversationId);
  if (!sessionKey) {
    // Generar 32 bytes (256 bits) aleatorios
    const randomBytes = globalThis.crypto.getRandomValues(new Uint8Array(32));
    sessionKey = bufferToHex(randomBytes);
    sessionKeyMap.set(conversationId, sessionKey);
  }
  return sessionKey;
}

/**
 * Destruye físicamente la clave de sesión en memoria (Crypto-Shredding)
 */
export function destroySessionKey(conversationId: string): boolean {
  return sessionKeyMap.delete(conversationId);
}

/**
 * Verifica si un objeto o string califica como un payload cifrado válido
 */
export function isEncryptedPayload(data: any): boolean {
  if (!data || typeof data !== 'object') return false;
  return (
    typeof data.ciphertext === 'string' &&
    typeof data.iv === 'string' &&
    typeof data.authTag === 'string' &&
    data.ciphertext.length > 0 &&
    data.iv.length === 24 && // 12 bytes hex = 24 chars
    data.authTag.length === 32 // 16 bytes hex = 32 chars
  );
}
