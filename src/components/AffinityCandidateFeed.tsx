import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SecureMediaViewer } from './SecureMediaViewer';
import { RadarChart5D } from './RadarChart5D';
import { BlindRevealImage } from './BlindRevealImage';
import { DensityRadarView } from './DensityRadarView';
import { ContextualCheckoutModal } from './ContextualCheckoutModal';
import { MoodSwitcherBar } from './MoodSwitcherBar';
import { CandidateMediaGallery } from './CandidateMediaGallery';
import { ProfileReputationAndCreatorSection } from './ProfileReputationAndCreatorSection';
import { ReportAndBlockModal } from './ReportAndBlockModal';
import {
  AudienceVisibilityState,
  MEDIA_GOVERNANCE_CONFIG
} from '../config/mediaGovernance';
import {
  getDensityRadarMetrics,
  hasActiveAccessPass,
  grantSingleConnectionPass
} from '../services/densityRadarService';
import { getSubscriptionStatus } from '../services/billingService';
import { haptics } from '../services/hapticsService';
import { notificationService } from '../services/notificationService';
import { SYSTEM_10_ADDITIONAL_CANDIDATES } from '../data/profilesData';
import {
  recordUserInteraction,
  recalibrateProfileVector,
  getUserInteractionHistory,
  RecalibrationResult
} from '../services/behavioralVectorService';
import { runBehavioralVectorTestSuite } from '../services/behavioralTestRunner';
import {
  COLOMBIA_BASE_CITIES,
  REGIONAL_NODES,
  getZoneNameById,
  CityConfig
} from '../services/tieredZonesService';
import {
  Sparkles,
  ShieldCheck,
  Lock,
  Unlock,
  Key,
  Eye,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  X,
  Sliders,
  Users,
  User,
  HeartHandshake,
  MessageSquare,
  Navigation,
  Compass,
  Award,
  RefreshCw,
  MapPin,
  Radar,
  Flame,
  Globe2,
  Building2,
  Plus,
  Check,
  Search,
  CheckCircle2,
  SlidersHorizontal,
  Activity,
  Zap,
  Crown,
  Sun,
  Palmtree,
  Maximize2,
  Mountain,
  Calendar,
  Landmark,
  Trees,
  Map,
  ShieldAlert
} from 'lucide-react';

interface Candidate {
  candidateId: string;
  alias: string;
  role: 'couple' | 'solo_female' | 'solo_male';
  roleTitle: string;
  location: string;
  zoneId?: string;
  zoneLabel?: string;
  proximityLabel?: string;
  quadrantId?: string;
  hybridTotalScore?: number;
  tagline: string;
  bio: string;
  affinityPercentage: number;
  cosineDistance: number;
  vetoCheckPassed: boolean;
  reasonIfBlocked?: string;
  vector5D: [number, number, number, number, number];
  publicImage: string;
  vaultMediaId: string;
  vaultAssetCount: number;
  hasVaultPermission: boolean;
  hardVetoesRespected: string[];
  verifiedBadges: string[];
  optOutBlindReveal?: boolean;
  privacyMode?: 'public' | 'blur_discreet' | 'blur_maximum';
}

interface AffinityCandidateFeedProps {
  userId?: string;
  userRole?: 'solo_male' | 'couple' | 'single_woman';
  onNavigateToTab?: (tab: string) => void;
}

export const AffinityCandidateFeed: React.FC<AffinityCandidateFeedProps> = ({
  userId = 'usr_male_unpaid_11',
  userRole = 'solo_male',
  onNavigateToTab
}) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [minAffinity, setMinAffinity] = useState<number>(60);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Vault Guide Dismissal State
  const [hasDismissedVaultGuide, setHasDismissedVaultGuide] = useState<boolean>(() => {
    try {
      return localStorage.getItem('enm_dismissed_vault_guide') === 'true';
    } catch {
      return false;
    }
  });

  const handleDismissVaultGuide = () => {
    haptics.selection();
    setHasDismissedVaultGuide(true);
    try {
      localStorage.setItem('enm_dismissed_vault_guide', 'true');
    } catch (e) {
      console.error(e);
    }
  };

  // Active Chat Sessions State
  const [activeChatSessions, setActiveChatSessions] = useState<Record<string, boolean>>({});

  // Active View Tab: 'feed' or 'radar'
  const [activeTab, setActiveTab] = useState<'feed' | 'radar'>('feed');

  // Mood Switcher Audience Visibility State (Defaults: parejas + unicornios activos)
  const [audienceVisibility, setAudienceVisibility] = useState<AudienceVisibilityState>(
    MEDIA_GOVERNANCE_CONFIG.AUDIENCE_SWITCHER.DEFAULT
  );

// Clean Geolocation & Multi-Zone Location Model State
  const [baseCityId, setBaseCityId] = useState<string>('bogota');
  const [baseZoneId, setBaseZoneId] = useState<string>('bog_all');
  const [exploreCity, setExploreCity] = useState<string | null>('Medellín');
  const [travelDays, setTravelDays] = useState<'3d' | '7d' | '15d' | '30d'>('7d');
  const [isNationalScope, setIsNationalScope] = useState<boolean>(false);
  const [exploreSearchInput, setExploreSearchInput] = useState<string>('');

  const [showZonePicker, setShowZonePicker] = useState<boolean>(false);
  const [vaultCourtesyModal, setVaultCourtesyModal] = useState<boolean>(false);

  // Compute activeZoneIds dynamically based on user choices
  const activeZoneIds = useMemo(() => {
    if (isNationalScope) return ['all_colombia'];
    const zones = [baseZoneId];
    if (exploreCity) {
      zones.push(`custom_${exploreCity.toLowerCase().replace(/\s+/g, '_')}`);
    }
    return zones;
  }, [isNationalScope, baseZoneId, exploreCity]);

  // Contextual Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [checkoutCandidate, setCheckoutCandidate] = useState<{
    id: string;
    alias: string;
    avatarUrl: string;
    affinityScore: number;
    primaryZone: string;
  } | null>(null);

  // Active Expanded 5D Sheet Candidate Modal
  const [expandedCandidate, setExpandedCandidate] = useState<Candidate | null>(null);

  // Secure Media Viewer Modal State
  const [activeSecureViewer, setActiveSecureViewer] = useState<{
    mediaId: string;
    alias: string;
  } | null>(null);

  // Simulated Granted Keys
  const [grantedKeys, setGrantedKeys] = useState<Record<string, boolean>>({});

  // Unlocked Discreet Photos State
  const [unlockedPhotos, setUnlockedPhotos] = useState<Record<string, boolean>>({});

  // Fullscreen Image Lightbox Modal State
  const [fullscreenImageModal, setFullscreenImageModal] = useState<{
    url: string;
    title: string;
    alias: string;
  } | null>(null);

  // Connection State per profile
  const [connectionState, setConnectionState] = useState<Record<string, 'NONE' | 'PENDING' | 'CONNECTED'>>({});

  // Luxury Custom Notice Dialog State (Replaces native browser alerts)
  const [luxuryNotice, setLuxuryNotice] = useState<{ title: string; message: string } | null>(null);

  const handleToggleConnection = (candidate: Candidate) => {
    haptics.selection();
    const currentState = connectionState[candidate.candidateId] || 'NONE';

    if (currentState === 'CONNECTED') {
      setConnectionState((prev) => ({ ...prev, [candidate.candidateId]: 'NONE' }));
      haptics.success();
      setLuxuryNotice({
        title: 'Vínculo Finalizado',
        message: `Has removido la conexión discreta con ${candidate.alias}.`
      });
    } else {
      setConnectionState((prev) => ({ ...prev, [candidate.candidateId]: 'CONNECTED' }));
      haptics.success();
      notificationService.addNotification({
        type: 'CHAT_INVITE',
        senderId: 'usr_me',
        senderAlias: 'Tu Perfil VIP',
        senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
        senderRole: 'couple',
        message: `Te has conectado exitosamente con ${candidate.alias}`,
        status: 'pending'
      });
      setLuxuryNotice({
        title: '✨ Vínculo Conectado',
        message: `¡Conexión establecida con ${candidate.alias}! Ahora están vinculados en la red social discreta.`
      });
    }
  };

  // User Subscription / Pass State
  const [hasSubscription, setHasSubscription] = useState<boolean>(false);

  useEffect(() => {
    // Check initial subscription status
    getSubscriptionStatus(userId).then((sub) => {
      setHasSubscription(sub.status === 'active');
    });
  }, [userId]);

  // Behavioral Vector State
  const [userVector5D, setUserVector5D] = useState<[number, number, number, number, number]>([0.2, 0.4, -0.1, 0.5, 0.3]);
  const [recalibrationInfo, setRecalibrationInfo] = useState<RecalibrationResult | null>(null);
  const [showTestModal, setShowTestModal] = useState<boolean>(false);
  const [testSuiteOutput, setTestSuiteOutput] = useState<{ passed: boolean; details: string } | null>(null);

  // Report & Shadow Block State
  const [reportModalCandidate, setReportModalCandidate] = useState<{ id: string; alias: string } | null>(null);
  const [blockedProfileIds, setBlockedProfileIds] = useState<string[]>([]);

  // Profile View Timer for passive reading dwell tracking (> 8s)
  const cardEntryTimeRef = useRef<number>(Date.now());

  // Touch Swipe Gesture State
  const [touchStartX, setTouchStartX] = useState<number>(0);
  const [swipeOffset, setSwipeOffset] = useState<number>(0);
  const [isSwiping, setIsSwiping] = useState<boolean>(false);

  const localEncounterCandidates = () =>
    SYSTEM_10_ADDITIONAL_CANDIDATES
      .filter((c: any) => {
        const cId = c.candidateId || c.id;
        const cAlias = (c.alias || '').toLowerCase();
        return (
          cId !== userId &&
          cId !== 'carlos_sofia_vip' &&
          !cAlias.includes('carlos & sofía') &&
          !cAlias.includes('carlos y sofía')
        );
      })
      .map((c, idx) => ({
        ...c,
        affinityPercentage: c.affinityPercentage,
        proximityLabel: '📍 Coincidencia Directa',
        cosineDistance: c.cosineDistance,
        vetoCheckPassed: true,
        hasVaultPermission: false,
        privacyMode: c.privacyMode || (idx % 3 === 1 ? 'blur_discreet' : 'public')
      }));

  const loadCandidates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/matching/find-candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activeZoneIds,
          matchLimit: 20
        })
      });

      const data = await res.json();

      if (data.candidates && data.candidates.length > 0) {
        const filteredRaw = data.candidates.filter((c: any) => {
          const cId = c.candidate_id || c.id || c.candidateId;
          const cAlias = (c.alias || '').toLowerCase();
          return (
            cId !== userId &&
            cId !== 'carlos_sofia_vip' &&
            !cAlias.includes('carlos & sofía') &&
            !cAlias.includes('carlos y sofía')
          );
        });

        const augmented = filteredRaw.map((c: any, index: number) => {
          const candidateZoneId = c.zoneId || c.zone_id || (index % 2 === 0 ? 'bog_all' : 'esc_anapoima');

          return {
            ...c,
            candidateId: c.candidate_id || c.id || c.candidateId || `cand_${index}`,
            zoneId: candidateZoneId,
            alias: c.alias || 'Candidato VIP ENM',
            role: c.role || (c.candidate_type === 'couple' ? 'couple' : 'solo_female'),
            publicImage: c.publicImage || c.public_image || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
            affinityPercentage: Math.round(c.hybridTotalScore || (c.affinity_score ? c.affinity_score * 100 : 88)),
            proximityLabel: activeZoneIds.includes(candidateZoneId) || isNationalScope ? '📍 Coincidencia Directa' : 'Coincidencia Cercana',
            roleTitle:
              c.roleTitle ||
              (c.role === 'couple'
                ? 'Pareja Verificada VIP'
                : c.role === 'solo_female'
                ? 'Mujer Unicornio VIP'
                : 'Hombre Solo VIP'),
            tagline:
              c.tagline ||
              (c.role === 'couple'
                ? 'Pareja Bi Bilingüe • Búsqueda de Conexiones Éticas'
                : 'Exploradora de Dinámicas Poliamorosas'),
            bio:
              c.bio ||
              'Alineación psicométrica verificada con protocolo de consentimiento mutuo y límites duros.',
            vaultAssetCount: c.vaultAssetCount || (index % 3) + 3,
            location: c.location || getZoneNameById(candidateZoneId) || 'Colombia',
            verifiedBadges: ['Verificación Biométrica 3D', 'Límite Sanitario Ok', 'Identidad Verificada'],
            vector5D: c.vector5D || c.vector_5d || [0.8, 0.4, 0.9, -0.2, 0.7],
            privacyMode: c.privacyMode || (index % 3 === 1 ? 'blur_discreet' : 'public')
          };
        });
        setCandidates(augmented);
      } else {
        setCandidates(localEncounterCandidates());
      }
    } catch (err) {
      console.warn('Error cargando candidatos:', err);
      setCandidates(localEncounterCandidates());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
  }, [activeZoneIds]);

  // Request Vault Key Handler
  const handleRequestKey = async (candidate: Candidate) => {
    haptics.selection();
    const isConnected = connectionState[candidate.candidateId] === 'CONNECTED';

    // Courtesy rule: Must initiate connection/chat prior to requesting private vault access
    if (!isConnected) {
      setVaultCourtesyModal(true);
      return;
    }

    const isSoloMale = userRole === 'solo_male';

    if (!isSoloMale) {
      setGrantedKeys((prev) => ({ ...prev, [candidate.candidateId]: true }));
      haptics.success();
      setLuxuryNotice({
        title: '🔑 Llave de Bóveda Intercambiada',
        message: `¡Acceso concedido exitosamente con ${candidate.alias}! Tu perfil tiene acceso VIP Gratuito a sus álbumes privados.`
      });
      return;
    }

    const access = await hasActiveAccessPass(userId, candidate.candidateId, isSoloMale);

    if (access.hasAccess) {
      setGrantedKeys((prev) => ({ ...prev, [candidate.candidateId]: true }));
      haptics.success();
      setLuxuryNotice({
        title: '🔑 Llave Concedida',
        message: `Acceso activo a la Bóveda Privada de ${candidate.alias}.`
      });
    } else {
      // Open Contextual Checkout ONLY for unpaid solo male
      setCheckoutCandidate({
        id: candidate.candidateId,
        alias: candidate.alias,
        avatarUrl: candidate.publicImage,
        affinityScore: candidate.affinityPercentage,
        primaryZone: candidate.location
      });
      setIsCheckoutOpen(true);
    }
  };

  // Start Ephemeral Chat Handler
  const handleStartChat = async (candidate: Candidate) => {
    haptics.selection();
    const isSoloMale = userRole === 'solo_male';

    if (!isSoloMale) {
      setActiveChatSessions((prev) => ({ ...prev, [candidate.candidateId]: true }));
      haptics.success();
      if (onNavigateToTab) {
        onNavigateToTab('chat');
      } else {
        setLuxuryNotice({
          title: '💬 Chat Discreto Iniciado',
          message: `Iniciaste un canal privado de conversación con ${candidate.alias}.`
        });
      }
      return;
    }

    const access = await hasActiveAccessPass(userId, candidate.candidateId, isSoloMale);

    if (access.hasAccess) {
      setActiveChatSessions((prev) => ({ ...prev, [candidate.candidateId]: true }));
      haptics.success();
      if (onNavigateToTab) {
        onNavigateToTab('chat');
      } else {
        setLuxuryNotice({
          title: '💬 Chat Discreto Iniciado',
          message: `Canal seguro activo con ${candidate.alias}.`
        });
      }
    } else {
      // Open Contextual Checkout ONLY for unpaid solo male
      setCheckoutCandidate({
        id: candidate.candidateId,
        alias: candidate.alias,
        avatarUrl: candidate.publicImage,
        affinityScore: candidate.affinityPercentage,
        primaryZone: candidate.location
      });
      setIsCheckoutOpen(true);
    }
  };

  const handlePaymentSuccess = (accessType: 'single_pass' | 'subscription', planName: string) => {
    if (checkoutCandidate) {
      setGrantedKeys((prev) => ({ ...prev, [checkoutCandidate.id]: true }));
      setActiveChatSessions((prev) => ({ ...prev, [checkoutCandidate.id]: true }));
    }
    if (accessType === 'subscription') {
      setHasSubscription(true);
    }
  };

  // Touch Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    const currentX = e.touches[0].clientX;
    const deltaX = currentX - touchStartX;
    setSwipeOffset(deltaX);
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    if (swipeOffset < -90) {
      haptics.selection();
      handleNext();
    } else if (swipeOffset > 90) {
      haptics.selection();
      handlePrev();
    }
    setSwipeOffset(0);
  };

  const filteredCandidates = candidates.filter((c) => {
    // Filter by Mood Switcher Audience Visibility
    if (!audienceVisibility.couples && c.role === 'couple') return false;
    if (!audienceVisibility.single_females && c.role === 'solo_female') return false;
    if (!audienceVisibility.single_males && c.role === 'solo_male') return false;

    if (filterRole !== 'all' && c.role !== filterRole) return false;
    if (c.affinityPercentage < minAffinity) return false;
    return true;
  });

  const currentCandidate = filteredCandidates[currentIndex] || filteredCandidates[0];

  const handleNext = () => {
    if (currentIndex < filteredCandidates.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      setCurrentIndex(filteredCandidates.length - 1);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100dvh-5rem)] max-w-full lg:max-w-6xl mx-auto pb-24 select-none px-2 sm:px-4 pt-1 space-y-2">
      {/* Unified Ultra-Compact Navigation & Filter Header (Quiet Luxury Obsidian & Amber Theme) */}
      <div className="bg-[#09090b]/95 backdrop-blur-xl p-2.5 rounded-2xl border border-amber-500/20 shadow-2xl space-y-2 select-none">
        {/* Line 1: Location & Escapada Status Bar */}
        <div className="flex items-center justify-between gap-1.5 text-xs font-mono">
          {/* Base Location Info Button */}
          <button
            onClick={() => {
              haptics.selection();
              notificationService.info('📍 Bogotá D.C. es tu Ciudad Base fija. Para explorar perfiles en otra ciudad activa el Modo Escapada.');
            }}
            className="flex items-center space-x-1.5 px-2.5 py-1 bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700/60 text-amber-200/90 rounded-lg font-bold transition-all active:scale-95 cursor-pointer shrink-0 shadow-sm"
            title="Tu Ciudad Base fija de residencia (Configurada en Perfil Dual)"
          >
            <Navigation className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="truncate text-[11px]">Bogotá (Base)</span>
          </button>

          <div className="h-4 w-px bg-white/10 shrink-0" />

          {/* Escapada Pill or Activate Button */}
          {exploreCity ? (
            <div className="flex items-center space-x-1 px-2.5 py-1 bg-amber-950/60 border border-amber-500/30 text-amber-300 rounded-lg text-[10px] font-bold shrink-0 shadow-sm">
              <button
                onClick={() => {
                  haptics.selection();
                  setShowZonePicker(true);
                }}
                className="flex items-center space-x-1 cursor-pointer hover:text-amber-200"
                title="Cambiar ciudad o municipio de Escapada"
              >
                <Compass className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="truncate">✦ Escapada: {exploreCity} ({travelDays})</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  haptics.selection();
                  setExploreCity(null);
                  notificationService.info('Modo Escapada finalizado. Has regresado a tu Ciudad Base (Bogotá).');
                }}
                className="ml-1 p-0.5 text-slate-400 hover:text-rose-300 cursor-pointer rounded hover:bg-neutral-800 transition-colors"
                title="Finalizar Viaje Ahora (Volver a Ciudad Base)"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                haptics.selection();
                setShowZonePicker(true);
              }}
              className="flex items-center space-x-1 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-200 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer shrink-0 active:scale-95 shadow-sm"
              title="Buscar perfiles en Medellín, Cali, Cartagena, Eje Cafetero, etc."
            >
              <Compass className="w-3 h-3 text-amber-400 shrink-0" />
              <span>+ Activar Escapada</span>
            </button>
          )}
        </div>

        {/* Line 2: Audience Role Switcher */}
        <MoodSwitcherBar
          visibility={audienceVisibility}
          onChangeVisibility={(nextVis) => setAudienceVisibility(nextVis)}
          userRole={userRole}
        />
      </div>

      {/* Main Luxury Candidate Card Container */}
      {loading ? (
        <div className="h-96 bg-[#0e0e14] rounded-3xl border border-white/[0.08] flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-xs font-mono text-slate-400">Calculando Afinidad Coseno &amp; Geohash...</p>
        </div>
      ) : !currentCandidate ? (
        <div className="h-80 bg-[#0e0e14] rounded-3xl border border-white/[0.08] flex flex-col items-center justify-center space-y-3 p-6 text-center">
          <Compass className="w-10 h-10 text-slate-600" />
          <h3 className="text-sm font-bold text-white">No hay candidatos en este sector</h3>
          <p className="text-xs text-slate-400 max-w-xs">
            Prueba explorar otra ciudad o activar "Toda Colombia".
          </p>
          <button
            onClick={() => setShowZonePicker(true)}
            className="px-4 py-2 bg-gradient-to-r from-rose-600 to-amber-600 text-white rounded-xl text-xs font-bold shadow-lg cursor-pointer"
          >
            Cambiar Ubicación
          </button>
        </div>
      ) : (
        <div className="w-full">
          {/* Responsive Layout: Single column on Mobile, 2-Column Split on Desktop PC */}
          <div className="lg:grid lg:grid-cols-12 lg:gap-6 lg:items-start space-y-4 lg:space-y-0">
            {/* LEFT COLUMN (PC: 5 cols, Mobile: full width): Card Portrait & Media (Sticky on PC) */}
            <div className="lg:col-span-5 space-y-3 lg:sticky lg:top-20">
              <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{
                  transform: `translateX(${swipeOffset}px) rotate(${swipeOffset * 0.03}deg) translateZ(0)`,
                  willChange: 'transform',
                  transition: isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
                className={`relative rounded-[28px] overflow-hidden shadow-2xl flex flex-col border transition-all duration-300 ${
                  currentCandidate.role === 'couple'
                    ? 'bg-gradient-to-b from-[#1c1408] via-[#0f0c07] to-[#070604] border-amber-500/35 shadow-[0_10px_35px_rgba(245,158,11,0.15)]'
                    : currentCandidate.role === 'solo_female'
                    ? 'bg-gradient-to-b from-[#180a26] via-[#0f0818] to-[#08050e] border-purple-500/35 shadow-[0_10px_35px_rgba(168,85,247,0.15)]'
                    : 'bg-gradient-to-b from-[#0a152a] via-[#070e1c] to-[#040810] border-blue-500/35 shadow-[0_10px_35px_rgba(59,130,246,0.15)]'
                }`}
              >
                {/* Full-Bleed Portrait Photo */}
                {(() => {
                  const connectionState = activeChatSessions[currentCandidate.candidateId] ? 'CONNECTED' : 'DISCONNECTED';
                  const isPhotoBlurred = Boolean(
                    currentCandidate?.privacyMode &&
                      currentCandidate.privacyMode !== 'public' &&
                      !unlockedPhotos[currentCandidate.candidateId] &&
                      connectionState !== 'CONNECTED'
                  );

                  return (
                    <div
                      onClick={() => {
                        haptics.selection();
                        setExpandedCandidate(currentCandidate);
                      }}
                      className="relative h-[380px] sm:h-[420px] lg:h-[440px] w-full bg-[#070709] overflow-hidden group cursor-pointer"
                    >
                      <img
                        src={currentCandidate.publicImage}
                        alt={currentCandidate.alias}
                        className={`w-full h-full object-cover object-center transition-all duration-500 ${
                          isPhotoBlurred
                            ? 'filter blur-2xl scale-125 opacity-40'
                            : 'filter contrast-[1.05] group-hover:scale-105'
                        }`}
                      />

                      {/* Discreet Antirreconocimiento Overlay */}
                      {isPhotoBlurred && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center space-y-3 z-20 pointer-events-auto">
                          <div className="w-12 h-12 rounded-full bg-amber-950/90 border border-amber-500/50 flex items-center justify-center shadow-2xl">
                            <ShieldCheck className="w-6 h-6 text-amber-400" />
                          </div>
                          <div className="space-y-1">
                            <span className="text-xs font-mono font-extrabold text-amber-200 uppercase tracking-wider block">
                              🛡️ Perfil en Modo Discreto
                            </span>
                            <p className="text-[11px] text-slate-300 max-w-[220px] mx-auto font-medium leading-tight">
                              Foto principal desenfocada por preferencia de privacidad del usuario.
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              haptics.selection();
                              setUnlockedPhotos((prev) => ({
                                ...prev,
                                [currentCandidate.candidateId]: true
                              }));
                              notificationService.success('Foto desenfocada revelada temporalmente');
                            }}
                            className="px-4 py-2 bg-gradient-to-r from-amber-500 via-amber-600 to-rose-600 text-slate-950 font-black text-xs rounded-xl shadow-xl transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 hover:brightness-110"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-950 shrink-0" />
                            <span>Revelar Rostro</span>
                          </button>
                        </div>
                      )}

                      {/* Dark Gradient Overlays */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e14] via-[#0e0e14]/40 to-transparent pointer-events-none" />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent pointer-events-none" />

                      {/* Top Bar Header Row (Obsidian & Amber Quiet Luxury) */}
                      <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2 z-10 pointer-events-none">
                        {/* Location Badge Top Left */}
                        <div className="backdrop-blur-md bg-black/80 border border-white/15 px-2.5 py-1 rounded-full flex items-center space-x-1 shadow-xl shrink-0 max-w-[55%] truncate">
                          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="text-[10px] font-bold text-amber-200/90 font-mono uppercase tracking-wider truncate">
                            {currentCandidate.location}
                          </span>
                        </div>

                        {/* Hybrid Score Badge Top Right */}
                        <div className="backdrop-blur-md bg-black/80 border border-amber-500/30 px-2.5 py-1 rounded-full flex items-center space-x-1 shadow-xl shrink-0">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="text-[11px] font-black text-amber-300 font-mono tracking-wide">
                            {currentCandidate.affinityPercentage}% Compatible
                          </span>
                        </div>
                      </div>

                  {/* Bottom Identity Block */}
                  <div className="absolute bottom-3 left-4 right-4 space-y-2 pointer-events-none">
                    {/* Role Title & Name Typography */}
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <h3
                        className="text-xl sm:text-2xl font-medium tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)] text-neutral-100"
                        style={{
                          textShadow: '0 2px 14px rgba(0,0,0,0.85)'
                        }}
                      >
                        {currentCandidate.alias}
                      </h3>
                      <span className="w-2 h-2 rounded-full bg-emerald-400/90 shadow-sm" />

                      {/* Unified Role Badge */}
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-[0.15em] border border-amber-500/30 bg-black/80 text-amber-200/90 shadow-md flex items-center space-x-1">
                        {currentCandidate.role === 'couple' ? (
                          <>
                            <Users className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>Pareja VIP</span>
                          </>
                        ) : currentCandidate.role === 'solo_female' ? (
                          <>
                            <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>Mujer Sola</span>
                          </>
                        ) : (
                          <>
                            <User className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>Hombre Solo</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Quiet Luxury Micro Badges */}
                    <div className="flex items-center space-x-2 text-slate-300 text-xs flex-wrap gap-1.5">
                      <span className="px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-neutral-300 border border-white/10 text-[10px] font-medium tracking-wide flex items-center space-x-1.5 shadow-md">
                        <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>{currentCandidate.proximityLabel || 'Sector Cercano'}</span>
                      </span>

                      <span className="px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-neutral-300 border border-white/10 text-[10px] font-medium tracking-wide flex items-center space-x-1.5 shadow-md">
                        <Calendar className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>
                          {currentCandidate.role === 'couple'
                            ? 'Rango Pareja: 28 – 35 Años'
                            : currentCandidate.role === 'solo_female'
                            ? 'Rango: 24 – 30 Años'
                            : 'Rango: 30 – 38 Años'}
                        </span>
                      </span>

                      <span className="px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-neutral-300 border border-white/10 text-[10px] font-medium tracking-wide flex items-center space-x-1.5 shadow-md">
                        <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>Biometría 3D</span>
                      </span>
                    </div>

                    <p className="text-xs text-slate-200/90 line-clamp-2 font-medium pt-0.5 drop-shadow">
                      {currentCandidate.tagline}
                    </p>
                  </div>
                </div>
                );
              })()}

                {/* Single-line Affinity Summary Badge on Card */}
                <div className="p-3 bg-[#09090b] border-t border-amber-500/20 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-amber-300 font-mono text-xs font-extrabold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Afinidad Global ({currentCandidate.affinityPercentage}%)</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold bg-neutral-900 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" /> Verificado
                  </span>
                </div>

                {/* Mobile Quick Action Buttons inside Card (Quiet Luxury Palette) */}
                <div className="p-3 bg-[#09090b] border-t border-amber-500/15 flex flex-col space-y-2 lg:hidden">
                  <button
                    onClick={() => {
                      haptics.selection();
                      setExpandedCandidate(currentCandidate);
                    }}
                    className="w-full py-2.5 px-3 bg-neutral-900 hover:bg-amber-950/40 border border-amber-500/35 text-amber-200 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-2 active:scale-95 cursor-pointer shadow-md"
                  >
                    <Sliders className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Ver Expediente Completo ↗</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleConnection(currentCandidate)}
                      className="flex-1 py-2 px-2 bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-amber-100/90 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 active:scale-95 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Conectar</span>
                    </button>

                    <button
                      onClick={() => handleStartChat(currentCandidate)}
                      className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl text-xs transition-all shadow-lg flex items-center justify-center space-x-1.5 active:scale-95 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                      <span>Mensaje</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Swipe Prev/Next Controls */}
              <div className="flex items-center justify-between px-1 bg-[#0e0e14] p-2.5 rounded-2xl border border-white/[0.08]">
                <button
                  onClick={handlePrev}
                  className="px-4 py-2 bg-[#070709] border border-white/[0.1] text-slate-300 rounded-xl hover:text-white transition-all active:scale-95 flex items-center space-x-1.5 text-xs font-bold cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Anterior</span>
                </button>
                <span className="text-xs font-mono text-slate-300 font-bold">
                  {currentIndex + 1} / {filteredCandidates.length}
                </span>
                <button
                  onClick={handleNext}
                  className="px-4 py-2 bg-[#070709] border border-white/[0.1] text-slate-300 rounded-xl hover:text-white transition-all active:scale-95 flex items-center space-x-1.5 text-xs font-bold cursor-pointer"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN (PC: 7 cols - Full 5D Psychometric Alignment & Vault Panel): ALWAYS VISIBLE ON DESKTOP */}
            <div className="hidden lg:flex lg:col-span-7 bg-[#0e0e14] border border-white/[0.09] rounded-[28px] p-5 lg:p-6 flex-col space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Alineación Psicométrica 5D Directa</span>
                  </div>
                  <h3 className="text-xl font-black text-white">{currentCandidate.alias}</h3>
                </div>

                <div className="px-3 py-1.5 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-bold font-mono flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{currentCandidate.affinityPercentage}% Afinidad</span>
                </div>
              </div>

              {/* TOP PRIMARY QUICK ACTIONS BAR FOR DESKTOP (Immediate 1-Click Access) */}
              {(() => {
                const hasPermission =
                  currentCandidate.hasVaultPermission || grantedKeys[currentCandidate.candidateId];
                const isConnected = connectionState[currentCandidate.candidateId] === 'CONNECTED';

                return (
                  <div className="space-y-2">
                    <div className="bg-gradient-to-r from-amber-950/40 via-slate-900/90 to-rose-950/40 border border-amber-500/30 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xl backdrop-blur-md">
                      <div className="flex items-center space-x-2">
                        <Zap className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
                        <span className="text-xs font-mono font-extrabold text-amber-300">Opciones de Conexión:</span>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0 flex-wrap gap-y-1.5">
                        {/* Conectar Button with Lightweight Luxury Glass Style */}
                        <button
                          onClick={() => handleToggleConnection(currentCandidate)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                            isConnected
                              ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/60 shadow-lg'
                              : 'bg-[#16121e]/90 hover:bg-amber-950/60 text-amber-200 border border-amber-400/40 shadow-md backdrop-blur-md hover:border-amber-300 active:scale-95'
                          }`}
                          title="Enviar solicitud discreta de vínculo directo"
                        >
                          {isConnected ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              <span>Conectado</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                              <span className="tracking-wide">Conectar</span>
                            </>
                          )}
                        </button>

                        {hasPermission ? (
                          <button
                            onClick={() => {
                              haptics.selection();
                              setActiveSecureViewer({
                                mediaId: currentCandidate.vaultMediaId,
                                alias: currentCandidate.alias
                              });
                            }}
                            className="px-4 py-2 bg-gradient-to-r from-purple-600 via-rose-600 to-amber-600 hover:opacity-95 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center space-x-1.5 active:scale-95 cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Ver Bóveda Privada</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRequestKey(currentCandidate)}
                            className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs rounded-xl border border-amber-500/40 transition-all flex items-center space-x-1.5 active:scale-95 cursor-pointer"
                          >
                            <Lock className="w-3.5 h-3.5 text-amber-400" />
                            <span>Solicitar Acceso Bóveda</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleStartChat(currentCandidate)}
                          className="px-4 py-2 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 hover:opacity-95 text-white font-black text-xs rounded-xl shadow-xl transition-all flex items-center space-x-1.5 active:scale-95 cursor-pointer"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>Mensaje Directo</span>
                        </button>
                      </div>
                    </div>

                    {/* Explanatory micro-note about Conectar */}
                    <p className="text-[10px] text-amber-200/70 font-mono px-2 flex items-center space-x-1">
                      <span>⚡</span>
                      <span><strong>Conectar</strong> envía una petición discreta de afinidad. Al ser aceptada, desbloquea la coincidencia en tu red directa.</span>
                    </p>
                  </div>
                );
              })()}

              {/* Couple Member-by-Member Profile Breakdown (Delicate & Sensual) */}
              {currentCandidate.role === 'couple' && (
                <div className="bg-gradient-to-b from-[#0c0c12] to-[#07070a] border border-rose-500/20 p-4.5 rounded-2xl space-y-3.5 shadow-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
                    <div className="flex items-center space-x-2 text-rose-300/90 font-mono text-xs font-bold tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-amber-100 font-semibold tracking-wide">Integrantes &amp; Perfiles de la Pareja</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 uppercase flex items-center gap-1 shadow-sm">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" /> Verificación Dual OK
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Partner A */}
                    <div className="p-3.5 bg-white/[0.02] rounded-xl border border-white/[0.06] space-y-2 hover:border-amber-500/30 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-black text-amber-300 tracking-wide">
                            Carlos
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-700/50 font-bold">
                            Él
                          </span>
                        </div>
                        <span className="text-[10px] text-amber-300/80 font-mono">
                          Perfil Verificado
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300 space-y-1 font-medium">
                        <p className="flex justify-between border-b border-white/[0.04] pb-1">
                          <span className="text-slate-400">Rango de Edad:</span>
                          <span className="font-mono text-amber-200 font-bold">30 – 35 Años</span>
                        </p>
                        <p className="flex justify-between border-b border-white/[0.04] pb-1">
                          <span className="text-slate-400">Gustos &amp; Hobbies:</span>
                          <span className="text-slate-200">Gastronomía, Vinos &amp; Ciclismo</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-slate-400">Estilo Relacional:</span>
                          <span className="text-emerald-300 font-mono text-[10px]">No Monogamia Ética</span>
                        </p>
                      </div>
                    </div>

                    {/* Partner B */}
                    <div className="p-3.5 bg-white/[0.02] rounded-xl border border-white/[0.06] space-y-2 hover:border-rose-500/30 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-black text-rose-300 tracking-wide">
                            Sofía
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950/60 text-rose-300 border border-rose-700/50 font-bold">
                            Ella
                          </span>
                        </div>
                        <span className="text-[10px] text-rose-300/80 font-mono">
                          Perfil Verificado
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300 space-y-1 font-medium">
                        <p className="flex justify-between border-b border-white/[0.04] pb-1">
                          <span className="text-slate-400">Rango de Edad:</span>
                          <span className="font-mono text-rose-200 font-bold">28 – 33 Años</span>
                        </p>
                        <p className="flex justify-between border-b border-white/[0.04] pb-1">
                          <span className="text-slate-400">Gustos &amp; Hobbies:</span>
                          <span className="text-slate-200">Arte Moderno, Fotografía &amp; Yoga</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-slate-400">Estilo Relacional:</span>
                          <span className="text-emerald-300 font-mono text-[10px]">No Monogamia Ética</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bio & Relational Intent (Editorial Quote Card Style) */}
              <div className="space-y-2 bg-gradient-to-br from-[#121018] via-[#0b0a10] to-[#07070a] p-5 rounded-2xl border border-amber-500/20 shadow-xl relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                  <h4 className="text-[11px] font-mono font-extrabold text-amber-300/90 uppercase tracking-widest flex items-center space-x-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Manifiesto &amp; Intención Relacional</span>
                  </h4>
                  <span className="text-[10px] text-amber-400/80 font-mono font-bold uppercase tracking-wider bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/20">
                    Carta de Presentación
                  </span>
                </div>

                <div className="pt-1 flex items-start space-x-2">
                  <span className="text-3xl text-amber-500/40 font-serif leading-none select-none">“</span>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans italic font-medium">
                    {currentCandidate.bio}
                  </p>
                </div>
              </div>

              {/* Vector de Afinidad & Alineación 5D (Desplegado & Espacioso) */}
              <div className="space-y-3 bg-[#0a0910]/90 p-4 rounded-2xl border border-amber-500/20 shadow-lg backdrop-blur-md">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                  <div className="flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <h3 className="text-[11px] font-semibold text-neutral-200 tracking-[0.15em] uppercase">
                      Vector de Afinidad &amp; Alineación 5D
                    </h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                    {currentCandidate.affinityPercentage}% Compatible
                  </span>
                </div>

                {/* 3 Dimensiones de Afinidad Compactas y Unificadas */}
                <div className="space-y-2.5 py-1">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[11px] font-mono font-bold">
                      <span className="text-slate-200">Sintonía Social &amp; Estilo</span>
                      <span className="text-amber-300 font-extrabold">88%</span>
                    </div>
                    <div className="h-2 w-full bg-neutral-950 rounded-full overflow-hidden border border-white/10">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: '88%' }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[11px] font-mono font-bold">
                      <span className="text-slate-200">Blindaje Ético &amp; Acuerdos</span>
                      <span className="text-amber-300 font-extrabold">100% ✓</span>
                    </div>
                    <div className="h-2 w-full bg-neutral-950 rounded-full overflow-hidden border border-white/10">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: '100%' }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[11px] font-mono font-bold">
                      <span className="text-slate-200">Química &amp; Exploración Íntima</span>
                      <span className="text-amber-300 font-extrabold">79%</span>
                    </div>
                    <div className="h-2 w-full bg-neutral-950 rounded-full overflow-hidden border border-white/10">
                      <div className="h-full bg-amber-600 rounded-full" style={{ width: '79%' }} />
                    </div>
                  </div>
                </div>

                {/* Radar 5D integrado */}
                <div className="pt-2 border-t border-white/[0.06]">
                  <RadarChart5D
                    vectorA={[0.9, 0.5, 0.8, -0.3, 0.8]}
                    vectorB={currentCandidate.vector5D}
                    labelA="Tu Perfil Vectorial"
                    labelB={currentCandidate.alias}
                  />
                </div>
              </div>

              {/* Community Badges, Social Vouches & Creator Section (Debajo del Vector de Afinidad) */}
              <ProfileReputationAndCreatorSection
                alias={currentCandidate.alias}
                inPersonVouchesCount={currentCandidate.inPersonVouchesCount || 2}
                vouchedByCouples={currentCandidate.vouchedByCouples || ['Carlos & Sofía (VIP)', 'Felipe & Juliana (VIP)']}
                eventsOrganizedCount={currentCandidate.eventsOrganizedCount || 1}
                eventsAttendedCount={currentCandidate.eventsAttendedCount || 5}
                isCommunityVouched={currentCandidate.isCommunityVouched !== false}
                isHostBadge={currentCandidate.isHostBadge || false}
                isAmbassador={currentCandidate.isAmbassador || false}
                creatorExternalLink={currentCandidate.creatorExternalLink || (currentCandidate.alias.includes('Camila') ? 'https://onlyfans.com/camila_v_exclusive' : undefined)}
                isEditable={false}
              />

              {/* Multi-Photo Carousel & Voice Note Intro */}
              <CandidateMediaGallery
                alias={currentCandidate.alias}
                role={currentCandidate.role}
                galleryImages={[
                  currentCandidate.publicImage,
                  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=800&q=80',
                  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80'
                ]}
                voiceNote={{
                  duration: '0:28',
                  label: `🎙️ Saludo de Voz Cifrado de ${currentCandidate.alias}`,
                  transcription: `Hola! Somos ${currentCandidate.alias}. Buscamos personas y parejas afines en un ambiente libre de prejuicios y con total transparencia...`
                }}
              />

              {/* Health & Identity Verification Badges */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Verificaciones &amp; Consentimiento Sanitarios
                </h4>
                <div className="flex flex-wrap gap-2">
                  {currentCandidate.verifiedBadges.map((badge, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      {badge}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bóveda Privada Strip */}
              {(() => {
                const hasPermission =
                  currentCandidate.hasVaultPermission || grantedKeys[currentCandidate.candidateId];

                return (
                  <div className="space-y-3">
                    <div className="bg-[#070709] p-4 sm:p-5 rounded-2xl border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
                      <div className="flex items-start space-x-3.5 min-w-0">
                        <div
                          className={`p-3 rounded-2xl border shrink-0 ${
                            hasPermission
                              ? 'bg-purple-950/60 text-purple-300 border-purple-800/80 shadow-md'
                              : 'bg-amber-950/50 text-amber-400 border-amber-800/60 shadow-md'
                          }`}
                        >
                          {hasPermission ? (
                            <Unlock className="w-5 h-5 text-purple-300" />
                          ) : (
                            <Lock className="w-5 h-5 text-amber-400 animate-pulse" />
                          )}
                        </div>
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <h4 className="text-sm font-black text-white tracking-wide">
                              Bóveda Privada del Perfil
                            </h4>
                            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-950/90 text-amber-200 border border-amber-700/60 shrink-0">
                              {currentCandidate.vaultAssetCount} Archivos
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 font-medium leading-normal">
                            {hasPermission
                              ? 'Acceso concedido — Contenido privado desbloqueado'
                              : 'Área reservada — Solicita acceso directo para desbloquear'}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center sm:self-center">
                        {hasPermission ? (
                          <button
                            onClick={() => {
                              haptics.selection();
                              setActiveSecureViewer({
                                mediaId: currentCandidate.vaultMediaId,
                                alias: currentCandidate.alias
                              });
                            }}
                            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-purple-600 via-rose-600 to-amber-600 hover:opacity-95 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 active:scale-95 cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Ver Bóveda</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRequestKey(currentCandidate)}
                            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-xs rounded-xl border border-amber-300/40 transition-all shadow-lg hover:shadow-amber-500/20 flex items-center justify-center space-x-2 active:scale-95 cursor-pointer"
                          >
                            <Lock className="w-4 h-4 text-slate-950" />
                            <span>Solicitar Acceso</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Dismissible & Improved Typography Vault Explanation Box */}
                    {!hasDismissedVaultGuide && (
                      <div className="p-4 bg-gradient-to-br from-amber-950/30 via-slate-900/90 to-slate-950 border border-amber-500/30 rounded-2xl space-y-2.5 shadow-xl transition-all animate-fadeIn">
                        <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                          <div className="font-mono font-extrabold text-amber-300 text-xs flex items-center space-x-2">
                            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>¿Cómo funciona la Bóveda Privada del Perfil?</span>
                          </div>

                          <button
                            onClick={handleDismissVaultGuide}
                            className="p-1 text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
                            title="Cerrar explicación"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <p className="text-xs text-slate-200/95 leading-relaxed font-sans font-normal">
                          Es el espacio reservado donde el perfil resguarda sus <strong>fotografías HD y videos exclusivos</strong>. Por discreción, este contenido permanece privado. Al pulsar <strong>Solicitar Acceso</strong>, les envías una petición discreta. Al ser aprobada, sus álbumes privados se desbloquearán para ti.
                        </p>

                        <div className="pt-1 flex items-center justify-end">
                          <button
                            onClick={handleDismissVaultGuide}
                            className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold font-mono transition-all flex items-center space-x-1.5 active:scale-95 cursor-pointer shadow-md"
                          >
                            <Check className="w-3.5 h-3.5 text-amber-400" />
                            <span>OK, entiendo qué es la Bóveda</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Desktop Primary Action & Report Button */}
              <div className="pt-2 flex items-center space-x-2">
                <button
                  onClick={() => handleStartChat(currentCandidate)}
                  className="flex-1 py-3.5 px-4 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 hover:opacity-95 text-white rounded-xl text-xs font-black transition-all shadow-xl flex items-center justify-center space-x-2 active:scale-95 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Enviar Mensaje Directo</span>
                </button>

                <button
                  onClick={() => {
                    haptics.selection();
                    setReportModalCandidate({
                      id: currentCandidate.id,
                      alias: currentCandidate.alias
                    });
                  }}
                  title="Reportar o Bloquear Perfil (Modo Sombra)"
                  className="p-3.5 bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-white/10 hover:border-rose-500/40 rounded-xl transition-all cursor-pointer shrink-0 active:scale-95"
                >
                  <ShieldAlert className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Image Lightbox Modal */}
      {fullscreenImageModal && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setFullscreenImageModal(null)}
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-3 z-10">
            <div className="flex items-center space-x-2">
              <span className="text-amber-400 font-extrabold text-base sm:text-lg">{fullscreenImageModal.alias}</span>
              <span className="text-slate-400 text-xs font-mono">• {fullscreenImageModal.title}</span>
            </div>

            <button
              onClick={() => setFullscreenImageModal(null)}
              className="p-2 rounded-full bg-slate-900 hover:bg-rose-900 text-white border border-white/20 transition-all cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
            <img
              src={fullscreenImageModal.url}
              alt={fullscreenImageModal.alias}
              className="max-h-[82vh] max-w-full object-contain rounded-2xl shadow-2xl filter contrast-[1.03]"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="text-center text-xs text-slate-400 font-mono">
            Haz clic fuera de la imagen o presiona ✕ para cerrar el visor HD
          </div>
        </div>
      )}

      {/* Expanded Candidate Expediente de Compatibilidad & Reputación Modal (Mobile & PC) */}
      {expandedCandidate && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="bg-[#0e0e14] border border-amber-500/25 rounded-t-[32px] sm:rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 text-white space-y-5 shadow-2xl">
            {/* Top Drag/Handle Indicator */}
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto -mt-1 mb-1" />

            {/* Header Title & Afinidad Badge */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="space-y-0.5 min-w-0 pr-2">
                <div className="flex items-center space-x-1.5 text-amber-400 font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">Expediente de Compatibilidad & Reputación</span>
                </div>
                <h3 className="text-lg font-black text-white truncate">{expandedCandidate.alias}</h3>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <span className="px-2.5 py-1 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-bold font-mono shadow-sm">
                  {expandedCandidate.affinityPercentage}% Afinidad
                </span>
                <button
                  onClick={() => setExpandedCandidate(null)}
                  className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Cerrar Expediente"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Direct Connection Quick Actions Bar */}
            {(() => {
              const isConnected = connectionState[expandedCandidate.candidateId] === 'CONNECTED';
              const hasPermission = expandedCandidate.hasVaultPermission || grantedKeys[expandedCandidate.candidateId];

              return (
                <div className="bg-gradient-to-r from-amber-950/40 via-slate-900/90 to-rose-950/40 border border-amber-500/30 p-3 rounded-2xl flex flex-col space-y-2 shadow-xl backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-extrabold text-amber-300">Opciones de Conexión Directa:</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleToggleConnection(expandedCandidate)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer active:scale-95 ${
                        isConnected
                          ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/60 shadow-md'
                          : 'bg-[#16121e]/90 hover:bg-amber-950/60 text-amber-200 border border-amber-400/40 shadow-sm'
                      }`}
                    >
                      {isConnected ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Conectado</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse shrink-0" />
                          <span>Conectar</span>
                        </>
                      )}
                    </button>

                    {hasPermission ? (
                      <button
                        onClick={() => {
                          haptics.selection();
                          setActiveSecureViewer({
                            mediaId: expandedCandidate.vaultMediaId,
                            alias: expandedCandidate.alias
                          });
                        }}
                        className="py-2 px-2 bg-gradient-to-r from-purple-600 to-rose-600 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center justify-center space-x-1 cursor-pointer active:scale-95"
                      >
                        <Eye className="w-3.5 h-3.5 shrink-0" />
                        <span>Ver Bóveda</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRequestKey(expandedCandidate)}
                        className="py-2 px-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs rounded-xl border border-amber-500/40 flex items-center justify-center space-x-1 cursor-pointer active:scale-95"
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Solicitar Llave</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleStartChat(expandedCandidate)}
                      className="py-2 px-2 bg-gradient-to-r from-rose-600 to-amber-600 text-white font-black text-xs rounded-xl shadow-xl flex items-center justify-center space-x-1 cursor-pointer active:scale-95"
                    >
                      <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                      <span>Mensaje</span>
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* 1. Manifiesto (Pull-Quote Editorial: Arriba, sin títulos pesados) */}
            <div className="py-2 px-3.5 bg-gradient-to-r from-amber-500/10 via-neutral-900/60 to-transparent border-l-2 border-amber-400 rounded-r-2xl space-y-1">
              <div className="flex items-start space-x-2">
                <span className="text-3xl text-amber-400/60 font-serif leading-none select-none -mt-1">“</span>
                <p className="text-sm sm:text-base text-neutral-100 leading-relaxed font-sans italic font-normal">
                  {expandedCandidate.bio}
                </p>
              </div>
            </div>

            {/* 2. Integrantes de la Pareja (Diseño Compacto Optimizado) */}
            {expandedCandidate.role === 'couple' && (
              <div className="bg-[#09090b] border border-amber-500/20 p-3 sm:p-3.5 rounded-2xl space-y-2 shadow-lg">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-1.5">
                  <div className="flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-[11px] font-semibold text-neutral-300 tracking-[0.15em] uppercase">Integrantes de la Pareja</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" /> Verificación Dual
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Partner A - Él */}
                  <div className="p-2.5 bg-neutral-900/80 rounded-xl border border-white/[0.06] space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-bold text-amber-200">Carlos</span>
                        <span className="text-[9px] px-1.5 py-0.2 bg-amber-950/80 text-amber-300 border border-amber-500/40 font-mono rounded-full">Él</span>
                      </div>
                      <span className="text-[9px] text-amber-300/80 font-mono">30–35 Años</span>
                    </div>
                    <div className="text-[10px] text-neutral-300 flex items-center justify-between pt-0.5 border-t border-white/[0.04]">
                      <span className="text-neutral-400">Gustos: <strong className="text-neutral-200 font-normal">Vinos & Gastronomía</strong></span>
                      <span className="text-emerald-400 font-mono text-[9px]">ENM</span>
                    </div>
                  </div>

                  {/* Partner B - Ella */}
                  <div className="p-2.5 bg-neutral-900/80 rounded-xl border border-white/[0.06] space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-bold text-amber-200">Sofía</span>
                        <span className="text-[9px] px-1.5 py-0.2 bg-amber-950/80 text-amber-300 border border-amber-500/40 font-mono rounded-full">Ella</span>
                      </div>
                      <span className="text-[9px] text-amber-300/80 font-mono">28–33 Años</span>
                    </div>
                    <div className="text-[10px] text-neutral-300 flex items-center justify-between pt-0.5 border-t border-white/[0.04]">
                      <span className="text-neutral-400">Gustos: <strong className="text-neutral-200 font-normal">Arte & Yoga</strong></span>
                      <span className="text-emerald-400 font-mono text-[9px]">ENM</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Vector de Afinidad & Alineación 5D (Desplegado & Espacioso) */}
            <div className="space-y-3 bg-[#0a0910]/90 p-3.5 sm:p-4 rounded-2xl border border-amber-500/20 shadow-lg backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                <div className="flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <h3 className="text-[11px] font-semibold text-neutral-200 tracking-[0.15em] uppercase">
                    Vector de Afinidad &amp; Alineación 5D
                  </h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                  {expandedCandidate.affinityPercentage}% Compatible
                </span>
              </div>

              {/* 3 Dimensiones de Afinidad Compactas y Unificadas */}
              <div className="space-y-2.5 py-1">
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[11px] font-mono font-bold">
                    <span className="text-slate-200">Sintonía Social &amp; Estilo</span>
                    <span className="text-amber-300 font-extrabold">88%</span>
                  </div>
                  <div className="h-2 w-full bg-neutral-950 rounded-full overflow-hidden border border-white/10">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '88%' }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[11px] font-mono font-bold">
                    <span className="text-slate-200">Blindaje Ético &amp; Acuerdos</span>
                    <span className="text-amber-300 font-extrabold">100% ✓</span>
                  </div>
                  <div className="h-2 w-full bg-neutral-950 rounded-full overflow-hidden border border-white/10">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[11px] font-mono font-bold">
                    <span className="text-slate-200">Química &amp; Exploración Íntima</span>
                    <span className="text-amber-300 font-extrabold">79%</span>
                  </div>
                  <div className="h-2 w-full bg-neutral-950 rounded-full overflow-hidden border border-white/10">
                    <div className="h-full bg-amber-600 rounded-full" style={{ width: '79%' }} />
                  </div>
                </div>
              </div>

              {/* Radar 5D integrado */}
              <div className="pt-2 border-t border-white/[0.06]">
                <RadarChart5D
                  vectorA={[0.9, 0.5, 0.8, -0.3, 0.8]}
                  vectorB={expandedCandidate.vector5D}
                  labelA="Tu Perfil Vectorial"
                  labelB={expandedCandidate.alias}
                />
              </div>
            </div>

            {/* Estatus & Reputación de Comunidad (Debajo del Vector de Afinidad) */}
            <ProfileReputationAndCreatorSection
              alias={expandedCandidate.alias}
              inPersonVouchesCount={expandedCandidate.inPersonVouchesCount || 2}
              vouchedByCouples={expandedCandidate.vouchedByCouples || ['Carlos & Sofía (VIP)', 'Felipe & Juliana (VIP)']}
              eventsOrganizedCount={expandedCandidate.eventsOrganizedCount || 1}
              eventsAttendedCount={expandedCandidate.eventsAttendedCount || 5}
              isCommunityVouched={expandedCandidate.isCommunityVouched !== false}
              isHostBadge={expandedCandidate.isHostBadge || false}
              isAmbassador={expandedCandidate.isAmbassador || false}
              creatorExternalLink={expandedCandidate.creatorExternalLink || (expandedCandidate.alias.includes('Camila') ? 'https://onlyfans.com/camila_v_exclusive' : undefined)}
              isEditable={false}
            />

            {/* Multi-Photo Gallery & Audio Voice Note */}
            <CandidateMediaGallery
              alias={expandedCandidate.alias}
              role={expandedCandidate.role}
              galleryImages={[
                expandedCandidate.publicImage,
                'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80'
              ]}
              voiceNote={{
                duration: '0:28',
                label: `🎙️ Saludo de Voz Cifrado de ${expandedCandidate.alias}`,
                transcription: `Hola! Somos ${expandedCandidate.alias}. Buscamos personas y parejas afines en un ambiente libre de prejuicios y con total transparencia...`
              }}
            />

            {/* Verification Badges */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                Verificaciones & Consentimiento Sanitarios:
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {expandedCandidate.verifiedBadges.map((badge, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 flex items-center gap-1"
                  >
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            {/* Privacidad Progresiva: Bóveda Privada */}
            <div className="bg-neutral-950 p-4 rounded-2xl border border-amber-500/30 space-y-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-amber-500/15 pb-2">
                <div className="flex items-center space-x-2 text-amber-300 font-mono text-xs font-extrabold uppercase tracking-wider">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Bóveda Privada Cifrada ({expandedCandidate.vaultAssetCount || 4} Fotos)</span>
                </div>
                {grantedKeys[expandedCandidate.candidateId] ? (
                  <span className="text-[10px] font-mono text-emerald-300 font-bold bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Unlock className="w-3 h-3 text-emerald-400" /> Acceso Concedido
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-400" /> Protegido
                  </span>
                )}
              </div>

              {/* Frosted Glass Thumbnails */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
                  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80',
                  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=400&q=80'
                ].map((imgUrl, i) => (
                  <div key={i} className="relative h-20 rounded-xl overflow-hidden border border-white/10 bg-black">
                    <img
                      src={imgUrl}
                      alt="Bóveda Privada"
                      className={`w-full h-full object-cover transition-all ${
                        grantedKeys[expandedCandidate.candidateId] ? '' : 'filter blur-xl scale-125 opacity-40'
                      }`}
                    />
                    {!grantedKeys[expandedCandidate.candidateId] && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Lock className="w-5 h-5 text-amber-400/80" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Action Button for Vault Key */}
              {!grantedKeys[expandedCandidate.candidateId] ? (
                <button
                  onClick={() => handleRequestKey(expandedCandidate)}
                  className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-500 via-rose-600 to-purple-600 text-white font-extrabold text-xs rounded-xl shadow-lg hover:brightness-110 transition-all flex items-center justify-center space-x-2 active:scale-98 cursor-pointer"
                >
                  <Key className="w-4 h-4 text-amber-200" />
                  <span>🔑 Solicitar Llave de Bóveda</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setActiveSecureViewer({
                      mediaId: expandedCandidate.vaultMediaId || 'vault_asset_default',
                      alias: expandedCandidate.alias
                    });
                  }}
                  className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-xs rounded-xl shadow-lg hover:brightness-110 transition-all flex items-center justify-center space-x-2 active:scale-98 cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-emerald-200" />
                  <span>Ver Álbumes Privados Cifrados</span>
                </button>
              )}
            </div>

            <button
              onClick={() => setExpandedCandidate(null)}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-xs font-bold transition-all shadow-lg active:scale-98 cursor-pointer"
            >
              Cerrar Expediente
            </button>
          </div>
        </div>
      )}

      {/* Secure Media Viewer Modal */}
      {activeSecureViewer && (
        <SecureMediaViewer
          mediaId={activeSecureViewer.mediaId}
          mediaTitle={`Bóveda Privada • ${activeSecureViewer.alias}`}
          viewerUserId="usr_currentTester"
          viewerRole="solo_female"
          onClose={() => setActiveSecureViewer(null)}
        />
      )}

      {/* Intuitive Geolocation Picker Modal */}
      {showZonePicker && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-2xl flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="bg-[#0c0d14] border border-white/10 rounded-t-[32px] sm:rounded-3xl max-w-lg sm:max-w-2xl w-full max-h-[85vh] overflow-y-auto p-5 sm:p-6 text-white space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs tracking-wider uppercase font-mono">
                  <Globe2 className="w-4 h-4 text-amber-400" />
                  <span>Ubicación y Búsqueda de Destinos</span>
                </div>
                <h3 className="text-lg font-black text-white">Configura tus Zonas de Conexión</h3>
              </div>
              <button
                onClick={() => setShowZonePicker(false)}
                className="p-2 rounded-full bg-slate-900 text-slate-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* OPCIÓN A: Mi Ubicación Base */}
            <div className="space-y-3 bg-[#070709] p-4 rounded-2xl border border-white/[0.08]">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span>1. Mi Ciudad Base (Residencia Fija)</span>
                </h4>
                <span className="text-[10px] font-mono text-emerald-300/80 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> Civil Verificado
                </span>
              </div>

              <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">
                  🏠 Residencia Fija Registrada: <strong className="text-emerald-300 font-mono">Bogotá D.C. &amp; Sabana</strong>
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-200 border border-emerald-700/50">
                  📍 Inmutable
                </span>
              </div>

              <p className="text-[10px] text-slate-400 leading-normal px-1">
                * Para cambiar tu ciudad base permanente o lugar de residencia fija, por favor actualízala desde la edición de tu <strong>Perfil Dual</strong>.
              </p>
            </div>

            {/* OPCIÓN B: Coincidencia por Destino de Viaje o Escapada (Modo Viajero) */}
            <div className="space-y-3 bg-[#070709] p-4 rounded-2xl border border-amber-500/20 shadow-lg">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                  <Compass className="w-4 h-4 text-amber-400" />
                  <span>2. Buscar en otra ciudad / Destinos de viaje (Modo Viajero)</span>
                </h4>
                {exploreCity && (
                  <button
                    onClick={() => {
                      haptics.selection();
                      setExploreCity(null);
                    }}
                    className="text-[10px] font-mono text-rose-400 hover:underline flex items-center gap-1 cursor-pointer bg-rose-950/60 px-2.5 py-1 rounded border border-rose-500/30"
                  >
                    <X className="w-3 h-3" />
                    <span>Finalizar Viaje Ahora</span>
                  </button>
                )}
              </div>

              <p className="text-[11px] text-slate-400 leading-tight">
                Selecciona el nodo regional de tu escapada. Tu perfil se mostrará en este destino durante los días configurados.
              </p>

              {/* Rango de Días de Escapada */}
              <div className="flex items-center space-x-2 pt-1 pb-1">
                <span className="text-[11px] font-mono text-amber-300 font-bold shrink-0">Duración del Viaje:</span>
                {(['3d', '7d', '15d', '30d'] as const).map((days) => (
                  <button
                    key={days}
                    onClick={() => setTravelDays(days)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border cursor-pointer transition-all ${
                      travelDays === days
                        ? 'bg-amber-950 border-amber-500 text-amber-300 shadow-md'
                        : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {days === '3d' ? '3 Días' : days === '7d' ? '7 Días' : days === '15d' ? '15 Días' : '30 Días'}
                  </button>
                ))}
              </div>

              {/* 2-Column Matrix Grid for 7 Regional Cluster Nodes */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {REGIONAL_NODES.map((node) => {
                  const isSelected = exploreCity === node.name;
                  return (
                    <button
                      key={node.id}
                      onClick={() => {
                        haptics.selection();
                        setExploreCity(isSelected ? null : node.name);
                      }}
                      className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between space-y-1 ${
                        isSelected
                          ? 'bg-amber-950/90 border-amber-400 text-amber-200 shadow-lg ring-1 ring-amber-400/30'
                          : 'bg-slate-900/80 border-white/10 text-slate-300 hover:border-amber-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-mono tracking-tight text-white">{node.shortLabel}</span>
                        {isSelected ? <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" /> : <Compass className="w-3 h-3 text-slate-500 shrink-0" />}
                      </div>
                      <span className="text-[9px] text-slate-400 line-clamp-1">{node.citiesIncluded}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* OPCIÓN C: Modo Cobertura Nacional */}
            <div className="bg-[#070709] p-4 rounded-2xl border border-white/[0.08] flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs">
                  <Globe2 className="w-4 h-4 text-cyan-400" />
                  <span>Modo Toda Colombia</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Explora perfiles en todo el territorio nacional sin restricciones de distancia.
                </p>
              </div>

              <button
                onClick={() => {
                  haptics.toggle();
                  setIsNationalScope(!isNationalScope);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                  isNationalScope
                    ? 'bg-cyan-950 border-cyan-500 text-cyan-300 shadow-lg'
                    : 'bg-slate-900 border-white/10 text-slate-400'
                }`}
              >
                {isNationalScope ? '✓ Cobertura Nacional' : 'Activar Toda Colombia'}
              </button>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowZonePicker(false)}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-rose-600 to-purple-600 text-white font-black rounded-2xl text-xs transition-all shadow-xl hover:opacity-95 active:scale-98 cursor-pointer flex items-center justify-center space-x-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Aplicar Ubicación Seleccionada</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contextual Checkout Modal for Solo Male Access Control */}
      <ContextualCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        userId={userId}
        userRole={userRole}
        targetCandidate={checkoutCandidate}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Luxury In-App Notice Modal */}
      {luxuryNotice && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0e0e14] border border-amber-500/40 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center relative">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-white">{luxuryNotice.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{luxuryNotice.message}</p>
            </div>
            <button
              onClick={() => setLuxuryNotice(null)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 text-slate-950 font-bold text-xs hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-lg"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Courtesy Micro-Modal for Private Vault Access Request */}
      {vaultCourtesyModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0e0e14] border border-amber-500/40 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center relative">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <Lock className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-extrabold text-white">Acceso a Bóveda Privada</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                El acceso a la Bóveda Privada requiere haber iniciado un canal de diálogo o conexión previa. Te invitamos a enviar un mensaje directo o solicitud de conexión para continuar.
              </p>
            </div>
            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  setVaultCourtesyModal(false);
                  if (currentCandidate) handleStartChat(currentCandidate);
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-rose-600 to-purple-600 text-white font-extrabold text-xs hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-lg flex items-center justify-center space-x-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Iniciar Diálogo Privado</span>
              </button>
              <button
                onClick={() => setVaultCourtesyModal(false)}
                className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-bold transition-all cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report & Shadow Block Modal */}
      {reportModalCandidate && (
        <ReportAndBlockModal
          targetAlias={reportModalCandidate.alias}
          targetId={reportModalCandidate.id}
          onClose={() => setReportModalCandidate(null)}
          onConfirmBlock={(reason, mode) => {
            setBlockedProfileIds((prev) => [...prev, reportModalCandidate.id]);
            setReportModalCandidate(null);
            setCurrentIndex((prev) => prev + 1);
          }}
        />
      )}
    </div>
  );
};
