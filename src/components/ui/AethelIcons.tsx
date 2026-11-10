import React from 'react';
import {
  ShieldCheck,
  LockKeyhole,
  Crown,
  Flame,
  Key,
  Radar as LucideRadar,
  Sparkles,
  Calendar,
  Award,
  Mic,
  ExternalLink,
  MessageSquare,
  EyeOff,
  ShieldAlert,
  Sliders,
  Users,
  Zap
} from 'lucide-react';

interface IconProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  glow?: boolean;
}

const sizeClasses = {
  xs: { box: 'w-6 h-6', icon: 'w-3 h-3' },
  sm: { box: 'w-8 h-8', icon: 'w-4 h-4' },
  md: { box: 'w-10 h-10', icon: 'w-5 h-5' },
  lg: { box: 'w-12 h-12', icon: 'w-6 h-6' },
  xl: { box: 'w-16 h-16', icon: 'w-8 h-8' }
};

// Common Dark Luxe Icon Box Style
const baseBoxStyle =
  'relative inline-flex items-center justify-center rounded-xl bg-neutral-950 border border-amber-500/30 p-1.5 shadow-lg';
const glowStyle =
  'absolute inset-0 bg-amber-500/10 rounded-xl blur-sm pointer-events-none';
const iconStyle =
  'text-amber-400 stroke-[1.75] drop-shadow-[0_0_8px_rgba(245,158,11,0.35)]';

export const CipherLockIcon: React.FC<IconProps> = ({ size = 'sm', className = '', glow = true }) => {
  const s = sizeClasses[size];
  return (
    <div className={`${baseBoxStyle} ${s.box} ${className}`}>
      {glow && <div className={glowStyle} />}
      <LockKeyhole className={`${s.icon} ${iconStyle}`} />
    </div>
  );
};

export const VouchShieldIcon: React.FC<IconProps> = ({ size = 'sm', className = '', glow = true }) => {
  const s = sizeClasses[size];
  return (
    <div className={`${baseBoxStyle} ${s.box} ${className}`}>
      {glow && <div className={glowStyle} />}
      <ShieldCheck className={`${s.icon} ${iconStyle}`} />
    </div>
  );
};

export const CrownVipIcon: React.FC<IconProps> = ({ size = 'sm', className = '', glow = true }) => {
  const s = sizeClasses[size];
  return (
    <div className={`${baseBoxStyle} ${s.box} ${className}`}>
      {glow && <div className={glowStyle} />}
      <Crown className={`${s.icon} ${iconStyle}`} />
    </div>
  );
};

export const FlameAffinityIcon: React.FC<IconProps> = ({ size = 'sm', className = '', glow = true }) => {
  const s = sizeClasses[size];
  return (
    <div className={`${baseBoxStyle} ${s.box} ${className}`}>
      {glow && <div className={glowStyle} />}
      <Flame className={`${s.icon} ${iconStyle}`} />
    </div>
  );
};

export const VaultKeyIcon: React.FC<IconProps> = ({ size = 'sm', className = '', glow = true }) => {
  const s = sizeClasses[size];
  return (
    <div className={`${baseBoxStyle} ${s.box} ${className}`}>
      {glow && <div className={glowStyle} />}
      <Key className={`${s.icon} ${iconStyle}`} />
    </div>
  );
};

export const Radar5DIcon: React.FC<IconProps> = ({ size = 'sm', className = '', glow = true }) => {
  const s = sizeClasses[size];
  return (
    <div className={`${baseBoxStyle} ${s.box} ${className}`}>
      {glow && <div className={glowStyle} />}
      <LucideRadar className={`${s.icon} ${iconStyle}`} />
    </div>
  );
};

export const PartyHostIcon: React.FC<IconProps> = ({ size = 'sm', className = '', glow = true }) => {
  const s = sizeClasses[size];
  return (
    <div className={`${baseBoxStyle} ${s.box} ${className}`}>
      {glow && <div className={glowStyle} />}
      <Sparkles className={`${s.icon} ${iconStyle}`} />
    </div>
  );
};

export const EventBraceletIcon: React.FC<IconProps> = ({ size = 'sm', className = '', glow = true }) => {
  const s = sizeClasses[size];
  return (
    <div className={`${baseBoxStyle} ${s.box} ${className}`}>
      {glow && <div className={glowStyle} />}
      <Calendar className={`${s.icon} ${iconStyle}`} />
    </div>
  );
};

export const AmbassadorBadgeIcon: React.FC<IconProps> = ({ size = 'sm', className = '', glow = true }) => {
  const s = sizeClasses[size];
  return (
    <div className={`${baseBoxStyle} ${s.box} ${className}`}>
      {glow && <div className={glowStyle} />}
      <Award className={`${s.icon} ${iconStyle}`} />
    </div>
  );
};

export const AudioMicIcon: React.FC<IconProps> = ({ size = 'sm', className = '', glow = true }) => {
  const s = sizeClasses[size];
  return (
    <div className={`${baseBoxStyle} ${s.box} ${className}`}>
      {glow && <div className={glowStyle} />}
      <Mic className={`${s.icon} ${iconStyle}`} />
    </div>
  );
};

export const CreatorLinkIcon: React.FC<IconProps> = ({ size = 'sm', className = '', glow = true }) => {
  const s = sizeClasses[size];
  return (
    <div className={`${baseBoxStyle} ${s.box} ${className}`}>
      {glow && <div className={glowStyle} />}
      <ExternalLink className={`${s.icon} ${iconStyle}`} />
    </div>
  );
};

export const ChatBubbleIcon: React.FC<IconProps> = ({ size = 'sm', className = '', glow = true }) => {
  const s = sizeClasses[size];
  return (
    <div className={`${baseBoxStyle} ${s.box} ${className}`}>
      {glow && <div className={glowStyle} />}
      <MessageSquare className={`${s.icon} ${iconStyle}`} />
    </div>
  );
};

export const KycShieldIcon: React.FC<IconProps> = ({ size = 'sm', className = '', glow = true }) => {
  const s = sizeClasses[size];
  return (
    <div className={`${baseBoxStyle} ${s.box} ${className}`}>
      {glow && <div className={glowStyle} />}
      <ShieldCheck className={`${s.icon} ${iconStyle}`} />
    </div>
  );
};

export const BlindRevealIcon: React.FC<IconProps> = ({ size = 'sm', className = '', glow = true }) => {
  const s = sizeClasses[size];
  return (
    <div className={`${baseBoxStyle} ${s.box} ${className}`}>
      {glow && <div className={glowStyle} />}
      <EyeOff className={`${s.icon} ${iconStyle}`} />
    </div>
  );
};

export const VetoWarningIcon: React.FC<IconProps> = ({ size = 'sm', className = '', glow = true }) => {
  const s = sizeClasses[size];
  return (
    <div className={`${baseBoxStyle} ${s.box} ${className}`}>
      {glow && <div className={glowStyle} />}
      <ShieldAlert className={`${s.icon} ${iconStyle}`} />
    </div>
  );
};

export const FilterSlidersIcon: React.FC<IconProps> = ({ size = 'sm', className = '', glow = true }) => {
  const s = sizeClasses[size];
  return (
    <div className={`${baseBoxStyle} ${s.box} ${className}`}>
      {glow && <div className={glowStyle} />}
      <Sliders className={`${s.icon} ${iconStyle}`} />
    </div>
  );
};

export const UserCoupleIcon: React.FC<IconProps> = ({ size = 'sm', className = '', glow = true }) => {
  const s = sizeClasses[size];
  return (
    <div className={`${baseBoxStyle} ${s.box} ${className}`}>
      {glow && <div className={glowStyle} />}
      <Users className={`${s.icon} ${iconStyle}`} />
    </div>
  );
};

export const UserUnicornIcon: React.FC<IconProps> = ({ size = 'sm', className = '', glow = true }) => {
  const s = sizeClasses[size];
  return (
    <div className={`${baseBoxStyle} ${s.box} ${className}`}>
      {glow && <div className={glowStyle} />}
      <Sparkles className={`${s.icon} ${iconStyle}`} />
    </div>
  );
};

export const UserBullIcon: React.FC<IconProps> = ({ size = 'sm', className = '', glow = true }) => {
  const s = sizeClasses[size];
  return (
    <div className={`${baseBoxStyle} ${s.box} ${className}`}>
      {glow && <div className={glowStyle} />}
      <Zap className={`${s.icon} ${iconStyle}`} />
    </div>
  );
};
