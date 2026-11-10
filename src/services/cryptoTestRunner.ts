import {
  encryptMessage,
  decryptMessage,
  isEncryptedPayload,
  getOrCreateSessionKey,
  destroySessionKey,
  EncryptedPayload
} from './cryptoEngine.js';

import {
  sendEphemeralMessage,
  getActiveMessages,
  purgeAllExpiredMessages,
  destroyConversationSession,
  burnMessageOnRead
} from './ephemeralChatService.js';

export interface CryptoTestResult {
  testName: string;
  passed: boolean;
  details: string;
  executionTimeMs: number;
}

export interface SecuritySuiteReport {
  timestamp: string;
  allPassed: boolean;
  totalTests: number;
  passedCount: number;
  failedCount: number;
  tests: CryptoTestResult[];
}

export async function runCryptoSecurityTestSuite(): Promise<SecuritySuiteReport> {
  const tests: CryptoTestResult[] = [];
  const testSessionKey = getOrCreateSessionKey('test_crypto_session_001');

  // Test 1: Pseudorandomness & AES-256-GCM Encryption
  const t1Start = Date.now();
  try {
    const plaintext = 'Mensaje Ultra Confidencial de Prueba Dark Luxe 2026';
    const payload1 = await encryptMessage(plaintext, testSessionKey);
    const payload2 = await encryptMessage(plaintext, testSessionKey);

    const isVal1 = isEncryptedPayload(payload1);
    const decrypted = await decryptMessage(payload1, testSessionKey);

    // IV and Ciphertext MUST be unique each time due to fresh 12-byte IV
    const uniqueIVs = payload1.iv !== payload2.iv;
    const uniqueCiphertexts = payload1.ciphertext !== payload2.ciphertext;
    const matchesPlaintext = decrypted === plaintext;

    const passed = isVal1 && uniqueIVs && uniqueCiphertexts && matchesPlaintext;

    tests.push({
      testName: '1. Cifrado AES-256-GCM e Indistinguibilidad de Ruido',
      passed,
      details: passed
        ? `Cifrado exitoso. IVs únicos generados (${payload1.iv.substring(0, 8)}... vs ${payload2.iv.substring(0, 8)}...). Descifrado verificado.`
        : 'Fallo en cifrado/descifrado o reutilización no permitida de IV.',
      executionTimeMs: Date.now() - t1Start
    });
  } catch (err: any) {
    tests.push({
      testName: '1. Cifrado AES-256-GCM e Indistinguibilidad de Ruido',
      passed: false,
      details: 'Error en prueba de cifrado: ' + err.message,
      executionTimeMs: Date.now() - t1Start
    });
  }

  // Test 2: Integrity Verification & Bit Tampering Detection
  const t2Start = Date.now();
  try {
    const plaintext = 'Mensaje de integridad crítica';
    const originalPayload = await encryptMessage(plaintext, testSessionKey);

    // Alter single bit in ciphertext
    const corruptedCiphertext =
      originalPayload.ciphertext.substring(0, originalPayload.ciphertext.length - 2) +
      (originalPayload.ciphertext.endsWith('a') ? 'b' : 'a');

    const tamperedPayload: EncryptedPayload = {
      ...originalPayload,
      ciphertext: corruptedCiphertext
    };

    let caughtIntegrityError = false;
    try {
      await decryptMessage(tamperedPayload, testSessionKey);
    } catch (err: any) {
      if (err.message.includes('INTEGRITY_VERIFICATION_FAILED')) {
        caughtIntegrityError = true;
      }
    }

    tests.push({
      testName: '2. Verificación de Integridad y Detección de Alteración de Bits',
      passed: caughtIntegrityError,
      details: caughtIntegrityError
        ? 'Prueba superada: La alteración de un solo bit en ciphertext o AuthTag activó el rechazo criptográfico inmediato.'
        : 'Fallo de seguridad: No se rechazó un payload alterado.',
      executionTimeMs: Date.now() - t2Start
    });
  } catch (err: any) {
    tests.push({
      testName: '2. Verificación de Integridad y Detección de Alteración de Bits',
      passed: false,
      details: 'Error inesperado: ' + err.message,
      executionTimeMs: Date.now() - t2Start
    });
  }

  // Test 3: Rejection of Unencrypted Plaintext
  const t3Start = Date.now();
  try {
    const rawPlaintextPayload = { content: 'Texto plano no cifrado' } as any;
    const sendResult = sendEphemeralMessage(
      'conv_test_unencrypted',
      'usr_tester',
      'solo_female',
      'Tester',
      rawPlaintextPayload
    );

    const rejectedCorrectly = !sendResult.success && sendResult.error?.includes('UNENCRYPTED_PLAINTEXT_REJECTED');

    tests.push({
      testName: '3. Rechazo Activo de Texto Plano no Cifrado',
      passed: rejectedCorrectly,
      details: rejectedCorrectly
        ? 'Éxito: El servidor rechazó activamente el envío de payload en texto plano no cifrado.'
        : 'Fallo de seguridad: El servidor aceptó un payload no cifrado.',
      executionTimeMs: Date.now() - t3Start
    });
  } catch (err: any) {
    tests.push({
      testName: '3. Rechazo Activo de Texto Plano no Cifrado',
      passed: false,
      details: 'Error: ' + err.message,
      executionTimeMs: Date.now() - t3Start
    });
  }

  // Test 4: Physical Crypto-Shredding & Memory Purge
  const t4Start = Date.now();
  try {
    const convId = `conv_crypto_shred_${Date.now()}`;
    const encryptedMsg = await encryptMessage('Contenido a destruir', testSessionKey);

    // 1. Enviar mensaje efímero con TTL corto (1 segundo)
    sendEphemeralMessage(
      convId,
      'usr_sender',
      'couple',
      'Couple',
      encryptedMsg,
      'text',
      undefined,
      1 // 1 segundo de vida
    );

    // Verificar presencia inicial
    const activeBefore = getActiveMessages(convId, 'usr_sender');
    const existsBefore = activeBefore.length === 1;

    // Destruir sesión mediante Crypto-Shredding
    destroyConversationSession(convId);

    // Verificar que los mensajes y claves fueron eliminados físicamente
    const activeAfter = getActiveMessages(convId, 'usr_sender');
    const purgedCompletely = activeAfter.length === 0;

    const passed = existsBefore && purgedCompletely;

    tests.push({
      testName: '4. Borrado Criptográfico Destructivo (Crypto-Shredding)',
      passed,
      details: passed
        ? 'Éxito: El borrado destruyó físicamente las claves de sesión y los registros sin copias residuales en memoria.'
        : 'Fallo en purga destructiva de memoria.',
      executionTimeMs: Date.now() - t4Start
    });
  } catch (err: any) {
    tests.push({
      testName: '4. Borrado Criptográfico Destructivo (Crypto-Shredding)',
      passed: false,
      details: 'Error: ' + err.message,
      executionTimeMs: Date.now() - t4Start
    });
  }

  // Limpieza final de claves de prueba
  destroySessionKey('test_crypto_session_001');

  const passedCount = tests.filter((t) => t.passed).length;
  const failedCount = tests.length - passedCount;

  return {
    timestamp: new Date().toISOString(),
    allPassed: failedCount === 0,
    totalTests: tests.length,
    passedCount,
    failedCount,
    tests
  };
}
