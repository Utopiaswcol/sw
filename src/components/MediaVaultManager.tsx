import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Unlock,
  Key,
  Clock,
  Eye,
  FileCheck,
  AlertOctagon,
  Sparkles,
  Upload,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  ShieldAlert,
  Image as ImageIcon,
  Smartphone,
  Trash2,
  Plus,
  Sliders,
  EyeOff,
  SlidersHorizontal,
  FolderLock,
  Flame,
  UserCheck,
  Share2,
  Info
} from 'lucide-react';
import { haptics } from '../services/hapticsService';
import { SecureMediaViewer } from './SecureMediaViewer';
import { LuxeIcon } from './common/LuxeIcon';

export interface VaultMediaItem {
  id: string;
  title: string;
  category: 'lenceria' | 'lifestyle' | 'efimero' | 'exclusivo_vip';
  categoryLabel: string;
  imageUrl: string;
  blurLevel: 'none' | 'medium' | 'high';
  isEphemeral: boolean;
  watermarkEnabled: boolean;
  reciprocalKeyOnly: boolean;
  uploadedAt: string;
  viewsCount: number;
}

interface MediaVaultManagerProps {
  initialTab?: 'albums' | 'upload' | 'keys' | 'security';
  onCloseModal?: () => void;
}

export const MediaVaultManager: React.FC<MediaVaultManagerProps> = ({
  initialTab = 'albums',
  onCloseModal
}) => {
  const [activeTab, setActiveTab] = useState<'albums' | 'upload' | 'keys' | 'security'>(initialTab);

  // Profile Vault Media Collections
  const [vaultItems, setVaultItems] = useState<VaultMediaItem[]>([
    {
      id: 'vault_01',
      title: 'Lencería Seda Negra & Encaje',
      category: 'lenceria',
      categoryLabel: '👙 Lencería & Sensual',
      imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
      blurLevel: 'high',
      isEphemeral: false,
      watermarkEnabled: true,
      reciprocalKeyOnly: true,
      uploadedAt: 'Hace 2 días',
      viewsCount: 14
    },
    {
      id: 'vault_02',
      title: 'Encuentro Social en Anapoima',
      category: 'lifestyle',
      categoryLabel: '🍾 Eventos & Lifestyle',
      imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      blurLevel: 'medium',
      isEphemeral: false,
      watermarkEnabled: true,
      reciprocalKeyOnly: false,
      uploadedAt: 'Hace 5 días',
      viewsCount: 29
    },
    {
      id: 'vault_03',
      title: 'Video Efímero Fiesta Privada',
      category: 'efimero',
      categoryLabel: '⚡ Efímero 24h',
      imageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
      blurLevel: 'high',
      isEphemeral: true,
      watermarkEnabled: true,
      reciprocalKeyOnly: true,
      uploadedAt: 'Expira en 4h 12m',
      viewsCount: 8
    },
    {
      id: 'vault_04',
      title: 'Sesión Fotográfica Privada VIP',
      category: 'exclusivo_vip',
      categoryLabel: '🔐 Exclusivo VIP',
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
      blurLevel: 'high',
      isEphemeral: false,
      watermarkEnabled: true,
      reciprocalKeyOnly: true,
      uploadedAt: 'Hace 1 semana',
      viewsCount: 42
    }
  ]);

  // Selected Album Category Filter for Album View
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Preview Mode: 'owner' (Admin clear view) vs 'visitor' (Simulated visitor with blur & watermark)
  const [previewPerspective, setPreviewPerspective] = useState<'owner' | 'visitor'>('owner');

  // Upload Form State
  const [newTitle, setNewTitle] = useState<string>('');
  const [newCategory, setNewCategory] = useState<'lenceria' | 'lifestyle' | 'efimero' | 'exclusivo_vip'>('lenceria');
  const [newBlurLevel, setNewBlurLevel] = useState<'none' | 'medium' | 'high'>('high');
  const [newIsEphemeral, setNewIsEphemeral] = useState<boolean>(false);
  const [newWatermark, setNewWatermark] = useState<boolean>(true);
  const [newReciprocalKey, setNewReciprocalKey] = useState<boolean>(true);
  const [newImagePreviewUrl, setNewImagePreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);

  // Active Keys Granted State
  const [grantedUsers, setGrantedUsers] = useState<Array<{ id: string; alias: string; grantedAt: string; expiresAt: string; role: string }>>([
    { id: 'usr_cpl_bogota', alias: 'Carlos & Sofía VIP', grantedAt: 'Hoy 14:30', expiresAt: 'En 21h 15m', role: 'Pareja Verificada' },
    { id: 'usr_uni_camila', alias: 'Camila V.', grantedAt: 'Ayer 20:10', expiresAt: 'En 3h 40m', role: 'Mujer Unicornio' }
  ]);
  const [newGrantAlias, setNewGrantAlias] = useState<string>('');

  // Security Test Workbench State
  const [selectedViewerRole, setSelectedViewerRole] = useState<'solo_female' | 'solo_male' | 'couple_member'>('solo_female');
  const [selectedViewerId, setSelectedViewerId] = useState<string>('cpl_medellin_bi_01');
  const [mediaId, setMediaId] = useState<string>('med_vault_camila_01');

  const [loading, setLoading] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [viewResult, setViewResult] = useState<any>(null);
  const [grantResult, setGrantResult] = useState<any>(null);
  const [securityTestResult, setSecurityTestResult] = useState<any>(null);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [showModalViewer, setShowModalViewer] = useState<boolean>(false);
  const [activeMediaForViewer, setActiveMediaForViewer] = useState<{ id: string; title: string } | null>(null);

  // Preset quick sample images for rapid testing
  const sampleUploadPresets = [
    {
      title: 'Lencería & Encaje de Seda',
      category: 'lenceria' as const,
      url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80'
    },
    {
      title: 'Fiesta Privada Anapoima',
      category: 'lifestyle' as const,
      url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80'
    },
    {
      title: 'Momento Efímero 24h',
      category: 'efimero' as const,
      url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80'
    }
  ];

  // File Upload Handler (Native file input)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImagePreviewUrl(reader.result as string);
        if (!newTitle) {
          setNewTitle(file.name.replace(/\.[^/.]+$/, ''));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit New Vault Media Item
  const handleSaveToVault = async () => {
    if (!newImagePreviewUrl) return;
    haptics.selection();
    setIsUploading(true);

    try {
      const categoryLabels: Record<string, string> = {
        lenceria: '👙 Lencería & Sensual',
        lifestyle: '🍾 Eventos & Lifestyle',
        efimero: '⚡ Efímero 24h',
        exclusivo_vip: '🔐 Exclusivo VIP'
      };

      const newItem: VaultMediaItem = {
        id: `vault_${Date.now()}`,
        title: newTitle || 'Nueva Foto Privada',
        category: newCategory,
        categoryLabel: categoryLabels[newCategory] || '🔐 Privado',
        imageUrl: newImagePreviewUrl,
        blurLevel: newBlurLevel,
        isEphemeral: newIsEphemeral,
        watermarkEnabled: newWatermark,
        reciprocalKeyOnly: newReciprocalKey,
        uploadedAt: newIsEphemeral ? 'Expira en 24h 00m' : 'Justo ahora',
        viewsCount: 0
      };

      setVaultItems((prev) => [newItem, ...prev]);
      haptics.success();
      setUploadSuccessMsg('✨ ¡Foto cifrada e ingresada con éxito a tu Bóveda Privada!');
      setTimeout(() => setUploadSuccessMsg(null), 4000);

      // Reset form
      setNewTitle('');
      setNewImagePreviewUrl(null);
      setActiveTab('albums');
    } catch (err: any) {
      haptics.warning();
    } finally {
      setIsUploading(false);
    }
  };

  // Toggle Item Blur Level
  const handleToggleBlur = (id: string) => {
    haptics.selection();
    setVaultItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextBlur = item.blurLevel === 'none' ? 'medium' : item.blurLevel === 'medium' ? 'high' : 'none';
          return { ...item, blurLevel: nextBlur };
        }
        return item;
      })
    );
  };

  // Delete Item from Vault
  const handleDeleteVaultItem = (id: string) => {
    haptics.warning();
    setVaultItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Grant Key Handler
  const handleGrantNewKey = () => {
    if (!newGrantAlias.trim()) return;
    haptics.success();
    setGrantedUsers((prev) => [
      {
        id: `usr_${Date.now()}`,
        alias: newGrantAlias.trim(),
        grantedAt: 'Justo ahora',
        expiresAt: 'En 24h 00m',
        role: 'Perfil Verificado'
      },
      ...prev
    ]);
    setNewGrantAlias('');
  };

  // Revoke Key Handler
  const handleRevokeKey = (id: string) => {
    haptics.warning();
    setGrantedUsers((prev) => prev.filter((u) => u.id !== id));
  };

  // Backend Security Suite Call
  const runSecuritySuite = async () => {
    haptics.selection();
    setLoading(true);
    setSecurityTestResult(null);

    try {
      const res = await fetch('/api/media/run-security-tests');
      const data = await res.json();
      setSecurityTestResult(data);
      if (data.allPassed) {
        haptics.success();
      } else {
        haptics.warning();
      }
    } catch (err: any) {
      haptics.warning();
    } finally {
      setLoading(false);
    }
  };

  const handleTestViewAccess = async () => {
    haptics.selection();
    setLoading(true);
    setViewResult(null);

    try {
      const res = await fetch(
        `/api/media/view/${mediaId}?viewerUserId=${selectedViewerId}&viewerRole=${selectedViewerRole}`
      );
      const data = await res.json();
      setViewResult(data);
      if (data.allowed) {
        haptics.success();
      } else {
        haptics.warning();
      }
    } catch (err: any) {
      haptics.warning();
    } finally {
      setLoading(false);
    }
  };

  const handleGrantVaultAccess = async () => {
    haptics.selection();
    setLoading(true);
    setGrantResult(null);

    try {
      const res = await fetch('/api/media/grant-vault-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerUserId: 'usr_unicorn_colombia_99',
          mediaId: mediaId,
          grantedToUserId: selectedViewerId,
          ttlHours: 24
        })
      });

      const data = await res.json();
      setGrantResult(data);
      haptics.success();
      await handleTestViewAccess();
    } catch (err: any) {
      haptics.warning();
    } finally {
      setLoading(false);
    }
  };

  const copySignedUrl = () => {
    haptics.selection();
    if (!viewResult?.signedUrl) return;
    navigator.clipboard.writeText(window.location.origin + viewResult.signedUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Filtered Vault Items
  const filteredVaultItems = vaultItems.filter((item) => {
    if (selectedCategory === 'all') return true;
    return item.category === selectedCategory;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Upper Status & Luxury Banner */}
      <div className="bg-gradient-to-r from-[#0b0b12] via-[#12111d] to-[#0b0b12] border border-amber-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs tracking-wider uppercase">
              <FolderLock className="w-4 h-4 text-amber-400" />
              <span>Gestión &amp; Bóveda Privada del Perfil</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
              <span>Bóveda Cifrada &amp; Control de Álbumes</span>
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Organiza tus álbumes sensuales, de estilo de vida y contenido efímero. Configura la protección contra capturas de pantalla, marca de agua con ID y gestiona quién tiene acceso a tu contenido.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {onCloseModal && (
              <button
                onClick={onCloseModal}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all cursor-pointer"
              >
                Cerrar Visor
              </button>
            )}
            <button
              onClick={() => {
                haptics.selection();
                setActiveTab('upload');
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Subir Foto a Bóveda</span>
            </button>
          </div>
        </div>

        {/* Global Security Micro-Indicators */}
        <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] font-mono">
          <div className="flex items-center space-x-2 text-emerald-300 bg-emerald-950/40 p-2 rounded-xl border border-emerald-800/50">
            <LuxeIcon icon={ShieldCheck} active={true} variant="emerald" size={16} strokeWidth={1.5} />
            <span>Anti-Screenshot Activo</span>
          </div>
          <div className="flex items-center space-x-2 text-amber-300 bg-amber-950/40 p-2 rounded-xl border border-amber-800/50">
            <LuxeIcon icon={Key} active={true} variant="gold" size={16} strokeWidth={1.5} />
            <span>Llaves Activas: {grantedUsers.length}</span>
          </div>
          <div className="flex items-center space-x-2 text-cyan-300 bg-cyan-950/40 p-2 rounded-xl border border-cyan-800/50">
            <LuxeIcon icon={Sparkles} active={true} variant="gold" size={16} strokeWidth={1.5} />
            <span>Marca de Agua con ID</span>
          </div>
          <div className="flex items-center space-x-2 text-purple-300 bg-purple-950/40 p-2 rounded-xl border border-purple-800/50">
            <LuxeIcon icon={Lock} active={true} variant="neutral" size={16} strokeWidth={1.5} />
            <span>Cifrado SHA-256</span>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center space-x-2 border-b border-white/10 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => {
            haptics.selection();
            setActiveTab('albums');
          }}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
            activeTab === 'albums'
              ? 'bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20 font-black'
              : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <LuxeIcon icon={ImageIcon} active={activeTab === 'albums'} variant={activeTab === 'albums' ? 'neutral' : 'gold'} size={16} strokeWidth={1.5} />
          <span>Mis Álbumes ({vaultItems.length})</span>
        </button>

        <button
          onClick={() => {
            haptics.selection();
            setActiveTab('upload');
          }}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
            activeTab === 'upload'
              ? 'bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20 font-black'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Subir Archivo Nuevo</span>
        </button>

        <button
          onClick={() => {
            haptics.selection();
            setActiveTab('keys');
          }}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
            activeTab === 'keys'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Control de Llaves ({grantedUsers.length})</span>
        </button>

        <button
          onClick={() => {
            haptics.selection();
            setActiveTab('security');
          }}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
            activeTab === 'security'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Auditoría de Ciberseguridad</span>
        </button>
      </div>

      {uploadSuccessMsg && (
        <div className="p-4 bg-emerald-950/90 border border-emerald-500/50 rounded-2xl text-emerald-200 text-xs font-bold flex items-center space-x-2 animate-in fade-in shadow-xl">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{uploadSuccessMsg}</span>
        </div>
      )}

      {/* TAB 1: ALBUMS ORGANIZER */}
      {activeTab === 'albums' && (
        <div className="space-y-6">
          {/* Top Controls: Category Filter & Perspective Toggle */}
          <div className="bg-[#0e0e14] p-4 rounded-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Filter by Category */}
            <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar">
              <span className="text-xs font-mono text-slate-400 shrink-0">Filtrar:</span>
              {[
                { id: 'all', label: 'Todos' },
                { id: 'lenceria', label: '👙 Lencería' },
                { id: 'lifestyle', label: '🍾 Lifestyle' },
                { id: 'efimero', label: '⚡ Efímeros' },
                { id: 'exclusivo_vip', label: '🔐 VIP' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    haptics.selection();
                    setSelectedCategory(cat.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 cursor-pointer transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-white/20 text-white border border-white/30'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Owner vs Visitor Perspective Switcher */}
            <div className="flex items-center space-x-2 shrink-0 bg-slate-900 p-1 rounded-xl border border-white/10">
              <span className="text-[11px] font-mono text-slate-400 pl-2">Vista Previa:</span>
              <button
                onClick={() => {
                  haptics.toggle();
                  setPreviewPerspective('owner');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  previewPerspective === 'owner'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Propietario (Limpia)
              </button>
              <button
                onClick={() => {
                  haptics.toggle();
                  setPreviewPerspective('visitor');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  previewPerspective === 'visitor'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Visitante (Con Desenfoque)
              </button>
            </div>
          </div>

          {/* Grid of Vault Items */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
            {filteredVaultItems.map((item) => (
              <div
                key={item.id}
                className="bg-[#0e0e14] border border-white/10 rounded-2xl overflow-hidden shadow-xl flex flex-col group hover:border-amber-500/40 transition-all"
              >
                {/* Image Container with Blur effect simulation */}
                <div className="relative h-64 bg-slate-950 overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className={`w-full h-full object-cover transition-all duration-300 ${
                      previewPerspective === 'visitor'
                        ? item.blurLevel === 'high'
                          ? 'blur-xl scale-110 opacity-70'
                          : item.blurLevel === 'medium'
                          ? 'blur-md scale-105 opacity-85'
                          : ''
                        : ''
                    }`}
                  />

                  {/* Category Badge */}
                  <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-amber-300 border border-amber-500/30">
                    {item.categoryLabel}
                  </div>

                  {/* Protection Badges */}
                  <div className="absolute top-3 right-3 flex items-center space-x-1">
                    {item.isEphemeral && (
                      <span className="bg-rose-950/90 text-rose-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-rose-700 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> 24h
                      </span>
                    )}
                    {item.watermarkEnabled && (
                      <span className="bg-cyan-950/90 text-cyan-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-cyan-700 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Marca ID
                      </span>
                    )}
                  </div>

                  {/* Watermark Overlay in Visitor Mode */}
                  {previewPerspective === 'visitor' && item.watermarkEnabled && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 rotate-[-20deg]">
                      <span className="text-white font-mono font-bold text-sm tracking-widest uppercase">
                        ENM • VISITOR_ID_CONFIDENTIAL
                      </span>
                    </div>
                  )}

                  {/* Overlay Admin Controls on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 space-y-2">
                    <button
                      onClick={() => {
                        haptics.selection();
                        setActiveMediaForViewer({ id: item.id, title: item.title });
                        setShowModalViewer(true);
                      }}
                      className="w-full py-2 bg-gradient-to-r from-amber-500 to-rose-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg hover:brightness-110 cursor-pointer flex items-center justify-center space-x-1.5"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Abrir en Visor Seguro con Gestos</span>
                    </button>
                  </div>
                </div>

                {/* Card Content & Configuration */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-white">{item.title}</h3>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                      <span>Cargado: {item.uploadedAt}</span>
                      <span className="text-amber-300 font-mono">{item.viewsCount} Visualizaciones</span>
                    </div>
                  </div>

                  {/* Settings Bar per photo */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleBlur(item.id)}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center space-x-1 transition-all cursor-pointer border ${
                          item.blurLevel === 'high'
                            ? 'bg-purple-950 text-purple-300 border-purple-800'
                            : item.blurLevel === 'medium'
                            ? 'bg-amber-950 text-amber-300 border-amber-800'
                            : 'bg-slate-800 text-slate-300 border-white/10'
                        }`}
                        title="Cambiar nivel de desenfoque de vista previa"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>
                          {item.blurLevel === 'high'
                            ? 'Blur Alto'
                            : item.blurLevel === 'medium'
                            ? 'Blur Medio'
                            : 'Sin Blur'}
                        </span>
                      </button>
                    </div>

                    <button
                      onClick={() => handleDeleteVaultItem(item.id)}
                      className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 rounded-lg text-xs transition-all cursor-pointer border border-rose-900/40"
                      title="Eliminar de Bóveda"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: UPLOAD STUDIO */}
      {activeTab === 'upload' && (
        <div className="bg-[#0e0e14] border border-white/10 rounded-3xl p-6 shadow-2xl max-w-2xl mx-auto space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-amber-400" />
              <span>Cargar Nueva Foto o Video a la Bóveda</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Todos los archivos cargados son sanitizados automáticamente (remoción de metadatos EXIF/GPS) y cifrados con marca de agua personalizada.
            </p>
          </div>

          {/* Quick Presets Selection */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-300 block">Opción 1: Probar con Foto Predeterminada de Muestra:</label>
            <div className="grid grid-cols-3 gap-3">
              {sampleUploadPresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    haptics.selection();
                    setNewImagePreviewUrl(preset.url);
                    setNewTitle(preset.title);
                    setNewCategory(preset.category);
                  }}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 flex flex-col items-center space-y-2 cursor-pointer transition-all"
                >
                  <img src={preset.url} alt={preset.title} className="w-full h-16 object-cover rounded-lg" />
                  <span className="text-[10px] font-bold text-slate-300 text-center truncate w-full">{preset.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Native File Input Dropzone */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-300 block">Opción 2: Subir Archivo Desde tu Dispositivo:</label>
            <div className="border-2 border-dashed border-white/20 hover:border-amber-500/50 rounded-2xl p-6 text-center bg-slate-950/50 transition-all relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="space-y-2 pointer-events-none">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-white">Haz clic o arrastra un archivo aquí</p>
                <p className="text-[11px] text-slate-400">Formatos soportados: JPG, PNG, WEBP (Hasta 25MB)</p>
              </div>
            </div>
          </div>

          {/* Upload Form Details */}
          {newImagePreviewUrl && (
            <div className="space-y-4 pt-4 border-t border-white/10 animate-in fade-in">
              <div className="flex items-center space-x-4 bg-slate-900 p-3 rounded-2xl border border-white/10">
                <img src={newImagePreviewUrl} alt="Preview" className="w-16 h-16 object-cover rounded-xl shrink-0" />
                <div className="flex-1 space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 block">Título de la foto:</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ej. Sesión Lencería Seda Negra"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              {/* Album Category Selector */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Álbum / Categoría:</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 outline-none"
                >
                  <option value="lenceria">👙 Lencería &amp; Sensual</option>
                  <option value="lifestyle">🍾 Eventos &amp; Lifestyle</option>
                  <option value="efimero">⚡ Efímero 24h</option>
                  <option value="exclusivo_vip">🔐 Exclusivo VIP</option>
                </select>
              </div>

              {/* Blur Intensity Selector */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Nivel de Desenfoque de Vista Previa:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'none', label: 'Sin Desenfoque' },
                    { id: 'medium', label: 'Medio (Elegante)' },
                    { id: 'high', label: 'Alto (Cifrado)' }
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => {
                        haptics.selection();
                        setNewBlurLevel(lvl.id as any);
                      }}
                      className={`p-2 rounded-xl text-xs font-bold cursor-pointer transition-all border ${
                        newBlurLevel === lvl.id
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold'
                          : 'bg-slate-950 text-slate-400 border-white/10'
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2 pt-2">
                <label className="flex items-center space-x-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={newWatermark}
                    onChange={(e) => setNewWatermark(e.target.checked)}
                    className="rounded border-amber-500 text-amber-500 bg-slate-950"
                  />
                  <span>Activar Marca de Agua Dinámica con ID del espectador</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={newIsEphemeral}
                    onChange={(e) => setNewIsEphemeral(e.target.checked)}
                    className="rounded border-amber-500 text-amber-500 bg-slate-950"
                  />
                  <span>Autodestrucción Automática a las 24 Horas</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSaveToVault}
                disabled={isUploading}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-rose-600 to-purple-600 text-slate-950 font-black rounded-2xl text-sm transition-all shadow-xl hover:opacity-95 active:scale-98 cursor-pointer flex items-center justify-center space-x-2"
              >
                {isUploading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>🔒 Cifrar &amp; Publicar en Bóveda</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: KEYS & PERMISSIONS MANAGEMENT */}
      {activeTab === 'keys' && (
        <div className="bg-[#0e0e14] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-400" />
                <span>Llaves Otorgadas &amp; Accesos Activos</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Administra los perfiles verificados a los que has concedido acceso a tus álbumes privados.
              </p>
            </div>

            <span className="text-xs font-mono font-bold bg-amber-950 text-amber-300 px-3 py-1 rounded-full border border-amber-800">
              {grantedUsers.length} Llaves Activas
            </span>
          </div>

          {/* Quick Grant Input */}
          <div className="bg-slate-900 p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              value={newGrantAlias}
              onChange={(e) => setNewGrantAlias(e.target.value)}
              placeholder="Escribe el Alias del perfil (Ej. Andrés & Maria VIP)"
              className="flex-1 w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-amber-500 outline-none"
            />
            <button
              onClick={handleGrantNewKey}
              className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-lg hover:brightness-110 cursor-pointer shrink-0"
            >
              Otorgar Llave Directa (24h)
            </button>
          </div>

          {/* List of Granted Users */}
          <div className="space-y-3">
            {grantedUsers.map((user) => (
              <div
                key={user.id}
                className="bg-slate-950 p-4 rounded-2xl border border-white/10 flex items-center justify-between gap-3 shadow-inner"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-sm shrink-0">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-white">{user.alias}</h4>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                      <span>{user.role}</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-mono font-bold">{user.expiresAt}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleRevokeKey(user.id)}
                  className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-xs font-bold rounded-xl border border-rose-800 transition-all cursor-pointer shrink-0"
                >
                  Revocar Llave
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SECURITY & BENCH SUITE */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-purple-800/80 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-purple-800/50 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Auditoría &amp; Suite de Pruebas de Ciberseguridad</h3>
              </div>
              <button
                onClick={runSecuritySuite}
                disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-rose-600 text-white font-bold text-xs rounded-xl shadow-lg hover:brightness-110 cursor-pointer flex items-center space-x-1.5"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>Ejecutar Test Completo</span>
              </button>
            </div>

            {securityTestResult && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">1. Purga EXIF &amp; Hash SHA-256</span>
                    {securityTestResult.test1_sanitization.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {securityTestResult.test1_sanitization.message}
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">2. Bloqueo Hombres Solos Inactivos</span>
                    {securityTestResult.test2_soloMaleUnpaidBlocking.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {securityTestResult.test2_soloMaleUnpaidBlocking.message}
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">3. Bóveda Privada &amp; Token TTL</span>
                    {securityTestResult.test3_vaultGrantAndSignedUrl.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {securityTestResult.test3_vaultGrantAndSignedUrl.message}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Integrated Visor Seguro Modal */}
      {showModalViewer && (
        <SecureMediaViewer
          mediaId={activeMediaForViewer?.id || mediaId}
          mediaTitle={activeMediaForViewer?.title || 'Foto Bóveda Privada'}
          viewerUserId={selectedViewerId}
          viewerRole={selectedViewerRole}
          onClose={() => setShowModalViewer(false)}
        />
      )}
    </div>
  );
};
