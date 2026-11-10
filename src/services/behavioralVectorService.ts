export interface ProfileInteraction {
  candidateId: string;
  candidateVector: [number, number, number, number, number];
  interactionType: 'view_duration' | 'vault_request' | 'chat_open' | 'quick_skip';
  durationSeconds?: number;
  timestamp: number;
}

export interface RecalibrationResult {
  updatedVector: [number, number, number, number, number];
  behavioralVector: [number, number, number, number, number];
  driftMetric: number;
  interactionCount: number;
  driftDescription: string;
}

// In-memory interaction log per user session
const sessionInteractions: Record<string, ProfileInteraction[]> = {};

/**
 * Calculates weight delta for a given interaction type
 */
export function calculateInteractionWeight(interaction: ProfileInteraction): number {
  switch (interaction.interactionType) {
    case 'view_duration':
      return (interaction.durationSeconds || 0) >= 8 ? 0.05 : 0.0;
    case 'vault_request':
    case 'chat_open':
      return 0.15;
    case 'quick_skip':
      return -0.05;
    default:
      return 0.0;
  }
}

/**
 * Helper to clip scalar value strictly to [-1.0, 1.0]
 */

export function clip(value: number, min = -1.0, max = 1.0): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Recalibrates a user's 5D vector using passive behavioral interactions
 * Formula: V_final = clip(0.70 * V_declared + 0.30 * V_behavioral, -1.0, 1.0)
 */
export function recalibrateProfileVector(
  userId: string,
  currentVector: [number, number, number, number, number],
  interactionHistory: ProfileInteraction[]
): RecalibrationResult {
  if (!interactionHistory || interactionHistory.length === 0) {
    return {
      updatedVector: [...currentVector] as [number, number, number, number, number],
      behavioralVector: [...currentVector] as [number, number, number, number, number],
      driftMetric: 0.0,
      interactionCount: 0,
      driftDescription: 'Sin interacciones registradas. Vector sin cambio.'
    };
  }

  // Calculate weighted sum for behavioral vector
  const weightedSums: [number, number, number, number, number] = [0, 0, 0, 0, 0];
  let totalWeight = 0;

  for (const interaction of interactionHistory) {
    const w = calculateInteractionWeight(interaction);
    if (Math.abs(w) > 0) {
      totalWeight += Math.abs(w);
      for (let i = 0; i < 5; i++) {
        // If positive interaction (w > 0), pull towards candidate vector.
        // If negative (w < 0), push away from candidate vector.
        const targetVal = w > 0 ? interaction.candidateVector[i] : -interaction.candidateVector[i];
        weightedSums[i] += targetVal * Math.abs(w);
      }
    }
  }

  let behavioralVector: [number, number, number, number, number];
  if (totalWeight > 0) {
    behavioralVector = weightedSums.map((val) => clip(val / totalWeight)) as [
      number,
      number,
      number,
      number,
      number
    ];
  } else {
    behavioralVector = [...currentVector];
  }

  // Apply convergence formula: 0.70 * V_declared + 0.30 * V_behavioral
  const updatedVector = currentVector.map((vDeclared, idx) =>
    clip(0.70 * vDeclared + 0.30 * behavioralVector[idx])
  ) as [number, number, number, number, number];

  // Calculate Euclidean Drift Metric
  let sumSqDiff = 0;
  for (let i = 0; i < 5; i++) {
    sumSqDiff += Math.pow(updatedVector[i] - currentVector[i], 2);
  }
  const driftMetric = Number(Math.sqrt(sumSqDiff).toFixed(4));

  let driftDescription = 'Alineación estable con onboarding inicial.';
  if (driftMetric > 0.3) {
    driftDescription = 'Alta desviación conductual: Preferencias reales difieren notablemente del onboarding.';
  } else if (driftMetric > 0.1) {
    driftDescription = 'Ajuste fino conductual detectado.';
  }

  return {
    updatedVector,
    behavioralVector,
    driftMetric,
    interactionCount: interactionHistory.length,
    driftDescription
  };
}

/**
 * Record a single interaction into user's session history and recalculate
 */
export function recordUserInteraction(
  userId: string,
  interaction: ProfileInteraction
): ProfileInteraction[] {
  if (!sessionInteractions[userId]) {
    sessionInteractions[userId] = [];
  }
  sessionInteractions[userId].push(interaction);
  return sessionInteractions[userId];
}

/**
 * Retrieves the session interaction history for a user
 */
export function getUserInteractionHistory(userId: string): ProfileInteraction[] {
  return sessionInteractions[userId] || [];
}

/**
 * Clears the session interaction history for a user
 */
export function clearUserInteractionHistory(userId: string): void {
  sessionInteractions[userId] = [];
}
