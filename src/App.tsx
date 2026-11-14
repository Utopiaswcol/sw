import React, { useState, useEffect, useCallback } from 'react';
import { Vector5D, VetoesDict, PracticesDict, EvaluationResult } from './types';
import { TEST_PRESETS, INITIAL_VETOES, INITIAL_PRACTICES } from './data';
import { evaluateRelationalCompatibilityLocal } from './utils';
import { MobileHeader } from './components/MobileHeader';
import { DesktopSidebar } from './components/DesktopSidebar';
import { BottomNav, MainAppTab } from './components/BottomNav';
import { VectorEditor } from './components/VectorEditor';
import { HardVetoEditor } from './components/HardVetoEditor';
import { RadarChart5D } from './components/RadarChart5D';
import { ConsensusMathView } from './components/ConsensusMathView';
import { PythonTerminalView } from './components/PythonTerminalView';
import { PythonCodeViewer } from './components/PythonCodeViewer';
import { OnboardingFlow } from './components/OnboardingFlow';
import { MediaVaultManager } from './components/MediaVaultManager';
import { SwayExplore } from './components/SwayExplore';
import { SwayProfile } from './components/SwayProfile';
import { ChatAndBillingView } from './components/ChatAndBillingView';
import { PrivateEventsAgenda } from './components/PrivateEventsAgenda';
import { SupabaseSqlViewer } from './components/SupabaseSqlViewer';
import { DocsView } from './components/DocsView';
import { PinLockCurtain } from './components/PinLockCurtain';
import { DecoyScreenProvider } from './components/DecoyScreen';
import { QuickProfileSwitchModal } from './components/QuickProfileSwitchModal';
import { SPECIAL_TEST_PROFILES, TestProfile } from './data/profilesData';
import { InteractionNotificationDrawer } from './components/InteractionNotificationDrawer';
import { SwayCover } from './components/SwayCover';
import { SwayJoin } from './components/SwayJoin';
import { SwayChat } from './components/SwayChat';
import { SwayDoor } from './components/SwayDoor';
import {
  allowance,
  loadAccount,
  loadPlan,
  loadThreads,
  personFromAccount,
  saveAccount,
  savePlan,
  startsUsed,
  type SwayAccount,
  type SwayPlan
} from './sway/account';
import type { SystemCandidate } from './data/profilesData';
import { Sparkles, ShieldAlert, CheckCircle2, Users, User, RefreshCw, Zap, ArrowRight, Layers } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<MainAppTab>('explore');
  const [doorOpen, setDoorOpen] = useState<boolean>(() => sessionStorage.getItem('sway_door') === 'open');
  const openDoor = () => {
    sessionStorage.setItem('sway_door', 'open');
    setActiveTab('explore');
    setDoorOpen(true);
  };
  const [activeProfile, setActiveProfile] = useState<TestProfile>(SPECIAL_TEST_PROFILES.pareja1);
  const [isCoupleMode, setIsCoupleMode] = useState<boolean>(true);
  const [isQuickSwitchOpen, setIsQuickSwitchOpen] = useState<boolean>(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState<boolean>(false);
  const [planFor, setPlanFor] = useState<SystemCandidate | null>(null);
  const [cupoLleno, setCupoLleno] = useState(false);
  const [chatWith, setChatWith] = useState<SystemCandidate | null>(null);
  const [joining, setJoining] = useState(false);
  const [account, setAccount] = useState<SwayAccount | null>(() => loadAccount());
  const [plan, setPlan] = useState<SwayPlan | null>(() => loadPlan());
  const [showPropose, setShowPropose] = useState(false);
  const [doorMode, setDoorMode] = useState<'list' | 'detail' | 'form'>('list');
  const reportDoor = useCallback((mode: 'list' | 'detail' | 'form') => setDoorMode(mode), []);
  const onSwayTab = activeTab === 'explore' || activeTab === 'dual_profile';
  const showMenu = onSwayTab && !chatWith && !(showPropose && doorMode !== 'list');

  const openChat = (person: SystemCandidate) => {
    const existing = loadThreads()[person.candidateId];
    const role = account?.role || activeProfile.role;
    const room = allowance(role, plan);
    if (!existing?.counted && startsUsed() >= room) {
      if (!plan && role === 'solo_male') setPlanFor(person);
      else setCupoLleno(true);
      return;
    }
    setChatWith(person);
  };

  const activatePlan = (next: SwayPlan) => {
    savePlan(next);
    setPlan(next);
    const person = planFor;
    setPlanFor(null);
    if (person) setChatWith(person);
  };

  const finishJoin = (next: SwayAccount) => {
    saveAccount(next);
    setAccount(next);
    setActiveProfile(personFromAccount(next));
    setIsCoupleMode(next.role === 'couple');
    setJoining(false);
    openDoor();
  };

  // Secret Developer Mode state
  const [isDevMode, setIsDevMode] = useState<boolean>(() => {
    return localStorage.getItem('aethel_dev_mode') === 'true';
  });

  const toggleDevMode = () => {
    setIsDevMode((prev) => {
      const next = !prev;
      localStorage.setItem('aethel_dev_mode', next ? 'true' : 'false');
      return next;
    });
  };

  // Keyboard shortcut listener: Pressing 'd' 3 times in 1 second toggles dev mode
  useEffect(() => {
    let count = 0;
    let timer: any;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'd' || e.key === 'D') {
        count++;
        clearTimeout(timer);
        if (count >= 3) {
          toggleDevMode();
          count = 0;
        } else {
          timer = setTimeout(() => {
            count = 0;
          }, 1200);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, []);

  // Ensure dev tabs redirect to 'explore' if dev mode is disabled
  useEffect(() => {
    const devTabs = ['simulator', 'terminal', 'code', 'sql', 'docs'];
    if (!isDevMode && devTabs.includes(activeTab)) {
      setActiveTab('explore');
    }
  }, [isDevMode, activeTab]);

  // Anti-Snoop PIN Lock Security State
  const [isPinLockEnabled, setIsPinLockEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('aethel_pin_enabled');
    return saved !== 'false';
  });
  const [userPin, setUserPin] = useState<string>(() => {
    return localStorage.getItem('aethel_user_pin') || '1234';
  });

  useEffect(() => {
    localStorage.setItem('aethel_pin_enabled', isPinLockEnabled ? 'true' : 'false');
  }, [isPinLockEnabled]);

  useEffect(() => {
    localStorage.setItem('aethel_user_pin', userPin);
  }, [userPin]);

  // Simulator State
  const [isCoupleA, setIsCoupleA] = useState<boolean>(true);
  const [isCoupleB, setIsCoupleB] = useState<boolean>(false);
  const [riskAversion, setRiskAversion] = useState<number>(0.65);

  const [profileA_m1, setProfileA_m1] = useState<Vector5D>(TEST_PRESETS[1].profileA_M1);
  const [profileA_m2, setProfileA_m2] = useState<Vector5D | null>(TEST_PRESETS[1].profileA_M2);

  const [profileB_m1, setProfileB_m1] = useState<Vector5D>(TEST_PRESETS[1].profileB_M1);
  const [profileB_m2, setProfileB_m2] = useState<Vector5D | null>(null);

  const [vetoesA, setVetoesA] = useState<VetoesDict>(TEST_PRESETS[1].vetoesA);
  const [practicesB, setPracticesB] = useState<PracticesDict>(TEST_PRESETS[1].practicesB);

  // Evaluate local result in real-time
  const evalResult: EvaluationResult = evaluateRelationalCompatibilityLocal({
    profileA_m1,
    profileA_m2: isCoupleA ? profileA_m2 : null,
    profileB_m1,
    profileB_m2: isCoupleB ? profileB_m2 : null,
    vetoesA,
    practicesB,
    riskAversion
  });

  const loadPreset = (presetId: string) => {
    const preset = TEST_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    setIsCoupleA(preset.isCoupleA);
    setIsCoupleB(preset.isCoupleB);
    setRiskAversion(preset.riskAversion);
    setProfileA_m1(preset.profileA_M1);
    setProfileA_m2(preset.profileA_M2);
    setProfileB_m1(preset.profileB_M1);
    setProfileB_m2(preset.profileB_M2);
    setVetoesA(preset.vetoesA);
    setPracticesB(preset.practicesB);
  };

  const handleSwitchProfileByPin = (pin: string) => {
    if (pin === '1234') {
      setActiveProfile(SPECIAL_TEST_PROFILES.pareja1);
      setIsCoupleMode(true);
      setUserPin('1234');
    } else if (pin === '1235') {
      setActiveProfile(SPECIAL_TEST_PROFILES.unicornio1);
      setIsCoupleMode(false);
      setUserPin('1235');
    } else if (pin === '1236') {
      setActiveProfile(SPECIAL_TEST_PROFILES.bull1);
      setIsCoupleMode(false);
      setUserPin('1236');
    }
  };

  return (
    <DecoyScreenProvider userPin={userPin}>
        <PinLockCurtain isEnabled={isPinLockEnabled && doorOpen} userPin={userPin} onSwitchProfileByPin={handleSwitchProfileByPin}>
        {!doorOpen && !joining && (
          <SwayCover
            onEnter={() => (loadAccount() ? openDoor() : setJoining(true))}
            onCreate={() => setJoining(true)}
          />
        )}
        {!doorOpen && joining && (
          <SwayJoin onDone={finishJoin} onBack={() => setJoining(false)} />
        )}
        {doorOpen && (
        <div className="w-full h-dvh bg-[#030305] text-slate-100 font-sans selection:bg-rose-500 selection:text-white flex flex-row overflow-hidden">
          {/* PC Left Desktop Sidebar (Visible on md and above) */}
          {isDevMode && <DesktopSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isCoupleMode={isCoupleMode}
            setIsCoupleMode={setIsCoupleMode}
            unreadChatCount={1}
            isDevMode={isDevMode}
            toggleDevMode={toggleDevMode}
            activeAlias={activeProfile.alias}
            onOpenQuickSwitch={() => setIsQuickSwitchOpen(true)}
            onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
          />}

          {/* Main App Layout Area */}
          <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            {/* Mobile Header (Hidden on md and above) */}
            {(isDevMode || (activeTab !== 'explore' && activeTab !== 'dual_profile')) && <MobileHeader
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              isCoupleMode={isCoupleMode}
              setIsCoupleMode={setIsCoupleMode}
              isDevMode={isDevMode}
              toggleDevMode={toggleDevMode}
              activeAlias={activeProfile.alias}
              onOpenQuickSwitch={() => setIsQuickSwitchOpen(true)}
              onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
            />}

            {/* Scrollable Main Content Container */}
            <main className={`flex-1 overflow-y-auto scroll-touch w-full ${activeTab === 'explore' || activeTab === 'dual_profile' ? 'mx-auto w-full max-w-md self-center bg-black p-0' : 'max-w-7xl mx-auto p-3 sm:p-5 md:p-8 pb-28 md:pb-8'}`}>
              {/* Developer Simulator View (Only if isDevMode) */}
              {isDevMode && activeTab === 'simulator' && (
                <div className="space-y-6">
                  {/* Top Quick Presets Bar */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-400" />
                        Casos de Prueba:
                      </span>
                      <span className="text-[10px] text-slate-400">Presets 5D</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {TEST_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => loadPreset(preset.id)}
                          className="p-2.5 bg-slate-950 hover:bg-slate-800/80 rounded-xl border border-slate-800 text-left transition-all hover:border-rose-500/50 group"
                        >
                          <div className="flex items-center justify-between text-xs font-bold text-white group-hover:text-rose-400 transition-colors">
                            <span>{preset.title.split(':')[0]}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                              {preset.id.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{preset.subtitle}</div>
                          <div className="text-[10px] text-emerald-400 mt-1 font-mono">{preset.expectedResult}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Score & Affinity Summary Hero Card */}
                  <div
                    className={`rounded-2xl p-5 border transition-all duration-300 shadow-2xl relative overflow-hidden ${
                      evalResult.is_vetoed
                        ? 'bg-gradient-to-r from-red-950/80 via-slate-900 to-slate-900 border-red-800/60'
                        : evalResult.status === 'MATCH'
                        ? 'bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border-emerald-800/60'
                        : 'bg-gradient-to-r from-amber-950/80 via-slate-900 to-slate-900 border-amber-800/60'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center space-y-3 relative z-10">
                      <div className="flex items-center space-x-2">
                        {evalResult.is_vetoed ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/40 uppercase tracking-wide flex items-center gap-1.5">
                            <ShieldAlert className="w-4 h-4" /> VETOED (0.0%)
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase tracking-wide flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" /> {evalResult.status} ({evalResult.affinity_percentage})
                          </span>
                        )}
                      </div>

                      <h2 className="text-xl font-black text-white">
                        {evalResult.is_vetoed
                          ? 'Incompatibilidad Crítica de Límites Duros'
                          : evalResult.status === 'MATCH'
                          ? 'Afinidad de Selección Excelente'
                          : 'Compatibilidad Relacional Moderada'}
                      </h2>

                      <p className="text-xs text-slate-300">{evalResult.message}</p>

                      <div className="flex flex-col items-center justify-center bg-slate-950/90 border border-slate-800 rounded-2xl p-4 w-full shadow-inner max-w-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Afinidad Escalar
                        </span>
                        <span
                          className={`text-3xl font-black font-mono my-1 ${
                            evalResult.is_vetoed
                              ? 'text-red-400'
                              : evalResult.status === 'MATCH'
                              ? 'text-emerald-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {evalResult.is_vetoed ? '0.0%' : evalResult.affinity_percentage}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Radar Chart & Consensus Math Section */}
                  <div className="space-y-4">
                    <RadarChart5D
                      vectorA={evalResult.consensus_vector_a || [0, 0, 0, 0, 0]}
                      vectorB={evalResult.consensus_vector_b || [0, 0, 0, 0, 0]}
                      labelA={isCoupleA ? 'Consenso Pareja A' : 'Perfil A Solo'}
                      labelB={isCoupleB ? 'Consenso Pareja B' : 'Perfil B Solo'}
                      isVetoed={evalResult.is_vetoed}
                    />

                    {isCoupleA && profileA_m2 && (
                      <ConsensusMathView
                        memberA={profileA_m1}
                        memberB={profileA_m2}
                        riskAversion={riskAversion}
                        onRiskAversionChange={setRiskAversion}
                      />
                    )}
                  </div>

                  {/* Hard Veto Engine Configuration */}
                  <HardVetoEditor
                    vetoesA={vetoesA}
                    onChangeVetoesA={setVetoesA}
                    practicesB={practicesB}
                    onChangePracticesB={setPracticesB}
                    labelPartyA={isCoupleA ? 'Pareja A' : 'Perfil A'}
                    labelPartyB={isCoupleB ? 'Pareja B' : 'Perfil B'}
                  />

                  {/* Profile Vector Editors */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800">
                        <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-rose-400" />
                          Perfil A ({isCoupleA ? 'Pareja' : 'Individual'})
                        </span>
                        <button
                          onClick={() => {
                            setIsCoupleA(!isCoupleA);
                            if (!profileA_m2) {
                              setProfileA_m2({ ...profileA_m1 });
                            }
                          }}
                          className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                        >
                          {isCoupleA ? 'Cambiar a Solo' : 'Cambiar a Pareja'}
                        </button>
                      </div>

                      <VectorEditor
                        title={isCoupleA ? 'Miembro A1 (Pareja A)' : 'Perfil Individual A'}
                        subtitle="Vector 5D"
                        accentColor="rose"
                        vector={profileA_m1}
                        onChange={setProfileA_m1}
                      />

                      {isCoupleA && (
                        <VectorEditor
                          title="Miembro A2 (Pareja A)"
                          subtitle="Segundo miembro"
                          accentColor="purple"
                          vector={profileA_m2 || profileA_m1}
                          onChange={(updated) => setProfileA_m2(updated)}
                        />
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800">
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-indigo-400" />
                          Perfil B ({isCoupleB ? 'Pareja Objetivo' : 'Objetivo Individual'})
                        </span>
                        <button
                          onClick={() => {
                            setIsCoupleB(!isCoupleB);
                            if (!profileB_m2) {
                              setProfileB_m2({ ...profileB_m1 });
                            }
                          }}
                          className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                        >
                          {isCoupleB ? 'Cambiar a Solo' : 'Cambiar a Pareja'}
                        </button>
                      </div>

                      <VectorEditor
                        title={isCoupleB ? 'Miembro B1 (Pareja B)' : 'Perfil Objetivo B'}
                        subtitle="Vector 5D"
                        accentColor="indigo"
                        vector={profileB_m1}
                        onChange={setProfileB_m1}
                      />

                      {isCoupleB && (
                        <VectorEditor
                          title="Miembro B2 (Pareja B)"
                          subtitle="Segundo miembro"
                          accentColor="emerald"
                          vector={profileB_m2 || profileB_m1}
                          onChange={(updated) => setProfileB_m2(updated)}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Primary View 1: Explorar & Match Feed */}
              {activeTab === 'explore' && (
                <SwayExplore showBars={plan !== null} onMessage={openChat} />
              )}

              {/* Primary View 2: Agenda & Private Circles SW */}
              {activeTab === 'agenda' && <PrivateEventsAgenda />}

              {/* Primary View 3: Mensajes & Suscripción */}
              {activeTab === 'chat' && <ChatAndBillingView />}

              {/* Primary View 4: Bóveda Privada Cifrada */}
              {activeTab === 'media' && <MediaVaultManager />}

              {/* Primary View 5: Calibración & Onboarding Dilemas 5D */}
              {activeTab === 'onboarding' && <OnboardingFlow />}

              {/* Primary View 6: Mi Perfil Dual */}
              {activeTab === 'dual_profile' && (
                <SwayProfile
                  person={account ? personFromAccount(account) : activeProfile}
                  mine
                  mineNote={account && account.role !== 'solo_male'
                    ? 'Puedes empezar cinco conversaciones sin el plan, y contestar las que te lleguen. El plan sube el cupo a quince.'
                    : 'Puedes recibir y contestar sin el plan. Escribir primero es el plan: 20.000 al mes o 180.000 al año.'}
                />
              )}

              {/* Technical Developer Tools Views (Only if isDevMode is TRUE) */}
              {isDevMode && activeTab === 'terminal' && <PythonTerminalView />}
              {isDevMode && activeTab === 'code' && <PythonCodeViewer />}
              {isDevMode && activeTab === 'sql' && <SupabaseSqlViewer />}
              {isDevMode && activeTab === 'docs' && <DocsView />}
            </main>

            {/* Mobile Bottom Nav Bar (Hidden on md and above) */}
            {showMenu && (
              <BottomNav
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                doorActive={showPropose}
                onLeave={() => setShowPropose(false)}
                onNotify={() => setIsNotificationDrawerOpen(true)}
                onPropose={() => setShowPropose(true)}
              />
            )}
            {planFor && (
              <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-4 pb-8" onClick={() => setPlanFor(null)}>
                <div className="w-full max-w-md rounded-3xl border border-[#c4a574]/30 bg-[#120e0c] p-5 text-white" onClick={(e) => e.stopPropagation()}>
                  <p className="sway-kicker">SWAY</p>
                  <p className="mt-2 font-sway text-3xl">El plan</p>
                  <p className="mt-2 text-sm leading-relaxed text-white/75">
                    Escribirle a {planFor.alias} abre el plan. Quince conversaciones nuevas al mes. Contestar no se cobra. El cobro real entra con Wompi al publicar. Aquí el plan queda activo en este teléfono.
                  </p>
                  <button type="button" className="sway-clay mt-4 h-12 w-full rounded-2xl" onClick={() => activatePlan('mes')}>
                    20.000 al mes
                  </button>
                  <button type="button" className="mt-2 h-12 w-full rounded-2xl border border-[#c4a574]/70" onClick={() => activatePlan('ano')}>
                    180.000 al año
                  </button>
                </div>
              </div>
            )}
            {cupoLleno && (
              <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-4 pb-8" onClick={() => setCupoLleno(false)}>
                <div className="w-full max-w-md rounded-3xl border border-[#c4a574]/30 bg-[#120e0c] p-5 text-white" onClick={(e) => e.stopPropagation()}>
                  <p className="sway-kicker">SWAY</p>
                  <p className="mt-2 font-sway text-3xl">Cupo del mes</p>
                  <p className="mt-2 text-sm leading-relaxed text-white/75">
                    Ya usaste las quince conversaciones nuevas. Se renuevan con el mes. Las que ya abriste siguen abiertas, y contestar no se cobra.
                  </p>
                  <button type="button" className="sway-clay mt-4 h-12 w-full rounded-2xl" onClick={() => setCupoLleno(false)}>
                    Volver
                  </button>
                </div>
              </div>
            )}
            {chatWith && <SwayChat person={chatWith} onBack={() => setChatWith(null)} />}
            {showPropose && (
              <SwayDoor
                viewerName={account ? (account.role === 'couple' ? `${account.name} & ${account.partnerName}` : account.name) : activeProfile.alias}
                role={account?.role || activeProfile.role}
                city={account?.city || 'Bogotá'}
                onClose={() => setShowPropose(false)}
                onMode={reportDoor}
              />
            )}
          </div>
        </div>
        )}

        {/* Global Test Profile Selector Modal */}
        <QuickProfileSwitchModal
          isOpen={isQuickSwitchOpen}
          onClose={() => setIsQuickSwitchOpen(false)}
          activeUsername={activeProfile.username}
          onSwitchProfile={(profile) => {
            setActiveProfile(profile);
            setIsCoupleMode(profile.role === 'couple');
            setUserPin(profile.pin);
          }}
        />

        {/* In-App Notifications & Vault Requests Drawer */}
        <InteractionNotificationDrawer
          isOpen={isNotificationDrawerOpen}
          onClose={() => setIsNotificationDrawerOpen(false)}
          onNavigateToTab={setActiveTab}
        />
      </PinLockCurtain>
    </DecoyScreenProvider>
  );
}


