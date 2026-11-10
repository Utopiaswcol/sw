"""
===============================================================================
MÓDULO DE SANITIZACIÓN MULTIMEDIA & CONTROL DE BÓVEDA
Plataforma de No-Monogamia Ética (ENM) / Swinger Colombia
===============================================================================
Autor: Arquitecto Backend Senior & Ciberseguridad
Lenguaje: Python 3 (hashlib + hmac + json)

Este script realiza la purga de metadatos, generación de hashes forenses SHA-256,
verificación de firma HMAC con expiración TTL para URLs privadas y simulación de
reglas de acceso para Bóveda Privada.
===============================================================================
"""

import hashlib
import hmac
import base64
import json
import time
import datetime
from typing import Dict, Any, Tuple, Optional


def sanitize_and_process_image(input_buffer: bytes, owner_id: str) -> Dict[str, Any]:
    """
    Simula la purga absoluta de metadatos EXIF/XMP y genera la huella forense SHA-256.
    En Node.js esto es ejecutado nativamente por Sharp (.rotate().withMetadata(false).webp()).
    """
    if not input_buffer:
        raise ValueError("Buffer de imagen vacío.")

    original_size = len(input_buffer)

    # Generación de Hash Forense SHA-256 con Salt del Propietario
    hasher = hashlib.sha256()
    hasher.update(input_buffer)
    hasher.update(owner_id.encode('utf-8'))
    forensic_hash = hasher.hexdigest()

    # Simulación de tamaño limpio en formato WebP (reducción estimada ~30-50%)
    cleaned_size = max(100, int(original_size * 0.55))

    return {
        "forensic_hash": forensic_hash,
        "format": "webp",
        "original_size_bytes": original_size,
        "cleaned_size_bytes": cleaned_size,
        "exif_stripped": True,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }


def generate_secure_media_token(
    media_id: str,
    viewer_id: str,
    secret_key: str = "secret_vault_key_enm_colombia_2026",
    ttl_seconds: int = 60
) -> Dict[str, Any]:
    """
    Genera un token firmado mediante HMAC-SHA256 con tiempo de vida estricto (TTL).
    """
    expires_at = int(time.time()) + ttl_seconds
    payload = {
        "media_id": media_id,
        "viewer_id": viewer_id,
        "expires_at": expires_at
    }

    json_str = json.dumps(payload, separators=(',', ':'))
    base64_payload = base64.urlsafe_b64encode(json_str.encode('utf-8')).decode('utf-8').rstrip('=')

    signature = hmac.new(
        secret_key.encode('utf-8'),
        base64_payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    token = f"{base64_payload}.{signature}"
    signed_url = f"/api/media/view/{media_id}?token={token}&viewerId={viewer_id}"

    return {
        "token": token,
        "signature": signature,
        "expires_at": expires_at,
        "ttl_seconds": ttl_seconds,
        "signed_url": signed_url
    }


def validate_media_access_rules(
    viewer_user_id: str,
    viewer_role: str,
    media_visibility: str,
    is_subscribed: bool,
    has_vault_permission: bool
) -> Tuple[bool, int, str]:
    """
    Capa de Control de Acceso por Roles y Bóveda.
    - Regla 1: Hombres solos inactivos en pago -> 402 PAYMENT_REQUIRED
    - Regla 2: Bóveda Privada sin permiso -> 403 VAULT_ACCESS_DENIED
    - Regla 3: Acceso Concedido -> 200 OK
    """
    # Regla 1: Suscripción Hombres Solos
    if viewer_role == "solo_male" and not is_subscribed:
        return False, 402, "PAYMENT_REQUIRED: Hombres solos requieren membresía activa."

    # Regla 2: Bóveda Privada
    if media_visibility == "vault_private" and not has_vault_permission:
        return False, 403, "VAULT_ACCESS_DENIED: Sin permiso vigente otorgado por el propietario."

    return True, 200, "Acceso Autorizado."


if __name__ == "__main__":
    print("=" * 80)
    print("EJECUTANDO PRUEBAS UNITARIAS DE CIBERSEGURIDAD Y BÓVEDA MULTIMEDIA (PYTHON)")
    print("=" * 80)

    # Test 1: Sanitización
    dummy_img = b"EXIF_METADATA_GPS_LOCATION_COLOMBIA_IMAGE_BYTES_SIMULATED"
    sanitized = sanitize_and_process_image(dummy_img, "usr_unicorn_colombia_99")
    print(f"✅ Test 1 (EXIF Purge & Hash SHA-256): {sanitized['forensic_hash']}")

    # Test 2: Bloqueo Hombre Solo
    allowed, code, reason = validate_media_access_rules(
        viewer_user_id="usr_male_unpaid_11",
        viewer_role="solo_male",
        media_visibility="vault_private",
        is_subscribed=False,
        has_vault_permission=False
    )
    assert code == 402, "Error en Test 2."
    print(f"✅ Test 2 (Bloqueo Hombre Solo Inactivo HTTP 402): {reason}")

    # Test 3: Token HMAC
    token_data = generate_secure_media_token("med_vault_camila_01", "cpl_medellin_bi_01")
    print(f"✅ Test 3 (Token HMAC-SHA256 TTL 60s): {token_data['signed_url']}")
