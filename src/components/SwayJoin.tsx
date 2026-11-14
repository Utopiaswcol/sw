import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import type { SwayAccount, SwayRole } from '../sway/account';

const CITIES = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla'];
const SEEKS = ['Pareja', 'Mujer', 'Hombre'];
const TASTES = ['Cena', 'Viaje', 'Arte', 'Música', 'Charla'];

interface SwayJoinProps {
  onDone: (account: SwayAccount) => void;
  onBack: () => void;
}

export const SwayJoin: React.FC<SwayJoinProps> = ({ onDone, onBack }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [role, setRole] = useState<SwayRole | null>(null);
  const [name, setName] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [age, setAge] = useState('');
  const [partnerAge, setPartnerAge] = useState('');
  const [city, setCity] = useState('Bogotá');
  const [seeks, setSeeks] = useState<string[]>([]);
  const [tastes, setTastes] = useState<string[]>([]);
  const [photo, setPhoto] = useState('');
  const [error, setError] = useState('');

  const toggle = (list: string[], value: string, set: (next: string[]) => void, max = 3) => {
    set(list.includes(value) ? list.filter((item) => item !== value) : list.length >= max ? list : [...list, value]);
  };

  const readPhoto = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const size = 480;
        const scale = Math.min(1, size / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
        setPhoto(canvas.toDataURL('image/jpeg', 0.72));
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  };

  const finish = () => {
    if (!role) return;
    const years = Number(age);
    const partnerYears = Number(partnerAge);
    if (name.trim().length < 2) return setError('Escribe el nombre.');
    if (!Number.isFinite(years) || years < 18) return setError('La edad empieza en 18.');
    if (role === 'couple' && (partnerName.trim().length < 2 || !Number.isFinite(partnerYears) || partnerYears < 18)) {
      return setError('La pareja también necesita nombre y 18 años o más.');
    }
    if (!seeks.length) return setError('Elige a quién buscan.');
    setError('');
    onDone({
      role,
      name: name.trim(),
      partnerName: partnerName.trim(),
      city,
      age,
      partnerAge,
      seeks,
      tastes,
      photo
    });
  };

  return (
    <div className="flex h-dvh flex-col bg-black px-5 py-6 text-white">
      <button type="button" onClick={step === 1 ? onBack : () => setStep((step - 1) as 1 | 2)} className="mb-6 flex items-center gap-1 text-sm text-[#c4a574]">
        <ChevronLeft className="h-4 w-4" />
        Volver
      </button>
      {step === 1 && (
        <>
          <h1 className="font-sway text-5xl">¿Quién entra?</h1>
          <p className="mt-2 text-sm text-white/65">La cuenta es de una persona o de una pareja. Bogotá es el primer cuarto.</p>
          <div className="mt-8 space-y-3">
            {([
              ['solo_male', 'Hombre'],
              ['solo_female', 'Mujer'],
              ['couple', 'Pareja']
            ] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => { setRole(id); setStep(2); }}
                className="h-14 w-full rounded-2xl border border-[#c4a574]/50 text-lg"
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}
      {step === 2 && role && (
        <>
          <h1 className="font-sway text-5xl">{role === 'couple' ? 'La pareja' : 'Tu cuenta'}</h1>
          <label className="mt-6 block text-sm text-white/60">{role === 'couple' ? 'Un nombre' : 'Nombre'}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="sway-field mt-1" />
          <label className="mt-4 block text-sm text-white/60">Edad</label>
          <input value={age} inputMode="numeric" onChange={(e) => setAge(e.target.value)} className="sway-field mt-1" />
          {role === 'couple' && (
            <>
              <label className="mt-4 block text-sm text-white/60">El otro nombre</label>
              <input value={partnerName} onChange={(e) => setPartnerName(e.target.value)} className="sway-field mt-1" />
              <label className="mt-4 block text-sm text-white/60">Edad</label>
              <input value={partnerAge} inputMode="numeric" onChange={(e) => setPartnerAge(e.target.value)} className="sway-field mt-1" />
            </>
          )}
          <p className="mt-4 text-sm text-white/60">Ciudad</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {CITIES.map((item) => (
              <button key={item} type="button" onClick={() => setCity(item)} className={`rounded-full border px-3 py-1.5 text-sm ${city === item ? 'border-[#d06a45] bg-[#d06a45]/18 text-white' : 'border-white/15 text-white/70'}`}>{item}</button>
            ))}
          </div>
          <p className="mt-4 text-sm text-white/60">Buscan</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {SEEKS.map((item) => (
              <button key={item} type="button" onClick={() => toggle(seeks, item, setSeeks)} className={`rounded-full border px-3 py-1.5 text-sm ${seeks.includes(item) ? 'border-[#d06a45] bg-[#d06a45]/18 text-white' : 'border-white/15 text-white/70'}`}>{item}</button>
            ))}
          </div>
          <button type="button" onClick={() => seeks.length ? setStep(3) : setError('Elige a quién buscan.')} className="sway-clay mt-8 h-12 w-full rounded-2xl">Seguir</button>
          {error && <p className="mt-3 text-sm text-[#d06a45]">{error}</p>}
        </>
      )}
      {step === 3 && (
        <>
          <h1 className="font-sway text-5xl">El estilo</h1>
          <p className="mt-2 text-sm text-white/65">Hasta tres. La foto es tuya y se queda en este teléfono.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {TASTES.map((item) => (
              <button key={item} type="button" onClick={() => toggle(tastes, item, setTastes)} className={`rounded-full border px-3 py-1.5 text-sm ${tastes.includes(item) ? 'border-[#d06a45] bg-[#d06a45]/18 text-white' : 'border-white/15 text-white/70'}`}>{item}</button>
            ))}
          </div>
          <label className="mt-6 block text-sm text-white/60">Foto</label>
          <input type="file" accept="image/*" className="mt-2 text-sm" onChange={(e) => { const file = e.target.files?.[0]; if (file) readPhoto(file); }} />
          {photo && <img src={photo} alt="" className="mt-3 h-20 w-20 rounded-full object-cover" />}
          <button type="button" onClick={finish} className="sway-clay mt-8 h-12 w-full rounded-2xl">Entrar a SWAY</button>
          {error && <p className="mt-3 text-sm text-[#d06a45]">{error}</p>}
        </>
      )}
    </div>
  );
};
