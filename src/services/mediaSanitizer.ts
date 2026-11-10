import sharp from 'sharp';
import crypto from 'crypto';

export interface SanitizedImageResult {
  cleanedBuffer: Buffer;
  forensicHash: string;
  width: number;
  height: number;
  format: 'webp';
  originalSizeBytes: number;
  cleanedSizeBytes: number;
  exifStripped: boolean;
  mimeType: string;
}

/**
 * Módulo de Sanitización de Metadatos EXIF / XMP / GPS.
 * Procesa binarios de imagen, purga cualquier rastro de geolocalización o dispositivo,
 * normaliza a formato WebP (calidad 85%) y genera la huella criptográfica SHA-256.
 */
export async function sanitizeAndProcessImage(
  inputBuffer: Buffer,
  ownerId: string
): Promise<SanitizedImageResult> {
  if (!inputBuffer || inputBuffer.length === 0) {
    throw new Error('Buffer de imagen inválido o vacío.');
  }

  const originalSizeBytes = inputBuffer.length;

  // 1. Purga absoluta de metadatos con Sharp:
  // rotate() auto-orienta según EXIF antes de removerlo.
  // withMetadata(false) o no invocar withMetadata remueve EXIF, IPTC, XMP y etiquetas GPS.
  const pipeline = sharp(inputBuffer)
    .rotate() // Corregir orientación antes de borrar EXIF
    .webp({ quality: 85, effort: 4 });

  const { data: cleanedBuffer, info } = await pipeline.toBuffer({ resolveWithObject: true });

  // 2. Generación del Hash Criptográfico Forense SHA-256 sobre el contenido limpio
  const forensicHash = crypto
    .createHash('sha256')
    .update(cleanedBuffer)
    .update(ownerId) // Salting con el ID del propietario para unicidad forense
    .digest('hex');

  return {
    cleanedBuffer,
    forensicHash,
    width: info.width,
    height: info.height,
    format: 'webp',
    originalSizeBytes,
    cleanedSizeBytes: cleanedBuffer.length,
    exifStripped: true,
    mimeType: 'image/webp'
  };
}
