import React from 'react';
import { UserRole } from '../types';
import { getRoleStyle, ROLE_COLORS } from '../lib/roleColors';

interface RoleBadgeProps {
  role: UserRole;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'badge' | 'solid' | 'text';
  showDot?: boolean;
  className?: string;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({
  role,
  size = 'sm',
  variant = 'badge',
  showDot = true,
  className = '',
}) => {
  const { style, dotColor } = getRoleStyle(role, variant as 'badge' | 'solid' | 'text');

  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5 rounded-md gap-1 font-semibold',
    sm: 'text-xs px-2.5 py-1 rounded-lg gap-1.5 font-bold',
    md: 'text-sm px-3 py-1.5 rounded-xl gap-2 font-extrabold',
    lg: 'text-base px-4 py-2 rounded-2xl gap-2.5 font-black',
  };

  const dotSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  return (
    <span
      style={style}
      className={`inline-flex items-center tracking-wide uppercase transition-all whitespace-nowrap select-none ${sizeClasses[size]} ${className}`}
    >
      {showDot && (
        <span
          className={`rounded-full shrink-0 ${dotSizes[size]}`}
          style={{
            backgroundColor: dotColor,
            boxShadow: `0 0 6px ${dotColor}`,
          }}
        />
      )}
      <span>{role}</span>
    </span>
  );
};
