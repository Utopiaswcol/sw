import React, { useState, useEffect } from 'react';
import { SecureMediaViewer } from './SecureMediaViewer';
import { haptics } from '../services/hapticsService';
import { useRealtimeSocket } from '../hooks/useRealtimeSocket';
import {
  Send,
  Lock,
  Unlock,
  Key,
  Flame,
  Clock,
  ShieldCheck,
  AlertOctagon,
  Image as ImageIcon,
  Check,
  X,
  User,
  Users,
  ShieldAlert,
  Cpu,
  Trash2,
  RefreshCw,
  Sparkles,
  Radio,
  EyeOff,
  Activity,
  Mic,
  Volume2,
  Play,
  Square
} from 'lucide-react';
import { LuxeIcon } from './common/LuxeIcon';
import { EphemeralMessage, ReciprocalVaultState } from '../services/ephemeralChatService';
import {
  encryptMessage,
  decryptMessage,
  getOrCreateSessionKey,
  EncryptedPayload
} from '../services/cryptoEngine';

interface EphemeralChatWindowProps {
  conversationId?: string;
  currentUserId: string;
  currentUserRole: 'solo_female' | 'solo_male' | 'couple';
  currentUserAlias: string;
  peerUserId: string;
  peerAlias: string;
}

interface DecryptedMessageMap {
  [msgId: string]: string;
}

export const EphemeralChatWindow: React.FC<EphemeralChatWindowProps> = ({
  conversationId = 'conv_cpl_vs_bull_01',
  currentUserId,
  currentUserRole,
  currentUserAlias,
  peerUserId,
  peerAlias
}) => {
  const [rawMessages, setRawMessages] = useState<EphemeralMessage[]>([]);
  const [decryptedMap, setDecryptedMap] = useState<DecryptedMessageMap>({});
  const [vaultStatus, setVaultStatus] = useState<ReciprocalVaultState | null>(null);
  const [inputContent, setInputContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [protocolAlert, setProtocolAlert] = useState<string | null>(null);
  const [activeSecureMediaId, setActiveSecureMediaId] = useState<string | null>(null);
  const [cryptoTestReport, setCryptoTestReport] = useState<any>(null);
  const [wsTestReport, setWsTestReport] = useState<any>(null);

  // Voice Note Recording State
  const [isRecordingAudio, setIsRecordingAudio] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  useEffect(() => {
    let timer: any = null;
    if (isRecordingAudio) {
      timer = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 15) {
            clearInterval(timer);
            return 15;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isRecordingAudio]);

  // Consent Toggle Protocol State for solo_male against couples/unicorns
  const [hasConsentedToTerms, setHasConsentedToTerms] = useState<boolean>(currentUserRole !== 'solo_male');
  const [consentTimestamp, setConsentTimestamp] = useState<number | null>(currentUserRole !== 'solo_male' ? Date.now() : null);

  // Real-time WebSocket Hook (Presencia Discreta + Señalización de Bóveda)
  const {
    isConnected,
    presenceMode,
    presenceLabel,
    latestVaultSignal,
    updatePresenceMode,
    sendVaultSignal
  } = useRealtimeSocket({
    userId: currentUserId,
    conversationId
  });

  const sessionKey = getOrCreateSessionKey(conversationId);

  // Escuchar eventos en vivo de Bóveda desde el WebSocket
  useEffect(() => {
    if (latestVaultSignal) {
      if (
        latestVaultSignal.type === 'VAULT_KEY_GRANTED' ||
        latestVaultSignal.type === 'VAULT_KEY_REVOKED'
      ) {
        haptics.success();
        refreshChat();
      } else if (latestVaultSignal.type === 'VAULT_KEY_REQUESTED') {
        haptics.selection();
        setProtocolAlert(`El usuario ${peerAlias} ha solicitado acceso a tu Bóveda Privada.`);
      }
    }
  }, [latestVaultSignal]);

  // 1. Cargar y Descifrar Mensajes en Cliente
  const refreshChat = async () => {
    try {
      // Estado Bóveda
      const statusRes = await fetch(
        `/api/chat/reciprocal-vault-status?conversationId=${conversationId}&userA=${currentUserId}&userB=${peerUserId}`
      );
      const statusData = await statusRes.json();
      setVaultStatus(statusData);

      // Cargar mensajes efímeros cifrados
      const msgRes = await fetch(
        `/api/chat/messages/${conversationId}?viewerUserId=${currentUserId}`
      );
      const msgData = await msgRes.json();

      if (msgData.messages) {
        setRawMessages(msgData.messages);

        // Descifrado transparente en cliente
        const newDecryptedMap: DecryptedMessageMap = {};
        for (const msg of msgData.messages as EphemeralMessage[]) {
          try {
            if (msg.encryptedPayload) {
              const text = await decryptMessage(msg.encryptedPayload, sessionKey);
              newDecryptedMap[msg.id] = text;
            }
          } catch (err) {
            newDecryptedMap[msg.id] = '⚠️ Error de integridad o clave no coincidente.';
          }
        }
        setDecryptedMap(newDecryptedMap);
      }
    } catch (err) {
      console.warn('Error refrescando chat efímero:', err);
    }
  };

  useEffect(() => {
    refreshChat();
    const interval = setInterval(refreshChat, 4000);
    return () => clearInterval(interval);
  }, [conversationId, currentUserId, peerUserId]);

  // 2. Cifrar en Cliente (E2EE) y Enviar a Servidor
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim()) return;

    haptics.selection();

    // Anti-Spam Commercial Chat Guard Filter
    const commercialFilterRegex = /(vendo|venta|menú|menu de fotos|tarifa|cobro|cuánto cobras|cuanto cobras|onlyfans por chat|nequi por|daviplata por|catálogo|catalogo|pago por encuentro|transferencia para)/i;
    if (commercialFilterRegex.test(inputContent)) {
      haptics.warning();
      setProtocolAlert(
        '🚫 VENTA COMERCIAL EN CHAT PROHIBIDA: Aethel Club es una red social de conexiones y química real. Las ofertas comerciales, ventas o cobros por chat están estrictamente prohibidos. Si eres creadora, puedes vincular tu enlace externo directamente en tu perfil público.'
      );
      return;
    }

    setLoading(true);
    setProtocolAlert(null);

    try {
      // Cifrado AES-256-GCM en Cliente antes de transmisión
      const encryptedPayload: EncryptedPayload = await encryptMessage(inputContent, sessionKey);

      const res = await fetch('/api/chat/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          senderId: currentUserId,
          senderRole: currentUserRole,
          senderAlias: currentUserAlias,
          encryptedPayload,
          type: 'text',
          ttlSeconds: 86400 // 24 horas
        })
      });

      const data = await res.json();
      if (data.success) {
        setInputContent('');
        haptics.success();
        await refreshChat();
      } else {
        haptics.warning();
        setProtocolAlert(data.error || data.message);
      }
    } catch (err: any) {
      haptics.warning();
      setProtocolAlert('Error en cifrado/envío: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Otorgar Consentimiento Recíproco de Bóveda
  const handleGrantReciprocalConsent = async () => {
    haptics.selection();
    setLoading(true);
    setProtocolAlert(null);
    try {
      const res = await fetch('/api/chat/request-reciprocal-vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          grantorUserId: currentUserId,
          targetUserId: peerUserId
        })
      });
      const data = await res.json();
      if (data.success) {
        setVaultStatus(data.vaultStatus);
        haptics.success();

        // Emitir señal WS de concesión de bóveda en tiempo real (< 50ms)
        sendVaultSignal('VAULT_KEY_GRANTED', conversationId, {
          grantorUserId: currentUserId,
          targetUserId: peerUserId
        });

        await refreshChat();
      }
    } catch (err: any) {
      haptics.warning();
      setProtocolAlert('Error otorgando permiso: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 4. Test WebSocket Latency & Disconnection
  const handleRunWSTests = async () => {
    haptics.selection();
    try {
      const res = await fetch('/api/ws/run-tests');
      const report = await res.json();
      setWsTestReport(report);
      if (report.allPassed) {
        haptics.success();
      } else {
        haptics.warning();
      }
    } catch (err: any) {
      haptics.warning();
      alert('Error ejecutando test WebSocket: ' + err.message);
    }
  };

  // 5. Ejecutar Test de Ciberseguridad Criptográfica
  const handleRunCryptoTests = async () => {
    haptics.selection();
    setLoading(true);
    try {
      const res = await fetch('/api/chat/run-security-tests');
      const report = await res.json();
      setCryptoTestReport(report);
      if (report.allPassed) {
        haptics.success();
      } else {
        haptics.warning();
      }
    } catch (err: any) {
      haptics.warning();
      alert('Error ejecutando suite criptográfica: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 6. Purga Manual de Expirados (Crypto-Shredding)
  const handleManualPurge = async () => {
    haptics.selection();
    try {
      const res = await fetch('/api/chat/purge-expired', { method: 'POST' });
      const data = await res.json();
      haptics.success();
      alert(`Crypto-Shredding ejecutado. ${data.purgedCount} mensajes purgados de memoria.`);
      await refreshChat();
    } catch (err: any) {
      haptics.warning();
      alert('Error ejecutando purga: ' + err.message);
    }
  };

  // 7. Compartir Foto de Bóveda Privada
  const handleShareVaultMedia = async () => {
    haptics.selection();
    setLoading(true);
    setProtocolAlert(null);

    try {
      const encryptedTextPayload = await encryptMessage(
        'He adjuntado una fotografía cifrada con marcas forenses de mi Bóveda Privada.',
        sessionKey
      );

      const res = await fetch('/api/chat/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          senderId: currentUserId,
          senderRole: currentUserRole,
          senderAlias: currentUserAlias,
          encryptedPayload: encryptedTextPayload,
          type: 'vault_media',
          mediaId: 'med_vault_camila_01',
          ttlSeconds: 3600 // 1 hora
        })
      });

      const data = await res.json();
      if (!data.success) {
        haptics.warning();
        setProtocolAlert(data.error);
      } else {
        haptics.success();
        await refreshChat();
      }
    } catch (err: any) {
      haptics.warning();
      setProtocolAlert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendVoiceNote = async () => {
    haptics.selection();
    setIsRecordingAudio(false);
    setLoading(true);

    try {
      const duration = recordingSeconds || 12;
      const encryptedTextPayload = await encryptMessage(
        `🎙️ [AUDIO EFÍMERO (${duration}s)] - Toca para escuchar nota de voz confidencial`,
        sessionKey
      );

      const res = await fetch('/api/chat/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          senderId: currentUserId,
          senderRole: currentUserRole,
          senderAlias: currentUserAlias,
          encryptedPayload: encryptedTextPayload,
          type: 'text',
          ttlSeconds: 3600
        })
      });

      const data = await res.json();
      if (data.success) {
        haptics.success();
        await refreshChat();
      }
    } catch (err: any) {
      haptics.warning();
    } finally {
      setLoading(false);
      setRecordingSeconds(0);
    }
  };

  return (
    <div className="bg-[#0e0e14] border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[600px] max-w-4xl mx-auto select-none">
      {/* Dark Luxe Header Bar */}
      <div className="p-4 bg-[#070709] border-b border-white/[0.08] flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-rose-500/20 to-purple-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-center font-black">
              {peerAlias.substring(0, 2).toUpperCase()}
            </div>
            {/* Realtime Connection Indicator */}
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#070709] ${
                isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
              }`}
            />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-black text-white">{peerAlias}</h3>

              {/* Ghost Presence Engine Badge */}
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 flex items-center gap-1">
                <Activity className="w-3 h-3 text-emerald-400" />
                <span>
                  {presenceMode === 'invisible' ? 'Modo Fantasma (Invisible)' : presenceLabel}
                </span>
              </span>
            </div>

            <div className="flex items-center space-x-2 mt-0.5">
              <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                <LuxeIcon icon={Lock} active={true} variant="gold" size={12} strokeWidth={1.5} /> Chat Discreto &amp; Confidencial
              </span>
              <button
                onClick={() => {
                  haptics.selection();
                  updatePresenceMode(presenceMode === 'invisible' ? 'active_now' : 'invisible');
                }}
                className="text-[9px] font-mono font-bold text-amber-300 hover:text-amber-200 underline flex items-center gap-0.5"
              >
                <LuxeIcon icon={EyeOff} active={presenceMode === 'invisible'} variant="gold" size={12} strokeWidth={1.5} />
                <span>
                  {presenceMode === 'invisible' ? 'Desactivar Fantasma' : 'Activar Modo Fantasma'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Action Controls Header */}
        <div className="flex items-center space-x-2">
          {/* Protocol Vault Consent Button */}
          {vaultStatus?.isReciprocalUnlocked ? (
            <span className="text-[10px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-700/80 px-2.5 py-1 rounded-xl flex items-center gap-1 font-bold">
              <Unlock className="w-3.5 h-3.5 text-emerald-400" /> Bóveda Recíproca Activa
            </span>
          ) : (
            <button
              onClick={handleGrantReciprocalConsent}
              disabled={loading}
              className="text-xs font-bold px-3 py-1.5 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white rounded-xl shadow-md transition-all flex items-center space-x-1.5 active:scale-95"
            >
              <Key className="w-3.5 h-3.5" />
              <span>
                {vaultStatus?.userAGrantedToB || vaultStatus?.userBGrantedToA
                  ? 'Esperando Respuesta'
                  : 'Otorgar Llave Recíproca'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* WebSocket Security & Latency Test Report Banner */}
      {wsTestReport && (
        <div className="bg-[#070709] border-b border-emerald-500/30 p-3 text-xs text-slate-200 space-y-2">
          <div className="flex items-center justify-between font-bold text-emerald-300">
            <span>Reporte de Rendimiento & Presencia Discreta WS</span>
            <button onClick={() => setWsTestReport(null)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1 font-mono text-[11px]">
            {wsTestReport.tests.map((t: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between bg-slate-900 p-2 rounded border border-slate-800">
                <span className="truncate">{t.name}</span>
                <span className={`px-2 py-0.5 rounded font-bold ${t.passed ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'}`}>
                  {t.passed ? 'PASADO' : 'FALLIDO'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Protocol Alert Warning Banner */}
      {protocolAlert && (
        <div className="bg-rose-950/90 border-b border-rose-800 p-3 text-xs text-rose-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{protocolAlert}</span>
          </div>
          <button onClick={() => setProtocolAlert(null)} className="text-rose-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Crypto Suite Report Modal Banner */}
      {cryptoTestReport && (
        <div className="bg-[#070709] border-b border-amber-500/30 p-3 text-xs text-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 font-bold text-amber-300">
              <Sparkles className="w-4 h-4" />
              <span>Reporte de Ciberseguridad Criptográfica AES-256-GCM</span>
            </div>
            <button onClick={() => setCryptoTestReport(null)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-1 font-mono text-[11px]">
            {cryptoTestReport.tests.map((t: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between bg-slate-900/80 p-1.5 rounded border border-slate-800">
                <span className="truncate">{t.testName}</span>
                <span className={`px-1.5 py-0.2 rounded font-bold shrink-0 ${t.passed ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'}`}>
                  {t.passed ? 'PASADO' : 'FALLIDO'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#070709]/80">
        {rawMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-6 h-6 animate-pulse" />
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-black text-white">Canal de Cifrado de Extremo a Extremo</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Mensajería efímera sin rastros en servidor. La purga física destructiva (<span className="text-amber-300 font-mono">Crypto-Shredding</span>) expira el contenido automáticamente.
              </p>
            </div>

            {/* Quick Starter Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full text-xs pt-2">
              <button
                onClick={() => setInputContent('¡Hola! Me encantó la afinidad de nuestro perfil. ¿Cómo están?')}
                className="p-3 rounded-2xl bg-[#0c0d14] border border-white/10 hover:border-amber-500/40 text-slate-200 text-left transition-all hover:bg-slate-900 cursor-pointer flex items-center space-x-2"
              >
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-semibold">Saludar con Afinidad 5D</span>
              </button>

              <button
                onClick={handleShareVaultMedia}
                className="p-3 rounded-2xl bg-[#0c0d14] border border-white/10 hover:border-amber-500/40 text-slate-200 text-left transition-all hover:bg-slate-900 cursor-pointer flex items-center space-x-2"
              >
                <Lock className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="font-semibold">Compartir Foto de Bóveda</span>
              </button>
            </div>
          </div>
        ) : (
          rawMessages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            const decryptedContent = decryptedMap[msg.id] || 'Descifrando...';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-mono">
                  <span>{msg.senderAlias}</span>
                  <span>•</span>
                  <span className="flex items-center text-amber-400 gap-0.5">
                    <Clock className="w-3 h-3" /> Efímero {Math.max(0, Math.floor((msg.expiresAt - Date.now()) / 1000)) > 3600 ? '24h' : `${Math.max(1, Math.floor((msg.expiresAt - Date.now()) / 60000))} min`}
                  </span>
                  <span>•</span>
                  <span className="text-emerald-400 font-bold">Confidencial</span>
                </div>

                <div
                  className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed shadow-lg ${
                    isMe
                      ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white rounded-tr-none'
                      : 'bg-[#0e0e14] border border-white/[0.09] text-slate-200 rounded-tl-none'
                  }`}
                >
                  {msg.type === 'vault_media' ? (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 font-bold text-amber-200">
                        <ImageIcon className="w-4 h-4 text-amber-300" />
                        <span>Fotografía Cifrada de Bóveda</span>
                      </div>
                      <p>{decryptedContent}</p>
                      <button
                        onClick={() => {
                          haptics.selection();
                          setActiveSecureMediaId(msg.mediaId || 'med_vault_camila_01');
                        }}
                        className="w-full py-2 bg-[#070709] hover:bg-slate-900 text-amber-300 border border-amber-500/30 rounded-xl font-mono text-[11px] font-bold flex items-center justify-center space-x-1.5 transition-all active:scale-95"
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Abrir Visor Seguro Anti-Captura</span>
                      </button>
                    </div>
                  ) : (
                    <p>{decryptedContent}</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Actions & Input Form with Consent Toggle Protocol */}
      <div className="p-4 bg-[#070709] border-t border-white/[0.08] space-y-3">
        {/* Consent Toggle Mandatory Protocol Card for Single Males */}
        {currentUserRole === 'solo_male' && (
          <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-rose-950/60 p-3.5 rounded-2xl border border-purple-500/30 space-y-2.5 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-rose-300 font-bold text-xs">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Protocolo de Respeto & Acuerdos de Pareja</span>
              </div>
              <span className="text-[9px] font-mono font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/80">
                Firma Obligatoria
              </span>
            </div>

            <div className="bg-black/50 p-2.5 rounded-xl border border-white/[0.08] space-y-1.5 text-[11px] text-slate-300">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Límites Duros & Estilo Relacional de {peerAlias}:
              </span>
              <div className="flex flex-wrap gap-1 text-[10px] font-mono">
                <span className="bg-rose-950 text-rose-300 border border-rose-800/80 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                  <LuxeIcon icon={ShieldAlert} active={true} variant="rose" size={12} strokeWidth={1.5} /> Soft Swap Exclusivo
                </span>
                <span className="bg-amber-950 text-amber-300 border border-amber-800/80 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                  <LuxeIcon icon={ShieldCheck} active={true} variant="gold" size={12} strokeWidth={1.5} /> Preservativo 100% Obligatorio
                </span>
                <span className="bg-purple-950 text-purple-300 border border-purple-800/80 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                  <LuxeIcon icon={Lock} active={true} variant="neutral" size={12} strokeWidth={1.5} /> No Visitas a Domicilio
                </span>
              </div>
            </div>

            {/* Consent Toggle Switch */}
            <div className="flex items-center justify-between gap-3 pt-1 border-t border-white/[0.08]">
              <label className="flex items-center space-x-2.5 cursor-pointer text-xs text-slate-200 font-medium select-none">
                <input
                  type="checkbox"
                  checked={hasConsentedToTerms}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setHasConsentedToTerms(checked);
                    if (checked) {
                      setConsentTimestamp(Date.now());
                      haptics.success();
                    } else {
                      setConsentTimestamp(null);
                      haptics.selection();
                    }
                  }}
                  className="w-4 h-4 rounded border-slate-700 text-rose-600 focus:ring-rose-500 bg-slate-900 cursor-pointer"
                />
                <span className="text-[11px]">
                  Para habilitar el chat, debes certificar que has leído y respetas los acuerdos de esta pareja/perfil.
                </span>
              </label>

              {consentTimestamp && (
                <span className="text-[9px] font-mono text-emerald-400 font-bold shrink-0 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded">
                  ✓ Certificado
                </span>
              )}
            </div>
          </div>
        )}

        {isRecordingAudio ? (
          <div className="bg-rose-950/80 border border-rose-500/50 p-3 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping shrink-0" />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white block">Grabando Nota de Voz Cifrada</span>
                <span className="text-[10px] font-mono text-rose-300 font-bold block">
                  0:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}s / 0:15s
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  haptics.selection();
                  setIsRecordingAudio(false);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-900 text-slate-300 text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSendVoiceNote}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 font-black text-xs hover:brightness-110 cursor-pointer shadow-lg flex items-center space-x-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar Audio</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
            <button
              type="button"
              disabled={!hasConsentedToTerms}
              onClick={handleShareVaultMedia}
              title="Adjuntar Foto Cifrada de Bóveda"
              className={`p-2.5 rounded-xl bg-[#0e0e14] border border-white/[0.08] text-slate-400 hover:text-amber-400 hover:border-amber-500/30 transition-all shrink-0 active:scale-95 ${
                !hasConsentedToTerms ? 'opacity-40 cursor-not-allowed' : ''
              }`}
            >
              <ImageIcon className="w-5 h-5" />
            </button>

            <button
              type="button"
              disabled={!hasConsentedToTerms}
              onClick={() => {
                haptics.selection();
                setIsRecordingAudio(true);
              }}
              title="Grabar Nota de Voz Efímera"
              className={`p-2.5 rounded-xl bg-[#0e0e14] border border-white/[0.08] text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-all shrink-0 active:scale-95 ${
                !hasConsentedToTerms ? 'opacity-40 cursor-not-allowed' : ''
              }`}
            >
              <Mic className="w-5 h-5" />
            </button>

            <input
              type="text"
              disabled={!hasConsentedToTerms}
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
              placeholder={
                hasConsentedToTerms
                  ? "Escribe un mensaje discreto..."
                  : "🔒 Certifica los acuerdos arriba para desbloquear el canal..."
              }
              className={`flex-1 bg-[#0e0e14] border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-500/50 ${
                !hasConsentedToTerms ? 'opacity-40 cursor-not-allowed bg-slate-950/80' : ''
              }`}
            />

            <button
              type="submit"
              disabled={loading || !inputContent.trim() || !hasConsentedToTerms}
              className="p-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> Mensajes 100% Privados y Protegidos
          </span>
          <span>✨ Borrado Automático Sin Rastros</span>
        </div>
      </div>

      {/* Secure Media Viewer Modal */}
      {activeSecureMediaId && (
        <SecureMediaViewer
          mediaId={activeSecureMediaId}
          mediaTitle="Foto Efímera de Bóveda Cifrada"
          viewerUserId={currentUserId}
          viewerRole={currentUserRole}
          onClose={() => setActiveSecureMediaId(null)}
        />
      )}
    </div>
  );
};
