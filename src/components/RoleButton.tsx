import React, { useState } from 'react';
import { UserRole } from '../types';
import { ROLE_COLORS, getRoleButtonStyle } from '../lib/roleColors';

interface RoleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  role: UserRole;
  variant?: 'outline' | 'solid' | 'subtle' | 'glow';
  isActive?: boolean;
  children: React.ReactNode;
  className?: string;
  showRankDot?: boolean;
}

export const RoleButton: React.FC<RoleButtonProps> = ({
  role,
  variant = 'outline',
  isActive = false,
  children,
  className = '',
  showRankDot = false,
  style: userStyle,
  onMouseEnter,
  onMouseLeave,
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const info = ROLE_COLORS[role] || { hex: '#38bdf8', isLightTextOnSolid: true, glowHex: '#38bdf8' };
  const isFounderBlack = info.hex === '#000000' || role === 'Founder';
  const glowHex = isFounderBlack ? '#ffffff' : info.glowHex;

  const baseStyle = getRoleButtonStyle(role, variant as 'outline' | 'solid' | 'subtle' | 'glow', isActive || isHovered);

  // Additional dynamic hover shadow boost
  const computedStyle: React.CSSProperties = {
    ...baseStyle,
    boxShadow: isHovered
      ? isFounderBlack
        ? '0 0 20px rgba(255, 255, 255, 0.95), 0 0 8px rgba(0, 0, 0, 0.6)'
        : `0 0 20px ${glowHex}a0, 0 0 8px ${info.hex}`
      : baseStyle.boxShadow,
    transform: isHovered ? 'translateY(-1px) scale(1.01)' : 'translateY(0) scale(1)',
    ...userStyle,
  };

  return (
    <button
      style={computedStyle}
      className={`relative inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs transition-all duration-200 select-none ${className}`}
      onMouseEnter={(e) => {
        setIsHovered(true);
        if (onMouseEnter) onMouseEnter(e);
      }}
      onMouseLeave={(e) => {
        setIsHovered(false);
        if (onMouseLeave) onMouseLeave(e);
      }}
      {...props}
    >
      {showRankDot && (
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{
            backgroundColor: isFounderBlack ? '#000000' : info.hex,
            boxShadow: `0 0 6px ${isFounderBlack ? 'rgba(0, 0, 0, 0.8)' : info.hex}`,
          }}
        />
      )}
      {children}
    </button>
  );
};
