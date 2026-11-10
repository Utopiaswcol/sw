import React, { useState } from 'react';
import {
  ShieldCheck,
  Zap,
  CheckCircle2,
  X,
  CreditCard,
  Building2,
  Smartphone,
  Lock,
  Sparkles,
  RefreshCw,
  Award,
  DollarSign
} from 'lucide-react';
import { SUBSCRIPTION_PLAN_CATALOG } from '../services/billingService';

interface SubscriptionModalProps {
  userId: string;
  userAlias?: string;
  onClose: () => void;
  onSubscriptionSuccess: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  userId,
  userAlias = 'Hombre Solo',
  onClose,
  onSubscriptionSuccess
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<
    'monthly_solo_male' | 'quarterly_vip_solo_male'
  >('quarterly_vip_solo_male');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'NEQUI' | 'PSE' | 'CARD'>('NEQUI');
  const [loading, setLoading] = useState<boolean>(false);
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);

  const selectedPlan = SUBSCRIPTION_PLAN_CATALOG[selectedPlanId];

  const handleCreateCheckout = async () => {
    setLoading(true);
    setCheckoutData(null);
    try {
      const res = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          planId: selectedPlanId
        })
      });

      const data = await res.json();
      setCheckoutData(data);
    } catch (err: any) {
      alert('Error iniciando checkout Wompi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateApprovedPayment = async () => {
    if (!checkoutData) return;
    setLoading(true);
    try {
      // Simular evento webhook Wompi APPROVED
      const res = await fetch('/api/billing/wompi-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'transaction.updated',
          data: {
            transaction: {
              reference: checkoutData.reference,
              status: 'APPROVED',
              amount_in_cents: checkoutData.amountInCents,
              currency: 'COP',
              payment_method_type: selectedPaymentMethod
            }
          }
        })
      });

      const data = await res.json();
      if (data.success) {
        setPaymentSuccess(true);
        setTimeout(() => {
          onSubscriptionSuccess();
          onClose();
        }, 2000);
      }
    } catch (err: any) {
      alert('Error simulando pago: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 select-none">
      <div className="relative w-full max-w-xl bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="px-6 py-5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/30 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Membresía VIP para Hombres Solos</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700">
                  WOMPI COLOMBIA
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Acceso exclusivo, respetuoso y filtrado a la comunidad de parejas y unicornios
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 bg-slate-900">
          {paymentSuccess ? (
            <div className="py-10 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-950 border border-emerald-600 rounded-full flex items-center justify-center mx-auto text-emerald-400 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold text-white">¡Pago Aprobado Exitosamente!</h4>
              <p className="text-xs text-slate-300">
                Tu membresía VIP en ENM Colombia está activa. Ahora tienes acceso completo a las bóvedas privadas y chat efímero.
              </p>
            </div>
          ) : (
            <>
              {/* Plan Selection */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Selecciona tu Plan de Suscripción:
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Monthly Plan */}
                  <div
                    onClick={() => setSelectedPlanId('monthly_solo_male')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      selectedPlanId === 'monthly_solo_male'
                        ? 'bg-amber-950/40 border-amber-500 text-white shadow-lg'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-slate-200">Plan Mensual</span>
                      <span className="text-xs font-mono font-bold text-amber-400">$89.000 COP</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-400">
                      Acceso por 30 días a solicitud de bóvedas e interacción con parejas.
                    </p>
                  </div>

                  {/* Quarterly VIP Plan */}
                  <div
                    onClick={() => setSelectedPlanId('quarterly_vip_solo_male')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all relative ${
                      selectedPlanId === 'quarterly_vip_solo_male'
                        ? 'bg-amber-950/40 border-amber-500 text-white shadow-lg ring-1 ring-amber-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="absolute -top-2.5 right-3 bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                      Recomendado VIP
                    </span>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-white">Trimestral VIP</span>
                      <span className="text-xs font-mono font-bold text-amber-400">$199.000 COP</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-300">
                      Ahorra 25% • 90 días con insignia Bull Verificado e interés destacado.
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Methods (Wompi) */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Medio de Pago Local en Colombia (Wompi):
                </label>

                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setSelectedPaymentMethod('NEQUI')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1 text-xs font-bold transition-all ${
                      selectedPaymentMethod === 'NEQUI'
                        ? 'bg-purple-950/60 border-purple-500 text-purple-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 text-purple-400" />
                    <span>Nequi</span>
                  </button>

                  <button
                    onClick={() => setSelectedPaymentMethod('PSE')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1 text-xs font-bold transition-all ${
                      selectedPaymentMethod === 'PSE'
                        ? 'bg-blue-950/60 border-blue-500 text-blue-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Building2 className="w-5 h-5 text-blue-400" />
                    <span>PSE Bancos</span>
                  </button>

                  <button
                    onClick={() => setSelectedPaymentMethod('CARD')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1 text-xs font-bold transition-all ${
                      selectedPaymentMethod === 'CARD'
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-emerald-400" />
                    <span>Tarjeta Deb/Cred</span>
                  </button>
                </div>
              </div>

              {/* Checkout Action Button */}
              {!checkoutData ? (
                <button
                  onClick={handleCreateCheckout}
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl transition-all flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  <span>Generar Checkout Wompi (${selectedPlan.amountCOP.toLocaleString('es-CO')} COP)</span>
                </button>
              ) : (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs">
                  <div className="flex justify-between text-slate-300 border-b border-slate-800 pb-2">
                    <span>Referencia Transacción:</span>
                    <span className="text-amber-400 font-bold">{checkoutData.reference}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Firma Criptográfica SHA-256:</span>
                    <span className="text-purple-300 text-[10px] truncate max-w-[200px]">
                      {checkoutData.signature}
                    </span>
                  </div>

                  <button
                    onClick={handleSimulateApprovedPayment}
                    disabled={loading}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>Simular Confirmación de Pago Wompi (Approved Webhook)</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
