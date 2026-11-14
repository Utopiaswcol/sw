import type { SwayRole } from './account';

export type HostKind = 'pareja' | 'mujer' | 'grupo';
export type Audience = 'parejas' | 'mujeres' | 'hombres' | 'todos';

export interface PartyRequest {
  name: string;
  status: 'pedido' | 'aceptado';
}

export interface Party {
  id: string;
  title: string;
  hostKind: HostKind;
  hostName: string;
  owner: string;
  day: string;
  city: string;
  capacity: number;
  forWhom: Audience[];
  address: string;
  note: string;
  requests: PartyRequest[];
}

const KEY = 'sway_parties';

const SEED: Party[] = [
  {
    id: 'cena-chapinero',
    title: 'Cena en casa',
    hostKind: 'pareja',
    hostName: 'Laura & Andrés',
    owner: 'Laura & Andrés',
    day: 'Sábado, 8 pm',
    city: 'Bogotá',
    capacity: 8,
    forWhom: ['parejas', 'mujeres'],
    address: 'Calle 59 #7-42, apto 401, Chapinero',
    note: 'Cena corta. Se entra de a dos o sola.',
    requests: []
  },
  {
    id: 'tarde-candelaria',
    title: 'Tarde en La Candelaria',
    hostKind: 'mujer',
    hostName: 'Camila',
    owner: 'Camila',
    day: 'Domingo, 4 pm',
    city: 'Bogotá',
    capacity: 12,
    forWhom: ['todos'],
    address: 'Carrera 4 #12-18, casa interior',
    note: 'Música baja. Sin fotos.',
    requests: []
  }
];

function read(): Party[] | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) as Party[] : null;
  } catch {
    return null;
  }
}

export function loadParties(): Party[] {
  return read() || SEED.map((party) => ({ ...party, requests: [] }));
}

export function saveParties(parties: Party[]) {
  localStorage.setItem(KEY, JSON.stringify(parties));
}

export function spotsLeft(party: Party) {
  return Math.max(0, party.capacity - party.requests.length);
}

export function fitsDoor(party: Party, role: SwayRole) {
  if (party.forWhom.includes('todos')) return true;
  if (role === 'couple') return party.forWhom.includes('parejas');
  if (role === 'solo_female') return party.forWhom.includes('mujeres');
  return party.forWhom.includes('hombres');
}

export function requestOf(party: Party, name: string) {
  return party.requests.find((item) => item.name === name) || null;
}

export function seesAddress(party: Party, name: string) {
  if (party.owner === name) return true;
  return party.requests.some((item) => item.name === name && item.status === 'aceptado');
}

export function forLine(forWhom: Audience[]) {
  if (forWhom.includes('todos')) return 'Para todos';
  const words = forWhom.map((item) => item);
  if (words.length <= 1) return `Para ${words[0] || 'quien el anfitrión diga'}`;
  return `Para ${words.slice(0, -1).join(', ')} y ${words[words.length - 1]}`;
}
