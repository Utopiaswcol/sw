import { runCryptoSecurityTestSuite } from './cryptoTestRunner.js';
import {
  recalibrateProfileVector,
  calculateInteractionWeight,
  ProfileInteraction
} from './behavioralVectorService.js';

export interface SuiteCombinedReport {
  cryptoReport: any;
  behavioralTestPassed: boolean;
  behavioralDetails: string;
}

/**
 * Runs unit test suite for behavioral vector convergence
 */
export function runBehavioralVectorTestSuite(): { passed: boolean; details: string } {
  try {
    const initialVector: [number, number, number, number, number] = [0.0, 0.0, 0.0, 0.0, 0.0];
    const candidateTargetVector: [number, number, number, number, number] = [0.8, 0.9, 0.7, -0.4, 0.8];

    // Simulate 5 positive interactions (duration > 8s or vault request)
    const simulatedInteractions: ProfileInteraction[] = [
      {
        candidateId: 'cand_1',
        candidateVector: candidateTargetVector,
        interactionType: 'view_duration',
        durationSeconds: 10,
        timestamp: Date.now() - 50000
      },
      {
        candidateId: 'cand_1',
        candidateVector: candidateTargetVector,
        interactionType: 'vault_request',
        timestamp: Date.now() - 40000
      },
      {
        candidateId: 'cand_1',
        candidateVector: candidateTargetVector,
        interactionType: 'chat_open',
        timestamp: Date.now() - 30000
      },
      {
        candidateId: 'cand_2',
        candidateVector: [0.9, 0.8, 0.8, -0.2, 0.9],
        interactionType: 'view_duration',
        durationSeconds: 12,
        timestamp: Date.now() - 20000
      },
      {
        candidateId: 'cand_2',
        candidateVector: [0.9, 0.8, 0.8, -0.2, 0.9],
        interactionType: 'vault_request',
        timestamp: Date.now() - 10000
      }
    ];

    const result = recalibrateProfileVector('usr_test_suite', initialVector, simulatedInteractions);

    // Verify mathematical convergence:
    // Vector must move towards [0.8, 0.9, ...] by ~30%
    const shiftedE1 = result.updatedVector[0]; // expect ~0.25 - 0.26
    const shiftedE2 = result.updatedVector[1]; // expect ~0.26 - 0.27
    const drift = result.driftMetric;

    const E1ShiftedCorrectly = shiftedE1 > 0.2;
    const E2ShiftedCorrectly = shiftedE2 > 0.2;
    const driftDetected = drift > 0.2;

    const passed = E1ShiftedCorrectly && E2ShiftedCorrectly && driftDetected;

    return {
      passed,
      details: passed
        ? `Convergencia Matemática Confirmada: Vector evolucionó de [0,0,0,0,0] a [${result.updatedVector.join(
            ', '
          )}] tras 5 interacciones. Drift Métrica: ${drift}.`
        : `Error en convergencia conductual. Vector final: [${result.updatedVector.join(', ')}].`
    };
  } catch (err: any) {
    return {
      passed: false,
      details: 'Error ejecutando prueba conductual: ' + err.message
    };
  }
}
