import React, { useLayoutEffect, useState } from 'react';
import { ChevronLeft, MapPin } from 'lucide-react';
import type { SwayRole } from '../sway/account';
import {
  fitsDoor,
  forLine,
  loadParties,
  requestOf,
  saveParties,
  seesAddress,
  spotsLeft,
  type Audience,
  type HostKind,
  type Party
} from '../sway/parties';

const AUDIENCE: { id: Audience; label: string }[] = [
  { id: 'parejas', label: 'Parejas' },
  { id: 'mujeres', label: 'Mujeres' },
  { id: 'hombres', label: 'Hombres' },
  { id: 'todos', label: 'Todos' }
];

const KIND: Record<HostKind, string> = { pareja: 'Pareja', mujer: 'Mujer', grupo: 'Grupo' };

interface SwayDoorProps {
  viewerName: string;
  role: SwayRole;
  city: string;
  onClose: () => void;
  onMode?: (mode: 'list' | 'detail' | 'form') => void;
}

export const SwayDoor: React.FC<SwayDoorProps> = ({ viewerName, role, city, onClose, onMode }) => {
  const [parties, setParties] = useState<Party[]>(loadParties);
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [onlyCity, setOnlyCity] = useState(true);

  const persist = (next: Party[]) => {
    saveParties(next);
    setParties(next);
  };

  const hostKind: HostKind = role === 'couple' ? 'pareja' : role === 'solo_female' ? 'mujer' : 'grupo';
  const visible = parties.filter((party) => !onlyCity || party.city.toLowerCase() === city.toLowerCase());
  const open = parties.find((party) => party.id === openId) || null;
  const mode = creating ? 'form' : open ? 'detail' : 'list';

  useLayoutEffect(() => {
    onMode?.(mode);
  }, [mode, onMode]);

  useLayoutEffect(() => () => onMode?.('list'), [onMode]);

  return (
    <div className={`fixed inset-0 flex justify-center bg-black text-white ${mode === 'list' ? 'z-30' : 'z-50'}`}>
      <div className="flex h-full w-full max-w-md flex-col">
        {creating ? (
          <CreateParty
            hostKind={hostKind}
            viewerName={viewerName}
            city={city}
            onBack={() => setCreating(false)}
            onCreate={(party) => {
              persist([party, ...parties]);
              setCreating(false);
              setOpenId(party.id);
            }}
          />
        ) : open ? (
          <PartyDetail
            party={open}
            viewerName={viewerName}
            role={role}
            onBack={() => setOpenId(null)}
            onChange={(next) => persist(parties.map((item) => item.id === next.id ? next : item))}
          />
        ) : (
          <div className="relative flex-1 overflow-y-auto px-4 pb-28 pt-4">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-40 opacity-50">
              <div className="h-full bg-[radial-gradient(circle_at_15%_20%,rgba(215,176,122,0.28),transparent_42%),radial-gradient(circle_at_85%_10%,rgba(161,90,58,0.28),transparent_40%)]" />
            </div>
            <div className="relative">
              <button type="button" onClick={onClose} className="mb-4 flex items-center gap-1 text-sm text-[#c4a574]">
                <ChevronLeft className="h-4 w-4" />
                Volver
              </button>
              <h1 className="font-sway text-4xl text-[#d06a45]">La puerta</h1>
              <p className="mt-1 text-sm text-white/65">La fiesta la arma una pareja, una mujer o un grupo. SWAY guarda la dirección.</p>
              <div className="mt-4 flex gap-2">
                <button type="button" onClick={() => setOnlyCity(true)} className={`rounded-full border px-3 py-1.5 text-sm ${onlyCity ? 'border-[#d06a45] bg-[#d06a45]/18 text-white' : 'border-white/15 text-white/70'}`}>{city}</button>
                <button type="button" onClick={() => setOnlyCity(false)} className={`rounded-full border px-3 py-1.5 text-sm ${!onlyCity ? 'border-[#d06a45] bg-[#d06a45]/18 text-white' : 'border-white/15 text-white/70'}`}>Colombia</button>
              </div>
              <div className="mt-4 space-y-3">
                {visible.length === 0 && (
                  <p className="rounded-3xl border border-white/10 px-4 py-8 text-center text-sm text-white/60">
                    En {city} todavía no hay una puerta abierta.
                  </p>
                )}
                {visible.map((party) => (
                  <button key={party.id} type="button" onClick={() => setOpenId(party.id)} className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-4 pl-5 text-left">
                    <span className={`absolute bottom-3 left-0 top-3 w-px ${party.hostKind === 'pareja' ? 'bg-[#c4a574]' : 'bg-[#d06a45]/70'}`} />
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-sway text-[1.7rem] leading-none">{party.title}</p>
                      <span className="shrink-0 rounded-full border border-white/15 px-2 py-1 text-[11px] text-white/60">
                        {spotsLeft(party) === 0 ? 'Llena' : `${spotsLeft(party)} lugares`}
                      </span>
                    </div>
                    <p className={`mt-2 text-sm ${party.hostKind === 'pareja' ? 'text-[#c4a574]' : 'text-white/75'}`}>
                      {KIND[party.hostKind]} · {party.hostName}
                    </p>
                    <p className="mt-2 flex items-center gap-1 text-sm text-white/60">
                      <MapPin className="h-3.5 w-3.5 text-[#c4a574]" />
                      {party.day} · {party.city}
                    </p>
                    <p className="mt-2 text-sm text-white/70">{forLine(party.forWhom)}</p>
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => setCreating(true)} className="mt-5 h-12 w-full rounded-2xl border border-[#c4a574]/70">
                Armar una fiesta
              </button>
              <p className="mt-3 text-center text-xs text-white/45">Armarla y pedir un lugar es gratis. SWAY no vende la entrada.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function PartyDetail({
  party,
  viewerName,
  role,
  onBack,
  onChange
}: {
  party: Party;
  viewerName: string;
  role: SwayRole;
  onBack: () => void;
  onChange: (party: Party) => void;
}) {
  const mine = party.owner === viewerName;
  const ask = requestOf(party, viewerName);
  const allowed = fitsDoor(party, role);
  const left = spotsLeft(party);
  const showAddress = seesAddress(party, viewerName);

  const requestSpot = () => {
    if (mine || ask || !allowed || left === 0) return;
    onChange({ ...party, requests: [...party.requests, { name: viewerName, status: 'pedido' }] });
  };

  const accept = (name: string) => {
    onChange({
      ...party,
      requests: party.requests.map((item) => item.name === name ? { ...item, status: 'aceptado' } : item)
    });
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-10 pt-4">
      <button type="button" onClick={onBack} className="mb-4 flex items-center gap-1 text-sm text-[#c4a574]">
        <ChevronLeft className="h-4 w-4" />
        La puerta
      </button>
      <h1 className="font-sway text-4xl">{party.title}</h1>
      <p className={`mt-2 text-sm ${party.hostKind === 'pareja' ? 'text-[#c4a574]' : 'text-white/75'}`}>
        {KIND[party.hostKind]} · {party.hostName}
      </p>
      <p className="mt-3 flex items-center gap-1 text-sm text-white/70">
        <MapPin className="h-3.5 w-3.5 text-[#c4a574]" />
        {party.day} · {party.city}
      </p>
      <p className="mt-2 text-sm text-white/70">{forLine(party.forWhom)} · {left === 0 ? 'llena' : `${left} lugares`}</p>
      {party.note && <p className="mt-4 text-sm leading-relaxed text-white/75">{party.note}</p>}

      {showAddress ? (
        <section className="mt-5 rounded-3xl border border-[#c4a574]/40 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-[#c4a574]">Dirección</p>
          <p className="mt-2 text-sm">{party.address}</p>
        </section>
      ) : (
        <p className="mt-5 text-sm leading-relaxed text-white/60">
          La dirección se queda con el anfitrión. La ves cuando acepta tu lugar.
        </p>
      )}

      {mine && (
        <section className="mt-5">
          <p className="text-sm text-white/60">Quien pidió un lugar</p>
          {party.requests.length === 0 && <p className="mt-2 text-sm text-white/45">Todavía nadie. Cuando pidan, tú aceptas.</p>}
          <div className="mt-2 space-y-2">
            {party.requests.map((item) => (
              <div key={item.name} className="flex items-center justify-between rounded-2xl border border-white/10 px-3 py-2">
                <span className="text-sm">{item.name}</span>
                {item.status === 'aceptado' ? (
                  <span className="text-xs text-[#c4a574]">Aceptado</span>
                ) : (
                  <button type="button" onClick={() => accept(item.name)} className="text-sm text-[#d06a45]">Aceptar</button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {!mine && ask?.status === 'pedido' && (
        <p className="mt-5 text-sm text-[#c4a574]">Pedido. El anfitrión decide.</p>
      )}
      {!mine && ask?.status === 'aceptado' && (
        <p className="mt-5 text-sm text-[#c4a574]">Aceptado. La dirección ya es tuya.</p>
      )}
      {!mine && !ask && !allowed && (
        <p className="mt-5 text-sm text-white/60">{forLine(party.forWhom)}. Esta puerta no es para tu cuenta.</p>
      )}
      {!mine && !ask && allowed && left === 0 && (
        <p className="mt-5 text-sm text-white/60">La puerta está llena.</p>
      )}
      {!mine && !ask && allowed && left > 0 && (
        <>
          <button type="button" onClick={requestSpot} className="sway-clay mt-5 h-12 w-full rounded-2xl">Pedir un lugar</button>
          <p className="mt-2 text-center text-xs text-white/45">Es gratis.</p>
        </>
      )}
    </div>
  );
}

function CreateParty({
  hostKind,
  viewerName,
  city,
  onBack,
  onCreate
}: {
  hostKind: HostKind;
  viewerName: string;
  city: string;
  onBack: () => void;
  onCreate: (party: Party) => void;
}) {
  const [title, setTitle] = useState('');
  const [day, setDay] = useState('');
  const [place, setPlace] = useState(city);
  const [capacity, setCapacity] = useState('8');
  const [forWhom, setForWhom] = useState<Audience[]>(hostKind === 'grupo' ? ['todos'] : ['parejas', 'mujeres']);
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [groupName, setGroupName] = useState('');
  const [error, setError] = useState('');

  const toggle = (id: Audience) => {
    if (id === 'todos') {
      setForWhom(['todos']);
      return;
    }
    const without = forWhom.filter((item) => item !== 'todos' && item !== id);
    setForWhom(forWhom.includes(id) ? without : [...without, id]);
  };

  const save = () => {
    const seats = Number(capacity);
    if (title.trim().length < 3) return setError('Ponle un nombre a la fiesta.');
    if (day.trim().length < 3) return setError('Escribe el día y la hora.');
    if (!Number.isFinite(seats) || seats < 2) return setError('El cupo empieza en 2.');
    if (!forWhom.length) return setError('Di para quién es.');
    if (address.trim().length < 6) return setError('La dirección se guarda y no se publica.');
    if (hostKind === 'grupo' && groupName.trim().length < 2) return setError('El grupo necesita un nombre.');
    setError('');
    onCreate({
      id: `fiesta-${Date.now()}`,
      title: title.trim(),
      hostKind,
      hostName: hostKind === 'grupo' ? groupName.trim() : viewerName,
      owner: viewerName,
      day: day.trim(),
      city: place.trim() || city,
      capacity: seats,
      forWhom,
      address: address.trim(),
      note: note.trim(),
      requests: []
    });
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-10 pt-4">
      <button type="button" onClick={onBack} className="mb-4 flex items-center gap-1 text-sm text-[#c4a574]">
        <ChevronLeft className="h-4 w-4" />
        Volver
      </button>
      <h1 className="font-sway text-4xl">Armar la fiesta</h1>
      <p className="mt-2 text-sm text-white/65">
        {hostKind === 'pareja' && `La arma la pareja ${viewerName}.`}
        {hostKind === 'mujer' && `La armas tú, ${viewerName}.`}
        {hostKind === 'grupo' && 'Un hombre solo la arma a nombre de un grupo.'}
      </p>
      {hostKind === 'grupo' && (
        <>
          <label className="mt-5 block text-sm text-white/60">Nombre del grupo</label>
          <input value={groupName} onChange={(event) => setGroupName(event.target.value)} className="sway-field mt-1" />
        </>
      )}
      <label className="mt-4 block text-sm text-white/60">Nombre</label>
      <input value={title} onChange={(event) => setTitle(event.target.value)} className="sway-field mt-1" />
      <label className="mt-4 block text-sm text-white/60">Día y hora</label>
      <input value={day} onChange={(event) => setDay(event.target.value)} placeholder="Sábado, 8 pm" className="sway-field mt-1" />
      <label className="mt-4 block text-sm text-white/60">Ciudad</label>
      <input value={place} onChange={(event) => setPlace(event.target.value)} className="sway-field mt-1" />
      <label className="mt-4 block text-sm text-white/60">Cupo</label>
      <input value={capacity} inputMode="numeric" onChange={(event) => setCapacity(event.target.value)} className="sway-field mt-1" />
      <p className="mt-4 text-sm text-white/60">Para quién</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {AUDIENCE.map((item) => (
          <button key={item.id} type="button" onClick={() => toggle(item.id)} className={`rounded-full border px-3 py-1.5 text-sm ${forWhom.includes(item.id) ? 'border-[#d06a45] bg-[#d06a45]/18 text-white' : 'border-white/15 text-white/70'}`}>{item.label}</button>
        ))}
      </div>
      <label className="mt-4 block text-sm text-white/60">Dirección, se queda guardada</label>
      <input value={address} onChange={(event) => setAddress(event.target.value)} className="sway-field mt-1" />
      <label className="mt-4 block text-sm text-white/60">Una línea</label>
      <input value={note} onChange={(event) => setNote(event.target.value)} className="sway-field mt-1" />
      <button type="button" onClick={save} className="sway-clay mt-6 h-12 w-full rounded-2xl">Publicar la puerta</button>
      {error && <p className="mt-3 text-sm text-[#d06a45]">{error}</p>}
    </div>
  );
}
