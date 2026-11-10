import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface LuxeIconProps {
  icon: LucideIcon;
  active?: boolean;
  size?: number;
  className?: string;
}

export const LuxeIcon: React.FC<LuxeIconProps> = ({
  icon: Icon,
  active = false,
  size = 20,
  className = ''
}) => {
  return (
    <Icon
      size={size}
      strokeWidth={active ? 1.75 : 1.5}
      className={`transition-all duration-300 shrink-0 ${
        active
          ? 'text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.35)]'
          : 'text-neutral-400 hover:text-neutral-200'
      } ${className}`}
    />
  );
};
