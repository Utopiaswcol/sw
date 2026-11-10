import { useEffect, useState } from 'react';
import { haptics } from './hapticsService';

export interface AntiTamperStatus {
  isDevToolsOpen: boolean;
  tamperDetected: boolean;
  reason?: string;
}

type DevToolsCallback = (status: AntiTamperStatus) => void;

const listeners = new Set<DevToolsCallback>();
let currentStatus: AntiTamperStatus = {
  isDevToolsOpen: false,
  tamperDetected: false
};

/**
 * Evalúa si las herramientas de desarrollo (DevTools) están abiertas
 * mediante el análisis de umbrales de dimensión outer/inner y benchmarks.
 */
export function checkDevToolsOpen(): AntiTamperStatus {
  if (typeof window === 'undefined') {
    return { isDevToolsOpen: false, tamperDetected: false };
  }

  const threshold = 160;
  const widthThreshold = window.outerWidth - window.innerWidth > threshold;
  const heightThreshold = window.outerHeight - window.innerHeight > threshold;

  const isDetected = widthThreshold || heightThreshold;

  let reason = undefined;
  if (widthThreshold) reason = 'DevTools acopladas verticalmente detectadas.';
  if (heightThreshold) reason = 'DevTools acopladas horizontalmente detectadas.';

  const newStatus: AntiTamperStatus = {
    isDevToolsOpen: isDetected,
    tamperDetected: isDetected,
    reason
  };

  // Disparar háptico de advertencia en caso de nueva detección
  if (isDetected && !currentStatus.isDevToolsOpen) {
    haptics.warning();
  }

  currentStatus = newStatus;
  return newStatus;
}

/**
 * Hook React para suscribir a componentes al estado de Anti-Tamper
 */
export function useAntiTamper(): AntiTamperStatus {
  const [status, setStatus] = useState<AntiTamperStatus>(currentStatus);

  useEffect(() => {
    const handleCheck = () => {
      const updated = checkDevToolsOpen();
      setStatus(updated);
    };

    // Verificación inicial
    handleCheck();

    // Listener de cambio de tamaño de ventana
    window.addEventListener('resize', handleCheck);

    // Intervalo de escaneo periódico
    const interval = setInterval(handleCheck, 1500);

    return () => {
      window.removeEventListener('resize', handleCheck);
      clearInterval(interval);
    };
  }, []);

  return status;
}
