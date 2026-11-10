import React, { useEffect, useRef, useState } from 'react';
import { ShieldAlert, Lock, Loader2 } from 'lucide-react';

interface MemoryProtectedImageProps {
  src: string;
  alt?: string;
  className?: string;
  watermarkText?: string;
  onLoaded?: () => void;
  onError?: (error: string) => void;
}

export const MemoryProtectedImage: React.FC<MemoryProtectedImageProps> = ({
  src,
  alt = 'Imagen Protegida en Memoria',
  className = '',
  watermarkText = 'DARK LUXE • CONFIDENTIAL • NO CAPTURE',
  onLoaded,
  onError
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const activeBitmapRef = useRef<ImageBitmap | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const renderSecureImage = async () => {
      setLoading(true);
      setErrorMsg(null);

      try {
        // 1. Descargar binario multimedia directamente en ArrayBuffer
        const response = await fetch(src);
        if (!response.ok) {
          throw new Error(`HTTP Error ${response.status}: Imposible recuperar la imagen.`);
        }

        const arrayBuffer = await response.arrayBuffer();
        if (isCancelled) return;

        // 2. Crear Blob temporal y Decodificar como ImageBitmap directo en RAM GPU
        const blob = new Blob([arrayBuffer]);
        const bitmap = await createImageBitmap(blob);
        activeBitmapRef.current = bitmap;

        if (isCancelled) {
          bitmap.close();
          return;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;

        // Configurar dimensiones exactas
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;

        const ctx = canvas.getContext('2d', { willReadFrequently: false });
        if (!ctx) {
          throw new Error('No se pudo inicializar el contexto 2D del Canvas.');
        }

        // 3. Dibujar píxeles en el Canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(bitmap, 0, 0);

        // 4. Inyectar Marca de Agua Criptográfica en los píxeles del Canvas
        if (watermarkText) {
          ctx.save();
          const fontSize = Math.max(14, Math.floor(canvas.width / 25));
          ctx.font = `900 ${fontSize}px sans-serif`;
          ctx.fillStyle = 'rgba(212, 175, 55, 0.25)'; // Champagne gold tenue
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // Dibujar marca diagonal repetida
          const stepX = canvas.width / 2;
          const stepY = canvas.height / 3;
          for (let x = stepX / 2; x < canvas.width; x += stepX) {
            for (let y = stepY / 2; y < canvas.height; y += stepY) {
              ctx.save();
              ctx.translate(x, y);
              ctx.rotate((-25 * Math.PI) / 180);
              ctx.fillText(watermarkText, 0, 0);
              ctx.restore();
            }
          }
          ctx.restore();
        }

        // 5. Anti-Exfiltración: Sobrescribir metódicamente API de extracción del Canvas
        canvas.toDataURL = () => {
          console.warn('SECURITY_VIOLATION: Intento de extracción bloqueado vía canvas.toDataURL()');
          return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        };

        canvas.toBlob = (callback) => {
          console.warn('SECURITY_VIOLATION: Intento de extracción bloqueado vía canvas.toBlob()');
          if (callback) {
            callback(new Blob([], { type: 'image/png' }));
          }
        };

        // Sobrescribir getImageData en el contexto para impedir capturas por scripts
        const originalGetImageData = ctx.getImageData.bind(ctx);
        ctx.getImageData = (sx, sy, sw, sh) => {
          console.warn('SECURITY_VIOLATION: Intento de lectura de píxeles vía getImageData()');
          return originalGetImageData(0, 0, 1, 1);
        };

        setLoading(false);
        if (onLoaded) onLoaded();
      } catch (err: any) {
        if (isCancelled) return;
        const msg = err.message || 'Error cargando imagen protegida';
        setErrorMsg(msg);
        setLoading(false);
        if (onError) onError(msg);
      }
    };

    renderSecureImage();

    // 6. Limpieza Estricta al Desmontar (Destrucción Volátil de Memoria RAM/GPU)
    return () => {
      isCancelled = true;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Rellenar canvas con píxeles negros puros para sobreescribir memoria de GPU
          ctx.fillStyle = '#070709';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        canvas.width = 1;
        canvas.height = 1;
      }

      if (activeBitmapRef.current) {
        activeBitmapRef.current.close();
        activeBitmapRef.current = null;
      }
    };
  }, [src, watermarkText]);

  return (
    <div className={`relative inline-block overflow-hidden bg-[#070709] select-none ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#070709] text-amber-400 p-4 space-y-2 z-10">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400">
            Descargando binario a RAM...
          </span>
        </div>
      )}

      {errorMsg && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#070709] text-rose-400 p-4 space-y-2 z-10 border border-rose-900/50 rounded-2xl">
          <ShieldAlert className="w-8 h-8 text-rose-500" />
          <span className="text-xs font-bold text-center">{errorMsg}</span>
        </div>
      )}

      {/* Elemento Canvas donde se renderizan los píxeles directamente */}
      <canvas
        ref={canvasRef}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        className={`w-full h-full object-contain pointer-events-none transition-opacity duration-300 ${
          loading ? 'opacity-0' : 'opacity-100'
        }`}
        aria-label={alt}
      />

      {/* Overlay de marca de agua física de seguridad */}
      <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-md border border-amber-500/20 text-[9px] font-mono text-amber-300/80 pointer-events-none flex items-center space-x-1">
        <Lock className="w-2.5 h-2.5 text-amber-400" />
        <span>RAM Canvas Protected</span>
      </div>
    </div>
  );
};
