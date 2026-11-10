export interface TestProfile {
  username: string; // pareja1 | unicornio1 | bull1
  pin: string; // 1234
  userId: string;
  alias: string;
  role: 'couple' | 'solo_female' | 'solo_male';
  roleTitle: string;
  location: string;
  tagline: string;
  bio: string;
  publicImage: string;
  vector5D: [number, number, number, number, number];
  hardVetoes: string[];
  verifiedBadges: string[];
  vaultAssetCount: number;
  zoneId: string;
  // Community Social Vouching & Event Badges
  inPersonVouchesCount?: number;
  vouchedByCouples?: string[];
  eventsOrganizedCount?: number;
  eventsAttendedCount?: number;
  isCommunityVouched?: boolean;
  isHostBadge?: boolean;
  isAmbassador?: boolean;
  creatorExternalLink?: string;
}

export interface SystemCandidate {
  candidateId: string;
  alias: string;
  role: 'couple' | 'solo_female' | 'solo_male';
  roleTitle: string;
  location: string;
  zoneId: string;
  zoneLabel?: string;
  proximityLabel?: string;
  tagline: string;
  bio: string;
  affinityPercentage: number;
  cosineDistance: number;
  vetoCheckPassed: boolean;
  vector5D: [number, number, number, number, number];
  publicImage: string;
  vaultMediaId: string;
  vaultAssetCount: number;
  hasVaultPermission: boolean;
  hardVetoesRespected: string[];
  verifiedBadges: string[];
  privacyMode?: 'public' | 'blur_discreet' | 'blur_maximum';
  // Community Social Vouching & Event Badges
  inPersonVouchesCount?: number;
  vouchedByCouples?: string[];
  eventsOrganizedCount?: number;
  eventsAttendedCount?: number;
  isCommunityVouched?: boolean;
  isHostBadge?: boolean;
  isAmbassador?: boolean;
  creatorExternalLink?: string;
}

export const SPECIAL_TEST_PROFILES: Record<'pareja1' | 'unicornio1' | 'bull1', TestProfile> = {
  pareja1: {
    username: 'pareja1',
    pin: '1234',
    userId: 'cpl_pareja1_med_bog',
    alias: 'Carlos & Sofía',
    role: 'couple',
    roleTitle: 'Pareja Verificada VIP',
    location: 'Medellín / Bogotá D.C.',
    tagline: 'Pareja Bi Bilingüe • Consenso Ético ENM Colombia',
    bio: 'Carlos (33) y Sofía (30). Pareja con acuerdo de consenso ético en ENM Colombia. Buscamos conexiones reales con unicornios y parejas afines en un ambiente de absoluto respeto.',
    publicImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
    vector5D: [0.35, -0.75, 0.20, -0.40, 0.50],
    hardVetoes: ['preservativo_obligatorio', 'no_hombres_solos_no_verificados'],
    verifiedBadges: ['Biometría 3D Pareja OK', 'Validación KYC Wompi', 'Test ETS 2026 Vigente'],
    vaultAssetCount: 5,
    zoneId: 'med_poblado',
    inPersonVouchesCount: 3,
    vouchedByCouples: ['Felipe & Juliana (VIP)', 'Andrés & Mónica (VIP)', 'Daniel & Andrea (VIP)'],
    eventsOrganizedCount: 2,
    eventsAttendedCount: 6,
    isCommunityVouched: true,
    isHostBadge: true,
    isAmbassador: true,
    creatorExternalLink: 'https://fanvue.com/carlos_sofia_official'
  },
  unicornio1: {
    username: 'unicornio1',
    pin: '1235',
    userId: 'usr_unicornio1_med',
    alias: 'Camila V.',
    role: 'solo_female',
    roleTitle: 'Chica Sola / Unicornio VIP',
    location: 'Medellín',
    tagline: 'Exploradora Bisexual • Independiente & Discreta',
    bio: 'Camila (27). Mujer independiente y exploradora de dinámicas poliamorosas. Disfruto química genuina con parejas verificadas y respetuosas.',
    publicImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    vector5D: [0.80, 0.50, 0.90, -0.20, 0.70],
    hardVetoes: ['preservativo_obligatorio', 'no_parejas_sin_verificacion_dual'],
    verifiedBadges: ['Unicornio Verificada VIP', 'Firma Digital de Límites', 'Biometría Facial OK'],
    vaultAssetCount: 6,
    zoneId: 'med_laureles',
    inPersonVouchesCount: 4,
    vouchedByCouples: ['Carlos & Sofía (VIP)', 'Sebastián & Valeria (VIP)', 'Mateo & Laura (VIP)'],
    eventsOrganizedCount: 1,
    eventsAttendedCount: 8,
    isCommunityVouched: true,
    isHostBadge: false,
    isAmbassador: true,
    creatorExternalLink: 'https://onlyfans.com/camila_v_exclusive'
  },
  bull1: {
    username: 'bull1',
    pin: '1236',
    userId: 'usr_bull1_bog',
    alias: 'Alejandro M.',
    role: 'solo_male',
    roleTitle: 'Hombre Solo / Bull VIP',
    location: 'Bogotá D.C.',
    tagline: 'Single Calificado • Pase Wompi VIP Activo',
    bio: 'Alejandro (34). Hombre solo con acreditación Wompi VIP activa. Discreto, deportista y enfocado en la experiencia y el ritmo que establezca la pareja.',
    publicImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
    vector5D: [0.20, -0.80, -0.30, 0.40, 0.20],
    hardVetoes: ['preservativo_obligatorio'],
    verifiedBadges: ['Pase Wompi VIP Activo', 'Antecedentes Verificados', 'Biometría 3D OK'],
    vaultAssetCount: 4,
    zoneId: 'bog_poblado_rosa',
    inPersonVouchesCount: 2,
    vouchedByCouples: ['Carlos & Sofía (VIP)', 'Andrés & Mónica (VIP)'],
    eventsOrganizedCount: 0,
    eventsAttendedCount: 5,
    isCommunityVouched: true,
    isHostBadge: false,
    isAmbassador: false
  }
};

export const SYSTEM_10_ADDITIONAL_CANDIDATES: SystemCandidate[] = [
  {
    candidateId: 'cpl_bogota_01',
    alias: 'Felipe & Juliana',
    role: 'couple',
    roleTitle: 'Pareja Swinger / Soft Swap',
    location: 'Bogotá D.C.',
    zoneId: 'bog_usaquen',
    tagline: 'Profesionales en Bogotá • Exploración con ritmo suave',
    bio: 'Felipe (35) y Juliana (32). Disfrutamos cenas, catas de vino y encuentros privados con parejas afines. Valoramos la conversación y la discreción ante todo.',
    affinityPercentage: 94,
    cosineDistance: 0.06,
    vetoCheckPassed: true,
    vector5D: [0.4, -0.6, 0.3, -0.2, 0.6],
    publicImage: 'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?auto=format&fit=crop&w=800&q=80',
    vaultMediaId: 'med_vault_cpl_bog_01',
    vaultAssetCount: 4,
    hasVaultPermission: true,
    hardVetoesRespected: ['Preservativo Obligatorio', 'No Visitas Domiciliarias'],
    verifiedBadges: ['Validación Biométrica Dual', 'Miembros VIP Bogotá']
  },
  {
    candidateId: 'cpl_cartagena_02',
    alias: 'Sebastian & Laura',
    role: 'couple',
    roleTitle: 'Pareja Swinger / Lifestyle Resort',
    location: 'Cartagena de Indias',
    zoneId: 'ctg_boca_grande',
    tagline: 'Escapadas de playa & encuentros exclusivos en Cartagena',
    bio: 'Anfitriones en Cartagena. Nos encanta invitar parejas y chicas solas a veladas en yate o villa privada. Ambiente seguro, de lujo y sin presiones.',
    affinityPercentage: 91,
    cosineDistance: 0.09,
    vetoCheckPassed: true,
    vector5D: [0.6, -0.4, 0.5, -0.5, 0.8],
    publicImage: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80',
    vaultMediaId: 'med_vault_cpl_ctg_02',
    vaultAssetCount: 7,
    hasVaultPermission: true,
    hardVetoesRespected: ['Preservativo Obligatorio', 'Consentimiento Previo Mandatorio'],
    verifiedBadges: ['Yacht Verified Hosts', 'KYC Cartagena Premium']
  },
  {
    candidateId: 'cpl_anapoima_03',
    alias: 'David & Andrea',
    role: 'couple',
    roleTitle: 'Pareja Abierta en Consenso',
    location: 'Anapoima',
    zoneId: 'esc_anapoima',
    tagline: 'Fines de semana de sol, piscina y libertad en Anapoima',
    bio: 'Tenemos casa campestre en Anapoima. Nos fascina desconectarnos del ruido de Bogotá los fines de semana y compartir momentos memorables.',
    affinityPercentage: 89,
    cosineDistance: 0.11,
    vetoCheckPassed: true,
    vector5D: [0.3, -0.8, 0.1, -0.3, 0.4],
    publicImage: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80',
    vaultMediaId: 'med_vault_cpl_anap_03',
    vaultAssetCount: 5,
    hasVaultPermission: true,
    hardVetoesRespected: ['Preservativo Obligatorio', 'No Solos No Verificados'],
    verifiedBadges: ['Anfitriones Anapoima VIP', 'Verificación Facial OK']
  },
  {
    candidateId: 'cpl_villadeleyva_04',
    alias: 'Camilo & Maria',
    role: 'couple',
    roleTitle: 'Pareja Soft Swap & Vinos',
    location: 'Villa de Leyva',
    zoneId: 'esc_villa_leyva',
    tagline: 'Vinos, chimenea y conversaciones profundas en Villa de Leyva',
    bio: 'Apasionados por la gastronomía, la naturaleza y el intercambio suave en viajes. Fines de semana culturales y eróticos en ambiente privado.',
    affinityPercentage: 87,
    cosineDistance: 0.13,
    vetoCheckPassed: true,
    vector5D: [-0.2, -0.5, -0.1, 0.2, 0.3],
    publicImage: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=800&q=80',
    vaultMediaId: 'med_vault_cpl_vleyva_04',
    vaultAssetCount: 3,
    hasVaultPermission: true,
    hardVetoesRespected: ['Preservativo Obligatorio', 'Sin Penetración en 1ra Cita'],
    verifiedBadges: ['Identidad Verificada', 'Perfil Histórico Limpio']
  },
  {
    candidateId: 'cpl_girardot_05',
    alias: 'Andres & Natalia',
    role: 'couple',
    roleTitle: 'Pareja Swinger / Sol y Fiesta',
    location: 'Girardot',
    zoneId: 'esc_girardot',
    tagline: 'Clima cálido, cocktails y excelente energía en Girardot',
    bio: 'Buscamos romper la rutina bogotana en Girardot o Melgar. Nos encanta la buena música, la piscina nocturna y conocer personas relajadas y seguras.',
    affinityPercentage: 86,
    cosineDistance: 0.14,
    vetoCheckPassed: true,
    vector5D: [0.5, -0.3, 0.4, -0.4, 0.6],
    publicImage: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
    vaultMediaId: 'med_vault_cpl_gir_05',
    vaultAssetCount: 6,
    hasVaultPermission: true,
    hardVetoesRespected: ['Preservativo Obligatorio'],
    verifiedBadges: ['Miembros Verificados', 'Test Sanitario Al Día']
  },
  {
    candidateId: 'usr_unicornio_bogota_02',
    alias: 'Valentina',
    role: 'solo_female',
    roleTitle: 'Chica Sola / Unicornio VIP',
    location: 'Bogotá D.C.',
    zoneId: 'bog_chapinero',
    tagline: 'Diseñadora gráfica • Buscando química con parejas afines',
    bio: 'Valentina (28 años). Creativa, viajera y con mente abierta. Disfruto conocer parejas educadas para salidas a restaurantes, galerías y momentos íntimos.',
    affinityPercentage: 93,
    cosineDistance: 0.07,
    vetoCheckPassed: true,
    vector5D: [0.7, 0.4, 0.8, -0.1, 0.6],
    publicImage: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
    vaultMediaId: 'med_vault_uni_bog_02',
    vaultAssetCount: 5,
    hasVaultPermission: true,
    hardVetoesRespected: ['Preservativo Obligatorio', 'No Solo Hombres'],
    verifiedBadges: ['Unicornio Verificada VIP', 'Biometría 3D Aprobada']
  },
  {
    candidateId: 'usr_unicornio_cali_03',
    alias: 'Isabella',
    role: 'solo_female',
    roleTitle: 'Chica Sola / Unicornio',
    location: 'Cali',
    zoneId: 'cal_ciudad_jardin',
    tagline: 'Música, baile y conexiones transparentes en Cali',
    bio: 'Isabella (26 años). Bailarina e instructora de yoga. Amo la espontaneidad y las parejas que saben comunicarse claramente sin dramas.',
    affinityPercentage: 90,
    cosineDistance: 0.10,
    vetoCheckPassed: true,
    vector5D: [0.8, 0.6, 0.7, -0.3, 0.8],
    publicImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
    vaultMediaId: 'med_vault_uni_cali_03',
    vaultAssetCount: 4,
    hasVaultPermission: true,
    hardVetoesRespected: ['Preservativo Obligatorio', 'No Citas Sin Previo Café'],
    verifiedBadges: ['Verificada Cali Premium', 'Firma de Consenso OK']
  },
  {
    candidateId: 'usr_unicornio_eje_04',
    alias: 'Mariana',
    role: 'solo_female',
    roleTitle: 'Chica Sola / Unicornio',
    location: 'Pereira / Eje Cafetero',
    zoneId: 'esc_eje_cafetero',
    tagline: 'Naturaleza, paz y experiencias consensuadas',
    bio: 'Mariana (29 años). Médica veterinaria. Busco conexiones genuinas y respetuosas en el Eje Cafetero o escapadas a fincas campestres.',
    affinityPercentage: 88,
    cosineDistance: 0.12,
    vetoCheckPassed: true,
    vector5D: [0.6, 0.3, 0.5, 0.1, 0.5],
    publicImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
    vaultMediaId: 'med_vault_uni_eje_04',
    vaultAssetCount: 6,
    hasVaultPermission: true,
    hardVetoesRespected: ['Preservativo Obligatorio'],
    verifiedBadges: ['Verificación Sanitaria Al Día', 'Identidad Cifrada']
  },
  {
    candidateId: 'usr_bull_medellin_02',
    alias: 'Mateo',
    role: 'solo_male',
    roleTitle: 'Hombre Solo / Bull VIP',
    location: 'Medellín',
    zoneId: 'med_poblado',
    tagline: 'Single Deportivo • Pase Wompi VIP Activo',
    bio: 'Mateo (31 años). Emprendedor tecnológico en Medellín. Atractivo, educado, respetuoso con las parejas y enfocado en el placer mutuo.',
    affinityPercentage: 89,
    cosineDistance: 0.11,
    vetoCheckPassed: true,
    vector5D: [0.3, -0.7, -0.2, 0.3, 0.4],
    publicImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
    vaultMediaId: 'med_vault_bull_med_02',
    vaultAssetCount: 4,
    hasVaultPermission: true,
    hardVetoesRespected: ['Preservativo Obligatorio', 'Respeto Absoluto a la Pareja'],
    verifiedBadges: ['Pase Wompi VIP Activo', 'Certificado Anticedentes OK']
  },
  {
    candidateId: 'usr_bull_llanos_04',
    alias: 'Santiago',
    role: 'solo_male',
    roleTitle: 'Hombre Solo / Bull VIP',
    location: 'Villavicencio',
    zoneId: 'esc_llanos',
    tagline: 'Discreción, caballerosidad y actitud relajada',
    bio: 'Santiago (36 años). Administrador de empresas ganaderas. Atento, pulcro y con alta valoración en el protocolo de pareja.',
    affinityPercentage: 85,
    cosineDistance: 0.15,
    vetoCheckPassed: true,
    vector5D: [0.1, -0.6, -0.4, 0.5, 0.2],
    publicImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=800&q=80',
    vaultMediaId: 'med_vault_bull_llanos_04',
    vaultAssetCount: 3,
    hasVaultPermission: true,
    hardVetoesRespected: ['Preservativo Obligatorio'],
    verifiedBadges: ['Verificación Wompi Activa', 'KYC Completo']
  }
];
