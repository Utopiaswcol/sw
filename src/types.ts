export interface Vector5D {
  e1_relational_spectrum: number;     // Soft Swap (-1) vs Full Swap (+1)
  e2_third_party_orientation: number;  // Unicorn/Female (-1) vs Bull/Male (+1)
  e3_power_dynamics: number;          // Voyeurism/Exhibitionism (-1) vs Equal Participation (+1)
  e4_emotional_attachment: number;    // Purely Recreational (-1) vs Polyamorous/Romantic (+1)
  e5_boundary_flexibility: number;    // Rigid Rules (-1) vs Fluid Improvisation (+1)
}

export type DimensionKey = keyof Vector5D;

export interface DimensionMeta {
  key: DimensionKey;
  code: string;
  name: string;
  shortLabel: string;
  minLabel: string;
  maxLabel: string;
  description: string;
  colombianContext: string;
}

export interface VetoesDict {
  no_men: boolean;
  condom_mandatory: boolean;
  no_home_visits: boolean;
  no_penetration: boolean;
  no_single_men: boolean;
  no_single_women: boolean;
  no_emotional_bonding: boolean;
}

export interface PracticesDict {
  has_male_partner: boolean;
  is_single_man: boolean;
  is_single_woman: boolean;
  seeking_male_interaction: boolean;
  penetration_required: boolean;
  full_swap_mandatory: boolean;
  no_condoms: boolean;
  home_visits_only: boolean;
  requires_romantic_bond: boolean;
}

export interface EvaluationResult {
  status: 'MATCH' | 'LOW_AFFINITY' | 'VETOED';
  affinity_score: number;
  affinity_percentage: string;
  is_vetoed: boolean;
  veto_reasons: string[];
  consensus_vector_a: number[] | null;
  consensus_vector_b: number[] | null;
  message: string;
}

export interface SupabasePayload {
  user_id: string;
  is_couple: boolean;
  vector_5d_json: number[];
  hard_vetoes: Record<string, boolean>;
  declared_practices: Record<string, boolean>;
  consistency_index: number;
}

export interface TestCasePreset {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  expectedResult: string;
  isCoupleA: boolean;
  isCoupleB: boolean;
  riskAversion: number;
  profileA_M1: Vector5D;
  profileA_M2: Vector5D | null;
  profileB_M1: Vector5D;
  profileB_M2: Vector5D | null;
  vetoesA: VetoesDict;
  practicesA: PracticesDict;
  vetoesB: VetoesDict;
  practicesB: PracticesDict;
}
