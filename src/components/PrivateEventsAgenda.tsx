import React, { useState } from 'react';
import {
  Calendar,
  MapPin,
  Users,
  Sparkles,
  Flame,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  PlusCircle,
  X,
  MessageCircle,
  AlertCircle,
  Lock,
  Eye,
  Filter,
  Ticket
} from 'lucide-react';
import { haptics } from '../services/hapticsService';

export interface PrivateEvent {
  id: string;
  title: string;
  hostName: string;
  isVerifiedHost: boolean;
  city: string;
  sectorZone: string;
  dateString: string;
  doorsOpen: string;
  flyerUrl: string;
  targetAudience: {
    allowCouples: boolean;
    allowSingleFemales: boolean;
    allowSingleMales: boolean;
  };
  pricingModel: {
    couplesPriceCop: number;
    singleFemalesPriceCop: number;
    singleMalesPriceCop: number | null; // null = Cupos cerrados o reserva previa
    includesDrinks: boolean;
  };
  dressCode: string;
  rules: string[];
  whatsappNumber: string;
  rsvpCount: number;
  userRsvped?: boolean;
}

const INITIAL_EVENTS: PrivateEvent[] = [
  {
    id: 'evt_01',
    title: 'Noche Mística & Antifaces • Masquerade VIP',
    hostName: 'Club Élite Nocturne',
    isVerifiedHost: true,
    city: 'Bogotá',
    sectorZone: 'Sector Norte / Chicó',
    dateString: 'Viernes 12 de Septiembre',
    doorsOpen: '9:00 PM',
    flyerUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
    targetAudience: {
      allowCouples: true,
      allowSingleFemales: true,
      allowSingleMales: false
    },
    pricingModel: {
      couplesPriceCop: 120000,
      singleFemalesPriceCop: 0,
      singleMalesPriceCop: null,
      includesDrinks: true
    },
    dressCode: 'Elegante / Antifaz Obligatorio',
    rules: ['Consentimiento Explícito', 'Teléfonos Bloqueados en Entrada', 'Reserva Previa'],
    whatsappNumber: '573001234567',
    rsvpCount: 14,
    userRsvped: true
  },
  {
    id: 'evt_02',
    title: 'Pool Party Lifestyle & Sunset Cocktails',
    hostName: 'Resort Finca Providencia',
    isVerifiedHost: true,
    city: 'Medellín',
    sectorZone: 'Sector El Poblado / Llanogrande',
    dateString: 'Sábado 13 de Septiembre',
    doorsOpen: '3:00 PM',
    flyerUrl: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80',
    targetAudience: {
      allowCouples: true,
      allowSingleFemales: true,
      allowSingleMales: true
    },
    pricingModel: {
      couplesPriceCop: 180000,
      singleFemalesPriceCop: 0,
      singleMalesPriceCop: 350000,
      includesDrinks: true
    },
    dressCode: 'Swimwear Chic / Resort Elegante',
    rules: ['Prohibidas Fotos y Videos', 'Filtro Previo para Hombres Solos', 'Cero Drogas'],
    whatsappNumber: '573109876543',
    rsvpCount: 22,
    userRsvped: false
  },
  {
    id: 'evt_03',
    title: 'Encuentro Sensorial • Soft Swap & Lounge',
    hostName: 'Anfitriones Camila & Mateo',
    isVerifiedHost: true,
    city: 'Cali',
    sectorZone: 'Sector Ciudad Jardín',
    dateString: 'Jueves 18 de Septiembre',
    doorsOpen: '8:30 PM',
    flyerUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
    targetAudience: {
      allowCouples: true,
      allowSingleFemales: true,
      allowSingleMales: false
    },
    pricingModel: {
      couplesPriceCop: 80000,
      singleFemalesPriceCop: 0,
      singleMalesPriceCop: null,
      includesDrinks: true
    },
    dressCode: 'Casual Elegante / Sensual',
    rules: ['Exclusivo Parejas y Chicas', 'Preservativo Obligatorio', 'Respeto Absoluto'],
    whatsappNumber: '573155558899',
    rsvpCount: 9,
    userRsvped: false
  }
];

export const PrivateEventsAgenda: React.FC = () => {
  const [events, setEvents] = useState<PrivateEvent[]>(INITIAL_EVENTS);
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('all');
  const [selectedAudienceFilter, setSelectedAudienceFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // New Event Form State
  const [newTitle, setNewTitle] = useState<string>('');
  const [newCity, setNewCity] = useState<string>('Bogotá');
  const [newZone, setNewZone] = useState<string>('Sector Norte');
  const [newDate, setNewDate] = useState<string>('');
  const [newDoorsOpen, setNewDoorsOpen] = useState<string>('9:00 PM');
  const [newCouplesPrice, setNewCouplesPrice] = useState<number>(100000);
  const [newSingleFemalesPrice, setNewSingleFemalesPrice] = useState<number>(0);
  const [newSingleMalesPrice, setNewSingleMalesPrice] = useState<string>('');
  const [newWhatsapp, setNewWhatsapp] = useState<string>('');

  const formatCOP = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleToggleRsvp = (eventId: string) => {
    haptics.selection();
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === eventId) {
          const nextRsvped = !e.userRsvped;
          return {
            ...e,
            userRsvped: nextRsvped,
            rsvpCount: nextRsvped ? e.rsvpCount + 1 : e.rsvpCount - 1
          };
        }
        return e;
      })
    );
  };

  const handleOpenWhatsapp = (evt: PrivateEvent) => {
    haptics.toggle();
    const text = encodeURIComponent(
      `Hola ${evt.hostName}, vi su evento "${evt.title}" en Aethel Vault y deseo solicitar reserva e información.`
    );
    window.open(`https://wa.me/${evt.whatsappNumber}?text=${text}`, '_blank');
  };

  const handleCreateEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newWhatsapp) {
      alert('Por favor completa el título y el número de WhatsApp.');
      return;
    }

    haptics.success();
    const created: PrivateEvent = {
      id: `evt_${Date.now()}`,
      title: newTitle,
      hostName: 'Mi Perfil Verificado',
      isVerifiedHost: true,
      city: newCity,
      sectorZone: newZone,
      dateString: newDate || 'Próximo Fin de Semana',
      doorsOpen: newDoorsOpen,
      flyerUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
      targetAudience: {
        allowCouples: true,
        allowSingleFemales: true,
        allowSingleMales: newSingleMalesPrice ? true : false
      },
      pricingModel: {
        couplesPriceCop: Number(newCouplesPrice),
        singleFemalesPriceCop: Number(newSingleFemalesPrice),
        singleMalesPriceCop: newSingleMalesPrice ? Number(newSingleMalesPrice) : null,
        includesDrinks: true
      },
      dressCode: 'Elegante / Dark Chic',
      rules: ['Consentimiento Obligatorio', 'Cero Cámaras', 'Reserva Previa'],
      whatsappNumber: newWhatsapp.replace(/[^0-9]/g, ''),
      rsvpCount: 1,
      userRsvped: true
    };

    setEvents([created, ...events]);
    setShowCreateModal(false);
    // Reset form
    setNewTitle('');
    setNewWhatsapp('');
  };

  const filteredEvents = events.filter((e) => {
    if (selectedCityFilter !== 'all' && e.city !== selectedCityFilter) return false;
    if (selectedAudienceFilter === 'no_males' && e.targetAudience.allowSingleMales) return false;
    if (selectedAudienceFilter === 'mixed' && !e.targetAudience.allowSingleMales) return false;
    return true;
  });

  return (
    <div className="space-y-5 max-w-4xl lg:max-w-5xl mx-auto select-none">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0a0a10] to-slate-900 border border-amber-500/20 rounded-3xl p-5 shadow-2xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>THE AGENDA • PRIVATE CIRCLES</span>
          </span>

          <button
            onClick={() => {
              haptics.selection();
              setShowCreateModal(true);
            }}
            className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center space-x-1 cursor-pointer active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Publicar Fiesta / Evento</span>
          </button>
        </div>

        <h2 className="text-xl font-black text-white">
          Eventos, Clubes y Fiestas SW Verificadas
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          Precios 100% transparentes en $ COP, protocolo de cero cobros ocultos y contacto directo vía WhatsApp con los anfitriones.
        </p>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
          <div className="flex items-center space-x-1.5 bg-black/50 px-3 py-1.5 rounded-xl border border-white/10 text-xs">
            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <select
              value={selectedCityFilter}
              onChange={(e) => setSelectedCityFilter(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none w-full text-xs cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-white">Todas las Ciudades</option>
              <option value="Bogotá" className="bg-slate-900 text-white">Bogotá y Alrededores</option>
              <option value="Medellín" className="bg-slate-900 text-white">Medellín y Aburrá</option>
              <option value="Cali" className="bg-slate-900 text-white">Cali</option>
              <option value="Bucaramanga" className="bg-slate-900 text-white">Bucaramanga</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5 bg-black/50 px-3 py-1.5 rounded-xl border border-white/10 text-xs">
            <Filter className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <select
              value={selectedAudienceFilter}
              onChange={(e) => setSelectedAudienceFilter(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none w-full text-xs cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-white">Toda Audiencia</option>
              <option value="no_males" className="bg-slate-900 text-white">Solo Parejas + Chicas</option>
              <option value="mixed" className="bg-slate-900 text-white">Mixto (Con Reserva Bulls)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events Feed List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredEvents.map((evt) => (
          <div
            key={evt.id}
            className="bg-[#09090f] border border-white/10 rounded-3xl overflow-hidden shadow-2xl hover:border-amber-500/30 transition-all group"
          >
            {/* Header Image Poster */}
            <div className="relative h-48 w-full overflow-hidden bg-slate-950">
              <img
                src={evt.flyerUrl}
                alt={evt.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#09090f] via-[#09090f]/40 to-black/60" />

              {/* Host Badge */}
              <div className="absolute top-3 left-3 flex items-center space-x-1.5 px-3 py-1 bg-black/70 backdrop-blur-md rounded-full border border-amber-500/30 text-amber-300 font-mono text-[11px] font-bold">
                {evt.isVerifiedHost && <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />}
                <span>{evt.hostName}</span>
              </div>

              {/* Date Badge */}
              <div className="absolute top-3 right-3 px-3 py-1 bg-amber-500/90 text-slate-950 rounded-full font-mono text-[11px] font-black shadow-lg">
                {evt.doorsOpen}
              </div>

              {/* Title & Zone Overlay */}
              <div className="absolute bottom-3 left-3 right-3 space-y-1">
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
                  {evt.city} • {evt.sectorZone}
                </span>
                <h3 className="text-lg font-black text-white leading-tight drop-shadow-md">
                  {evt.title}
                </h3>
                <span className="text-xs text-slate-300 font-medium block">
                  🗓️ {evt.dateString}
                </span>
              </div>
            </div>

            {/* Event Body Details */}
            <div className="p-4 space-y-3">
              {/* Audience Badges */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Users className="w-3 h-3 text-emerald-400" />
                  <span>Parejas Permitidas</span>
                </span>

                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-purple-950/80 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span>Chicas Solas (Free)</span>
                </span>

                {evt.targetAudience.allowSingleMales ? (
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-amber-950/80 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-400" />
                    <span>Bulls Con Reserva</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-900 text-slate-400 border border-white/10 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>Sin Hombres Solos</span>
                  </span>
                )}
              </div>

              {/* Transparent Pricing Matrix Grid */}
              <div className="bg-black/40 border border-white/5 rounded-2xl p-3 grid grid-cols-3 gap-2 text-center">
                <div className="p-1.5 rounded-xl bg-slate-900/80">
                  <span className="text-[9px] font-mono text-slate-400 uppercase font-bold block">Pareja</span>
                  <span className="text-xs font-black text-amber-300 font-mono">
                    {formatCOP(evt.pricingModel.couplesPriceCop)}
                  </span>
                </div>

                <div className="p-1.5 rounded-xl bg-slate-900/80">
                  <span className="text-[9px] font-mono text-slate-400 uppercase font-bold block">Chica Sola</span>
                  <span className="text-xs font-black text-emerald-400 font-mono">FREE PASS</span>
                </div>

                <div className="p-1.5 rounded-xl bg-slate-900/80">
                  <span className="text-[9px] font-mono text-slate-400 uppercase font-bold block">Hombre Solo</span>
                  <span className="text-xs font-black font-mono text-amber-400">
                    {evt.pricingModel.singleMalesPriceCop
                      ? formatCOP(evt.pricingModel.singleMalesPriceCop)
                      : 'Cupo Cerrado'}
                  </span>
                </div>
              </div>

              {/* Rules & Dress Code Chips */}
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-slate-400">
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-white/10 text-slate-300">
                  👔 {evt.dressCode}
                </span>
                {evt.rules.map((rule, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-slate-900 border border-white/10">
                    • {rule}
                  </span>
                ))}
              </div>

              {/* Action Buttons Row */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                <button
                  onClick={() => handleToggleRsvp(evt.id)}
                  className={`py-2.5 px-3 rounded-2xl font-bold text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95 ${
                    evt.userRsvped
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50 shadow-lg'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{evt.userRsvped ? 'Asistiré con mi Pareja' : 'Confirmar Asistencia'} ({evt.rsvpCount})</span>
                </button>

                <button
                  onClick={() => handleOpenWhatsapp(evt)}
                  className="py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-2xl shadow-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95"
                >
                  <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
                  <span>Reservar por WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal to Create Event */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0e0e14] border border-amber-500/30 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                Publicar Nuevo Evento / Fiesta SW
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white bg-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEventSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Nombre del Evento o Club</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Masquerade Night VIP"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Ciudad</label>
                  <select
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                  >
                    <option value="Bogotá">Bogotá</option>
                    <option value="Medellín">Medellín</option>
                    <option value="Cali">Cali</option>
                    <option value="Bucaramanga">Bucaramanga</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Sector / Zona</label>
                  <input
                    type="text"
                    placeholder="ej. Norte / Chicó"
                    value={newZone}
                    onChange={(e) => setNewZone(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Fecha</label>
                  <input
                    type="text"
                    placeholder="ej. Viernes 19 de Sept"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Hora de Apertura</label>
                  <input
                    type="text"
                    placeholder="ej. 9:00 PM"
                    value={newDoorsOpen}
                    onChange={(e) => setNewDoorsOpen(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Precio Pareja ($ COP)</label>
                  <input
                    type="number"
                    value={newCouplesPrice}
                    onChange={(e) => setNewCouplesPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Precio Hombre Solo ($ COP)</label>
                  <input
                    type="number"
                    placeholder="Dejar vacío si cupo cerrado"
                    value={newSingleMalesPrice}
                    onChange={(e) => setNewSingleMalesPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">WhatsApp para Reservas</label>
                <input
                  type="text"
                  required
                  placeholder="ej. 573001234567"
                  value={newWhatsapp}
                  onChange={(e) => setNewWhatsapp(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-xl transition-all cursor-pointer"
                >
                  Publicar Evento Gratis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
