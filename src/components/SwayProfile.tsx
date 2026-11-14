import React from 'react';
import { BadgeCheck, ChevronLeft, Lock, MapPin, Pencil } from 'lucide-react';
import type { SystemCandidate, TestProfile } from '../data/profilesData';

type Person = SystemCandidate | TestProfile;

interface SwayProfileProps {
  person: Person;
  mine?: boolean;
  mineNote?: string;
  showBars?: boolean;
  onBack?: () => void;
  onMessage?: () => void;
}

export const SwayProfile: React.FC<SwayProfileProps> = ({ person, mine, mineNote, showBars = false, onBack, onMessage }) => {
  const ages = agesOf(person.bio);
  const seek = seekOf(person.bio);
  const affinity = 'affinityPercentage' in person ? person.affinityPercentage : null;
  const closeness = 'cosineDistance' in person
    ? Math.max(40, Math.min(99, Math.round((1 - person.cosineDistance) * 100)))
    : null;
  const marks = person.verifiedBadges.length;
  const [photoOk, setPhotoOk] = React.useState(true);
  const voice = voiceOf(person.tagline);
  const story = storyOf(person.bio, seek.raw);
  const axes = !mine ? axesOf(person.vector5D) : [];
  const limits = mine ? [] : limitsOf(person);
  const album = albumOf(person, Boolean(mine));
  const vouches = !mine && person.inPersonVouchesCount ? person.inPersonVouchesCount : 0;
  const hosted = !mine && person.eventsOrganizedCount ? person.eventsOrganizedCount : 0;
  const [albumAsked, setAlbumAsked] = React.useState(false);

  return (
    <div className="relative min-h-full bg-black text-white">
      <div className="sway-glow pointer-events-none absolute inset-x-0 top-0 h-56" />
      <div className={`relative px-5 pb-28 ${onBack ? 'pt-4' : 'pt-6'}`}>
        {onBack && (
          <button type="button" onClick={onBack} className="mb-5 flex items-center gap-1 text-sm text-[#c4a574]">
            <ChevronLeft className="h-4 w-4" />
            Explorar
          </button>
        )}

        <div className="flex items-start gap-4">
          {photoOk && person.publicImage ? (
            <img
              src={person.publicImage}
              alt=""
              onError={() => setPhotoOk(false)}
              className="sway-ring h-[6.5rem] w-[6.5rem] shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="sway-ring flex h-[6.5rem] w-[6.5rem] shrink-0 items-center justify-center rounded-full bg-[#3a241c] font-sway text-3xl text-[#c4a574]">
              {initials(person.alias)}
            </div>
          )}
          <div className="min-w-0 pt-1">
            <div className="flex items-start gap-1.5">
              <h1 className="font-sway text-[2rem] leading-[1.05]">{person.alias}</h1>
              {marks > 0 && (
                <span className="mt-2 flex shrink-0 gap-0.5">
                  <BadgeCheck className="h-4 w-4 text-[#3b82f6]" />
                  {marks > 1 && <BadgeCheck className="h-4 w-4 text-[#d06a45]" />}
                </span>
              )}
            </div>
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-white/75">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-white/70" />
                {cityOf(person.location)}
              </span>
              {ages && <span className="text-white/55">{ages}</span>}
            </p>
            {seek.label && <p className="mt-1.5 text-sm text-white/80">{seek.label}</p>}
          </div>
        </div>

        {affinity !== null && (
          <section className="mt-8 border-t border-white/10 pt-5">
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-[8.5rem]">
                <p className="sway-kicker">Afinidad de estilo</p>
                <p className="mt-2 font-sway text-7xl leading-none text-[#c56a45]">{affinity}%</p>
                <span className="mt-3 block h-px w-10 bg-[#c4a574]/80" />
              </div>
              {voice && (
                <p className="max-w-[46%] pb-2 text-sm leading-snug text-white/70">{voice}</p>
              )}
            </div>
            {showBars && axes.length > 0 && (
              <div className="mt-4 space-y-2">
                {axes.map((axis) => (
                  <Bar key={axis.label} label={axis.label} value={axis.value} />
                ))}
                {closeness !== null && closeness !== affinity && <Bar label="Cercanía" value={closeness} />}
              </div>
            )}
            {showBars && axes.length === 0 && closeness !== null && closeness !== affinity && (
              <div className="mt-4">
                <Bar label="Cercanía" value={closeness} />
              </div>
            )}
          </section>
        )}

        {!mine && (
          <button
            type="button"
            onClick={onMessage}
            className="mt-6 flex h-[3.25rem] w-full items-center justify-center gap-2 rounded-2xl border border-[#c4a574]/70 bg-black/40 text-lg tracking-wide"
          >
            <Pencil className="h-4 w-4" />
            Mensaje
          </button>
        )}

        {mine && (
          <p className="mt-6 text-sm leading-relaxed text-white/55">
            {mineNote || 'Puedes recibir y contestar sin el plan. Escribir primero, a quien aún no te escribió, es el plan.'}
          </p>
        )}

        {story && (
          <p className="mt-5 text-[0.95rem] leading-relaxed text-white/75">{story}</p>
        )}

        {person.verifiedBadges.length > 0 && !mine && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {person.verifiedBadges.slice(0, 3).map((badge) => (
              <span key={badge} className="rounded-full border border-[#7eb6ff]/40 px-2.5 py-1 text-[11px] text-[#7eb6ff]">
                {badge}
              </span>
            ))}
          </div>
        )}

        {limits.length > 0 && (
          <section className="mt-6">
            <p className="sway-kicker">Límites</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {limits.map((limit) => (
                <span key={limit} className="rounded-full border border-white/20 px-2.5 py-1 text-[11px] text-white/75">
                  {limit}
                </span>
              ))}
            </div>
          </section>
        )}

        {(vouches > 0 || hosted > 0) && (
          <p className="mt-4 text-sm text-white/60">
            {vouches > 0 && `${vouches} ${vouches === 1 ? 'pareja los confirma' : 'parejas los confirman'}`}
            {vouches > 0 && hosted > 0 && ' · '}
            {hosted > 0 && `${hosted} ${hosted === 1 ? 'fiesta' : 'fiestas'}`}
          </p>
        )}

        <section className="mt-6 border-t border-white/10 pt-5">
          <div className="flex items-center justify-between">
            <p className="sway-kicker">{mine ? 'Tu álbum' : 'Álbum'}</p>
            <p className="text-xs text-white/40">{album.count === 0 ? 'Vacío' : `${album.count} ${album.count === 1 ? 'foto' : 'fotos'}`}</p>
          </div>
          {album.count > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {(album.open ? [0] : Array.from({ length: Math.min(album.count, 3) }, (_, index) => index)).map((index) => (
                <div key={index} className={`relative h-24 overflow-hidden rounded-2xl border bg-[#1a120f] ${album.open ? 'border-[#c4a574]/50' : 'border-white/10'}`}>
                  {person.publicImage && (
                    <img
                      src={person.publicImage}
                      alt=""
                      className={`h-full w-full object-cover ${album.open ? '' : 'scale-110 blur-xl'}`}
                    />
                  )}
                  {!album.open && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/55">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#c4a574]/60 bg-black/50">
                        <Lock className="h-3.5 w-3.5 text-[#c4a574]" />
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {mine && (
            <p className="mt-3 text-sm leading-relaxed text-white/55">
              Se abre para alguien cuando los dos ya se escribieron.
            </p>
          )}
          {!mine && album.open && (
            <p className="mt-3 text-sm text-[#c4a574]">El álbum está abierto.</p>
          )}
          {!mine && !album.open && (
            albumAsked ? (
              <p className="mt-3 text-sm text-[#c4a574]">Pedido. Se abre cuando contesten.</p>
            ) : (
              <button type="button" onClick={() => setAlbumAsked(true)} className="mt-3 h-11 w-full rounded-2xl border border-[#c4a574]/50 text-sm text-[#c4a574]">
                Pedir el álbum
              </button>
            )
          )}
        </section>
      </div>
    </div>
  );
};

const AXES = ['Intercambio', 'Integrantes', 'Participación', 'Vínculo', 'Acuerdos'];

const VETO_NAMES: Record<string, string> = {
  preservativo_obligatorio: 'Preservativo',
  no_hombres_solos_no_verificados: 'Sin hombres sin verificar',
  no_parejas_sin_verificacion_dual: 'Sin parejas sin verificar',
  no_men: 'Sin hombres'
};

function axesOf(vector: [number, number, number, number, number] | undefined) {
  if (!vector) return [];
  return AXES.map((label, index) => ({
    label,
    value: Math.max(0, Math.min(100, Math.round((vector[index] + 1) * 50)))
  }));
}

function limitsOf(person: Person) {
  if ('hardVetoesRespected' in person) return person.hardVetoesRespected;
  return person.hardVetoes.map((item) => VETO_NAMES[item] || item.replaceAll('_', ' '));
}

function albumOf(person: Person, mine: boolean) {
  if (mine) {
    return { count: person.publicImage?.startsWith('data:') ? 1 : 0, open: true };
  }
  const count = 'vaultAssetCount' in person ? person.vaultAssetCount : 0;
  const open = 'hasVaultPermission' in person ? person.hasVaultPermission : false;
  return { count, open };
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 text-sm text-white/70">
      <span className="w-24 shrink-0">{label}</span>
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
        <span className="sway-bar block h-full rounded-full" style={{ width: `${value}%` }} />
      </span>
      <span className="w-9 text-right text-white/80">{value}%</span>
    </div>
  );
}

function initials(name: string) {
  return name.split(/\s+|&/).filter((w) => w && w !== '&').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function cityOf(location: string) {
  return location.split('/')[0].replace('D.C.', '').trim();
}

function agesOf(bio: string) {
  const nums = [...bio.matchAll(/\((\d{2})\)/g)].map((m) => Number(m[1]));
  if (!nums.length) return '';
  if (nums.length === 1) return `${nums[0]} años`;
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  return `Rango de edad ${min}–${max} años`;
}

function seekOf(bio: string) {
  const raw = bio.split('.').map((part) => part.trim()).find((part) => /busco|buscamos/i.test(part)) || '';
  if (!raw) return { raw: '', label: '' };
  const rest = raw.replace(/^(buscamos|busco)\s+/i, '');
  const label = /^buscamos/i.test(raw) ? `Buscan: ${rest}` : `Busca: ${rest}`;
  return { raw, label };
}

function voiceOf(tagline: string) {
  const piece = tagline.split('•').map((part) => part.trim()).filter(Boolean).pop() || '';
  return piece.length > 42 ? '' : piece;
}

function storyOf(bio: string, seekRaw: string) {
  const text = bio
    .replace(seekRaw, '')
    .replace(/[^.]*\(\d{2}\)[^.]*\.?/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[.\s]+|[.\s]+$/g, '');
  return text ? `${text}.` : '';
}
