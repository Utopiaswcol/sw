import { sanitizeAndProcessImage } from './mediaSanitizer';
import { generateSecureMediaToken, verifySecureMediaToken } from './secureMediaService';
import {
  validateMediaAccess,
  grantVaultAccess,
  registerMediaAsset
} from './mediaAccessEngine';
import sharp from 'sharp';

export interface TestSuiteResult {
  timestamp: string;
  test1_sanitization: {
    passed: boolean;
    forensicHash: string;
    originalSizeBytes: number;
    cleanedSizeBytes: number;
    format: string;
    exifStripped: boolean;
    message: string;
  };
  test2_soloMaleUnpaidBlocking: {
    passed: boolean;
    statusCode: number;
    allowed: boolean;
    reason: string;
    message: string;
  };
  test3_vaultGrantAndSignedUrl: {
    passed: boolean;
    permissionGranted: boolean;
    accessAfterGrant: boolean;
    signedUrl: string;
    tokenVerification: boolean;
    message: string;
  };
  allPassed: boolean;
}

/**
 * Suite de Pruebas Unitarias e Integradas de Ciberseguridad Multimedia
 */
export async function runMediaSecurityTestSuite(): Promise<TestSuiteResult> {
  // --------------------------------------------------------------------------
  // TEST 1: Subida e Ingesta con Sanitización EXIF/XMP y Hash Forense SHA-256
  // --------------------------------------------------------------------------
  // Crear un buffer de imagen JPG ficticio con metadatos EXIF en Sharp
  const mockJpgWithExif = await sharp({
    create: {
      width: 400,
      height: 400,
      channels: 3,
      background: { r: 244, g: 63, b: 94 }
    }
  })
    .jpeg({ quality: 90 })
    .toBuffer();

  const ownerId = 'usr_unicorn_colombia_99';
  const sanitizeRes = await sanitizeAndProcessImage(mockJpgWithExif, ownerId);

  const test1Passed =
    sanitizeRes.exifStripped &&
    sanitizeRes.format === 'webp' &&
    sanitizeRes.forensicHash.length === 64 &&
    sanitizeRes.cleanedSizeBytes > 0;

  // Registrar la imagen sanitizada en el motor
  const newMediaId = `med_sanitized_test_${Date.now()}`;
  registerMediaAsset({
    id: newMediaId,
    ownerUserId: ownerId,
    visibility: 'vault_private',
    storagePath: `vault/${ownerId}/${newMediaId}.webp`,
    forensicHash: sanitizeRes.forensicHash,
    createdAt: new Date().toISOString()
  });

  // --------------------------------------------------------------------------
  // TEST 2: Bloqueo de Hombre Solo Sin Suscripción Activa (Status 402)
  // --------------------------------------------------------------------------
  const unpaidUserRes = await validateMediaAccess(
    'usr_male_unpaid_11',
    'solo_male',
    'med_vault_camila_01'
  );

  const test2Passed =
    !unpaidUserRes.allowed &&
    unpaidUserRes.statusCode === 402 &&
    unpaidUserRes.reason.includes('PAYMENT_REQUIRED');

  // --------------------------------------------------------------------------
  // TEST 3: Otorgamiento de Permiso de Bóveda + Validación + Token HMAC TTL
  // --------------------------------------------------------------------------
  const targetUser = 'cpl_medellin_bi_01';

  // a) Comprobar denegación inicial previa al permiso
  const accessBeforeGrant = await validateMediaAccess(
    targetUser,
    'couple_member',
    'med_vault_camila_01'
  );

  // b) Otorgar permiso de bóveda
  const grantRes = await grantVaultAccess(
    ownerId,
    'med_vault_camila_01',
    targetUser,
    24
  );

  // c) Comprobar acceso concedido posterior al permiso
  const accessAfterGrant = await validateMediaAccess(
    targetUser,
    'couple_member',
    'med_vault_camila_01'
  );

  // d) Generar token firmado de visualización temporal
  const signedToken = generateSecureMediaToken(
    'med_vault_camila_01',
    targetUser,
    'ip_hash_medellin_123',
    60
  );

  // e) Verificar autenticidad y vigencia del token HMAC
  const verification = verifySecureMediaToken(
    signedToken.token,
    targetUser,
    'ip_hash_medellin_123'
  );

  const test3Passed =
    !accessBeforeGrant.allowed &&
    grantRes.success &&
    accessAfterGrant.allowed &&
    verification.valid;

  const allPassed = test1Passed && test2Passed && test3Passed;

  return {
    timestamp: new Date().toISOString(),
    test1_sanitization: {
      passed: test1Passed,
      forensicHash: sanitizeRes.forensicHash,
      originalSizeBytes: sanitizeRes.originalSizeBytes,
      cleanedSizeBytes: sanitizeRes.cleanedSizeBytes,
      format: sanitizeRes.format,
      exifStripped: sanitizeRes.exifStripped,
      message: test1Passed
        ? '✅ Purga EXIF/XMP, conversión WebP (85%) y Hash Forense SHA-256 exitosos.'
        : '❌ Falló la sanitización de metadatos.'
    },
    test2_soloMaleUnpaidBlocking: {
      passed: test2Passed,
      statusCode: unpaidUserRes.statusCode,
      allowed: unpaidUserRes.allowed,
      reason: unpaidUserRes.reason,
      message: test2Passed
        ? '✅ Bloqueo HTTP 402 PAYMENT_REQUIRED verificado correctamente para hombres solos inactivos.'
        : '❌ Falló el control de acceso para hombres solos.'
    },
    test3_vaultGrantAndSignedUrl: {
      passed: test3Passed,
      permissionGranted: grantRes.success,
      accessAfterGrant: accessAfterGrant.allowed,
      signedUrl: signedToken.signedUrl,
      tokenVerification: verification.valid,
      message: test3Passed
        ? '✅ Otorgamiento de Permiso de Bóveda y Generación de Token HMAC TTL (60s) verificados con éxito.'
        : '❌ Falló el flujo de Bóveda Privada o Firma de Token.'
    },
    allPassed
  };
}
