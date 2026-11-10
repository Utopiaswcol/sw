import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserCheck,
  UserPlus,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Key,
  X,
  Share2,
  Lock,
  RefreshCw,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  Terminal
} from 'lucide-react';
import {
  initiateMemberAVerification,
  validateMemberB,
  getCoupleKycStatus,
  runKycAntiFraudTestSuite,
  CoupleKycRecord
} from '../services/asyncKycService';
import {
  generateMnemonic12Words,
  createEncryptedVaultKeyPackage,
  restoreEncryptionKeys,
  syncKeyPackageToServer,
  getKeyPackageFromServer,
  runZeroKnowledgeTestSuite,
  VaultKeyPackage
} from '../services/zeroKnowledgeVaultService';
import { haptics } from '../services/hapticsService';

interface AsyncKycModalProps {
  isOpen: boolean;
  onClose: () => void;
  coupleId?: string;
  memberAUserId?: string;
}

export const AsyncKycModal: React.FC<AsyncKycModalProps> = ({
  isOpen,
  onClose,
  coupleId = 'cpl_medellin_bi_01',
  memberAUserId = 'usr_member_a_vip'
}) => {
  const [kycStatus, setKycStatus] = useState<CoupleKycRecord | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [showSeedModal, setShowSeedModal] = useState<boolean>(false);
  const [seedPhrase, setSeedPhrase] = useState<string>('');
  const [seedCopied, setSeedCopied] = useState<boolean>(false);

  // Member A Form State
  const [cedulaA, setCedulaA] = useState<string>('1018223940');
  const [isSimulatingMemberA, setIsSimulatingMemberA] = useState<boolean>(false);

  // Member B Simulation Form State
  const [cedulaB, setCedulaB] = useState<string>('1020448112');
  const [isSimulatingMemberB, setIsSimulatingMemberB] = useState<boolean>(false);
  const [simulateFraudAttempt, setSimulateFraudAttempt] = useState<boolean>(false);

  // Test Suite Runner State
  const [testOutput, setTestOutput] = useState<any | null>(null);
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      loadKycStatus();
      if (!seedPhrase) {
        setSeedPhrase(generateMnemonic12Words());
      }
    }
  }, [isOpen, coupleId]);

  const loadKycStatus = () => {
    const status = getCoupleKycStatus(coupleId);
    setKycStatus(status);
  };

  const handleInitiateMemberA = () => {
    haptics.selection();
    setIsSimulatingMemberA(true);

    setTimeout(() => {
      const result = initiateMemberAVerification(
        coupleId,
        memberAUserId,
        cedulaA,
        'base64_selfie_a_data'
      );
      setKycStatus(getCoupleKycStatus(coupleId));
      setIsSimulatingMemberA(false);
      haptics.success();
    }, 600);
  };

  const handleSimulateMemberB = () => {
    haptics.selection();
    setIsSimulatingMemberB(true);

    setTimeout(() => {
      if (!kycStatus?.inviteToken) return;

      // Vector A from member A
      const vecA = kycStatus.memberA?.facialVector || [0.55, 0.32, 0.88, 0.12, 0.67, 0.45];

      // If fraud simulated, use near-identical vector (distance < 0.25)
      const vecB = simulateFraudAttempt
        ? [0.56, 0.32, 0.87, 0.12, 0.68, 0.45] // Near identical face -> FRAUD
        : [0.12, 0.95, 0.22, 0.78, 0.34, 0.89]; // Distinct face -> LEGIT

      const result = validateMemberB(
        coupleId,
        kycStatus.inviteToken,
        'usr_member_b_simulated',
        cedulaB,
        'base64_selfie_b_data',
        vecB
      );

      setKycStatus(getCoupleKycStatus(coupleId));
      setIsSimulatingMemberB(false);

      if (result.isFraudAttempt) {
        haptics.warning();
      } else {
        haptics.success();
      }
    }, 800);
  };

  const handleCopyInviteLink = () => {
    if (!kycStatus?.inviteToken) return;
    haptics.selection();
    const link = `https://aethel-vault.app?kyc_invite=${kycStatus.inviteToken}&couple=${coupleId}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleRunAllTests = async () => {
    haptics.selection();
    setIsRunningTests(true);

    const kycSuite = runKycAntiFraudTestSuite();
    const zkSuite = await runZeroKnowledgeTestSuite();

    setTestOutput({
      kycSuite,
      zkSuite,
      timestamp: new Date().toLocaleTimeString()
    });
    setIsRunningTests(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-[#0e0e14] border border-white/10 rounded-[28px] max-w-lg w-full p-5 text-white space-y-4 shadow-2xl relative my-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-3">
          <div>
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Verificación Asíncrona de Co-Titularidad (+18)</span>
            </div>
            <h3 className="text-lg font-black text-white mt-0.5">Doble Consentimiento de Parejas VIP</h3>
          </div>
          <button
            onClick={() => {
              haptics.selection();
              onClose();
            }}
            className="p-1.5 rounded-full bg-slate-800/80 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ley 1581 Zero Document Storage Disclaimer */}
        <div className="bg-emerald-950/40 border border-emerald-800/50 rounded-2xl p-3 text-[11px] text-emerald-200 space-y-1">
          <div className="flex items-center space-x-1.5 font-bold text-emerald-300">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cumplimiento Ley 1581 de 2012 • Cero Almacenamiento</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Las fotografías de documentos y selfies 3D se purgan de memoria volátil inmediatamente tras la extracción OCR de mayoría de edad. Solo se conserva la prueba biométrica anonimizada.
          </p>
        </div>

        {/* Suspended Account Fraud Warning */}
        {kycStatus?.isSuspended && (
          <div className="bg-rose-950/80 border border-rose-600/80 rounded-2xl p-4 text-xs text-rose-200 space-y-2 animate-shake">
            <div className="flex items-center space-x-2 font-black text-rose-400 text-sm">
              <ShieldAlert className="w-5 h-5" />
              <span>CUENTA DE PAREJA SUSPENDIDA</span>
            </div>
            <p className="text-slate-200 font-mono text-[11px]">
              Motivo: {kycStatus.fraudReason}
            </p>
            <p className="text-[10px] text-slate-300">
              Se detectó que la misma persona intentó realizar la validación dual en ambos perfiles. Contacte a soporte de seguridad.
            </p>
          </div>
        )}

        {/* Member Status Cards Phase 1 & Phase 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Member A Card */}
          <div className="bg-[#070709] border border-white/10 rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Miembro A</span>
              {kycStatus?.memberA ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center space-x-1">
                  <UserCheck className="w-3 h-3" />
                  <span>Verificado (+18)</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  Pendiente
                </span>
              )}
            </div>

            {kycStatus?.memberA ? (
              <div className="text-[11px] space-y-1 font-mono text-slate-400">
                <div>Cédula: <span className="text-white">{kycStatus.memberA.cedulaNumberMasked}</span></div>
                <div className="truncate">Hash: <span className="text-slate-300">{kycStatus.memberA.facialHash.substring(0, 12)}...</span></div>
                <div className="text-[10px] text-emerald-400">Biometría 3D Aprobada</div>
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                <input
                  type="text"
                  value={cedulaA}
                  onChange={(e) => setCedulaA(e.target.value)}
                  placeholder="Cédula de Ciudadanía"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white"
                />
                <button
                  onClick={handleInitiateMemberA}
                  disabled={isSimulatingMemberA}
                  className="w-full py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1"
                >
                  {isSimulatingMemberA ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Validar Miembro A</span>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Member B Card */}
          <div className="bg-[#070709] border border-white/10 rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Miembro B</span>
              {kycStatus?.bothVerified ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center space-x-1">
                  <UserCheck className="w-3 h-3" />
                  <span>Co-Titular (+18)</span>
                </span>
              ) : kycStatus?.memberA ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 animate-pulse">
                  Invitación Enviada
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-500">
                  Esperando A
                </span>
              )}
            </div>

            {kycStatus?.bothVerified && kycStatus.memberB ? (
              <div className="text-[11px] space-y-1 font-mono text-slate-400">
                <div>Cédula: <span className="text-white">{kycStatus.memberB.cedulaNumberMasked}</span></div>
                <div className="truncate">Hash: <span className="text-slate-300">{kycStatus.memberB.facialHash.substring(0, 12)}...</span></div>
                <div className="text-[10px] text-emerald-400">Co-titularidad Firmada</div>
              </div>
            ) : (
              <div className="text-[10px] text-slate-400 space-y-1">
                <p className="line-clamp-2">
                  {kycStatus?.memberA
                    ? 'Enlace de invitación HMAC generado. Válido por 48 horas.'
                    : 'Requiere que el Miembro A complete su validación primero.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Share Invite Link Button */}
        {kycStatus?.memberA && !kycStatus.bothVerified && !kycStatus.isSuspended && (
          <div className="space-y-2 pt-1 border-t border-white/10">
            <div className="flex items-center justify-between text-xs text-slate-300 font-bold">
              <span>Invitación de Co-titularidad (WhatsApp / Signal):</span>
              <span className="text-[10px] text-amber-400 font-mono">TTL: 48 Horas</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopyInviteLink}
                className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg flex items-center justify-center space-x-1.5 active:scale-95"
              >
                {copiedLink ? <CheckCircle2 className="w-4 h-4 text-slate-950" /> : <Share2 className="w-4 h-4" />}
                <span>{copiedLink ? '¡Enlace Copiado al Portapapeles!' : 'Copiar Enlace de Invitación'}</span>
              </button>
            </div>

            {/* Test Simulation Controls for Member B */}
            <div className="bg-slate-950/80 border border-white/5 rounded-xl p-3 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                Simulador Táctico de Verificación Miembro B (Testing):
              </span>
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center space-x-1.5 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={simulateFraudAttempt}
                    onChange={(e) => setSimulateFraudAttempt(e.target.checked)}
                    className="accent-rose-500 rounded"
                  />
                  <span className={simulateFraudAttempt ? 'text-rose-400 font-bold' : ''}>
                    Simular Suplantación (Mismo Rostro &lt; 0.25 Distancia)
                  </span>
                </label>

                <button
                  onClick={handleSimulateMemberB}
                  disabled={isSimulatingMemberB}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs flex items-center space-x-1"
                >
                  {isSimulatingMemberB ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <span>Procesar Miembro B</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Security & Zero-Knowledge Backup Phrase Toggle */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between">
          <button
            onClick={() => {
              haptics.selection();
              setShowSeedModal(true);
            }}
            className="px-3 py-1.5 bg-slate-900 border border-white/10 hover:border-amber-500/50 text-amber-300 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>Respaldar Frase Semilla Zero-Knowledge (12 Palabras)</span>
          </button>

          <button
            onClick={handleRunAllTests}
            disabled={isRunningTests}
            className="px-3 py-1.5 bg-slate-900 border border-white/10 hover:border-emerald-500/50 text-emerald-300 rounded-xl text-xs font-bold flex items-center space-x-1 transition-all"
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isRunningTests ? 'Probando...' : 'Ejecutar Pruebas'}</span>
          </button>
        </div>

        {/* Test Outputs Display */}
        {testOutput && (
          <div className="bg-black/90 border border-slate-800 rounded-2xl p-3 space-y-2 text-[10px] font-mono">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-amber-400 font-bold">REPORTE DE SUITE DE PRUEBAS SPRINT 3 ({testOutput.timestamp})</span>
              <button onClick={() => setTestOutput(null)} className="text-slate-500 hover:text-white">Cerrar</button>
            </div>

            <div className="space-y-1">
              <div className={testOutput.kycSuite.passed ? 'text-emerald-400' : 'text-rose-400'}>
                • Biometría Anti-Fraude: {testOutput.kycSuite.details}
              </div>
              <div className={testOutput.zkSuite.passed ? 'text-emerald-400' : 'text-rose-400'}>
                • Custodia Zero-Knowledge: {testOutput.zkSuite.details}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Seed Phrase Backup Sub-Modal */}
      {showSeedModal && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-3xl flex items-center justify-center p-4">
          <div className="bg-[#0e0e14] border border-amber-500/40 rounded-[28px] max-w-md w-full p-5 text-white space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
                <Key className="w-4 h-4 text-amber-400" />
                <span>Frase Semilla Mnemónica Zero-Knowledge</span>
              </div>
              <button
                onClick={() => setShowSeedModal(false)}
                className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Escribe estas 12 palabras en un papel de forma confidencial. Permiten restaurar tus chats cifrados E2EE y bóveda privada en cualquier nuevo dispositivo si borras la memoria local.
            </p>

            <div className="grid grid-cols-3 gap-2 bg-[#070709] p-3 rounded-2xl border border-white/10 font-mono text-xs">
              {seedPhrase.split(' ').map((word, idx) => (
                <div key={idx} className="bg-slate-900/90 border border-white/5 rounded-lg p-1.5 text-center">
                  <span className="text-[9px] text-slate-500 block">{idx + 1}</span>
                  <span className="font-bold text-amber-300">{word}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex items-center space-x-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(seedPhrase);
                  setSeedCopied(true);
                  setTimeout(() => setSeedCopied(false), 2000);
                }}
                className="flex-1 py-2 bg-gradient-to-r from-amber-500 to-rose-600 text-slate-950 font-black rounded-xl text-xs"
              >
                {seedCopied ? '¡Copiado!' : 'Copiar Frase Semilla'}
              </button>
              <button
                onClick={() => setShowSeedModal(false)}
                className="py-2 px-4 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
