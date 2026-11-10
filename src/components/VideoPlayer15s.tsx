import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Key, ShieldCheck, Cpu, Flame, Clock } from 'lucide-react';
import { haptics } from '../services/hapticsService';
import { MEDIA_GOVERNANCE_CONFIG } from '../config/mediaGovernance';

interface VideoPlayer15sProps {
  posterUrl: string;
  videoTitle?: string;
  candidateAlias?: string;
  onRequestKey?: () => void;
  onRequestChat?: () => void;
}

export const VideoPlayer15s: React.FC<VideoPlayer15sProps> = ({
  posterUrl,
  videoTitle = 'Tráiler 15s de Atmósfera Relacional',
  candidateAlias = 'Camila & Mateo',
  onRequestKey,
  onRequestChat
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0); // 0 to 100%
  const [secondsLeft, setSecondsLeft] = useState<number>(MEDIA_GOVERNANCE_CONFIG.VIDEO.MAX_DURATION_SECONDS);

  const durationSec = MEDIA_GOVERNANCE_CONFIG.VIDEO.MAX_DURATION_SECONDS; // 15s

  useEffect(() => {
    let interval: any = null;

    if (isPlaying) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            // Loop back after 15 seconds
            setSecondsLeft(durationSec);
            return 0;
          }
          const next = prev + (100 / (durationSec * 10)); // 10 updates per second
          setSecondsLeft(Math.max(0, Math.ceil(durationSec * (1 - next / 100))));
          return next;
        });
      }, 100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, durationSec]);

  const togglePlay = () => {
    haptics.toggle();
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    haptics.toggle();
    setIsMuted(!isMuted);
  };

  return (
    <div className="relative w-full aspect-[9/16] max-h-[520px] rounded-3xl overflow-hidden bg-[#070709] border border-white/10 shadow-2xl select-none group">
      {/* Simulated High Definition 15s Loop Canvas Container */}
      <div className="relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden">
        <img
          src={posterUrl}
          alt={videoTitle}
          className={`w-full h-full object-cover transition-transform duration-700 ${
            isPlaying ? 'scale-105 filter brightness-105' : 'scale-100 filter brightness-75'
          }`}
        />

        {/* Ambient Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070709] via-transparent to-black/60 pointer-events-none" />

        {/* Top Badges Bar */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20">
          <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-amber-300 border border-amber-500/30 font-mono text-[10px] font-bold flex items-center gap-1.5">
            <Flame className="w-3 h-3 text-amber-400 animate-pulse" />
            <span>TRÁILER 15S DOPAMÍNICO</span>
          </span>

          <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-emerald-300 border border-emerald-500/30 font-mono text-[10px] font-bold flex items-center gap-1">
            <Cpu className="w-3 h-3 text-emerald-400" />
            <span>RAM AES-GCM 3.5Mbps</span>
          </span>
        </div>

        {/* Play/Pause Center Button Overlay */}
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center z-10 cursor-pointer"
        >
          {!isPlaying && (
            <div className="p-4 rounded-full bg-amber-500/90 text-slate-950 border border-amber-300 shadow-2xl backdrop-blur-md transition-transform hover:scale-110 active:scale-95">
              <Play className="w-8 h-8 fill-slate-950 ml-1" />
            </div>
          )}
        </button>

        {/* Bottom Floating Interactive Controls */}
        <div className="absolute bottom-3 left-3 right-3 z-20 space-y-2">
          {/* Progress Bar (15s Loop) */}
          <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-white font-medium">
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMute}
                className="p-1.5 rounded-lg bg-black/60 text-amber-400 hover:text-amber-300 border border-white/10"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <span className="font-mono text-[11px] text-slate-300">
                00:{secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft} / 00:15
              </span>
            </div>

            <span className="text-[10px] font-mono text-amber-300/90 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
              Efecto Cliffhanger
            </span>
          </div>

          {/* Call to Action Bar */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => {
                haptics.selection();
                if (onRequestKey) onRequestKey();
              }}
              className="py-2 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-extrabold text-xs rounded-xl border border-amber-500/40 backdrop-blur-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>Pedir Llave Bóveda</span>
            </button>

            <button
              onClick={() => {
                haptics.selection();
                if (onRequestChat) onRequestChat();
              }}
              className="py-2 px-3 bg-gradient-to-r from-rose-600 to-amber-600 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Chat Cifrado</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
