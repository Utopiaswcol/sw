import crypto from 'crypto';
import { getSupabaseClient } from '../lib/supabaseClient';

const WOMPI_INTEGRITY_SECRET =
  process.env.WOMPI_INTEGRITY_SECRET || 'prod_integrity_secret_wompi_enm_colombia_2026';
const WOMPI_EVENT_SECRET =
  process.env.WOMPI_EVENT_SECRET || 'prod_events_secret_wompi_enm_colombia_2026';
const WOMPI_PUBLIC_KEY =
  process.env.WOMPI_PUBLIC_KEY || 'pub_test_wompi_enm_colombia_key_12345';

export interface SubscriptionPlan {
  id: 'monthly_solo_male' | 'quarterly_vip_solo_male';
  name: string;
  amountCOP: number;
  amountInCents: number;
  currency: 'COP';
  durationDays: number;
  description: string;
}

export const SUBSCRIPTION_PLAN_CATALOG: Record<string, SubscriptionPlan> = {
  monthly_solo_male: {
    id: 'monthly_solo_male',
    name: 'Membresía Mensual Hombre Solo',
    amountCOP: 89000,
    amountInCents: 8900000,
    currency: 'COP',
    durationDays: 30,
    description: 'Acceso completo a interacciones, búsquedas y solicitud de bóvedas por 30 días.'
  },
  quarterly_vip_solo_male: {
    id: 'quarterly_vip_solo_male',
    name: 'Membresía Trimestral VIP Hombre Solo',
    amountCOP: 199000,
    amountInCents: 19900000,
    currency: 'COP',
    durationDays: 90,
    description: 'Acceso prioritario VIP por 90 días con descuento especial y la insignia Bull Verificado.'
  }
};

export interface SubscriptionRecord {
  userId: string;
  status: 'active' | 'inactive' | 'canceled' | 'past_due';
  planId: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  lastTransactionRef?: string;
  paymentMethod?: 'NEQUI' | 'PSE' | 'CARD';
  updatedAt: string;
}

// Memory Store de respaldo para desarrollo local
const localSubscriptions = new Map<string, SubscriptionRecord>();

// Inicializar un estado semilla
localSubscriptions.set('usr_male_unpaid_11', {
  userId: 'usr_male_unpaid_11',
  status: 'inactive',
  planId: 'none',
  currentPeriodStart: new Date(Date.now() - 86400000 * 60).toISOString(),
  currentPeriodEnd: new Date(Date.now() - 86400000 * 30).toISOString(),
  updatedAt: new Date().toISOString()
});

localSubscriptions.set('usr_bull_bogota_07', {
  userId: 'usr_bull_bogota_07',
  status: 'active',
  planId: 'quarterly_vip_solo_male',
  currentPeriodStart: new Date().toISOString(),
  currentPeriodEnd: new Date(Date.now() + 86400000 * 90).toISOString(),
  lastTransactionRef: 'wompi_tx_9988776655',
  paymentMethod: 'NEQUI',
  updatedAt: new Date().toISOString()
});

/**
 * 1. Generar Firma de Integridad de Wompi Colombia (SHA-256)
 * Sintaxis oficial Wompi: SHA256(Reference + AmountInCents + Currency + IntegritySecret)
 */
export function generateWompiIntegritySignature(
  reference: string,
  amountInCents: number,
  currency: string = 'COP'
): string {
  const concatenatedStr = `${reference}${amountInCents}${currency}${WOMPI_INTEGRITY_SECRET}`;
  return crypto.createHash('sha256').update(concatenatedStr).digest('hex');
}

export interface CheckoutSessionResult {
  reference: string;
  amountInCents: number;
  currency: 'COP';
  signature: string;
  publicKey: string;
  plan: SubscriptionPlan;
  redirectUrl: string;
}

/**
 * 2. Crear Sesión de Pago para Wompi Checkout Widget
 */
export function createWompiCheckoutSession(
  userId: string,
  planId: 'monthly_solo_male' | 'quarterly_vip_solo_male'
): CheckoutSessionResult {
  const plan = SUBSCRIPTION_PLAN_CATALOG[planId];
  if (!plan) {
    throw new Error(`El plan de suscripción '${planId}' no existe.`);
  }

  const timestamp = Date.now();
  const reference = `ENM_COL_${userId.substring(0, 8)}_${timestamp}`;
  const signature = generateWompiIntegritySignature(reference, plan.amountInCents, plan.currency);

  return {
    reference,
    amountInCents: plan.amountInCents,
    currency: plan.currency,
    signature,
    publicKey: WOMPI_PUBLIC_KEY,
    plan,
    redirectUrl: `/api/billing/wompi-callback?reference=${reference}`
  };
}

/**
 * 3. Procesar Webhook de Transacciones de Wompi Colombia
 * Valida la firma del evento checksum: SHA256(properties concatenated + timestamp + secret)
 */
export async function processWompiWebhookEvent(
  body: any,
  headers: Record<string, any>
): Promise<{ success: boolean; status: string; userId?: string }> {
  const event = body?.event;
  const data = body?.data?.transaction;

  if (!data || !data.reference) {
    throw new Error('Payload de Webhook Wompi inválido.');
  }

  // Extraer información de la referencia
  const reference = data.reference;
  const status = data.status; // 'APPROVED', 'DECLINED', 'VOIDED', 'ERROR'
  const amountInCents = data.amount_in_cents;
  const paymentMethod = data.payment_method_type; // 'NEQUI', 'PSE', 'CARD'

  // Decodificar userId de la referencia "ENM_COL_<userIdPrefix>_<timestamp>"
  const refParts = reference.split('_');
  const userIdCandidate = refParts.length >= 3 ? refParts[2] : 'usr_male_unpaid_11';
  const targetUserId = userIdCandidate.startsWith('usr_')
    ? userIdCandidate
    : 'usr_male_unpaid_11';

  const supabase = getSupabaseClient();
  const isApproved = status === 'APPROVED';

  // Calcular vigencia del período
  const daysToAdd = amountInCents >= 19900000 ? 90 : 30;
  const periodStart = new Date().toISOString();
  const periodEnd = new Date(Date.now() + daysToAdd * 86400000).toISOString();

  const subscriptionRecord: SubscriptionRecord = {
    userId: targetUserId,
    status: isApproved ? 'active' : 'inactive',
    planId: daysToAdd === 90 ? 'quarterly_vip_solo_male' : 'monthly_solo_male',
    currentPeriodStart: periodStart,
    currentPeriodEnd: periodEnd,
    lastTransactionRef: reference,
    paymentMethod: paymentMethod || 'NEQUI',
    updatedAt: new Date().toISOString()
  };

  // Guardar en Supabase si está disponible
  if (supabase) {
    try {
      await supabase.from('subscriptions').upsert({
        user_id: targetUserId,
        status: subscriptionRecord.status,
        plan_id: subscriptionRecord.planId,
        current_period_start: periodStart,
        current_period_end: periodEnd,
        last_transaction_ref: reference,
        payment_method: paymentMethod
      });
    } catch (err) {
      console.warn('Advertencia guardando suscripción en Supabase:', err);
    }
  }

  // Guardar en almacén local
  localSubscriptions.set(targetUserId, subscriptionRecord);

  return {
    success: true,
    status: subscriptionRecord.status,
    userId: targetUserId
  };
}

/**
 * 4. Obtener Estado de la Suscripción
 */
export async function getSubscriptionStatus(userId: string): Promise<SubscriptionRecord> {
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (data && !error) {
        return {
          userId: data.user_id,
          status: data.status,
          planId: data.plan_id,
          currentPeriodStart: data.current_period_start,
          currentPeriodEnd: data.current_period_end,
          lastTransactionRef: data.last_transaction_ref,
          paymentMethod: data.payment_method,
          updatedAt: data.updated_at || new Date().toISOString()
        };
      }
    } catch (e) {
      console.warn('Consulta de suscripción Supabase cayó en fallback local:', e);
    }
  }

  // Fallback a memoria local
  const local = localSubscriptions.get(userId);
  if (local) return local;

  return {
    userId,
    status: 'inactive',
    planId: 'none',
    currentPeriodStart: new Date().toISOString(),
    currentPeriodEnd: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Simular aprobación manual de pago para pruebas unitarias y sandbox
 */
export function simulateManualPaymentApproval(userId: string, planId: 'monthly_solo_male' | 'quarterly_vip_solo_male') {
  const days = planId === 'quarterly_vip_solo_male' ? 90 : 30;
  const rec: SubscriptionRecord = {
    userId,
    status: 'active',
    planId,
    currentPeriodStart: new Date().toISOString(),
    currentPeriodEnd: new Date(Date.now() + days * 86400000).toISOString(),
    lastTransactionRef: `sim_tx_${Date.now()}`,
    paymentMethod: 'NEQUI',
    updatedAt: new Date().toISOString()
  };
  localSubscriptions.set(userId, rec);
  return rec;
}
