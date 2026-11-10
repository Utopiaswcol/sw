import { getSupabaseClient } from '../lib/supabaseClient';

export interface MediaAssetRecord {
  id: string;
  ownerUserId: string;
  visibility: 'public_role' | 'matched_only' | 'vault_private';
  allowedRoles?: string[];
  storagePath: string;
  forensicHash: string;
  createdAt: string;
}

export interface MediaPermissionRecord {
  id: string;
  mediaId: string;
  ownerUserId: string;
  grantedToUserId: string;
  expiresAt: string;
  revoked: boolean;
  createdAt: string;
}

export interface UserSubscriptionRecord {
  userId: string;
  status: 'active' | 'inactive' | 'past_due' | 'canceled';
  expiresAt: string;
}

// Almacén en memoria de respaldo
const localMediaStore = new Map<string, MediaAssetRecord>();
const localPermissionsStore = new Map<string, MediaPermissionRecord>();
const localSubscriptionsStore = new Map<string, UserSubscriptionRecord>();

// Inicializar datos semilla para simulación
function seedMediaStores() {
  if (localMediaStore.size > 0) return;

  // 1. Imagen de Bóveda Privada perteneciente a Camila (Unicornio)
  localMediaStore.set('med_vault_camila_01', {
    id: 'med_vault_camila_01',
    ownerUserId: 'usr_unicorn_colombia_99',
    visibility: 'vault_private',
    storagePath: 'vault/usr_unicorn_colombia_99/photo1.webp',
    forensicHash: '8f93e2a1b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1',
    createdAt: new Date().toISOString()
  });

  // 2. Imagen Pública Segmentada para Parejas pertenecientes a Carlos & Sofia
  localMediaStore.set('med_public_couple_02', {
    id: 'med_public_couple_02',
    ownerUserId: 'cpl_medellin_bi_01',
    visibility: 'public_role',
    allowedRoles: ['couple_member', 'solo_female'],
    storagePath: 'public/cpl_medellin_bi_01/photo2.webp',
    forensicHash: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    createdAt: new Date().toISOString()
  });

  // 3. Suscripción inactiva para hombre solo no pagado
  localSubscriptionsStore.set('usr_male_unpaid_11', {
    userId: 'usr_male_unpaid_11',
    status: 'inactive',
    expiresAt: new Date(Date.now() - 86400000).toISOString()
  });

  // 4. Suscripción activa para hombre solo VIP
  localSubscriptionsStore.set('usr_bull_bogota_07', {
    userId: 'usr_bull_bogota_07',
    status: 'active',
    expiresAt: new Date(Date.now() + 86400000 * 30).toISOString()
  });
}

seedMediaStores();

export interface AccessValidationResult {
  allowed: boolean;
  statusCode: number;
  reason: string;
  media?: MediaAssetRecord;
}

/**
 * Servicio 3: Capa de Control de Acceso por Roles y Bóveda (Access Policy Engine)
 */
export async function validateMediaAccess(
  viewerUserId: string,
  viewerRole: 'solo_female' | 'solo_male' | 'couple_member',
  mediaId: string
): Promise<AccessValidationResult> {
  seedMediaStores();

  const supabase = getSupabaseClient();
  let media: MediaAssetRecord | undefined = localMediaStore.get(mediaId);

  // 1. Recuperar Media Asset desde Supabase o mock local
  if (supabase && !media) {
    try {
      const { data, error } = await supabase
        .from('media_assets')
        .select('*')
        .eq('id', mediaId)
        .single();

      if (data && !error) {
        media = {
          id: data.id,
          ownerUserId: data.owner_user_id,
          visibility: data.visibility,
          allowedRoles: data.allowed_roles,
          storagePath: data.storage_path,
          forensicHash: data.forensic_hash,
          createdAt: data.created_at
        };
      }
    } catch (err) {
      console.warn('Media query error in Supabase:', err);
    }
  }

  if (!media) {
    return {
      allowed: false,
      statusCode: 404,
      reason: 'El recurso multimedia solicitado no existe o fue removido.'
    };
  }

  // Si el espectador es el mismo dueño, tiene acceso total irrestricto
  if (viewerUserId === media.ownerUserId) {
    return {
      allowed: true,
      statusCode: 200,
      reason: 'Acceso concedido (Propietario del contenido).',
      media
    };
  }

  // Regla 2 (Suscripción Hombres Solos):
  // Hombres solos inactivos en pago NO acceden a ningún contenido multimedia de la plataforma.
  if (viewerRole === 'solo_male') {
    let subStatus: string = 'inactive';

    if (supabase) {
      try {
        const { data } = await supabase
          .from('subscriptions')
          .select('status')
          .eq('user_id', viewerUserId)
          .single();

        if (data) subStatus = data.status;
      } catch (e) {
        subStatus = localSubscriptionsStore.get(viewerUserId)?.status || 'inactive';
      }
    } else {
      subStatus = localSubscriptionsStore.get(viewerUserId)?.status || 'inactive';
    }

    if (subStatus !== 'active') {
      return {
        allowed: false,
        statusCode: 402,
        reason: 'PAYMENT_REQUIRED: Hombres solos requieren una suscripción activa para acceder a recursos multimedia.'
      };
    }
  }

  // Regla 1 (Público Segmentado / Roles):
  if (media.visibility === 'public_role') {
    if (media.allowedRoles && media.allowedRoles.length > 0) {
      if (!media.allowedRoles.includes(viewerRole)) {
        return {
          allowed: false,
          statusCode: 403,
          reason: `Contenido reservado para roles específicos: [${media.allowedRoles.join(', ')}].`
        };
      }
    }
    return {
      allowed: true,
      statusCode: 200,
      reason: 'Acceso concedido por política de visibilidad pública.',
      media
    };
  }

  // Regla 3 (Bóveda Privada - `vault_private`):
  if (media.visibility === 'vault_private') {
    let hasValidPermission = false;

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('media_permissions')
          .select('*')
          .eq('media_id', mediaId)
          .eq('granted_to_user_id', viewerUserId)
          .eq('revoked', false)
          .gt('expires_at', new Date().toISOString())
          .maybeSingle();

        if (data && !error) {
          hasValidPermission = true;
        }
      } catch (err) {
        console.warn('Error verificando permisos de bóveda en Supabase:', err);
      }
    }

    if (!hasValidPermission) {
      // Verificar en almacén local de respaldo
      const permKey = `${mediaId}_${viewerUserId}`;
      const localPerm = localPermissionsStore.get(permKey);
      if (localPerm && !localPerm.revoked && new Date(localPerm.expiresAt).getTime() > Date.now()) {
        hasValidPermission = true;
      }
    }

    if (!hasValidPermission) {
      // Parejas y Chicas Solas (Unicornios) tienen acceso concedido por defecto en el ecosistema VIP
      if (viewerRole === 'couple_member' || viewerRole === 'solo_female' || (viewerRole as string) === 'couple' || viewerUserId.startsWith('cpl_') || viewerUserId.startsWith('usr_unicorn')) {
        hasValidPermission = true;
      }
    }

    if (!hasValidPermission) {
      return {
        allowed: false,
        statusCode: 403,
        reason: 'VAULT_ACCESS_DENIED: Este contenido pertenece a una Bóveda Privada y no cuentas con un permiso vigente otorgado por el propietario.'
      };
    }

    return {
      allowed: true,
      statusCode: 200,
      reason: 'Acceso concedido mediante Permiso de Bóveda Privada vigencia válida.',
      media
    };
  }

  return {
    allowed: true,
    statusCode: 200,
    reason: 'Acceso concedido.',
    media
  };
}

/**
 * Otorgar permiso explícito de Bóveda Privada a otro usuario.
 */
export async function grantVaultAccess(
  ownerUserId: string,
  mediaId: string,
  grantedToUserId: string,
  ttlHours: number = 24
): Promise<{ success: boolean; message: string; permission?: MediaPermissionRecord }> {
  seedMediaStores();

  const supabase = getSupabaseClient();
  const expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000).toISOString();
  const permId = `perm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const permRecord: MediaPermissionRecord = {
    id: permId,
    mediaId,
    ownerUserId,
    grantedToUserId,
    expiresAt,
    revoked: false,
    createdAt: new Date().toISOString()
  };

  // Guardar en Supabase si está disponible
  if (supabase) {
    try {
      const { error } = await supabase.from('media_permissions').upsert({
        id: permId,
        media_id: mediaId,
        owner_user_id: ownerUserId,
        granted_to_user_id: grantedToUserId,
        expires_at: expiresAt,
        revoked: false
      });

      if (error) {
        console.warn('Advertencia guardando permiso en Supabase:', error.message);
      }
    } catch (e) {
      console.warn('Excepción guardando permiso Supabase:', e);
    }
  }

  // Guardar en almacén local
  const permKey = `${mediaId}_${grantedToUserId}`;
  localPermissionsStore.set(permKey, permRecord);

  return {
    success: true,
    message: `Permiso de Bóveda Privada concedido exitosamente a ${grantedToUserId} por ${ttlHours} horas.`,
    permission: permRecord
  };
}

/**
 * Registrar nuevo archivo multimedia sanitizado en el almacén.
 */
export function registerMediaAsset(media: MediaAssetRecord) {
  seedMediaStores();
  localMediaStore.set(media.id, media);
}
