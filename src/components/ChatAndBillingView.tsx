import React, { useState, useEffect } from 'react';
import { EphemeralChatWindow } from './EphemeralChatWindow';
import { SubscriptionModal } from './SubscriptionModal';
import {
  Flame,
  CreditCard,
  ShieldCheck,
  Lock,
  Sparkles,
  Award,
  RefreshCw,
  CheckCircle2,
  AlertOctagon
} from 'lucide-react';
import { SubscriptionRecord } from '../services/billingService';

export const ChatAndBillingView: React.FC = () => {
  const [currentUserId, setCurrentUserId] = useState<string>('usr_male_unpaid_11');
  const [currentUserRole, setCurrentUserRole] = useState<'solo_male' | 'solo_female' | 'couple'>('solo_male');
  const [currentUserAlias, setCurrentUserAlias] = useState<string>('Carlos Bull (Cartagena)');
  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState<boolean>(false);

  const fetchSubscriptionStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/billing/subscription-status/${currentUserId}`);
      const data = await res.json();
      setSubscription(data);
    } catch (err) {
      console.warn('Error obteniendo estado de suscripción:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionStatus();
  }, [currentUserId]);

  const isSubscribed = subscription?.status === 'active';

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Identity & Subscription Control Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 font-extrabold text-xs tracking-wider uppercase font-mono">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>Canal Privado E2EE • Bóveda Aethel</span>
            </div>
            <h2 className="text-2xl font-black text-white mt-1 tracking-tight">
              Mensajería Efímera &amp; Membresía Exclusiva
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Simula diferentes roles para probar el control de acceso y comunicación en tiempo real.
            </p>
          </div>

          {/* Role & Persona Selector for Simulation */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#08080c] p-2 rounded-2xl border border-white/10 text-xs shadow-inner">
            <span className="text-slate-400 font-bold px-2 text-[11px] font-mono uppercase tracking-wider">Simular Rol:</span>
            
            <button
              onClick={() => {
                setCurrentUserId('usr_male_unpaid_11');
                setCurrentUserRole('solo_male');
                setCurrentUserAlias('Carlos Bull (Cartagena)');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                currentUserId === 'usr_male_unpaid_11'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/50'
                  : 'bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>Bull (Inactivo)</span>
            </button>

            <button
              onClick={() => {
                setCurrentUserId('usr_bull_bogota_07');
                setCurrentUserRole('solo_male');
                setCurrentUserAlias('Andrés Bull VIP (Bogotá)');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                currentUserId === 'usr_bull_bogota_07'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/30'
                  : 'bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
              <span>Bull VIP (Activo)</span>
            </button>

            <button
              onClick={() => {
                setCurrentUserId('cpl_medellin_bi_01');
                setCurrentUserRole('couple');
                setCurrentUserAlias('Camila & Mateo (Pareja)');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                currentUserId === 'cpl_medellin_bi_01'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50'
                  : 'bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>👥 Pareja (Gratis)</span>
            </button>
          </div>
        </div>

        {/* Membership Status Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Estado de Membresía */}
          <div className="bg-[#0a0a0f] p-4.5 rounded-2xl border border-white/[0.08] flex items-center justify-between shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="space-y-1.5 z-10">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                Estado de Tu Membresía:
              </span>
              <div className="flex items-center space-x-2">
                <span
                  className={`text-xs font-black font-mono px-3 py-1 rounded-full flex items-center space-x-1.5 border shadow-md ${
                    currentUserRole !== 'solo_male' || isSubscribed
                      ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50'
                      : 'bg-rose-950/90 text-rose-300 border-rose-500/50'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      currentUserRole !== 'solo_male' || isSubscribed
                        ? 'bg-emerald-400 animate-pulse'
                        : 'bg-rose-500'
                    }`}
                  />
                  <span>
                    {currentUserRole !== 'solo_male'
                      ? 'ACCESO GRATUITO (Parejas/Mujeres)'
                      : isSubscribed
                      ? 'PASE VIP ACTIVO (Wompi)'
                      : 'INACTIVA (Requiere Pase)'}
                  </span>
                </span>
              </div>
            </div>

            {!isSubscribed && currentUserRole === 'solo_male' && (
              <button
                onClick={() => setShowSubscriptionModal(true)}
                className="z-10 px-4 py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-rose-500 hover:brightness-110 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center space-x-1.5 active:scale-95 cursor-pointer shrink-0 border border-amber-300/40"
              >
                <Award className="w-4 h-4 text-slate-950" />
                <span>Activar Pase Wompi</span>
              </button>
            )}
          </div>

          {/* Card 2: Plan / Vencimiento */}
          <div className="bg-[#0a0a0f] p-4.5 rounded-2xl border border-white/[0.08] space-y-1.5 shadow-xl relative overflow-hidden">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
              Plan Actual / Vencimiento:
            </span>
            <div className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="text-xs text-slate-100 font-mono font-black">
                {currentUserRole !== 'solo_male'
                  ? 'Membresía Ilimitada Sin Costo'
                  : subscription?.planId === 'quarterly_vip_solo_male'
                  ? 'Trimestral VIP ($199.000 COP)'
                  : subscription?.planId === 'monthly_solo_male'
                  ? 'Mensual ($89.000 COP)'
                  : 'Sin suscripción activa'}
              </p>
            </div>
          </div>

          {/* Card 3: Protocolo de Bóveda */}
          <div className="bg-[#0a0a0f] p-4.5 rounded-2xl border border-white/[0.08] space-y-1.5 shadow-xl relative overflow-hidden">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
              Protocolo de Bóveda:
            </span>
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
              <p className="text-xs text-purple-300 font-bold font-mono">
                Consentimiento Recíproco Obligatorio
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Ephemeral Chat Component */}
      <EphemeralChatWindow
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        currentUserAlias={currentUserAlias}
        peerUserId={
          currentUserId === 'cpl_medellin_bi_01'
            ? 'usr_bull_bogota_07'
            : 'cpl_medellin_bi_01'
        }
        peerAlias={
          currentUserId === 'cpl_medellin_bi_01'
            ? 'Andrés Bull (Bogotá)'
            : 'Camila & Mateo (Medellín Bi)'
        }
      />

      {/* Subscription Modal Popup */}
      {showSubscriptionModal && (
        <SubscriptionModal
          userId={currentUserId}
          userAlias={currentUserAlias}
          onClose={() => setShowSubscriptionModal(false)}
          onSubscriptionSuccess={() => {
            fetchSubscriptionStatus();
          }}
        />
      )}
    </div>
  );
};
