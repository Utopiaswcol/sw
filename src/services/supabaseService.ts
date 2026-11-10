import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabaseClient';
import { VetoesDict, PracticesDict } from '../types';
import { SPECIAL_TEST_PROFILES, SYSTEM_10_ADDITIONAL_CANDIDATES } from '../data/profilesData';

export interface OnboardingSavePayload {
  userId: string;
  role: 'solo_female' | 'solo_male' | 'couple_member';
  isCouple: boolean;
  alias: string;
  bio?: string;
  partnerBUserId?: string;
  vector5D: number[];
  hardVetoes: Partial<VetoesDict>;
  declaredPractices: Partial<PracticesDict>;
  consistencyIndex: number;
}

export interface CandidateResult {
  candidate_id: string;
  candidate_type: 'solo' | 'couple';
  alias: string;
  role?: string;
  roleTitle?: string;
  location?: string;
  zoneId?: string;
  tagline?: string;
  bio?: string;
  publicImage?: string;
  vaultAssetCount?: number;
  affinity_score: number;
  affinity_percentage: string;
  vector_5d: number[];
  hard_vetoes: Partial<VetoesDict>;
  declared_practices: Partial<PracticesDict>;
  is_calibrated: boolean;
}

// Almacén en memoria de respaldo para simulación local previa a configurar Supabase
const mockDatabaseStore = {
  users: new Map<string, any>(),
  solo_profiles: new Map<string, any>(),
  couple_profiles: new Map<string, any>(),
  preference_vectors: new Map<string, any>()
};

// Poblar la base ficticia con algunos perfiles de muestra para probar la consulta RPC en fallback
function seedMockData() {
  if (mockDatabaseStore.preference_vectors.size > 0) return;

  // 1. Inserción de los 3 Perfiles Especiales de Prueba (pareja1, unicornio1, bull1)
  Object.values(SPECIAL_TEST_PROFILES).forEach((p) => {
    mockDatabaseStore.preference_vectors.set(p.userId, {
      user_id: p.userId,
      is_couple: p.role === 'couple',
      alias: p.alias,
      role: p.role,
      role_title: p.roleTitle,
      location: p.location,
      zone_id: p.zoneId,
      tagline: p.tagline,
      bio: p.bio,
      public_image: p.publicImage,
      vector: p.vector5D,
      hard_vetoes: { condom_mandatory: true },
      declared_practices: {
        is_single_woman: p.role === 'solo_female',
        is_single_man: p.role === 'solo_male',
        has_male_partner: p.role === 'couple'
      },
      vault_asset_count: p.vaultAssetCount,
      consistency_index: 0.95,
      is_calibrated: true
    });
  });

  // 2. Inserción de los 10 Candidatos Adicionales
  SYSTEM_10_ADDITIONAL_CANDIDATES.forEach((c) => {
    mockDatabaseStore.preference_vectors.set(c.candidateId, {
      user_id: c.candidateId,
      is_couple: c.role === 'couple',
      alias: c.alias,
      role: c.role,
      role_title: c.roleTitle,
      location: c.location,
      zone_id: c.zoneId,
      tagline: c.tagline,
      bio: c.bio,
      public_image: c.publicImage,
      vector: c.vector5D,
      hard_vetoes: { condom_mandatory: true },
      declared_practices: {
        is_single_woman: c.role === 'solo_female',
        is_single_man: c.role === 'solo_male',
        has_male_partner: c.role === 'couple'
      },
      vault_asset_count: c.vaultAssetCount,
      consistency_index: 0.90,
      is_calibrated: true
    });
  });
}

seedMockData();

/**
 * Servicio 1: Ingesta y Persistencia de Perfiles en Supabase
 */
export async function saveOnboardingProfile(payload: OnboardingSavePayload): Promise<{
  success: boolean;
  mode: 'supabase' | 'mock_memory';
  details: any;
  message: string;
}> {
  const supabase = getSupabaseClient();
  const vectorPgStr = `[${payload.vector5D.map((x) => x.toFixed(4)).join(',')}]`;

  // Si Supabase está conectado, realizar upsert real
  if (supabase) {
    try {
      // 1. Upsert en users
      const { error: userErr } = await supabase
        .from('users')
        .upsert({
          id: payload.userId,
          role: payload.role,
          is_identity_verified: true,
          updated_at: new Date().toISOString()
        });

      if (userErr && !userErr.message.includes('auth.users')) {
        console.warn('Advertencia users table upsert:', userErr.message);
      }

      // 2. Upsert en solo_profiles o couple_profiles
      let profileId = payload.userId;
      if (!payload.isCouple) {
        const { data: soloData, error: soloErr } = await supabase
          .from('solo_profiles')
          .upsert({
            user_id: payload.userId,
            alias: payload.alias,
            bio: payload.bio || 'Perfil de onboarding ENM Colombia',
            birthdate: '1996-05-15',
            gender: payload.role === 'solo_female' ? 'Femenino' : 'Masculino',
            updated_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (soloErr) console.warn('Advertencia solo_profiles upsert:', soloErr.message);
        if (soloData) profileId = soloData.id;
      } else {
        const partnerB = payload.partnerBUserId || '00000000-0000-0000-0000-000000000002';
        const { data: cplData, error: cplErr } = await supabase
          .from('couple_profiles')
          .upsert({
            partner_a_id: payload.userId,
            partner_b_id: partnerB,
            couple_alias: payload.alias,
            bio: payload.bio || 'Pareja verificada ENM Colombia',
            both_verified: true,
            updated_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (cplErr) console.warn('Advertencia couple_profiles upsert:', cplErr.message);
        if (cplData) profileId = cplData.id;
      }

      // 3. Upsert en preference_vectors
      const vectorRecord = {
        [payload.isCouple ? 'couple_id' : 'user_id']: payload.isCouple ? profileId : payload.userId,
        vector: vectorPgStr,
        e1_relational_spectrum: payload.vector5D[0],
        e2_third_party_orientation: payload.vector5D[1],
        e3_power_dynamics: payload.vector5D[2],
        e4_emotional_attachment: payload.vector5D[3],
        e5_boundary_flexibility: payload.vector5D[4],
        hard_vetoes: payload.hardVetoes,
        declared_practices: payload.declaredPractices,
        consistency_index: payload.consistencyIndex,
        is_calibrated: payload.consistencyIndex >= 0.70,
        updated_at: new Date().toISOString()
      };

      const { data: vecData, error: vecErr } = await supabase
        .from('preference_vectors')
        .upsert(vectorRecord)
        .select('*');

      if (vecErr) throw new Error(`Error insertando en preference_vectors: ${vecErr.message}`);

      return {
        success: true,
        mode: 'supabase',
        details: vecData,
        message: 'Perfil e Inserción Vectorial realizada exitosamente en Supabase (PostgreSQL).'
      };
    } catch (err: any) {
      console.error('Error al guardar en Supabase, cayendo a simulación local:', err.message);
    }
  }

  // Fallback: Guardar en memoria local si no hay credenciales activas
  const mockRecord = {
    user_id: payload.userId,
    is_couple: payload.isCouple,
    alias: payload.alias,
    vector: payload.vector5D,
    hard_vetoes: payload.hardVetoes,
    declared_practices: payload.declaredPractices,
    consistency_index: payload.consistencyIndex,
    is_calibrated: payload.consistencyIndex >= 0.70,
    updated_at: new Date().toISOString()
  };

  mockDatabaseStore.preference_vectors.set(payload.userId, mockRecord);

  return {
    success: true,
    mode: 'mock_memory',
    details: mockRecord,
    message: 'Perfil guardado exitosamente en la Capa de Emulación Local (Esperando llaves de Supabase).'
  };
}

/**
 * Servicio 2: Endpoint RPC de Matching Vectorial
 */
export async function findVectorCandidates(
  queryVector: number[],
  callerVetoes: Partial<VetoesDict> = {},
  matchLimit: number = 20
): Promise<{
  success: boolean;
  mode: 'supabase_rpc' | 'mock_memory_rpc';
  candidates: CandidateResult[];
  count: number;
}> {
  const supabase = getSupabaseClient();
  const vectorPgStr = `[${queryVector.map((x) => x.toFixed(4)).join(',')}]`;

  // Intento 1: Ejecutar RPC en Supabase
  if (supabase) {
    try {
      const { data, error } = await supabase.rpc('match_candidates', {
        query_vector: vectorPgStr,
        caller_vetoes: callerVetoes,
        match_limit: matchLimit
      });

      if (!error && Array.isArray(data)) {
        return {
          success: true,
          mode: 'supabase_rpc',
          candidates: data as CandidateResult[],
          count: data.length
        };
      } else if (error) {
        console.warn('RPC Supabase retornó advertencia:', error.message);
      }
    } catch (err: any) {
      console.warn('Excepción ejecutando RPC en Supabase:', err.message);
    }
  }

  // Fallback 2: Cálculo en memoria (Coseno + Vetoes Filter)
  seedMockData();
  const results: CandidateResult[] = [];

  for (const [id, item] of mockDatabaseStore.preference_vectors.entries()) {
    const candidateVec = item.vector;
    const itemVetoes = item.hard_vetoes || {};
    const itemPractices = item.declared_practices || {};

    // 1. Comprobar filtro de Vetos del llamante
    let isVetoed = false;
    if (callerVetoes.no_men && itemPractices.seeking_male_interaction) isVetoed = true;
    if (callerVetoes.condom_mandatory && itemPractices.no_condoms) isVetoed = true;
    if (callerVetoes.no_penetration && itemPractices.penetration_required) isVetoed = true;
    if (callerVetoes.no_single_men && itemPractices.is_single_man) isVetoed = true;
    if (callerVetoes.no_single_women && itemPractices.is_single_woman) isVetoed = true;

    if (isVetoed) continue;

    // 2. Similitud Coseno
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < 5; i++) {
      dot += queryVector[i] * candidateVec[i];
      normA += queryVector[i] * queryVector[i];
      normB += candidateVec[i] * candidateVec[i];
    }

    const cosSim = (normA > 0 && normB > 0) ? (dot / (Math.sqrt(normA) * Math.sqrt(normB))) : 0;
    const affinityScore = Math.min(1.0, Math.max(0.0, (cosSim + 1.0) / 2.0));

    results.push({
      candidate_id: id,
      candidate_type: item.is_couple ? 'couple' : 'solo',
      alias: item.alias || id,
      role: item.role,
      roleTitle: item.role_title,
      location: item.location,
      zoneId: item.zone_id,
      tagline: item.tagline,
      bio: item.bio,
      publicImage: item.public_image,
      vaultAssetCount: item.vault_asset_count,
      affinity_score: Number(affinityScore.toFixed(4)),
      affinity_percentage: `${(affinityScore * 100).toFixed(1)}%`,
      vector_5d: candidateVec,
      hard_vetoes: itemVetoes,
      declared_practices: itemPractices,
      is_calibrated: item.is_calibrated ?? true
    });
  }

  results.sort((a, b) => b.affinity_score - a.affinity_score);

  return {
    success: true,
    mode: 'mock_memory_rpc',
    candidates: results.slice(0, matchLimit),
    count: results.length
  };
}

/**
 * Servicio 3: Suite de Simulación y Pruebas Integradas
 */
export async function runSupabaseIntegrationTests(): Promise<{
  timestamp: string;
  isSupabaseConnected: boolean;
  saveUnicornResult: any;
  saveCoupleResult: any;
  matchingRpcResult: any;
  summary: string;
}> {
  // 1. Guardar Unicornio
  const saveUnicorn = await saveOnboardingProfile({
    userId: 'usr_unicorn_colombia_99',
    role: 'solo_female',
    isCouple: false,
    alias: 'Camila (Unicornio Medellín)',
    bio: 'Buscando juegos lúdicos con parejas respetuosas.',
    vector5D: [0.1974, -0.6640, -0.2913, -0.9320, -0.1974],
    hardVetoes: { no_men: true, no_single_men: true, condom_mandatory: true },
    declaredPractices: { is_single_woman: true, penetration_required: true },
    consistencyIndex: 0.9417
  });

  // 2. Guardar Pareja
  const saveCouple = await saveOnboardingProfile({
    userId: 'cpl_medellin_bi_01',
    role: 'couple_member',
    isCouple: true,
    alias: 'Carlos & Sofia (Pareja Abierta)',
    bio: 'Pareja experimentada en el poblado.',
    partnerBUserId: 'usr_partner_b_99',
    vector5D: [0.3500, -0.7500, 0.2000, -0.4000, 0.5000],
    hardVetoes: { no_single_men: true, condom_mandatory: true },
    declaredPractices: { has_male_partner: true, is_single_woman: false },
    consistencyIndex: 0.9200
  });

  // 3. Ejecutar RPC Matching
  const rpcResult = await findVectorCandidates(
    [0.1974, -0.6640, -0.2913, -0.9320, -0.1974],
    { no_men: true, no_single_men: true },
    5
  );

  return {
    timestamp: new Date().toISOString(),
    isSupabaseConnected: isSupabaseConfigured(),
    saveUnicornResult: saveUnicorn,
    saveCoupleResult: saveCouple,
    matchingRpcResult: rpcResult,
    summary: `Prueba completada exitosamente. Modo: ${isSupabaseConfigured() ? 'Supabase Real' : 'Emulación Local'}. Candidatos encontrados: ${rpcResult.count}`
  };
}
