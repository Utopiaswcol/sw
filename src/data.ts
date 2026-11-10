import { DimensionMeta, VetoesDict, PracticesDict, TestCasePreset } from './types';

export const DILEMMAS_CATALOG_UI = [
  {
    dilemma_id: 'D1_PHYSICAL_LIMITS',
    title: 'Dilema 1: Límites Físicos y Nivel de Intercambio',
    description: 'Durante una fiesta privada swinger, una pareja les propone pasar a la habitación VIP. ¿Cuál es su postura?',
    options: [
      {
        option_id: 'D1_OPT_SOFT_ONLY',
        text: 'Aceptamos compartir espacio y besos, pero prohibimos estrictamente la penetración con terceros (Soft Swap).',
        delta_vector: [-0.6, -0.1, -0.2, -0.3, -0.5],
        vetoes: { no_penetration: true }
      },
      {
        option_id: 'D1_OPT_FULL_SWAP',
        text: 'Aceptamos intercambio completo con penetración y juego directo (Full Swap).',
        delta_vector: [0.7, 0.1, 0.3, -0.2, 0.6],
        vetoes: { no_penetration: false }
      }
    ]
  },
  {
    dilemma_id: 'D2_GENDER_ORIENTATION',
    title: 'Dilema 2: Inclusión de Terceros y Género',
    description: 'Al seleccionar nuevos perfiles en la plataforma, ¿cuál es la configuración ideal?',
    options: [
      {
        option_id: 'D2_OPT_UNICORN_BI',
        text: 'Buscamos exclusivamente una mujer sola (Unicornio) o bisexual.',
        delta_vector: [0.1, -0.8, 0.1, -0.1, 0.2],
        vetoes: { no_men: true, no_single_men: true }
      },
      {
        option_id: 'D2_OPT_BULL_MALE',
        text: 'Buscamos la incorporación de un hombre solo (Bull) con buena presencia.',
        delta_vector: [0.3, 0.85, 0.4, -0.2, 0.3],
        vetoes: { no_single_women: true }
      }
    ]
  },
  {
    dilemma_id: 'D3_POWER_JEALOUSY',
    title: 'Dilema 3: Manejo de Celos y Dinámicas de Poder',
    description: 'Si durante el encuentro una parte recibe más atención física, ¿cómo se gestiona?',
    options: [
      {
        option_id: 'D3_OPT_CUCKOLD_VOYEUR',
        text: 'Nos excita la asimetría: que uno sea el centro mientras el otro observa pasivamente.',
        delta_vector: [0.2, 0.2, -0.85, -0.2, 0.3],
        vetoes: {}
      },
      {
        option_id: 'D3_OPT_SAFE_WORD_PAUSE',
        text: 'Aplicamos código o palabra de seguridad inmediata para pausar si alguien siente incomodidad.',
        delta_vector: [-0.2, 0.0, 0.4, 0.2, -0.7],
        vetoes: {}
      }
    ]
  },
  {
    dilemma_id: 'D4_EMOTIONAL_ATTACHMENT',
    title: 'Dilema 4: Afectividad vs. Placer Lúdico',
    description: '¿Qué nivel de involucramiento emocional consideran aceptable?',
    options: [
      {
        option_id: 'D4_OPT_PURE_RECREATIONAL',
        text: 'Estrictamente recreativo y lúdico. No se permiten mensajes afectivos ni citas románticas.',
        delta_vector: [0.1, 0.0, 0.0, -0.85, -0.5],
        vetoes: { no_emotional_bonding: true }
      },
      {
        option_id: 'D4_OPT_POLYAMORY_ROMANTIC',
        text: 'Buscamos relaciones poliamorosas o triejas con afecto auténtico y proyecto compartido.',
        delta_vector: [0.3, -0.2, 0.2, 0.9, 0.6],
        vetoes: { no_emotional_bonding: false }
      }
    ]
  },
  {
    dilemma_id: 'D5_SEXUAL_HEALTH',
    title: 'Dilema 5: Salud Sexual y Protección',
    description: '¿Cuál es la regla innegociable de seguridad e higiene?',
    options: [
      {
        option_id: 'D5_OPT_CONDOM_ALWAYS',
        text: 'Uso 100% obligatorio de preservativo en cualquier penetración o sexo oral.',
        delta_vector: [-0.1, 0.0, 0.1, -0.1, -0.8],
        vetoes: { condom_mandatory: true }
      }
    ]
  },
  {
    dilemma_id: 'D6_LOGISTICS_AFTERMATH',
    title: 'Dilema 6: Logística del Encuentro',
    description: '¿Cómo prefieren estructurar la locación y el seguimiento?',
    options: [
      {
        option_id: 'D6_OPT_NEUTRAL_HOTEL',
        text: 'Únicamente en territorio neutral (hoteles o clubes swingers). Prohibido domicilios privados.',
        delta_vector: [-0.2, 0.0, 0.0, -0.4, -0.6],
        vetoes: { no_home_visits: true }
      },
      {
        option_id: 'D6_OPT_GHOSTING_BYE',
        text: 'Una vez terminado el encuentro, se agradece y no hay seguimiento.',
        delta_vector: [0.1, 0.0, -0.2, -0.8, -0.3],
        vetoes: { no_emotional_bonding: true }
      }
    ]
  }
];

export const DIMENSIONS: DimensionMeta[] = [
  {
    key: 'e1_relational_spectrum',
    code: 'E1',
    name: 'Relational Spectrum',
    shortLabel: 'Nivel de Intercambio Físico',
    minLabel: 'Soft Swap (Sin Penetración)',
    maxLabel: 'Full Swap (Intercambio Completo)',
    description: 'Nivel de intimidad e intercambio físico acordado.',
    colombianContext: 'Interacción de caricias y besos (Soft) frente a interacción completa directa (Full).'
  },
  {
    key: 'e2_third_party_orientation',
    code: 'E2',
    name: 'Third Party Orientation',
    shortLabel: 'Preferencia de Integrantes',
    minLabel: 'Mujeres Solas / Parejas',
    maxLabel: 'Hombres Solos / Parejas',
    description: 'Preferencia de integrantes en la experiencia compartida.',
    colombianContext: 'Inclusión de mujeres solas o interacción con hombres solos o parejas.'
  },
  {
    key: 'e3_power_dynamics',
    code: 'E3',
    name: 'Power Dynamics',
    shortLabel: 'Estilo de Participación & Roles',
    minLabel: 'Observación & Voyeurismo',
    maxLabel: 'Participación Simétrica Simultánea',
    description: 'Preferencia de rol en el encuentro.',
    colombianContext: 'Disfrute observando/ser observado frente a participación dinámica en simultáneo.'
  },
  {
    key: 'e4_emotional_attachment',
    code: 'E4',
    name: 'Emotional Attachment',
    shortLabel: 'Nivel de Vínculo Emocional',
    minLabel: 'Recreativo Lúdico Casual',
    maxLabel: 'Vínculo Afectivo / Poliamor',
    description: 'Apertura hacia conexiones afectivas o amistades continuas.',
    colombianContext: 'Encuentros lúdicos sin apego frente a vínculos afectivos o relaciones continuas.'
  },
  {
    key: 'e5_boundary_flexibility',
    code: 'E5',
    name: 'Boundary Flexibility',
    shortLabel: 'Acuerdos & Flexibilidad de Límites',
    minLabel: 'Reglas Innegociables Estrictas',
    maxLabel: 'Comunicación Fluida Espontánea',
    description: 'Manera de negociar límites y acuerdos antes y durante la cita.',
    colombianContext: 'Estatuto de reglas previas frente a fluidez con comunicación constante.'
  }
];

export const VETO_LABELS: Record<keyof VetoesDict, { label: string; desc: string }> = {
  no_men: { label: 'No Men (Sin Hombres)', desc: 'Prohíbe la presencia o contacto activo masculino.' },
  condom_mandatory: { label: 'Uso Obligatorio de Preservativo', desc: 'Exige preservativo en todas las prácticas sexuales.' },
  no_home_visits: { label: 'No Visitas a Domicilio', desc: 'Sólo hoteles, clubes swingers o territorio neutral.' },
  no_penetration: { label: 'No Penetración (Soft Swap Exclusivo)', desc: 'Veta la penetración para terceros.' },
  no_single_men: { label: 'No Hombres Solos (Bulls)', desc: 'Rechaza la participación de hombres individuales.' },
  no_single_women: { label: 'No Mujeres Solas (Unicornios)', desc: 'Rechaza la participación de mujeres individuales.' },
  no_emotional_bonding: { label: 'Sin Involucramiento Emocional', desc: 'Prohíbe intenciones románticas o afectivas.' }
};

export const PRACTICE_LABELS: Record<keyof PracticesDict, { label: string; desc: string }> = {
  has_male_partner: { label: 'Pareja/Participante Masculino Activo', desc: 'Incluye a un hombre en la interacción.' },
  is_single_man: { label: 'Perfil Hombre Solo (Bull)', desc: 'Perfil individual masculino.' },
  is_single_woman: { label: 'Perfil Mujer Sola (Unicornio)', desc: 'Perfil individual femenino.' },
  seeking_male_interaction: { label: 'Busca Interacción Masculina', desc: 'Requiere presencia de hombres.' },
  penetration_required: { label: 'Requiere Penetración', desc: 'Busca o exige penetración activa.' },
  full_swap_mandatory: { label: 'Exige Full Swap Completo', desc: 'No acepta únicamente soft swap.' },
  no_condoms: { label: 'Practica Sexo Sin Preservativo', desc: 'Busca o practica sin protección.' },
  home_visits_only: { label: 'Solo Encuentros en Casa/Domicilio', desc: 'Exige que el encuentro sea en residencia.' },
  requires_romantic_bond: { label: 'Busca Vínculo Romántico / Poliamor', desc: 'Requiere conexión afectiva duradera.' }
};

export const INITIAL_VETOES: VetoesDict = {
  no_men: false,
  condom_mandatory: true,
  no_home_visits: false,
  no_penetration: false,
  no_single_men: false,
  no_single_women: false,
  no_emotional_bonding: false,
};

export const INITIAL_PRACTICES: PracticesDict = {
  has_male_partner: false,
  is_single_man: false,
  is_single_woman: false,
  seeking_male_interaction: false,
  penetration_required: false,
  full_swap_mandatory: false,
  no_condoms: false,
  home_visits_only: false,
  requires_romantic_bond: false,
};

export const TEST_PRESETS: TestCasePreset[] = [
  {
    id: 'case1',
    title: 'Caso 1: Pareja Conservadora (Soft Swap) vs Bull Agresivo',
    subtitle: 'Prueba de Filtro Booleano de Límites Duros (Hard-Veto Engine)',
    description: 'Pareja que solo acepta Soft Swap y prohíbe hombres solos frente a un Bull que busca Full Swap con penetración.',
    expectedResult: 'Veto Inmediato (Score: 0.0%) con desglose de colisiones.',
    isCoupleA: true,
    isCoupleB: false,
    riskAversion: 0.65,
    profileA_M1: {
      e1_relational_spectrum: -0.8,
      e2_third_party_orientation: -0.9,
      e3_power_dynamics: -0.5,
      e4_emotional_attachment: -0.8,
      e5_boundary_flexibility: -0.9
    },
    profileA_M2: {
      e1_relational_spectrum: -0.9,
      e2_third_party_orientation: -0.8,
      e3_power_dynamics: -0.6,
      e4_emotional_attachment: -0.9,
      e5_boundary_flexibility: -1.0
    },
    profileB_M1: {
      e1_relational_spectrum: 0.9,
      e2_third_party_orientation: 1.0,
      e3_power_dynamics: 0.8,
      e4_emotional_attachment: -0.5,
      e5_boundary_flexibility: 0.8
    },
    profileB_M2: null,
    vetoesA: {
      no_men: true,
      condom_mandatory: true,
      no_home_visits: false,
      no_penetration: true,
      no_single_men: true,
      no_single_women: false,
      no_emotional_bonding: true
    },
    practicesA: {
      has_male_partner: true,
      is_single_man: false,
      is_single_woman: false,
      seeking_male_interaction: false,
      penetration_required: false,
      full_swap_mandatory: false,
      no_condoms: false,
      home_visits_only: false,
      requires_romantic_bond: false
    },
    vetoesB: {
      no_men: false,
      condom_mandatory: false,
      no_home_visits: false,
      no_penetration: false,
      no_single_men: false,
      no_single_women: false,
      no_emotional_bonding: false
    },
    practicesB: {
      has_male_partner: false,
      is_single_man: true,
      is_single_woman: false,
      seeking_male_interaction: true,
      penetration_required: true,
      full_swap_mandatory: true,
      no_condoms: false,
      home_visits_only: false,
      requires_romantic_bond: false
    }
  },
  {
    id: 'case2',
    title: 'Caso 2: Pareja Abierta Equilibrada vs Unicornio Simétrica',
    subtitle: 'Prueba de Alta Afinidad Vectorial Coseno (> 85%)',
    description: 'Pareja Swinger experimentada en perfecta consonancia con una mujer sola bisexual que busca juego respetuoso y coordinado.',
    expectedResult: 'Afinidad de Selección Excelente (> 95%).',
    isCoupleA: true,
    isCoupleB: false,
    riskAversion: 0.65,
    profileA_M1: {
      e1_relational_spectrum: 0.5,
      e2_third_party_orientation: -0.8,
      e3_power_dynamics: 0.3,
      e4_emotional_attachment: -0.2,
      e5_boundary_flexibility: 0.6
    },
    profileA_M2: {
      e1_relational_spectrum: 0.6,
      e2_third_party_orientation: -0.9,
      e3_power_dynamics: 0.2,
      e4_emotional_attachment: -0.1,
      e5_boundary_flexibility: 0.7
    },
    profileB_M1: {
      e1_relational_spectrum: 0.6,
      e2_third_party_orientation: -0.9,
      e3_power_dynamics: 0.3,
      e4_emotional_attachment: -0.2,
      e5_boundary_flexibility: 0.7
    },
    profileB_M2: null,
    vetoesA: {
      no_men: false,
      condom_mandatory: true,
      no_home_visits: false,
      no_penetration: false,
      no_single_men: false,
      no_single_women: false,
      no_emotional_bonding: false
    },
    practicesA: {
      has_male_partner: true,
      is_single_man: false,
      is_single_woman: false,
      seeking_male_interaction: false,
      penetration_required: false,
      full_swap_mandatory: false,
      no_condoms: false,
      home_visits_only: false,
      requires_romantic_bond: false
    },
    vetoesB: {
      no_men: false,
      condom_mandatory: true,
      no_home_visits: false,
      no_penetration: false,
      no_single_men: false,
      no_single_women: false,
      no_emotional_bonding: false
    },
    practicesB: {
      has_male_partner: false,
      is_single_man: false,
      is_single_woman: true,
      seeking_male_interaction: false,
      penetration_required: false,
      full_swap_mandatory: false,
      no_condoms: false,
      home_visits_only: false,
      requires_romantic_bond: false
    }
  },
  {
    id: 'case3',
    title: 'Caso 3: Evaluación de Consenso con Pareja Asimétrica',
    subtitle: 'Prueba de Aversión al Riesgo (Miembro Estricto vs Flexible)',
    description: 'Miembro A prefiere Soft Swap estricto (-0.9) mientras el Miembro B desea Full Swap (+0.9). Evalúa la protección del confort del Miembro A.',
    expectedResult: 'Consenso E1 de Pareja se mantiene seguro en zona conservadora (-0.585) evitando el engaño del promedio 0.0.',
    isCoupleA: true,
    isCoupleB: true,
    riskAversion: 0.65,
    profileA_M1: {
      e1_relational_spectrum: -0.9,
      e2_third_party_orientation: -0.5,
      e3_power_dynamics: -0.5,
      e4_emotional_attachment: -0.5,
      e5_boundary_flexibility: -0.9
    },
    profileA_M2: {
      e1_relational_spectrum: 0.9,
      e2_third_party_orientation: -0.5,
      e3_power_dynamics: -0.5,
      e4_emotional_attachment: -0.5,
      e5_boundary_flexibility: 0.9
    },
    profileB_M1: {
      e1_relational_spectrum: -0.6,
      e2_third_party_orientation: -0.5,
      e3_power_dynamics: -0.5,
      e4_emotional_attachment: -0.5,
      e5_boundary_flexibility: -0.6
    },
    profileB_M2: {
      e1_relational_spectrum: -0.5,
      e2_third_party_orientation: -0.5,
      e3_power_dynamics: -0.5,
      e4_emotional_attachment: -0.5,
      e5_boundary_flexibility: -0.5
    },
    vetoesA: {
      no_men: false,
      condom_mandatory: true,
      no_home_visits: false,
      no_penetration: true,
      no_single_men: false,
      no_single_women: false,
      no_emotional_bonding: false
    },
    practicesA: {
      has_male_partner: true,
      is_single_man: false,
      is_single_woman: false,
      seeking_male_interaction: false,
      penetration_required: false,
      full_swap_mandatory: false,
      no_condoms: false,
      home_visits_only: false,
      requires_romantic_bond: false
    },
    vetoesB: {
      no_men: false,
      condom_mandatory: true,
      no_home_visits: false,
      no_penetration: false,
      no_single_men: false,
      no_single_women: false,
      no_emotional_bonding: false
    },
    practicesB: {
      has_male_partner: true,
      is_single_man: false,
      is_single_woman: false,
      seeking_male_interaction: false,
      penetration_required: false,
      full_swap_mandatory: false,
      no_condoms: false,
      home_visits_only: false,
      requires_romantic_bond: false
    }
  }
];
