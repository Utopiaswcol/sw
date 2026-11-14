import { SPECIAL_TEST_PROFILES, type TestProfile } from '../data/profilesData';

export type SwayRole = 'solo_male' | 'solo_female' | 'couple';
export type SwayPlan = 'mes' | 'ano';

export interface SwayAccount {
  role: SwayRole;
  name: string;
  partnerName: string;
  city: string;
  age: string;
  partnerAge: string;
  seeks: string[];
  tastes: string[];
  photo: string;
}

export interface SwayThread {
  id: string;
  alias: string;
  couple: boolean;
  messages: { text: string; at: number }[];
  pending: boolean;
  counted: boolean;
}

const ACCOUNT = 'sway_account';
const PLAN = 'sway_plan';
const THREADS = 'sway_threads';

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : null;
  } catch {
    return null;
  }
}

export function loadAccount(): SwayAccount | null {
  return read<SwayAccount>(ACCOUNT);
}

export function saveAccount(account: SwayAccount) {
  localStorage.setItem(ACCOUNT, JSON.stringify(account));
}

export function loadPlan(): SwayPlan | null {
  const plan = localStorage.getItem(PLAN);
  return plan === 'mes' || plan === 'ano' ? plan : null;
}

export function savePlan(plan: SwayPlan) {
  localStorage.setItem(PLAN, plan);
}

export function loadThreads(): Record<string, SwayThread> {
  return read<Record<string, SwayThread>>(THREADS) || {};
}

export function saveThreads(threads: Record<string, SwayThread>) {
  localStorage.setItem(THREADS, JSON.stringify(threads));
}

export function startsUsed() {
  return Object.values(loadThreads()).filter((thread) => thread.counted).length;
}

export function allowance(role: SwayRole, plan: SwayPlan | null) {
  if (plan) return 15;
  if (role === 'solo_male') return 0;
  return 5;
}

export function personFromAccount(account: SwayAccount): TestProfile {
  const base = SPECIAL_TEST_PROFILES.pareja1;
  const couple = account.role === 'couple';
  const alias = couple ? `${account.name} & ${account.partnerName}` : account.name;
  const ages = couple
    ? `${account.name} (${account.age}) y ${account.partnerName} (${account.partnerAge})`
    : `${account.name} (${account.age})`;
  const verb = couple ? 'Buscamos' : 'Busco';
  return {
    ...base,
    alias,
    role: account.role,
    roleTitle: couple ? 'Pareja' : account.role === 'solo_female' ? 'Mujer' : 'Hombre',
    location: account.city,
    tagline: account.tastes.join(' · ') || account.city,
    bio: `${ages}. ${verb} ${account.seeks.join(', ') || 'alguien afín'}.`,
    publicImage: account.photo || '',
    verifiedBadges: []
  };
}
