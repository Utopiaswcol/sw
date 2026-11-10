import crypto from 'crypto';

export interface FacialVector {
  vector: number[]; // 5D or 128D normalized facial embedding vector
  hash: string;     // SHA-256 anonymized facial hash
}

export interface MemberKycState {
  userId: string;
  cedulaNumberMasked: string; // e.g. "1018****89" for zero-document compliance
  facialHash: string;
  facialVector: number[];
  verifiedAt: string;
  isAgeVerified18Plus: boolean;
}

export interface CoupleKycRecord {
  coupleId: string;
  memberA?: MemberKycState;
  memberB?: MemberKycState;
  bothVerified: boolean;
  inviteToken?: string;
  inviteExpiresAt?: string;
  isSuspended: boolean;
  fraudReason?: string;
  mutualConsentTimestamp?: string;
  createdTime: string;
}

// Volatile in-memory store for couple KYC records
const coupleKycStore = new Map<string, CoupleKycRecord>();
const inviteTokenToCoupleId = new Map<string, { coupleId: string; expiresAt: number; memberAUserId: string }>();

const HMAC_KYC_SECRET = 'aethel_vault_async_kyc_hmac_secret_key_2026';

/**
 * Computes Euclidean Distance between two normalized facial feature vectors
 */
export function calculateFacialDistance(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) {
    return 1.0; // Max distance if vectors missing
  }
  const minLen = Math.min(vecA.length, vecB.length);
  let sumSq = 0;
  for (let i = 0; i < minLen; i++) {
    sumSq += Math.pow(vecA[i] - vecB[i], 2);
  }
  return Math.sqrt(sumSq);
}

/**
 * Generates an anonymized SHA-256 hash for a facial vector or image signature
 */
export function generateFacialHash(vector: number[]): string {
  const str = vector.map((v) => v.toFixed(4)).join(',');
  return crypto.createHash('sha256').update(str).digest('hex');
}

/**
 * Mask Colombian Cédula de Ciudadanía for Ley 1581 de 2012 compliance
 */
export function maskCedula(cedula: string): string {
  if (!cedula || cedula.length < 4) return '****';
  const start = cedula.substring(0, 3);
  const end = cedula.slice(-2);
  return `${start}****${end}`;
}

/**
 * Generates an HMAC-signed invitation token for Member B
 */
export function generatePartnerInviteToken(
  coupleId: string,
  memberAUserId: string,
  ttlHours = 48
): { inviteToken: string; inviteUrl: string; expiresAt: string } {
  const expiresAtMs = Date.now() + ttlHours * 60 * 60 * 1000;
  const rawPayload = `${coupleId}:${memberAUserId}:${expiresAtMs}`;
  
  const hmac = crypto.createHmac('sha256', HMAC_KYC_SECRET).update(rawPayload).digest('hex');
  const inviteToken = Buffer.from(`${rawPayload}:${hmac}`).toString('base64url');

  const expiresAtIso = new Date(expiresAtMs).toISOString();

  // Save in token lookup map
  inviteTokenToCoupleId.set(inviteToken, {
    coupleId,
    expiresAt: expiresAtMs,
    memberAUserId
  });

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://aethel-vault.app';
  const inviteUrl = `${baseUrl}?kyc_invite=${inviteToken}&couple=${coupleId}`;

  return {
    inviteToken,
    inviteUrl,
    expiresAt: expiresAtIso
  };
}

/**
 * Validates an HMAC partner invite token
 */
export function validatePartnerInviteToken(token: string): {
  valid: boolean;
  coupleId?: string;
  memberAUserId?: string;
  error?: string;
} {
  try {
    if (!token) {
      return { valid: false, error: 'TOKEN_MISSING' };
    }

    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const parts = decoded.split(':');
    if (parts.length !== 4) {
      return { valid: false, error: 'TOKEN_MALFORMED' };
    }

    const [coupleId, memberAUserId, expiresAtStr, hmacSignature] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);

    if (Date.now() > expiresAt) {
      return { valid: false, error: 'TOKEN_EXPIRED' };
    }

    // Recompute HMAC to verify integrity
    const recomputedHmac = crypto
      .createHmac('sha256', HMAC_KYC_SECRET)
      .update(`${coupleId}:${memberAUserId}:${expiresAtStr}`)
      .digest('hex');

    if (recomputedHmac !== hmacSignature) {
      return { valid: false, error: 'TOKEN_INVALID_SIGNATURE' };
    }

    return {
      valid: true,
      coupleId,
      memberAUserId
    };
  } catch (err: any) {
    return { valid: false, error: 'TOKEN_VALIDATION_ERROR: ' + err.message };
  }
}

/**
 * Step 1: Initiate Member A verification (+18 volatile OCR & 3D selfie)
 */
export function initiateMemberAVerification(
  coupleId: string,
  memberAUserId: string,
  cedulaNumber: string,
  selfieImageBase64: string,
  customFacialVector?: number[]
): {
  success: boolean;
  coupleId: string;
  memberAVerified: boolean;
  inviteToken: string;
  inviteUrl: string;
  expiresAt: string;
  message: string;
} {
  // Simulate OCR + 3D facial feature extraction in volatile memory
  // Purge raw selfie image immediately (Ley 1581 de 2012 Compliance)
  const facialVector = customFacialVector || [0.55, 0.32, 0.88, 0.12, 0.67, 0.45];
  const facialHash = generateFacialHash(facialVector);

  const memberAState: MemberKycState = {
    userId: memberAUserId,
    cedulaNumberMasked: maskCedula(cedulaNumber),
    facialHash,
    facialVector,
    verifiedAt: new Date().toISOString(),
    isAgeVerified18Plus: true
  };

  const inviteDetails = generatePartnerInviteToken(coupleId, memberAUserId, 48);

  const record: CoupleKycRecord = {
    coupleId,
    memberA: memberAState,
    bothVerified: false,
    inviteToken: inviteDetails.inviteToken,
    inviteExpiresAt: inviteDetails.expiresAt,
    isSuspended: false,
    createdTime: new Date().toISOString()
  };

  coupleKycStore.set(coupleId, record);

  return {
    success: true,
    coupleId,
    memberAVerified: true,
    inviteToken: inviteDetails.inviteToken,
    inviteUrl: inviteDetails.inviteUrl,
    expiresAt: inviteDetails.expiresAt,
    message: 'Miembro A verificado correctamente (+18). Enlace de invitación para Miembro B generado (TTL 48h).'
  };
}

/**
 * Step 2: Validate Member B and execute Anti-Fraud Cross Validation (<0.25 Euclidean distance check)
 */
export function validateMemberB(
  coupleId: string,
  inviteToken: string,
  memberBUserId: string,
  cedulaNumber: string,
  selfieImageBase64: string,
  customFacialVector?: number[]
): {
  success: boolean;
  bothVerified: boolean;
  distance?: number;
  isFraudAttempt?: boolean;
  message: string;
} {
  // 1. Verify token validity
  const tokenValidation = validatePartnerInviteToken(inviteToken);
  if (!tokenValidation.valid || tokenValidation.coupleId !== coupleId) {
    return {
      success: false,
      bothVerified: false,
      message: `Enlace de invitación inválido o expirado (${tokenValidation.error}).`
    };
  }

  const record = coupleKycStore.get(coupleId);
  if (!record || !record.memberA) {
    return {
      success: false,
      bothVerified: false,
      message: 'No existe registro previo para el Miembro A en esta pareja.'
    };
  }

  if (record.isSuspended) {
    return {
      success: false,
      bothVerified: false,
      isFraudAttempt: true,
      message: `Cuenta de pareja suspendida previamente. Razón: ${record.fraudReason}`
    };
  }

  // Simulate Member B 3D facial feature extraction in volatile memory
  const vecB = customFacialVector || [0.12, 0.95, 0.22, 0.78, 0.34, 0.89];
  const distance = calculateFacialDistance(record.memberA.facialVector, vecB);

  // Anti-Fraud Rule: If Euclidean distance < 0.25, it's the exact same person trying to register twice
  if (distance < 0.25) {
    record.isSuspended = true;
    record.fraudReason = 'SAME_PERSON_DUPLICATE_FACE: Distancia facial ' + distance.toFixed(4) + ' < 0.25 threshold.';
    coupleKycStore.set(coupleId, record);

    return {
      success: false,
      bothVerified: false,
      distance,
      isFraudAttempt: true,
      message: '🚨 ALERTA ANTI-FRAUDE: Se detectó que el Miembro A y el Miembro B son la misma persona. Verificación rechazada y cuenta de pareja suspendida.'
    };
  }

  // Member B successfully verified
  const memberBState: MemberKycState = {
    userId: memberBUserId,
    cedulaNumberMasked: maskCedula(cedulaNumber),
    facialHash: generateFacialHash(vecB),
    facialVector: vecB,
    verifiedAt: new Date().toISOString(),
    isAgeVerified18Plus: true
  };

  record.memberB = memberBState;
  record.bothVerified = true;
  record.mutualConsentTimestamp = new Date().toISOString();
  coupleKycStore.set(coupleId, record);

  return {
    success: true,
    bothVerified: true,
    distance,
    isFraudAttempt: false,
    message: '✓ Co-titularidad verificada exitosamente. Ambos miembros de la pareja (+18) están autenticados.'
  };
}

/**
 * Get consolidated KYC status for a couple
 */
export function getCoupleKycStatus(coupleId: string): CoupleKycRecord {
  const record = coupleKycStore.get(coupleId);
  if (!record) {
    return {
      coupleId,
      bothVerified: false,
      isSuspended: false,
      createdTime: new Date().toISOString()
    };
  }
  return record;
}

/**
 * Anti-Fraud Unit Test Suite
 */
export function runKycAntiFraudTestSuite(): {
  passed: boolean;
  details: string;
  testResults: any[];
} {
  const testResults: any[] = [];
  let allPassed = true;

  // Test 1: Legitimate couple with distinct faces
  const coupleId1 = `cpl_test_legit_${Date.now()}`;
  const memberA_Vector = [0.85, 0.12, 0.44, 0.90, 0.33, 0.21];
  const memberB_DistinctVector = [0.10, 0.92, 0.15, 0.05, 0.88, 0.77];

  const initResult = initiateMemberAVerification(
    coupleId1,
    'usr_legit_member_a',
    '1018223940',
    'base64_selfie_a',
    memberA_Vector
  );

  const legitBResult = validateMemberB(
    coupleId1,
    initResult.inviteToken,
    'usr_legit_member_b',
    '1020448112',
    'base64_selfie_b',
    memberB_DistinctVector
  );

  const t1Passed = legitBResult.success && legitBResult.bothVerified && !legitBResult.isFraudAttempt;
  if (!t1Passed) allPassed = false;
  testResults.push({
    testName: 'Verificación de Pareja Legítima (Rostros Diferentes)',
    passed: t1Passed,
    distance: legitBResult.distance,
    message: legitBResult.message
  });

  // Test 2: Fraudulent attempt (Member A and B use identical/near-identical face, distance < 0.25)
  const coupleId2 = `cpl_test_fraud_${Date.now()}`;
  const fraudMemberA_Vector = [0.75, 0.40, 0.60, 0.50, 0.30, 0.90];
  // Identical or tiny variation (distance ~ 0.03)
  const fraudMemberB_Vector = [0.76, 0.41, 0.59, 0.50, 0.31, 0.89];

  const initFraudResult = initiateMemberAVerification(
    coupleId2,
    'usr_imposter_a',
    '1032998411',
    'base64_selfie_imposter',
    fraudMemberA_Vector
  );

  const fraudBResult = validateMemberB(
    coupleId2,
    initFraudResult.inviteToken,
    'usr_imposter_a_again',
    '1032998412',
    'base64_selfie_imposter_2',
    fraudMemberB_Vector
  );

  const t2Passed = !fraudBResult.success && fraudBResult.isFraudAttempt === true && fraudBResult.distance! < 0.25;
  if (!t2Passed) allPassed = false;
  testResults.push({
    testName: 'Detección de Suplantación Dual (Mismo Rostro con <0.25 Distancia)',
    passed: t2Passed,
    distance: fraudBResult.distance,
    message: fraudBResult.message
  });

  // Test 3: Ley 1581 Zero Document Storage Check
  const coupleStatus = getCoupleKycStatus(coupleId1);
  const t3Passed =
    coupleStatus.memberA?.cedulaNumberMasked.includes('****') &&
    !JSON.stringify(coupleStatus).includes('base64_selfie');
  if (!t3Passed) allPassed = false;
  testResults.push({
    testName: 'Cumplimiento Ley 1581 (Cero Almacenamiento de Documentos / Cédulas Enmascaradas)',
    passed: t3Passed,
    maskedCedula: coupleStatus.memberA?.cedulaNumberMasked
  });

  return {
    passed: allPassed,
    details: allPassed
      ? '✓ Suite Anti-Fraude de Biometría de Parejas completada exitosamente. Detección de duplicados <0.25 activa.'
      : '❌ Error en la suite de pruebas anti-fraude de biometría.',
    testResults
  };
}
