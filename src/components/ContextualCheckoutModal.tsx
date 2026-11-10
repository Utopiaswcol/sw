import React, { useState } from 'react';
import {
  createWompiCheckoutSession,
  simulateManualPaymentApproval
} from '../services/billingService';
import { grantSingleConnectionPass } from '../services/densityRadarService';
import { haptics } from '../services/hapticsService';
import {
  X,
  ShieldCheck,
  Zap,
  Lock,
  MessageSquare,
  Key,
  Crown,
  CreditCard,
  CheckCircle2,
  Sparkles,
  Smartphone,
  Building2,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

interface ContextualCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  userRole?: 'solo_male' | 'couple' | 'single_woman' | 'solo_female';
  targetCandidate?: {
    id: string;
    alias: string;
    avatarUrl?: string;
    affinityScore?: number;
    primaryZone?: string;
  } | null;
  onPaymentSuccess?: (accessType: 'single_pass' | 'subscription', planName: string) => void;
}

export const ContextualCheckoutModal: React.FC<ContextualCheckoutModalProps> = ({
  isOpen,
  onClose,
  userId = 'usr_male_unpaid_11',
  userRole = 'solo_male',
  targetCandidate,
  onPaymentSuccess
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'single_pass' | 'monthly_solo_male' | 'quarterly_vip_solo_male'>(
    'single_pass'
  );
  const [selectedMethod, setSelectedMethod] = useState<'NEQUI' | 'PSE' | 'CARD'>('NEQUI');
  const [consentChecked, setConsentChecked] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paymentDoneMsg, setPaymentDoneMsg] = useState<string | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // For Couples & Solo Females: 100% Free VIP Access with NO Charges
  const isFreeRole = userRole === 'couple' || userRole === 'single_woman' || userRole === 'solo_female';

  const handleProcessPayment = async () => {
    if (!consentChecked) {
      setErrorMessage('Debes confirmar el acuerdo de consentimiento mutuo y respeto de límites.');
      return;
    }
    setErrorMessage(null);

    haptics.toggle();
    setIsProcessing(true);
    setPaymentDoneMsg(null);

    // Simulate Wompi API response / local approval
    setTimeout(() => {
      setIsProcessing(false);

      if (selectedPlan === 'single_pass') {
        const candidateId = targetCandidate?.id || 'cand_cpl_chico_01';
        grantSingleConnectionPass(userId, candidateId);
        setPaymentDoneMsg(
          `¡Pase de Conexión Individual activado para ${targetCandidate?.alias || 'esta pareja'}! Chat y llave habilitados.`
        );
        haptics.success();
        if (onPaymentSuccess) {
          onPaymentSuccess('single_pass', 'Pase de Conexión Individual ($19.000 COP)');
        }
      } else {
        simulateManualPaymentApproval(userId, selectedPlan);
        const planTitle =
          selectedPlan === 'quarterly_vip_solo_male'
            ? 'Membresía Trimestral Élite ($199.000 COP)'
            : 'Membresía Mensual VIP ($89.000 COP)';
        setPaymentDoneMsg(`¡${planTitle} activada exitosamente! Insignia "Bull Verificado" obtenida.`);
        haptics.success();
        if (onPaymentSuccess) {
          onPaymentSuccess('subscription', planTitle);
        }
      }

      setTimeout(() => {
        onClose();
      }, 1800);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#09090e] border border-amber-500/40 rounded-3xl p-6 md:p-8 shadow-2xl text-slate-100 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Glow ambient background elements */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => {
            haptics.selection();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/10 transition-all cursor-pointer z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {isFreeRole ? (
          /* FREE ROLE VIEW FOR COUPLES & SOLO FEMALES (NO PAYWALLS EVER) */
          <div className="space-y-6 py-2 text-center">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-600 via-rose-500 to-amber-400 p-0.5 mx-auto shadow-2xl animate-pulse">
              <div className="w-full h-full bg-[#07070a] rounded-[22px] flex items-center justify-center">
                <Crown className="w-8 h-8 text-amber-400" />
              </div>
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-extrabold bg-rose-950/80 text-rose-300 border border-rose-800/80 uppercase tracking-wider">
                ✨ MEMBRESÍA VIP 100% GRATUITA PARA PAREJAS Y MUJERES
              </span>
              <h2 className="text-2xl font-black text-white">
                Acceso Ilimitado Sin Costo
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                En <strong>Aethel Vault</strong> las parejas y mujeres solas disfrutan de acceso libre permanente a la bóveda cifrada, chat efímero e intercambio de llaves digitales sin ninguna tarifa.
              </p>
            </div>

            <div className="bg-[#0e0e14] border border-amber-500/30 p-4 rounded-2xl text-left space-y-2 max-w-md mx-auto">
              <div className="flex items-center space-x-2 text-amber-300 text-xs font-bold font-mono">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Verificación Biométrica 3D Opcional</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-normal">
                Puedes solicitar tu sello de <strong>Perfil VIP Verificado</strong> totalmente gratis mediante una selfie biométrica 3D confidencial para generar máxima confianza sin mostrar tu documento.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  haptics.success();
                  if (targetCandidate) {
                    const candidateId = targetCandidate.id;
                    grantSingleConnectionPass(userId, candidateId);
                  }
                  if (onPaymentSuccess) {
                    onPaymentSuccess('subscription', 'Membresía VIP Gratuita (Pareja / Mujer)');
                  }
                  onClose();
                }}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-rose-600 to-amber-500 text-white font-black text-sm rounded-2xl shadow-2xl transition-all active:scale-95 cursor-pointer flex items-center justify-center space-x-2"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Ingresar a Bóveda &amp; Iniciar Chat (Acceso Gratuito)</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Header Section */}
        <div className="space-y-2 mb-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>DESBLOQUEO CONTEXTUAL POR INTENCIÓN • WOMPI COLOMBIA</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Acceso Directo e Interacción Discreta
          </h2>

          {targetCandidate && (
            <p className="text-amber-200/90 text-sm font-medium bg-amber-950/40 p-2.5 rounded-xl border border-amber-500/30 flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Conectando con <strong className="text-white font-bold">{targetCandidate.alias}</strong> ({targetCandidate.affinityScore}% Afinidad • {targetCandidate.primaryZone})
              </span>
            </p>
          )}
        </div>

        {/* Success Message Banner */}
        {paymentDoneMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 text-sm font-bold flex items-center space-x-3 shadow-xl animate-fade-in">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <span>{paymentDoneMsg}</span>
          </div>
        )}

        {/* Plan Selection Cards */}
        <div className="space-y-3 mb-6">
          <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
            1. Selecciona tu Nivel de Acceso:
          </span>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Option 1: Single Connection Pass */}
            <button
              type="button"
              onClick={() => {
                haptics.selection();
                setSelectedPlan('single_pass');
              }}
              className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                selectedPlan === 'single_pass'
                  ? 'bg-amber-950/40 border-amber-500 text-white shadow-xl shadow-amber-500/10 ring-1 ring-amber-500'
                  : 'bg-[#08080c] hover:bg-slate-900 border-white/10 text-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                    Pase Individual
                  </span>
                  <MessageSquare className="w-4 h-4 text-amber-400" />
                </div>
                <h4 className="font-extrabold text-base text-white">Chat + Bóveda</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-tight">
                  Habilita chat efímero y solicitud de llave únicamente para este perfil.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-white/10">
                <span className="text-lg font-extrabold text-amber-300 font-mono">
                  $19.000 COP
                </span>
                <span className="text-[10px] text-slate-400 block">Pago único por perfil</span>
              </div>
            </button>

            {/* Option 2: Monthly VIP Membership */}
            <button
              type="button"
              onClick={() => {
                haptics.selection();
                setSelectedPlan('monthly_solo_male');
              }}
              className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                selectedPlan === 'monthly_solo_male'
                  ? 'bg-amber-950/40 border-amber-500 text-white shadow-xl shadow-amber-500/10 ring-1 ring-amber-500'
                  : 'bg-[#08080c] hover:bg-slate-900 border-white/10 text-slate-300'
              }`}
            >
              <div className="absolute -top-2.5 right-3 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider">
                Recomendado
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                    Membresía Mensual
                  </span>
                  <Crown className="w-4 h-4 text-amber-400" />
                </div>
                <h4 className="font-extrabold text-base text-white">Bulls VIP</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-tight">
                  Chats ilimitados con todas las parejas, llaves prioritarias e insignia "Bull Verificado".
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-white/10">
                <span className="text-lg font-extrabold text-amber-300 font-mono">
                  $89.000 COP
                </span>
                <span className="text-[10px] text-slate-400 block">30 días de acceso ilimitado</span>
              </div>
            </button>

            {/* Option 3: Quarterly Elite */}
            <button
              type="button"
              onClick={() => {
                haptics.selection();
                setSelectedPlan('quarterly_vip_solo_male');
              }}
              className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                selectedPlan === 'quarterly_vip_solo_male'
                  ? 'bg-purple-950/40 border-purple-500 text-white shadow-xl shadow-purple-500/10 ring-1 ring-purple-500'
                  : 'bg-[#08080c] hover:bg-slate-900 border-white/10 text-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-purple-400 uppercase">
                    Trimestral Élite
                  </span>
                  <Zap className="w-4 h-4 text-purple-400" />
                </div>
                <h4 className="font-extrabold text-base text-white">VIP Preferencial</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-tight">
                  Ahorro del 25%, soporte directo prioritario e insignia Élite de por vida.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-white/10">
                <span className="text-lg font-extrabold text-purple-300 font-mono">
                  $199.000 COP
                </span>
                <span className="text-[10px] text-slate-400 block">90 días de acceso VIP</span>
              </div>
            </button>
          </div>
        </div>

        {/* Colombian Payment Method Selector */}
        <div className="space-y-3 mb-6">
          <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
            2. Método de Pago Colombia (Wompi Gateway):
          </span>

          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => {
                haptics.selection();
                setSelectedMethod('NEQUI');
              }}
              className={`p-3 rounded-2xl border flex items-center justify-center space-x-2 text-xs font-bold transition-all cursor-pointer ${
                selectedMethod === 'NEQUI'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-lg'
                  : 'bg-slate-900 text-slate-300 border-white/10 hover:bg-slate-800'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Nequi</span>
            </button>

            <button
              type="button"
              onClick={() => {
                haptics.selection();
                setSelectedMethod('PSE');
              }}
              className={`p-3 rounded-2xl border flex items-center justify-center space-x-2 text-xs font-bold transition-all cursor-pointer ${
                selectedMethod === 'PSE'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-lg'
                  : 'bg-slate-900 text-slate-300 border-white/10 hover:bg-slate-800'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>PSE / Débito</span>
            </button>

            <button
              type="button"
              onClick={() => {
                haptics.selection();
                setSelectedMethod('CARD');
              }}
              className={`p-3 rounded-2xl border flex items-center justify-center space-x-2 text-xs font-bold transition-all cursor-pointer ${
                selectedMethod === 'CARD'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-lg'
                  : 'bg-slate-900 text-slate-300 border-white/10 hover:bg-slate-800'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Tarjeta Crédito</span>
            </button>
          </div>
        </div>

        {/* Discretion Guarantee Badge */}
        <div className="bg-[#050508] p-3.5 rounded-2xl border border-amber-500/30 mb-6 flex items-center space-x-3">
          <ShieldCheck className="w-6 h-6 text-amber-400 shrink-0" />
          <div className="text-xs">
            <p className="font-bold text-amber-200">
              Garantía de Cobro 100% Neutro y Discreto
            </p>
            <p className="text-[11px] text-slate-400">
              El cobro aparecerá en tu extracto bancario o app Nequi bajo la razón social neutra:{' '}
              <strong className="text-white font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-white/10">
                SERVICIOS DIGITALES S.A.S.
              </strong>
            </p>
          </div>
        </div>

        {/* Consent Toggle Checkbox */}
        <div className="mb-4 flex items-start space-x-3 bg-slate-900/60 p-3.5 rounded-2xl border border-white/10">
          <input
            type="checkbox"
            id="consentToggle"
            checked={consentChecked}
            onChange={(e) => setConsentChecked(e.target.checked)}
            className="mt-0.5 rounded border-amber-500 text-amber-500 focus:ring-amber-500 h-4 w-4 bg-slate-950 cursor-pointer"
          />
          <label htmlFor="consentToggle" className="text-xs text-slate-300 cursor-pointer leading-tight">
            Acepto el Código de Ética y Respeto Mutuo Aethel: No capturar pantalla, respetar límites marcados en los vectores psicométricos y no compartir enlaces de bóvedas.
          </label>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-950/80 border border-rose-500/50 rounded-xl text-rose-200 text-xs font-bold animate-in fade-in">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleProcessPayment}
          disabled={isProcessing}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-base flex items-center justify-center space-x-2 transition-all shadow-xl shadow-amber-500/20 active:scale-98 disabled:opacity-50 cursor-pointer"
        >
          {isProcessing ? (
            <div className="flex items-center space-x-2 font-mono">
              <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              <span>Procesando Pasarela Wompi...</span>
            </div>
          ) : (
            <>
              <span>
                {selectedPlan === 'single_pass'
                  ? 'Pagar $19.000 COP y Desbloquear Chat'
                  : selectedPlan === 'monthly_solo_male'
                  ? 'Activar Membresía Mensual VIP ($89.000 COP)'
                  : 'Activar Membresía Trimestral Élite ($199.000 COP)'}
              </span>
              <ArrowRight className="w-5 h-5 fill-slate-950" />
            </>
          )}
        </button>
          </>
        )}

        <p className="text-[10px] text-center text-slate-500 font-mono mt-3">
          Simulación en Sandbox Wompi para Pruebas Locales • SSL 256-Bit Encrypted Gateway
        </p>
      </div>
    </div>
  );
};
