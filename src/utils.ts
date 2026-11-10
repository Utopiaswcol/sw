import { Vector5D, VetoesDict, PracticesDict, EvaluationResult } from './types';

export function vectorToArray(v: Vector5D): number[] {
  return [
    Math.max(-1, Math.min(1, v.e1_relational_spectrum)),
    Math.max(-1, Math.min(1, v.e2_third_party_orientation)),
    Math.max(-1, Math.min(1, v.e3_power_dynamics)),
    Math.max(-1, Math.min(1, v.e4_emotional_attachment)),
    Math.max(-1, Math.min(1, v.e5_boundary_flexibility)),
  ];
}

export function arrayToVector(arr: number[]): Vector5D {
  return {
    e1_relational_spectrum: arr[0] ?? 0,
    e2_third_party_orientation: arr[1] ?? 0,
    e3_power_dynamics: arr[2] ?? 0,
    e4_emotional_attachment: arr[3] ?? 0,
    e5_boundary_flexibility: arr[4] ?? 0,
  };
}

export function evaluateHardVetoes(
  vetoesA: VetoesDict,
  practicesB: PracticesDict,
  vetoesB?: VetoesDict,
  practicesA?: PracticesDict
): { isVetoed: boolean; reasons: string[] } {
  const reasons: string[] = [];

  // Veto rules matrix
  if (vetoesA.no_men) {
    if (practicesB.has_male_partner) {
      reasons.push("Incompatibilidad de género: La Parte A prohíbe interacción masculina y la Parte B incluye un participante masculino.");
    }
    if (practicesB.is_single_man) {
      reasons.push("Incompatibilidad de género: La Parte A veta interacción con hombres solos y la Parte B es un hombre solo.");
    }
    if (practicesB.seeking_male_interaction) {
      reasons.push("Incompatibilidad de género: La Parte B exige interacción masculina prohibida por la Parte A.");
    }
  }

  if (vetoesA.condom_mandatory && practicesB.no_condoms) {
    reasons.push("Seguridad sexual: La Parte A exige uso obligatorio de preservativo y la Parte B practica sexo sin protección.");
  }

  if (vetoesA.no_home_visits && practicesB.home_visits_only) {
    reasons.push("Logística: La Parte A rechaza visitas a domicilio y la Parte B exige exclusivamente encuentros residenciales.");
  }

  if (vetoesA.no_penetration) {
    if (practicesB.penetration_required) {
      reasons.push("Nivel de intercambio: La Parte A prohíbe la penetración (Soft Swap puro) y la Parte B requiere penetración obligatoria.");
    }
    if (practicesB.full_swap_mandatory) {
      reasons.push("Nivel de intercambio: La Parte A sólo acepta Soft Swap y la Parte B exige Full Swap obligatorio.");
    }
  }

  if (vetoesA.no_single_men && practicesB.is_single_man) {
    reasons.push("Tipo de perfil: La Parte A rechaza hombres solos y la Parte B es un hombre solo (Bull).");
  }

  if (vetoesA.no_single_women && practicesB.is_single_woman) {
    reasons.push("Tipo de perfil: La Parte A rechaza mujeres solas y la Parte B es una mujer sola (Unicornio).");
  }

  if (vetoesA.no_emotional_bonding && practicesB.requires_romantic_bond) {
    reasons.push("Enfoque emocional: La Parte A busca encuentros recreativos puros y la Parte B exige vínculo romántico/poliamoroso.");
  }

  // Check reverse vetoes (B -> A)
  if (vetoesB && practicesA) {
    if (vetoesB.no_men && practicesA.has_male_partner) {
      reasons.push("Veto cruzado (Parte B): La Parte B rechaza parejas con hombres y la Parte A incluye un participante masculino.");
    }
    if (vetoesB.condom_mandatory && practicesA.no_condoms) {
      reasons.push("Veto cruzado (Parte B): La Parte B exige preservativo obligatorio y la Parte A no lo usa.");
    }
    if (vetoesB.no_penetration && (practicesA.penetration_required || practicesA.full_swap_mandatory)) {
      reasons.push("Veto cruzado (Parte B): La Parte B prohíbe penetración y la Parte A exige full swap.");
    }
  }

  return {
    isVetoed: reasons.length > 0,
    reasons,
  };
}

export function computeCoupleConsensus(
  vectorA: Vector5D | number[],
  vectorB: Vector5D | number[],
  riskAversion: number = 0.65
): number[] {
  const vA = Array.isArray(vectorA) ? vectorA : vectorToArray(vectorA);
  const vB = Array.isArray(vectorB) ? vectorB : vectorToArray(vectorB);
  const lambda = Math.max(0, Math.min(1, riskAversion));

  const consensus: number[] = [];
  for (let i = 0; i < 5; i++) {
    const mean = (vA[i] + vB[i]) / 2.0;
    const minAnchor = Math.min(vA[i], vB[i]);
    const val = (1.0 - lambda) * mean + lambda * minAnchor;
    consensus.push(Math.max(-1, Math.min(1, val)));
  }

  return consensus;
}

export function calculateAffinityScore(
  consensusVector: number[],
  targetVector: number[],
  weights?: number[]
): number {
  const u = consensusVector;
  const v = targetVector;
  const w = weights && weights.length === 5 ? weights : [1, 1, 1, 1, 1];

  let dotProduct = 0;
  let normU = 0;
  let normV = 0;

  for (let i = 0; i < 5; i++) {
    dotProduct += w[i] * u[i] * v[i];
    normU += w[i] * u[i] * u[i];
    normV += w[i] * v[i] * v[i];
  }

  const denom = Math.sqrt(normU) * Math.sqrt(normV);
  if (denom < 1e-9) return 0;

  let cosSim = dotProduct / denom;
  cosSim = Math.max(-1, Math.min(1, cosSim));

  // Normalize [-1, 1] to [0, 1]
  const affinity = (cosSim + 1.0) / 2.0;
  return Math.max(0, Math.min(1, affinity));
}

export function evaluateRelationalCompatibilityLocal(config: {
  profileA_m1: Vector5D;
  profileA_m2: Vector5D | null;
  profileB_m1: Vector5D;
  profileB_m2: Vector5D | null;
  vetoesA: VetoesDict;
  practicesB: PracticesDict;
  vetoesB?: VetoesDict;
  practicesA?: PracticesDict;
  riskAversion: number;
  weights?: number[];
}): EvaluationResult {
  const { isVetoed, reasons } = evaluateHardVetoes(
    config.vetoesA,
    config.practicesB,
    config.vetoesB,
    config.practicesA
  );

  if (isVetoed) {
    return {
      status: 'VETOED',
      affinity_score: 0,
      affinity_percentage: '0.0%',
      is_vetoed: true,
      veto_reasons: reasons,
      consensus_vector_a: null,
      consensus_vector_b: null,
      message: 'Compatibilidad anulada por colisión directa en límites innegociables.',
    };
  }

  const vA = config.profileA_m2
    ? computeCoupleConsensus(config.profileA_m1, config.profileA_m2, config.riskAversion)
    : vectorToArray(config.profileA_m1);

  const vB = config.profileB_m2
    ? computeCoupleConsensus(config.profileB_m1, config.profileB_m2, config.riskAversion)
    : vectorToArray(config.profileB_m1);

  const affinity = calculateAffinityScore(vA, vB, config.weights);

  return {
    status: affinity >= 0.7 ? 'MATCH' : 'LOW_AFFINITY',
    affinity_score: Number(affinity.toFixed(4)),
    affinity_percentage: `${(affinity * 100).toFixed(1)}%`,
    is_vetoed: false,
    veto_reasons: [],
    consensus_vector_a: vA.map((x) => Number(x.toFixed(3))),
    consensus_vector_b: vB.map((x) => Number(x.toFixed(3))),
    message: `Evaluación exitosa. Afinidad vectorial: ${(affinity * 100).toFixed(1)}%`,
  };
}
