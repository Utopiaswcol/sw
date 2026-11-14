import React, { useMemo, useState } from 'react';
import { Heart, MapPin, Mars, ShieldCheck, SlidersHorizontal, Venus } from 'lucide-react';
import { SYSTEM_10_ADDITIONAL_CANDIDATES, type SystemCandidate } from '../data/profilesData';
import { SwayProfile } from './SwayProfile';
import { SwayMural } from './SwayCover';

type RoleFilter = 'pareja' | 'hombre' | 'mujer' | null;

const FILTERS: { id: RoleFilter; label: string }[] = [
  { id: null, label: 'Ciudad' },
  { id: 'pareja', label: 'Pareja' },
  { id: 'hombre', label: 'Hombre' },
  { id: 'mujer', label: 'Mujer' }
];

interface SwayExploreProps {
  onMessage: (person: SystemCandidate) => void;
  showBars?: boolean;
}

export const SwayExplore: React.FC<SwayExploreProps> = ({ onMessage, showBars = false }) => {
  const [role, setRole] = useState<RoleFilter>(null);
  const [onlyCity, setOnlyCity] = useState(true);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const people = useMemo(() => {
    return SYSTEM_10_ADDITIONAL_CANDIDATES.filter((c) => {
      if (onlyCity && !/bogot/i.test(c.location)) return false;
      if (onlyVerified && c.verifiedBadges.length === 0) return false;
      if (role === 'pareja' && c.role !== 'couple') return false;
      if (role === 'hombre' && c.role !== 'solo_male') return false;
      if (role === 'mujer' && c.role !== 'solo_female') return false;
      return true;
    });
  }, [role, onlyCity, onlyVerified]);

  const open = people.find((c) => c.candidateId === openId) || null;

  if (open) {
    return (
      <SwayProfile
        person={open}
        onBack={() => setOpenId(null)}
        showBars={showBars}
        onMessage={() => onMessage(open)}
      />
    );
  }

  return (
    <div className="relative min-h-full bg-black text-white">
      <div className="pointer-events-none absolute inset-0">
        <SwayMural className="h-full w-full opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/72 to-black" />
      </div>

      <div className="relative px-4 pb-28 pt-4">
        <header className="flex items-start justify-between">
          <div>
            <p className="font-sway text-5xl leading-none tracking-[0.04em]">SWAY</p>
            <span className="mt-2 block h-px w-16 bg-gradient-to-r from-[#c4a574] to-transparent" />
            <p className="mt-2 text-[11px] tracking-[0.42em] text-white/75">ENM</p>
          </div>
          <button
            type="button"
            onClick={() => setOnlyVerified((v) => !v)}
            className="relative rounded-full border border-white/25 p-2.5 text-white/80"
            aria-label="Solo verificados"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className={`absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full ${onlyVerified ? 'bg-[#7eb6ff]' : 'bg-[#d06a45]'}`} />
          </button>
        </header>

        <h1 className="mt-6 font-sway text-4xl text-[#d06a45]">Explorar</h1>
        <p className="mt-1 text-sm text-white/65">Conecta con parejas y personas afines.</p>

        <div className="scrollbar-none mt-4 flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => {
            const on = f.id === null ? onlyCity : role === f.id;
            return (
              <button
                key={f.label}
                type="button"
                onClick={() => {
                  if (f.id === null) setOnlyCity((v) => !v);
                  else setRole((current) => (current === f.id ? null : f.id));
                }}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${
                  on ? 'border-[#d06a45] bg-[#d06a45]/18 text-white' : 'border-white/15 text-white/70'
                }`}
              >
                {f.id === null ? (onlyCity ? 'Bogotá' : 'Colombia') : f.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setOnlyVerified((v) => !v)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${
              onlyVerified ? 'border-[#7eb6ff] bg-[#7eb6ff]/15 text-[#7eb6ff]' : 'border-white/15 text-white/70'
            }`}
          >
            Verificados
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {people.length === 0 && (
            <p className="rounded-3xl border border-white/10 px-4 py-8 text-center text-sm text-white/60">
              Con estos filtros no hay nadie en la sala. Quita uno y mira de nuevo.
            </p>
          )}
          {people.map((person) => (
            <Card key={person.candidateId} person={person} onOpen={() => setOpenId(person.candidateId)} />
          ))}
        </div>
      </div>
    </div>
  );
};

function Card({ person, onOpen }: { person: SystemCandidate; onOpen: () => void }) {
  const kind = person.role === 'couple' ? 'Pareja' : person.role === 'solo_female' ? 'Mujer' : 'Hombre';
  const KindIcon = person.role === 'couple' ? Heart : person.role === 'solo_female' ? Venus : Mars;
  const chips = chipsOf(person);
  const [photoOk, setPhotoOk] = React.useState(true);
  const verified = person.verifiedBadges.length > 0;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative w-full overflow-hidden rounded-[28px] border border-white/15 bg-black/55 p-3 text-left shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-[2px]"
    >
      {person.role === 'couple' && <span className="absolute bottom-4 left-0 top-4 w-px bg-[#c4a574]" />}
      <div className="flex gap-3">
        {photoOk ? (
          <img
            src={person.publicImage}
            alt=""
            onError={() => setPhotoOk(false)}
            className="sway-ring h-[4.6rem] w-[4.6rem] shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="sway-ring flex h-[4.6rem] w-[4.6rem] shrink-0 items-center justify-center rounded-full bg-[#3a241c] font-sway text-xl text-[#c4a574]">
            {person.alias.slice(0, 1)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[1.35rem] leading-tight">{person.alias}</p>
              {verified && (
                <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-[#7eb6ff]/50 px-2 py-0.5 text-[10px] text-[#7eb6ff]">
                  <ShieldCheck className="h-3 w-3" />
                  Verificado
                </span>
              )}
            </div>
            <p className="font-sway text-[2.6rem] leading-none text-[#d06a45]">{person.affinityPercentage}%</p>
          </div>
          <p className={`mt-1 flex items-center gap-1 text-sm ${kind === 'Pareja' ? 'text-[#c4a574]' : 'text-white/85'}`}>
            <KindIcon className="h-3.5 w-3.5" />
            {kind}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-white/55">
            <MapPin className="h-3 w-3 text-[#c4a574]" />
            {person.location.replace('D.C.', '').split('/')[0].trim()}
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="sway-bar h-full rounded-full" style={{ width: `${person.affinityPercentage}%` }} />
          </div>
        </div>
      </div>
      {chips.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <span key={chip} className="rounded-full border border-[#c4a574]/35 bg-[#c4a574]/10 px-2.5 py-1 text-[11px] text-white/80">
              {chip}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

function chipsOf(person: SystemCandidate) {
  const fromTitle = person.roleTitle.split('/').pop()?.trim() || '';
  const fromLine = person.tagline.split('•')[0].trim();
  const unique = [fromTitle, fromLine].filter((item, i, all) => item && item.length < 32 && all.indexOf(item) === i);
  return unique.slice(0, 2);
}
