import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause, Images, Film, ShieldCheck, Sparkles, ChevronLeft, ChevronRight, Mic, Heart, Flame, Sparkle, Key, MessageSquare, CheckCircle2, Lock, Maximize2, X, FolderHeart, ZoomIn, ZoomOut, RotateCcw, Move } from 'lucide-react';
import { haptics } from '../services/hapticsService';
import { notificationService } from '../services/notificationService';

interface CandidateMediaGalleryProps {
  alias: string;
  role: 'couple' | 'solo_female' | 'solo_male';
  galleryImages: string[];
  voiceNote?: {
    duration: string;
    transcription: string;
    label: string;
  };
  isUnregisteredExternal?: boolean; // True when viewed outside network without active session
  onRequestKey?: () => void;
  onStartChat?: () => void;
}

interface ItemReactionState {
  likes: number;
  fire: number;
  flirt: number;
  userChoice: 'LIKE' | 'FIRE' | 'FLIRT' | null;
}

export const CandidateMediaGallery: React.FC<CandidateMediaGalleryProps> = ({
  alias,
  role,
  galleryImages,
  voiceNote = {
    duration: '0:24',
    label: 'Saludo de Presentación Cifrado',
    transcription: 'Hola! Nos encanta viajar a Anapoima y Medellín. Buscamos parejas y chicas afines para buena conversación, música en vivo y experiencias de total respeto...'
  },
  isUnregisteredExternal = false,
  onRequestKey,
  onStartChat
}) => {
  const [activeTab, setActiveTab] = useState<'photos' | 'videos' | 'audio'>('photos');
  const [selectedAlbum, setSelectedAlbum] = useState<string>('todos');
  const [activeImgIndex, setActiveImgIndex] = useState<number>(0);
  const [activeVideoIndex, setActiveVideoIndex] = useState<number>(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [audioProgress, setAudioProgress] = useState<number>(0);
  const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(false);
  const [reactionFeedback, setReactionFeedback] = useState<string | null>(null);
  
  // Lightbox Fullscreen & Zoom/Pan state
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1, 1.5, 2, 2.5, 3
  const [panPosition, setPanPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchPinchDistRef = useRef<number | null>(null);

  const [floatingHeartAnim, setFloatingHeartAnim] = useState<{ id: number; x: number; y: number } | null>(null);

  // Touch Swipe Gesture Refs for Photos
  const touchStartXRef = useRef<number>(0);
  const touchEndXRef = useRef<number>(0);

  const handleTouchStartPhoto = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleTouchEndPhoto = () => {
    const distance = touchStartXRef.current - touchEndXRef.current;
    if (Math.abs(distance) > 40) {
      if (distance > 0) {
        handleNextPhoto();
      } else {
        handlePrevPhoto();
      }
    }
  };

  // Zoom control helpers
  const handleZoomIn = () => {
    haptics.selection();
    setZoomLevel((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    haptics.selection();
    setZoomLevel((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPanPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    haptics.selection();
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  };

  const handleToggleDoubleTapZoom = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    haptics.toggle();
    if (zoomLevel > 1) {
      setZoomLevel(1);
      setPanPosition({ x: 0, y: 0 });
    } else {
      setZoomLevel(2);
    }
  };

  // Mouse Panning
  const handleMouseDownPan = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      e.preventDefault();
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      initialPanRef.current = { ...panPosition };
    }
  };

  const handleMouseMovePan = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setPanPosition({
        x: initialPanRef.current.x + dx,
        y: initialPanRef.current.y + dy
      });
    }
  };

  const handleMouseUpPan = () => {
    setIsDragging(false);
  };

  // Touch Pinch & Pan
  const handleLightboxTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchPinchDistRef.current = dist;
    } else if (e.touches.length === 1 && zoomLevel > 1) {
      setIsDragging(true);
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      initialPanRef.current = { ...panPosition };
    } else if (e.touches.length === 1 && zoomLevel === 1) {
      touchStartXRef.current = e.touches[0].clientX;
      touchEndXRef.current = e.touches[0].clientX;
    }
  };

  const handleLightboxTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchPinchDistRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = dist - touchPinchDistRef.current;
      if (Math.abs(delta) > 10) {
        if (delta > 0) {
          setZoomLevel((prev) => Math.min(prev + 0.1, 3));
        } else {
          setZoomLevel((prev) => Math.max(prev - 0.1, 1));
        }
        touchPinchDistRef.current = dist;
      }
    } else if (e.touches.length === 1 && isDragging && zoomLevel > 1) {
      const dx = e.touches[0].clientX - dragStartRef.current.x;
      const dy = e.touches[0].clientY - dragStartRef.current.y;
      setPanPosition({
        x: initialPanRef.current.x + dx,
        y: initialPanRef.current.y + dy
      });
    } else if (e.touches.length === 1 && zoomLevel === 1) {
      touchEndXRef.current = e.touches[0].clientX;
    }
  };

  const handleLightboxTouchEnd = () => {
    setIsDragging(false);
    touchPinchDistRef.current = null;
    if (zoomLevel === 1) {
      const distance = touchStartXRef.current - touchEndXRef.current;
      if (Math.abs(distance) > 40) {
        if (distance > 0) {
          handleNextPhoto();
        } else {
          handlePrevPhoto();
        }
      }
    }
  };

  const albumsList = [
    { id: 'todos', name: 'Todas' },
    { id: 'eventos', name: 'Eventos' },
    { id: 'viajes', name: 'Viajes' },
    { id: 'lifestyle', name: 'Estilo' }
  ];

  const rawImages = galleryImages && galleryImages.length > 0
    ? galleryImages
    : [
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85'
      ];

  const photoItems = rawImages.map((url, idx) => ({
    id: `photo_${idx}`,
    url,
    album: idx % 3 === 0 ? 'eventos' : idx % 3 === 1 ? 'viajes' : 'lifestyle',
    title: `Fotografía #${idx + 1}`
  }));

  const filteredPhotos = selectedAlbum === 'todos' 
    ? photoItems 
    : photoItems.filter(p => p.album === selectedAlbum);

  const videos = [
    {
      id: 'video_0',
      title: 'Reel 01 • Anapoima Sunset Private Gathering',
      duration: '0:15',
      poster: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-party-lights-and-people-dancing-40715-large.mp4'
    },
    {
      id: 'video_1',
      title: 'Reel 02 • Momento de Copas & Música en Vivo',
      duration: '0:22',
      poster: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-friends-toasting-with-wine-glasses-43283-large.mp4'
    }
  ];

  // Per-item reaction states mapped by key e.g. 'photo_0', 'video_1', 'audio_0'
  const [mediaReactions, setMediaReactions] = useState<Record<string, ItemReactionState>>({
    photo_0: { likes: 14, fire: 8, flirt: 3, userChoice: null },
    photo_1: { likes: 9, fire: 15, flirt: 5, userChoice: null },
    photo_2: { likes: 21, fire: 12, flirt: 8, userChoice: null },
    photo_3: { likes: 11, fire: 19, flirt: 4, userChoice: null },
    video_0: { likes: 18, fire: 22, flirt: 10, userChoice: null },
    video_1: { likes: 7, fire: 19, flirt: 4, userChoice: null },
    audio_0: { likes: 12, fire: 5, flirt: 11, userChoice: null }
  });

  // Handle ESC key for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLightboxOpen(false);
      if (isLightboxOpen) {
        if (e.key === 'ArrowRight') handleNextPhoto();
        if (e.key === 'ArrowLeft') handlePrevPhoto();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, activeImgIndex, filteredPhotos.length]);

  // Get key for currently active item
  const getCurrentItemKey = (): { key: string; label: string; url?: string } => {
    if (activeTab === 'photos') {
      const currentPhoto = filteredPhotos[activeImgIndex] || filteredPhotos[0];
      return {
        key: currentPhoto ? currentPhoto.id : `photo_${activeImgIndex}`,
        label: `Foto #${activeImgIndex + 1} de ${filteredPhotos.length}`,
        url: currentPhoto?.url
      };
    } else if (activeTab === 'videos') {
      const currentVideo = videos[activeVideoIndex] || videos[0];
      return {
        key: currentVideo.id,
        label: `Reel #${activeVideoIndex + 1}: ${currentVideo.title}`,
        url: currentVideo.poster
      };
    } else {
      return {
        key: 'audio_0',
        label: `Audio: ${voiceNote.label}`
      };
    }
  };

  const currentItem = getCurrentItemKey();
  const currentReactionState: ItemReactionState = mediaReactions[currentItem.key] || {
    likes: 0,
    fire: 0,
    flirt: 0,
    userChoice: null
  };

  const toggleAudioPlay = () => {
    haptics.selection();
    if (isPlayingAudio) {
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      let current = 0;
      const interval = setInterval(() => {
        current += 5;
        setAudioProgress(current);
        if (current >= 100) {
          clearInterval(interval);
          setIsPlayingAudio(false);
          setAudioProgress(0);
        }
      }, 250);
    }
  };

  const handleNextPhoto = () => {
    haptics.selection();
    setActiveImgIndex((prev) => (prev + 1) % Math.max(1, filteredPhotos.length));
  };

  const handlePrevPhoto = () => {
    haptics.selection();
    setActiveImgIndex((prev) => (prev - 1 + filteredPhotos.length) % Math.max(1, filteredPhotos.length));
  };

  const handleNextVideo = () => {
    haptics.selection();
    setIsPlayingVideo(false);
    setActiveVideoIndex((prev) => (prev + 1) % videos.length);
  };

  const handlePrevVideo = () => {
    haptics.selection();
    setIsPlayingVideo(false);
    setActiveVideoIndex((prev) => (prev - 1 + videos.length) % videos.length);
  };

  const triggerReactionOnCurrentItem = (type: 'LIKE' | 'FIRE' | 'FLIRT') => {
    haptics.success();
    const itemKey = currentItem.key;
    const itemLabel = currentItem.label;

    setMediaReactions((prev) => {
      const existing = prev[itemKey] || { likes: 0, fire: 0, flirt: 0, userChoice: null };
      let newChoice: 'LIKE' | 'FIRE' | 'FLIRT' | null = type;
      let newLikes = existing.likes;
      let newFire = existing.fire;
      let newFlirt = existing.flirt;

      // Toggle off if same reaction clicked
      if (existing.userChoice === type) {
        newChoice = null;
        if (type === 'LIKE') newLikes = Math.max(0, newLikes - 1);
        if (type === 'FIRE') newFire = Math.max(0, newFire - 1);
        if (type === 'FLIRT') newFlirt = Math.max(0, newFlirt - 1);

        setReactionFeedback(`Retiraste tu reacción de ${itemLabel}.`);
      } else {
        // Remove previous choice
        if (existing.userChoice === 'LIKE') newLikes = Math.max(0, newLikes - 1);
        if (existing.userChoice === 'FIRE') newFire = Math.max(0, newFire - 1);
        if (existing.userChoice === 'FLIRT') newFlirt = Math.max(0, newFlirt - 1);

        // Add new choice
        if (type === 'LIKE') newLikes += 1;
        if (type === 'FIRE') newFire += 1;
        if (type === 'FLIRT') newFlirt += 1;

        const actionText = type === 'LIKE' ? '❤️ Me Gusta' : type === 'FIRE' ? '🔥 Fuego' : '✨ Coqueteo';
        setReactionFeedback(`${actionText} registrado solo para ${itemLabel} (1 reacción máx).`);

        // Register notification
        notificationService.addNotification({
          type: 'REACTION_FLIRT',
          senderId: 'usr_me',
          senderAlias: 'Tu Perfil VIP',
          senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
          senderRole: 'couple',
          message: `Reaccionaste con ${actionText} a ${itemLabel} de ${alias}`,
          status: 'pending'
        });
      }

      setTimeout(() => setReactionFeedback(null), 3500);

      return {
        ...prev,
        [itemKey]: {
          likes: newLikes,
          fire: newFire,
          flirt: newFlirt,
          userChoice: newChoice
        }
      };
    });
  };

  const handleDoubleClickPhoto = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setFloatingHeartAnim({ id: Date.now(), x, y });
    triggerReactionOnCurrentItem('LIKE');

    setTimeout(() => {
      setFloatingHeartAnim(null);
    }, 1000);
  };

  // External Unregistered Access Shield (Zero Photo Leak Outside App)
  if (isUnregisteredExternal) {
    return (
      <div className="bg-[#0b0a10] border border-amber-500/30 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto animate-pulse">
          <Lock className="w-7 h-7 text-amber-400" />
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-mono font-extrabold text-amber-300 uppercase tracking-widest block">
            AETHEL CIPHERSHIELD • PRIVACIDAD ABSOLUTA
          </span>
          <h4 className="text-base font-black text-white">
            Fotos y Bóveda Cifrada Protegidas
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
            Ninguna foto ni contenido multimedia de {alias} es accesible desde la web abierta o motores de búsqueda. Para salvaguardar la discreción, el contenido solo se desbloquea para miembros inscritos y verificados.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            window.location.href = '#login';
          }}
          className="py-2.5 px-5 bg-gradient-to-r from-amber-500 to-rose-600 text-slate-950 font-extrabold rounded-xl text-xs shadow-lg hover:brightness-110 cursor-pointer"
        >
          🔑 Registrarse o Iniciar Sesión para Ver Bóveda
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 bg-[#0a0910]/90 p-3.5 sm:p-4 rounded-2xl border border-amber-500/20 shadow-lg backdrop-blur-md">
      {/* Gallery Main Tabs (Unboxed, Sleek Pill Nav) */}
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.08] pb-2">
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => {
              haptics.selection();
              setActiveTab('photos');
            }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer border ${
              activeTab === 'photos'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                : 'bg-neutral-900/80 text-neutral-400 border-white/10 hover:text-white'
            }`}
          >
            <Images className="w-3.5 h-3.5" />
            <span>Fotos ({filteredPhotos.length})</span>
          </button>

          <button
            onClick={() => {
              haptics.selection();
              setActiveTab('videos');
            }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer border ${
              activeTab === 'videos'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                : 'bg-neutral-900/80 text-neutral-400 border-white/10 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Reels ({videos.length})</span>
          </button>

          <button
            onClick={() => {
              haptics.selection();
              setActiveTab('audio');
            }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer border ${
              activeTab === 'audio'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                : 'bg-neutral-900/80 text-neutral-400 border-white/10 hover:text-white'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Audio</span>
          </button>
        </div>
      </div>

      {/* Album Category Selector (When Photos Tab is active) */}
      {activeTab === 'photos' && (
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-0.5 no-scrollbar scroll-smooth">
          {albumsList.map((alb) => (
            <button
              key={alb.id}
              onClick={() => {
                haptics.selection();
                setSelectedAlbum(alb.id);
                setActiveImgIndex(0);
              }}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold whitespace-nowrap transition-all cursor-pointer border shrink-0 ${
                selectedAlbum === alb.id
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 font-bold'
                  : 'bg-neutral-900/50 text-neutral-400 border-white/5 hover:text-white'
              }`}
            >
              {alb.name}
            </button>
          ))}
        </div>
      )}

      {/* Tab 1: Photo Carousel with Fixed Integrated Reaction Bar */}
      {activeTab === 'photos' && (
        <div className="space-y-0 rounded-2xl overflow-hidden border border-white/10 shadow-xl bg-slate-950">
          {/* Main Photo Frame Container */}
          <div
            onDoubleClick={handleDoubleClickPhoto}
            onTouchStart={handleTouchStartPhoto}
            onTouchMove={(e) => { touchEndXRef.current = e.touches[0].clientX; }}
            onTouchEnd={handleTouchEndPhoto}
            onClick={() => {
              haptics.selection();
              setZoomLevel(1);
              setPanPosition({ x: 0, y: 0 });
              setIsLightboxOpen(true);
            }}
            className="relative h-72 sm:h-96 w-full cursor-zoom-in group select-none overflow-hidden bg-slate-950"
          >
            <img
              src={filteredPhotos[activeImgIndex]?.url || rawImages[0]}
              alt={`${alias} foto ${activeImgIndex + 1}`}
              className="w-full h-full object-cover object-center transition-all duration-300 filter contrast-[1.03] group-hover:scale-105"
            />

            {/* Top Bar inside Image: Counter & Lightbox Zoom Icon */}
            <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10">
              <span className="bg-black/70 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/10 text-[10px] font-mono text-neutral-200">
                Foto {activeImgIndex + 1} de {filteredPhotos.length}
              </span>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  haptics.selection();
                  setZoomLevel(1);
                  setPanPosition({ x: 0, y: 0 });
                  setIsLightboxOpen(true);
                }}
                className="px-2.5 py-1 rounded-full bg-black/70 hover:bg-black/95 backdrop-blur-md border border-white/15 text-neutral-200 hover:text-white transition-all cursor-pointer flex items-center space-x-1 text-xs font-mono font-bold"
                title="Ampliar foto y hacer Zoom"
              >
                <Maximize2 className="w-3.5 h-3.5 text-amber-300" />
                <span className="text-[10px] text-amber-300">Ampliar 🔍</span>
              </button>
            </div>

            {/* Previous Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevPhoto();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/70 hover:bg-amber-500 hover:text-slate-950 text-white border border-white/15 transition-all active:scale-95 cursor-pointer shadow-lg z-10"
              title="Foto anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Next Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNextPhoto();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/70 hover:bg-amber-500 hover:text-slate-950 text-white border border-white/15 transition-all active:scale-95 cursor-pointer shadow-lg z-10"
              title="Foto siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Double-click floating animation heart */}
            {floatingHeartAnim && (
              <div
                className="absolute z-30 pointer-events-none animate-bounce text-rose-500"
                style={{ left: floatingHeartAnim.x - 20, top: floatingHeartAnim.y - 20 }}
              >
                <Heart className="w-10 h-10 fill-rose-500 text-rose-400 drop-shadow-[0_0_15px_rgba(244,63,94,0.9)]" />
              </div>
            )}
          </div>

          {/* FIXED INTEGRATED REACTION BAR (Directly below photo frame - 100% stable, no wrap/shift) */}
          <div className="bg-[#090a0f] border-t border-white/10 p-2.5 sm:p-3 flex items-center justify-between gap-2">
            {/* Photo Dots Indicator */}
            <div className="flex items-center space-x-1.5 bg-black/50 px-2.5 py-1 rounded-full border border-white/10 shrink-0">
              {filteredPhotos.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImgIndex(idx);
                  }}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    activeImgIndex === idx ? 'bg-amber-400 w-4' : 'bg-neutral-600 hover:bg-neutral-400 w-1.5'
                  }`}
                  title={`Foto ${idx + 1}`}
                />
              ))}
            </div>

            {/* Fixed Reaction Buttons */}
            <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  triggerReactionOnCurrentItem('LIKE');
                }}
                className={`px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer border ${
                  currentReactionState.userChoice === 'LIKE'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/60 shadow-md scale-105'
                    : 'bg-neutral-900/80 text-neutral-300 border-white/10 hover:border-rose-500/40 hover:text-rose-300'
                }`}
                title="Me Gusta"
              >
                <Heart className={`w-3.5 h-3.5 ${currentReactionState.userChoice === 'LIKE' ? 'fill-rose-500 text-rose-500' : 'text-rose-400'}`} />
                <span>Me Gusta ({currentReactionState.likes})</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  triggerReactionOnCurrentItem('FIRE');
                }}
                className={`px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer border ${
                  currentReactionState.userChoice === 'FIRE'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-md scale-105'
                    : 'bg-neutral-900/80 text-neutral-300 border-white/10 hover:border-amber-500/40 hover:text-amber-300'
                }`}
                title="Fuego"
              >
                <Flame className={`w-3.5 h-3.5 ${currentReactionState.userChoice === 'FIRE' ? 'text-amber-400 fill-amber-400/30' : 'text-amber-400'}`} />
                <span>Fuego ({currentReactionState.fire})</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  triggerReactionOnCurrentItem('FLIRT');
                }}
                className={`px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer border ${
                  currentReactionState.userChoice === 'FLIRT'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/60 shadow-md scale-105'
                    : 'bg-neutral-900/80 text-neutral-300 border-white/10 hover:border-purple-500/40 hover:text-purple-300'
                }`}
                title="Coqueteo"
              >
                <Sparkle className={`w-3.5 h-3.5 ${currentReactionState.userChoice === 'FLIRT' ? 'text-purple-300 fill-purple-300/30' : 'text-purple-400'}`} />
                <span>Coqueteo ({currentReactionState.flirt})</span>
              </button>
            </div>
          </div>

          {/* Dynamic Micro-Feedback Banner */}
          {reactionFeedback && (
            <div className="p-2 bg-amber-950/80 border-t border-amber-500/50 text-amber-200 text-[10px] font-mono font-medium flex items-center space-x-1.5 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{reactionFeedback}</span>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Video Reels Carousel Player */}
      {activeTab === 'videos' && (
        <div className="space-y-3">
          <div className="relative h-64 sm:h-80 w-full rounded-2xl overflow-hidden bg-slate-950 border border-white/10 group">
            {isPlayingVideo ? (
              <video
                src={videos[activeVideoIndex].videoUrl}
                poster={videos[activeVideoIndex].poster}
                autoPlay
                controls
                loop
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="relative w-full h-full">
                <img
                  src={videos[activeVideoIndex].poster}
                  alt={videos[activeVideoIndex].title}
                  className="w-full h-full object-cover filter contrast-[1.05]"
                />
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center space-y-3 p-4 text-center">
                  <button
                    onClick={() => {
                      haptics.success();
                      setIsPlayingVideo(true);
                    }}
                    className="w-16 h-16 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-2xl transition-all active:scale-95 cursor-pointer border-2 border-white/40"
                  >
                    <Play className="w-7 h-7 fill-slate-950 ml-1" />
                  </button>
                  <div className="bg-black/80 px-4 py-2 rounded-xl border border-white/10 backdrop-blur-md max-w-xs">
                    <p className="text-xs font-bold text-white leading-tight">{videos[activeVideoIndex].title}</p>
                    <p className="text-[10px] text-amber-300 font-mono mt-1">Duración: {videos[activeVideoIndex].duration} • HD 1080p</p>
                  </div>
                </div>
              </div>
            )}

            {/* Video Prev / Next Carousel Controls */}
            <button
              onClick={handlePrevVideo}
              title="Reel Anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/70 hover:bg-amber-500 hover:text-slate-950 text-white border border-white/20 transition-all active:scale-95 cursor-pointer shadow-lg z-10"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={handleNextVideo}
              title="Reel Siguiente"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/70 hover:bg-amber-500 hover:text-slate-950 text-white border border-white/20 transition-all active:scale-95 cursor-pointer shadow-lg z-10"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Reel Counter Badge */}
            <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15 text-[10px] font-mono text-amber-300 font-bold z-10">
              Reel {activeVideoIndex + 1} de {videos.length}
            </div>
          </div>

          {/* Video Selector Thumbnails Strip */}
          <div className="grid grid-cols-2 gap-2">
            {videos.map((vid, idx) => (
              <button
                key={idx}
                onClick={() => {
                  haptics.selection();
                  setActiveVideoIndex(idx);
                  setIsPlayingVideo(false);
                }}
                className={`p-2.5 rounded-xl border text-left flex items-center space-x-2 transition-all cursor-pointer ${
                  activeVideoIndex === idx
                    ? 'bg-amber-950/50 border-amber-500 text-amber-300 shadow-md ring-1 ring-amber-500/40'
                    : 'bg-slate-950 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <Film className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="truncate min-w-0">
                  <p className="text-[11px] font-bold truncate">{vid.title}</p>
                  <p className="text-[9px] font-mono opacity-80">{vid.duration}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Voice Note Player */}
      {activeTab === 'audio' && (
        <div className="bg-[#0c0d14] border border-amber-500/30 p-4 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-rose-950/80 text-rose-400 border border-rose-800/80">
                <Mic className="w-4 h-4 text-rose-400" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">{voiceNote.label}</span>
                <span className="text-[10px] text-slate-400 font-mono">Audio Cifrado • {voiceNote.duration}</span>
              </div>
            </div>

            <button
              onClick={toggleAudioPlay}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-all cursor-pointer ${
                isPlayingAudio
                  ? 'bg-rose-600 text-white shadow-lg animate-pulse'
                  : 'bg-gradient-to-r from-amber-500 to-rose-600 text-white hover:opacity-90'
              }`}
            >
              {isPlayingAudio ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pausar</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Escuchar Audio</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center space-x-1 h-7 bg-black/40 px-3 rounded-xl border border-white/5 overflow-hidden">
            {[40, 70, 30, 90, 60, 100, 40, 80, 50, 70, 30, 90, 60, 40, 80, 50, 60, 90, 30, 70].map((height, idx) => (
              <div
                key={idx}
                className={`flex-1 rounded-full transition-all duration-150 ${
                  isPlayingAudio && (idx * 5) <= audioProgress
                    ? 'bg-gradient-to-t from-rose-500 to-amber-400 animate-pulse'
                    : 'bg-slate-700'
                }`}
                style={{
                  height: isPlayingAudio ? `${Math.max(15, Number((height * Math.random()).toFixed(0)))}%` : `${height * 0.4}%`
                }}
              />
            ))}
          </div>

          <p className="text-[11px] text-slate-300 italic bg-black/40 p-3 rounded-xl border border-white/5">
            "{voiceNote.transcription}"
          </p>
        </div>
      )}

      {/* LIGHTBOX FULLSCREEN IMMERSIVE MODAL WITH ZOOM & PAN */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col justify-between select-none overflow-hidden animate-in fade-in duration-200">
          {/* Top Bar Header Row */}
          <div className="flex items-center justify-between p-3 sm:p-4 bg-black/80 border-b border-white/10 z-30 shrink-0">
            {/* Candidate Title & Position */}
            <div className="flex items-center space-x-2 bg-neutral-900/90 border border-white/15 px-3 py-1.5 rounded-full">
              <span className="text-amber-400 font-extrabold text-xs sm:text-sm">{alias}</span>
              <span className="text-slate-300 text-[11px] font-mono">
                • Foto {activeImgIndex + 1} de {filteredPhotos.length}
              </span>
            </div>

            {/* ZOOM CONTROLS TOOLBAR */}
            <div className="flex items-center space-x-1.5 bg-neutral-900/90 border border-white/15 px-2 py-1 rounded-full shadow-lg">
              <button
                onClick={handleZoomOut}
                disabled={zoomLevel <= 1}
                className="p-1.5 rounded-full hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent text-white cursor-pointer transition-all"
                title="Alejar (-)"
              >
                <ZoomOut className="w-4 h-4 text-amber-300" />
              </button>

              <span className="text-xs font-mono font-bold text-amber-300 min-w-[42px] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>

              <button
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3}
                className="p-1.5 rounded-full hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent text-white cursor-pointer transition-all"
                title="Acercar (+)"
              >
                <ZoomIn className="w-4 h-4 text-amber-300" />
              </button>

              {zoomLevel > 1 && (
                <button
                  onClick={handleResetZoom}
                  className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer transition-all ml-1 border-l border-white/10"
                  title="Restablecer tamaño (100%)"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-300" />
                </button>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={() => {
                setZoomLevel(1);
                setPanPosition({ x: 0, y: 0 });
                setIsLightboxOpen(false);
              }}
              className="p-2 sm:p-2.5 rounded-full bg-rose-950/80 hover:bg-rose-900 text-white border border-rose-500/40 transition-all cursor-pointer shadow-xl active:scale-95"
              title="Cerrar vista ampliada"
            >
              <X className="w-5 h-5 text-neutral-100" />
            </button>
          </div>

          {/* Center Interactive Photo Canvas */}
          <div
            className="relative flex-1 w-full flex items-center justify-center overflow-hidden cursor-default touch-none"
            onMouseDown={handleMouseDownPan}
            onMouseMove={handleMouseMovePan}
            onMouseUp={handleMouseUpPan}
            onMouseLeave={handleMouseUpPan}
            onTouchStart={handleLightboxTouchStart}
            onTouchMove={handleLightboxTouchMove}
            onTouchEnd={handleLightboxTouchEnd}
            onDoubleClick={handleToggleDoubleTapZoom}
          >
            <div
              className={`transition-transform duration-100 ease-out flex items-center justify-center ${
                zoomLevel > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'
              }`}
              style={{
                transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`
              }}
            >
              <img
                src={filteredPhotos[activeImgIndex]?.url || rawImages[0]}
                alt={currentItem.label}
                draggable={false}
                className="max-h-[75vh] max-w-full object-contain rounded-xl shadow-2xl filter contrast-[1.03]"
              />
            </div>

            {/* Drag hint badge when zoomed */}
            {zoomLevel > 1 && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-[10px] font-mono text-amber-300 pointer-events-none z-20 flex items-center space-x-1 shadow-2xl">
                <Move className="w-3.5 h-3.5 text-amber-400" />
                <span>Mantén presionado y arrastra para explorar</span>
              </div>
            )}

            {/* Previous Photo Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setZoomLevel(1);
                setPanPosition({ x: 0, y: 0 });
                handlePrevPhoto();
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/80 hover:bg-amber-500 hover:text-slate-950 text-white border border-white/20 shadow-2xl transition-all cursor-pointer active:scale-95 z-30"
              title="Foto anterior"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Next Photo Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setZoomLevel(1);
                setPanPosition({ x: 0, y: 0 });
                handleNextPhoto();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/80 hover:bg-amber-500 hover:text-slate-950 text-white border border-white/20 shadow-2xl transition-all cursor-pointer active:scale-95 z-30"
              title="Foto siguiente"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* FIXED BOTTOM REACTION BAR IN LIGHTBOX */}
          <div className="p-3 bg-black/90 backdrop-blur-xl border-t border-white/10 z-30 flex items-center justify-center shrink-0">
            <div className="max-w-lg w-full bg-[#0c0d14] border border-white/15 p-2.5 rounded-2xl flex items-center justify-between gap-2 shadow-2xl">
              {/* Photo Selector Dots */}
              <div className="flex items-center space-x-1.5 bg-black/60 px-2.5 py-1.5 rounded-full border border-white/10 shrink-0">
                {filteredPhotos.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setZoomLevel(1);
                      setPanPosition({ x: 0, y: 0 });
                      setActiveImgIndex(idx);
                    }}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      activeImgIndex === idx ? 'bg-amber-400 w-4' : 'bg-neutral-600 hover:bg-neutral-400 w-1.5'
                    }`}
                    title={`Foto ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Reaction Buttons Group */}
              <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerReactionOnCurrentItem('LIKE');
                  }}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer border ${
                    currentReactionState.userChoice === 'LIKE'
                      ? 'bg-rose-500 text-white border-rose-500 shadow-md scale-105'
                      : 'bg-neutral-900 text-neutral-200 border-white/10 hover:border-rose-500/40 hover:text-rose-300'
                  }`}
                  title="Me Gusta"
                >
                  <Heart className={`w-3.5 h-3.5 ${currentReactionState.userChoice === 'LIKE' ? 'fill-white text-white' : 'text-rose-400'}`} />
                  <span>Me Gusta ({currentReactionState.likes})</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerReactionOnCurrentItem('FIRE');
                  }}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer border ${
                    currentReactionState.userChoice === 'FIRE'
                      ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold shadow-md scale-105'
                      : 'bg-neutral-900 text-neutral-200 border-white/10 hover:border-amber-500/40 hover:text-amber-300'
                  }`}
                  title="Fuego"
                >
                  <Flame className={`w-3.5 h-3.5 ${currentReactionState.userChoice === 'FIRE' ? 'text-slate-950 fill-slate-950' : 'text-amber-400'}`} />
                  <span>Fuego ({currentReactionState.fire})</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerReactionOnCurrentItem('FLIRT');
                  }}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer border ${
                    currentReactionState.userChoice === 'FLIRT'
                      ? 'bg-purple-600 text-white border-purple-500 shadow-md scale-105'
                      : 'bg-neutral-900 text-neutral-200 border-white/10 hover:border-purple-500/40 hover:text-purple-300'
                  }`}
                  title="Coqueteo"
                >
                  <Sparkle className={`w-3.5 h-3.5 ${currentReactionState.userChoice === 'FLIRT' ? 'text-white fill-white' : 'text-purple-400'}`} />
                  <span>Coqueteo ({currentReactionState.flirt})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
