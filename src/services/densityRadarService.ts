import { getSubscriptionStatus, simulateManualPaymentApproval } from './billingService.js';

export interface ElasticZoneDensity {
  zoneName: string;
  activeCouplesCount: number;
  verifiedUnicornsCount: number;
  avgAffinityScore: number;
  topInterestsBreakdown: Record<string, number>; // Percentage distribution
  totalEcosystemCount: number;
  activeNowCount: number;
}

export interface TeaserCandidateSummary {
  id: string;
  alias: string;
  role: 'couple' | 'single_woman' | 'single_man';
  primaryZone: string;
  affinityScore: number;
  vector5D: [number, number, number, number, number];
  avatarUrl: string;
  optOutBlindReveal: boolean;
  hardVetoesSummary: string[];
  verifiedBadges: string[];
}

export interface DensityRadarSummary {
  activeZones: string[];
  totalCouplesInRange: number;
  totalUnicornsInRange: number;
  totalBullsInRange: number;
  highAffinityMatchCount: number; // count of matches with affinity > 80%
  zoneBreakdown: ElasticZoneDensity[];
  teaserProfiles: TeaserCandidateSummary[];
  timestamp: string;
}

export interface SinglePassRecord {
  passId: string;
  userId: string;
  candidateId: string;
  grantedAt: string;
  status: 'active';
}

// In-memory store for Single Connection Passes ($19.000 COP)
const singlePassStore = new Map<string, SinglePassRecord>();

// Seed database of anonymous candidate profiles in Colombian zones
const MOCK_RADAR_CANDIDATE_POOL = [
  {
    id: 'cand_cpl_chico_01',
    alias: 'Pareja Chicó / Zona Rosa',
    role: 'couple' as const,
    primaryZone: 'Chicó / Zona Rosa (Bogotá)',
    vector5D: [0.6, -0.8, 0.3, -0.2, 0.7] as [number, number, number, number, number],
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80',
    optOutBlindReveal: false,
    hardVetoesSummary: ['Preservativo 100% Obligatorio', 'Soft Swap Preferente'],
    verifiedBadges: ['Biometría +18', 'Pareja Verificada VIP'],
    preferredPractices: ['Soft Swap', 'Tríos MFF', 'Uso de Preservativo']
  },
  {
    id: 'cand_uni_chapinero_02',
    alias: 'Valentina (Unicornio)',
    role: 'single_woman' as const,
    primaryZone: 'Chapinero Alto (Bogotá)',
    vector5D: [0.5, -0.9, 0.2, -0.1, 0.8] as [number, number, number, number, number],
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80',
    optOutBlindReveal: false,
    hardVetoesSummary: ['Sin Visitas a Domicilio', 'Preservativo Obligatorio'],
    verifiedBadges: ['Unicornio Verificada', 'Biometría +18'],
    preferredPractices: ['Soft Swap', 'Tríos MFF']
  },
  {
    id: 'cand_cpl_poblado_03',
    alias: 'Pareja El Poblado',
    role: 'couple' as const,
    primaryZone: 'El Poblado (Medellín)',
    vector5D: [0.8, -0.7, 0.4, -0.3, 0.6] as [number, number, number, number, number],
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    optOutBlindReveal: true,
    hardVetoesSummary: ['Full Swap Aprobado', 'Preservativo Obligatorio'],
    verifiedBadges: ['Pareja Verificada VIP', 'Biometría +18', 'Bóveda Cifrada'],
    preferredPractices: ['Full Swap', 'Fiestas Privadas']
  },
  {
    id: 'cand_uni_laureles_04',
    alias: 'Camila (Unicornio)',
    role: 'single_woman' as const,
    primaryZone: 'Laureles / Estadio (Medellín)',
    vector5D: [0.4, -0.85, 0.1, -0.2, 0.75] as [number, number, number, number, number],
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80',
    optOutBlindReveal: false,
    hardVetoesSummary: ['Territorio Neutral Hoteles', 'Preservativo Obligatorio'],
    verifiedBadges: ['Unicornio Verificada'],
    preferredPractices: ['Soft Swap', 'Tríos MFF']
  },
  {
    id: 'cand_cpl_cartagena_05',
    alias: 'Pareja Centro Histórico',
    role: 'couple' as const,
    primaryZone: 'Centro Histórico (Cartagena)',
    vector5D: [0.7, -0.75, 0.35, -0.15, 0.8] as [number, number, number, number, number],
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80',
    optOutBlindReveal: false,
    hardVetoesSummary: ['Soft Swap Respetuoso', 'Reserva Hotel VIP'],
    verifiedBadges: ['Pareja VIP', 'Modo Nómada Activo'],
    preferredPractices: ['Soft Swap', 'Escapadas de Fin de Semana']
  },
  {
    id: 'cand_cpl_anapoima_06',
    alias: 'Pareja Anapoima Escapada',
    role: 'couple' as const,
    primaryZone: 'Anapoima / Girardot (Cundinamarca)',
    vector5D: [0.65, -0.8, 0.25, -0.2, 0.85] as [number, number, number, number, number],
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
    optOutBlindReveal: false,
    hardVetoesSummary: ['Finca Privada', 'Preservativo Obligatorio'],
    verifiedBadges: ['Verificación 3D', 'Destino Escapada'],
    preferredPractices: ['Soft Swap', 'Fiestas Privadas Pool']
  }
];

/**
 * Calculates Cosine Similarity between two 5D vectors
 */
function calculateVectorCosineSimilarity(
  vA: [number, number, number, number, number],
  vB: [number, number, number, number, number]
): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < 5; i++) {
    dot += vA[i] * vB[i];
    magA += vA[i] * vA[i];
    magB += vB[i] * vB[i];
  }
  if (magA === 0 || magB === 0) return 0.5;
  const sim = dot / (Math.sqrt(magA) * Math.sqrt(magB));
  // Convert [-1, 1] to [0, 1]
  return Math.max(0, Math.min(1, (sim + 1) / 2));
}

/**
 * 1. Computes aggregated ecosystem density metrics for active elastic zones
 */
export function getDensityRadarMetrics(
  userZones: string[] = ['Chicó / Zona Rosa (Bogotá)', 'El Poblado (Medellín)'],
  userVector5D: [number, number, number, number, number] = [0.5, -0.8, 0.3, -0.2, 0.7]
): DensityRadarSummary {
  const activeZones = userZones.length > 0 ? userZones : ['Chicó / Zona Rosa (Bogotá)', 'El Poblado (Medellín)'];

  const zoneBreakdown: ElasticZoneDensity[] = activeZones.map((zoneName) => {
    // Filter candidates matching zone
    const zoneCandidates = MOCK_RADAR_CANDIDATE_POOL.filter((c) =>
      c.primaryZone.toLowerCase().includes(zoneName.toLowerCase().split(' ')[0]) ||
      zoneName.toLowerCase().includes(c.primaryZone.toLowerCase().split(' ')[0])
    );

    const couples = zoneCandidates.filter((c) => c.role === 'couple');
    const unicorns = zoneCandidates.filter((c) => c.role === 'single_woman');

    // Simulate multiplier for realistic dense ecosystem scale in Colombia
    const multiplier = 3.5;
    const activeCouplesCount = Math.max(8, Math.round((couples.length + 3) * multiplier));
    const verifiedUnicornsCount = Math.max(4, Math.round((unicorns.length + 2) * multiplier));

    let totalAffinitySum = 0;
    zoneCandidates.forEach((cand) => {
      totalAffinitySum += calculateVectorCosineSimilarity(userVector5D, cand.vector5D);
    });
    const avgAffinity = zoneCandidates.length > 0 ? totalAffinitySum / zoneCandidates.length : 0.86;

    return {
      zoneName,
      activeCouplesCount,
      verifiedUnicornsCount,
      avgAffinityScore: Number((avgAffinity * 100).toFixed(1)),
      topInterestsBreakdown: {
        'Soft Swap Respetuoso': 65,
        'Full Swap Consentido': 35,
        'Tríos MFF / Unicornio': 52,
        'Preservativo 100% Obligatorio': 94
      },
      totalEcosystemCount: activeCouplesCount + verifiedUnicornsCount,
      activeNowCount: Math.round((activeCouplesCount + verifiedUnicornsCount) * 0.45)
    };
  });

  const totalCouplesInRange = zoneBreakdown.reduce((acc, z) => acc + z.activeCouplesCount, 0);
  const totalUnicornsInRange = zoneBreakdown.reduce((acc, z) => acc + z.verifiedUnicornsCount, 0);

  // Generate anonymized teaser profiles for preview
  const teaserProfiles: TeaserCandidateSummary[] = MOCK_RADAR_CANDIDATE_POOL.slice(0, 3).map((cand) => {
    const affinity = calculateVectorCosineSimilarity(userVector5D, cand.vector5D);
    return {
      id: cand.id,
      alias: cand.alias,
      role: cand.role,
      primaryZone: cand.primaryZone,
      affinityScore: Math.round(affinity * 100),
      vector5D: cand.vector5D,
      avatarUrl: cand.avatarUrl,
      optOutBlindReveal: cand.optOutBlindReveal,
      hardVetoesSummary: cand.hardVetoesSummary,
      verifiedBadges: cand.verifiedBadges
    };
  });

  return {
    activeZones,
    totalCouplesInRange,
    totalUnicornsInRange,
    totalBullsInRange: 12,
    highAffinityMatchCount: Math.round((totalCouplesInRange + totalUnicornsInRange) * 0.75),
    zoneBreakdown,
    teaserProfiles,
    timestamp: new Date().toISOString()
  };
}

/**
 * 2. Check granular access for solo male
 */
export async function hasActiveAccessPass(
  userId: string,
  targetCandidateId?: string,
  isSoloMale = true
): Promise<{
  hasAccess: boolean;
  accessType: 'subscription' | 'single_pass' | 'none';
  isSoloMale: boolean;
}> {
  // If not a solo male (e.g. couple or unicorn), full free active access
  if (!isSoloMale) {
    return { hasAccess: true, accessType: 'subscription', isSoloMale: false };
  }

  // 1. Check full VIP subscription status in billing service
  const sub = await getSubscriptionStatus(userId);
  if (sub.status === 'active') {
    return { hasAccess: true, accessType: 'subscription', isSoloMale: true };
  }

  // 2. Check single connection pass if candidate ID provided
  if (targetCandidateId) {
    const passKey = `${userId}_${targetCandidateId}`;
    if (singlePassStore.has(passKey)) {
      return { hasAccess: true, accessType: 'single_pass', isSoloMale: true };
    }
  }

  return { hasAccess: false, accessType: 'none', isSoloMale: true };
}

/**
 * 3. Grants single connection pass for a specific profile ($19.000 COP)
 */
export function grantSingleConnectionPass(userId: string, targetCandidateId: string): SinglePassRecord {
  const passKey = `${userId}_${targetCandidateId}`;
  const passRecord: SinglePassRecord = {
    passId: `pass_single_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    userId,
    candidateId: targetCandidateId,
    grantedAt: new Date().toISOString(),
    status: 'active'
  };
  singlePassStore.set(passKey, passRecord);
  return passRecord;
}

/**
 * 4. Checks single connection pass
 */
export function checkSingleConnectionPass(userId: string, targetCandidateId: string): boolean {
  return singlePassStore.has(`${userId}_${targetCandidateId}`);
}

/**
 * 5. Integrated Unit Test Suite for Density Radar & Access Control
 */
export function runDensityRadarTestSuite(): {
  passed: boolean;
  details: string;
  testResults: any[];
} {
  const testResults: any[] = [];
  let allPassed = true;

  try {
    // Test 1: Density Metric Aggregation in Active Zones
    const userZones = ['Chicó / Zona Rosa (Bogotá)', 'El Poblado (Medellín)'];
    const metrics = getDensityRadarMetrics(userZones);
    const t1Passed =
      metrics.totalCouplesInRange > 0 &&
      metrics.totalUnicornsInRange > 0 &&
      metrics.zoneBreakdown.length === 2 &&
      metrics.teaserProfiles.length === 3;

    if (!t1Passed) allPassed = false;
    testResults.push({
      testName: 'Agregación de Métricas de Densidad por Zonas Elásticas',
      passed: t1Passed,
      totalCouples: metrics.totalCouplesInRange,
      totalUnicorns: metrics.totalUnicornsInRange,
      activeZonesCount: metrics.zoneBreakdown.length
    });

    // Test 2: Granular Access Block for Unpaid Solo Male
    const testSoloUserId = 'usr_test_solo_unpaid_' + Date.now();
    const testCandidateId = 'cand_cpl_chico_01';

    // Before payment -> Must be denied (hasAccess: false)
    const passCheckBefore = checkSingleConnectionPass(testSoloUserId, testCandidateId);
    const t2Passed = passCheckBefore === false;
    if (!t2Passed) allPassed = false;
    testResults.push({
      testName: 'Bloqueo Granular de Chat/Bóveda para Hombre Solo Sin Suscripción',
      passed: t2Passed,
      hasAccessBeforePayment: passCheckBefore
    });

    // Test 3: Real-Time Access Grant upon Single Pass Purchase or VIP Subscription
    grantSingleConnectionPass(testSoloUserId, testCandidateId);
    const passCheckAfter = checkSingleConnectionPass(testSoloUserId, testCandidateId);

    // Also simulate manual subscription upgrade
    const subRecord = simulateManualPaymentApproval(testSoloUserId, 'monthly_solo_male');
    const t3Passed = passCheckAfter === true && subRecord.status === 'active';
    if (!t3Passed) allPassed = false;
    testResults.push({
      testName: 'Actualización en Tiempo Real de Inactive a Active tras Transacción',
      passed: t3Passed,
      hasSinglePassGranted: passCheckAfter,
      subscriptionStatus: subRecord.status
    });

    return {
      passed: allPassed,
      details: allPassed
        ? '✓ Suite de Pruebas de Radar de Densidad y Embudo Freemium completada exitosamente.'
        : '❌ Fallo en la suite de pruebas de radar de densidad.',
      testResults
    };
  } catch (err: any) {
    return {
      passed: false,
      details: 'Error ejecutando prueba de radar de densidad: ' + err.message,
      testResults: [{ error: err.message }]
    };
  }
}
