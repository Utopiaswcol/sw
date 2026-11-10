-- ===============================================================================
-- INFRAESTRUCTURA DE BASE DE DATOS DEFINITIVA Y CALIBRADA PARA SUPABASE
-- Plataforma de No-Monogamia Ética (ENM) y Club Social Aethel Vault Colombia
-- ===============================================================================
-- Autor: Arquitecto de Datos Senior & Diseñador de Producto
-- Versión: 3.0 (Calibración Crítica: Anti-Clasismo, Consentimiento RLS y Short-Circuit 5D)
-- 
-- CALIBRACIONES CLAVE:
-- 1. Eliminación de `sector_zone` para erradicar el clasismo territorial y sesgos de barrio.
-- 2. Sistema de Consentimiento y Pausa de Pareja (`consent_toggle_signed` y `paused_by_couple`) en RLS.
-- 3. Short-Circuit de Hard Vetoes antes de distancia coseno exacta para vectors $d=5$.
-- ===============================================================================

-- -------------------------------------------------------------------------------
-- 1. EXTENSIONES DE POSTGRESQL
-- -------------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- -------------------------------------------------------------------------------
-- 2. LIMPIEZA DE TABLAS Y FUNCIONES PREVIAS (Evita errores de columnas faltantes)
-- -------------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.match_candidates CASCADE;
DROP TABLE IF EXISTS public.ephemeral_messages CASCADE;
DROP TABLE IF EXISTS public.ephemeral_conversations CASCADE;
DROP TABLE IF EXISTS public.media_assets CASCADE;
DROP TABLE IF EXISTS public.private_events CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.preference_vectors CASCADE;
DROP TABLE IF EXISTS public.couple_profiles CASCADE;
DROP TABLE IF EXISTS public.solo_profiles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('solo_female', 'solo_male', 'couple_member');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('inactive', 'active', 'past_due', 'cancelled', 'trialing');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE visibility_level AS ENUM ('public_role', 'matched_only', 'vault_private');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


-- -------------------------------------------------------------------------------
-- 3. TABLAS DE USUARIOS Y PERFILES (SIN SESGO TERRITORIAL DE BARRIO)
-- -------------------------------------------------------------------------------

-- TABLA 1: users (Sincronizada con auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'couple_member',
    phone_number VARCHAR(30),
    is_identity_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role user_role NOT NULL DEFAULT 'couple_member';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(30);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_identity_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- TABLA 2: solo_profiles (Perfiles individuales - Únicamente Ciudad/Área Metropolitana)
CREATE TABLE IF NOT EXISTS public.solo_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    alias VARCHAR(80) NOT NULL,
    gender_role VARCHAR(50) NOT NULL, -- 'single_female' / 'single_male'
    bio TEXT,
    birthdate DATE DEFAULT '1995-06-15',
    city VARCHAR(100) NOT NULL DEFAULT 'Medellín', -- Sin sector_zone para evitar clasismo territorial
    avatar_url TEXT,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    is_vip BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLA 3: couple_profiles (Perfiles de Pareja - Únicamente Ciudad/Área Metropolitana)
CREATE TABLE IF NOT EXISTS public.couple_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_a_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    partner_b_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    couple_alias VARCHAR(100) NOT NULL,
    partner_a_name VARCHAR(100) DEFAULT 'Carlos',
    partner_b_name VARCHAR(100) DEFAULT 'Sofia',
    city VARCHAR(100) NOT NULL DEFAULT 'Medellín', -- Sin sector_zone para evitar clasismo territorial
    bio TEXT,
    both_verified BOOLEAN NOT NULL DEFAULT TRUE,
    is_travel_mode BOOLEAN NOT NULL DEFAULT FALSE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- -------------------------------------------------------------------------------
-- 4. TABLA DE VECTORES PSICOMÉTRICOS 5D Y FILTROS VETO
-- -------------------------------------------------------------------------------

-- TABLA 4: preference_vectors (Vectores 5D)
CREATE TABLE IF NOT EXISTS public.preference_vectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    couple_id UUID REFERENCES public.couple_profiles(id) ON DELETE CASCADE,
    vector vector(5) NOT NULL,
    e1_relational_spectrum NUMERIC(5,4) NOT NULL DEFAULT 0.0,
    e2_third_party_orientation NUMERIC(5,4) NOT NULL DEFAULT 0.0,
    e3_power_dynamics NUMERIC(5,4) NOT NULL DEFAULT 0.0,
    e4_emotional_attachment NUMERIC(5,4) NOT NULL DEFAULT 0.0,
    e5_boundary_flexibility NUMERIC(5,4) NOT NULL DEFAULT 0.0,
    risk_aversion_factor NUMERIC(4,3) NOT NULL DEFAULT 0.150,
    hard_vetoes JSONB NOT NULL DEFAULT '{}'::jsonb,
    declared_practices JSONB NOT NULL DEFAULT '{}'::jsonb,
    consistency_index NUMERIC(5,4) NOT NULL DEFAULT 1.0000,
    is_calibrated BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Asegurar columna couple_id si la tabla preference_vectors ya existía previamente
ALTER TABLE public.preference_vectors ADD COLUMN IF NOT EXISTS couple_id UUID REFERENCES public.couple_profiles(id) ON DELETE CASCADE;
ALTER TABLE public.preference_vectors ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;


-- -------------------------------------------------------------------------------
-- 5. TABLA DE SUSCRIPCIONES Y SEGUIMIENTO DE PAGOS
-- -------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    user_email VARCHAR(255),
    user_role VARCHAR(50) DEFAULT 'solo_male',
    plan_type VARCHAR(50) NOT NULL DEFAULT 'solo_male_monthly',
    gateway VARCHAR(30) NOT NULL DEFAULT 'wompi',
    payment_reference VARCHAR(100) UNIQUE NOT NULL,
    status subscription_status NOT NULL DEFAULT 'active',
    amount_cop NUMERIC(12,2) NOT NULL DEFAULT 89000.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'COP',
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL, -- Fecha de vencimiento del pago
    auto_renew BOOLEAN NOT NULL DEFAULT TRUE,
    payment_method VARCHAR(50) DEFAULT 'credit_card',
    last_four VARCHAR(4) DEFAULT '4242',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- -------------------------------------------------------------------------------
-- 6. GESTIÓN DE CONSENTIMIENTO Y PAUSA DE PAREJA (CANAL Y CHAT EFÍMERO)
-- -------------------------------------------------------------------------------

-- TABLA 6: ephemeral_conversations (Control de canal con Consentimiento y Pausa)
CREATE TABLE IF NOT EXISTS public.ephemeral_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id VARCHAR(100) UNIQUE NOT NULL,
    couple_id UUID REFERENCES public.couple_profiles(id) ON DELETE CASCADE,
    solo_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- SWITCHES CRÍTICOS DE CONSENTIMIENTO Y PAUSA
    consent_toggle_signed BOOLEAN NOT NULL DEFAULT TRUE, -- Consentimiento explícito activo
    paused_by_couple BOOLEAN NOT NULL DEFAULT FALSE,      -- Pausa de la pareja sin borrar canal
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ephemeral_conversations ADD COLUMN IF NOT EXISTS couple_id UUID REFERENCES public.couple_profiles(id) ON DELETE CASCADE;
ALTER TABLE public.ephemeral_conversations ADD COLUMN IF NOT EXISTS solo_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;

-- TABLA 7: ephemeral_messages (Mensajes Cifrados en Chat)
CREATE TABLE IF NOT EXISTS public.ephemeral_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id VARCHAR(100) NOT NULL REFERENCES public.ephemeral_conversations(room_id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    encrypted_payload TEXT NOT NULL,
    burn_after_read_seconds INT DEFAULT 86400,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- -------------------------------------------------------------------------------
-- 7. AGENDA DE EVENTOS Y BÓVEDA PRIVADA
-- -------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.private_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(120) NOT NULL,
    city VARCHAR(80) NOT NULL DEFAULT 'Medellín',
    event_date TIMESTAMPTZ NOT NULL,
    doors_open VARCHAR(20) DEFAULT '9:00 PM',
    target_audience JSONB NOT NULL DEFAULT '{"allow_couples": true, "allow_single_females": true, "allow_single_males": false}'::jsonb,
    pricing_model JSONB NOT NULL DEFAULT '{"couples_price_cop": 120000, "single_females_price_cop": 0, "single_males_price_cop": 180000}'::jsonb,
    dress_code VARCHAR(100) DEFAULT 'Elegante / Dark Chic',
    rules TEXT[] DEFAULT ARRAY['Consentimiento explícito obligatorio', 'Sellos adhesivos en cámaras de smartphones'],
    whatsapp_number VARCHAR(30) NOT NULL,
    flyer_url TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    owner_couple_id UUID REFERENCES public.couple_profiles(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    visibility visibility_level NOT NULL DEFAULT 'matched_only',
    forensic_hash VARCHAR(128),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.media_assets ADD COLUMN IF NOT EXISTS owner_couple_id UUID REFERENCES public.couple_profiles(id) ON DELETE CASCADE;


-- -------------------------------------------------------------------------------
-- 8. INDEXACIÓN ÓPTIMA (B-TREE SECUNDARIOS)
-- -------------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_pref_vectors_user_id ON public.preference_vectors(user_id);
CREATE INDEX IF NOT EXISTS idx_pref_vectors_couple_id ON public.preference_vectors(couple_id);
CREATE INDEX IF NOT EXISTS idx_solo_profiles_user_id ON public.solo_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_ephemeral_conversations_room ON public.ephemeral_conversations(room_id);


-- -------------------------------------------------------------------------------
-- 9. POLITICAS DE SEGURIDAD RLS (LÓGICA DE PAUSA Y CONSENTIMIENTO)
-- -------------------------------------------------------------------------------

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solo_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preference_vectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ephemeral_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ephemeral_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

-- POLICY ZERO-CRON: Evaluación en tiempo real (al segundo exacto con NOW()) para Bóveda Privada
CREATE POLICY solo_males_active_access ON public.media_assets
FOR SELECT USING (
    auth.role() = 'service_role'
    OR owner_user_id = auth.uid()
    OR visibility = 'public_role'
    OR EXISTS (
        SELECT 1 FROM public.subscriptions s
        WHERE s.user_id = auth.uid() 
          AND s.status = 'active' 
          AND s.current_period_end > NOW() -- Corte dinámico al segundo exacto sin Cron Job
    )
);

-- RLS Mensajería: LECTURA permitida de historial previo, PERO ENVÍO BLOQUEADO si paused_by_couple = TRUE
CREATE POLICY rls_ephemeral_messages_select ON public.ephemeral_messages
    FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY rls_ephemeral_messages_insert ON public.ephemeral_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.ephemeral_conversations ec
            WHERE ec.room_id = room_id
            AND ec.consent_toggle_signed = TRUE
            AND ec.paused_by_couple = FALSE -- Bloquea nuevos mensajes en caso de pausa, preservando historial
        ) OR auth.role() = 'service_role'
    );


-- -------------------------------------------------------------------------------
-- 10. RPC: MATCHING VECTORIAL EXACTO CON SHORT-CIRCUIT DE HARD VETOES
-- -------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.match_candidates(
    query_vector vector(5),
    caller_vetoes JSONB DEFAULT '{}'::jsonb,
    match_limit INT DEFAULT 20
)
RETURNS TABLE (
    candidate_id UUID,
    candidate_type TEXT,
    alias TEXT,
    affinity_score NUMERIC(5,4),
    affinity_percentage TEXT,
    vector_5d JSONB,
    hard_vetoes JSONB,
    declared_practices JSONB,
    is_calibrated BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    -- PASO 1: SHORT-CIRCUIT (Filtrar primero por vetos antes de calcular distancia coseno)
    WITH filtered_candidates AS (
        SELECT 
            pv.id AS pref_id,
            COALESCE(pv.user_id, pv.couple_id) AS entity_id,
            CASE WHEN pv.user_id IS NOT NULL THEN 'solo' ELSE 'couple' END AS entity_type,
            COALESCE(sp.alias, cp.couple_alias, 'Anónimo') AS entity_alias,
            pv.vector,
            pv.hard_vetoes,
            pv.declared_practices,
            pv.is_calibrated
        FROM public.preference_vectors pv
        LEFT JOIN public.solo_profiles sp ON sp.user_id = pv.user_id
        LEFT JOIN public.couple_profiles cp ON cp.id = pv.couple_id
        WHERE 
            pv.is_calibrated = TRUE
            -- CORTOCIRCUITO ESTRICTO: Descarta incompatibles inmediatamente
            AND NOT (
                ((caller_vetoes->>'no_men')::boolean = true AND (pv.declared_practices->>'seeking_male_interaction')::boolean = true) OR
                ((caller_vetoes->>'condom_mandatory')::boolean = true AND (pv.declared_practices->>'no_condoms')::boolean = true) OR
                ((caller_vetoes->>'no_penetration')::boolean = true AND (pv.declared_practices->>'penetration_required')::boolean = true) OR
                ((caller_vetoes->>'no_single_men')::boolean = true AND (pv.declared_practices->>'is_single_man')::boolean = true) OR
                ((caller_vetoes->>'no_single_women')::boolean = true AND (pv.declared_practices->>'is_single_woman')::boolean = true)
            )
    ),
    -- PASO 2: CÁLCULO DE DISTANCIA COSENO EXACTA SOLO SOBRE CANDIDATOS VÁLIDOS
    scored_candidates AS (
        SELECT 
            fc.entity_id,
            fc.entity_type,
            fc.entity_alias,
            fc.vector,
            fc.hard_vetoes,
            fc.declared_practices,
            fc.is_calibrated,
            -- Distancia Coseno exacta (1 - coseno) convertida a similitud [0.0, 1.0]
            ((1.0 - (fc.vector <=> query_vector)) + 1.0) / 2.0 AS calculated_affinity
        FROM filtered_candidates fc
    )
    SELECT 
        sc.entity_id AS candidate_id,
        sc.entity_type AS candidate_type,
        sc.entity_alias AS alias,
        ROUND(sc.calculated_affinity::numeric, 4) AS affinity_score,
        (ROUND((sc.calculated_affinity * 100)::numeric, 1) || '%') AS affinity_percentage,
        to_jsonb(sc.vector) AS vector_5d,
        sc.hard_vetoes,
        sc.declared_practices,
        sc.is_calibrated
    FROM scored_candidates sc
    ORDER BY sc.calculated_affinity DESC
    LIMIT match_limit;
END;
$$;


-- -------------------------------------------------------------------------------
-- 11. DATOS SEMILLA (SEED DATA)
-- -------------------------------------------------------------------------------

INSERT INTO public.users (id, email, role, is_identity_verified) VALUES
('11111111-1111-1111-1111-111111111111', 'carlos.sofia@aethel.co', 'couple_member', true),
('22222222-2222-2222-2222-222222222222', 'alejandro.bull@aethel.co', 'solo_male', true),
('33333333-3333-3333-3333-333333333333', 'camila.unicornio@aethel.co', 'solo_female', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.couple_profiles (id, partner_a_id, couple_alias, partner_a_name, partner_b_name, city, bio, both_verified) VALUES
('c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Carlos & Sofia (Medellín)', 'Carlos', 'Sofia', 'Medellín', 'Pareja en búsqueda de experiencias éticas.', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.solo_profiles (user_id, alias, gender_role, city, bio, is_vip) VALUES
('22222222-2222-2222-2222-222222222222', 'Alejandro (Bogotá)', 'single_male', 'Bogotá', 'Single calificado con membresía VIP al día.', true),
('33333333-3333-3333-3333-333333333333', 'Camila (Medellín)', 'single_female', 'Medellín', 'Unicornio bi explorando afinidad 5D.', true)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.subscriptions (user_id, user_email, user_role, plan_type, gateway, payment_reference, status, amount_cop, current_period_start, current_period_end) VALUES
('22222222-2222-2222-2222-222222222222', 'alejandro.bull@aethel.co', 'solo_male', 'solo_male_monthly', 'wompi', 'WOMPI_TX_2026_98123', 'active', 89000.00, NOW(), NOW() + INTERVAL '30 days')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.ephemeral_conversations (room_id, couple_id, solo_user_id, consent_toggle_signed, paused_by_couple) VALUES
('room_cpl_1111_sol_2222', 'c1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', true, false)
ON CONFLICT (room_id) DO NOTHING;

INSERT INTO public.preference_vectors (couple_id, vector, e1_relational_spectrum, e2_third_party_orientation, e3_power_dynamics, e4_emotional_attachment, e5_boundary_flexibility, hard_vetoes, declared_practices) VALUES
('c1111111-1111-1111-1111-111111111111', '[0.3500, -0.7500, 0.2000, -0.4000, 0.5000]', 0.3500, -0.7500, 0.2000, -0.4000, 0.5000, '{"no_single_men": true, "condom_mandatory": true}', '{"has_male_partner": true, "penetration_required": true}')
ON CONFLICT DO NOTHING;

-- ===============================================================================
-- FIN DEL SCRIPT CALIBRADO
-- ===============================================================================
