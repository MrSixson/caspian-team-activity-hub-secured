import type { CSSProperties } from 'react';
import { UserRole } from '../types';

export interface RoleColorInfo {
  hex: string;
  isLightTextOnSolid: boolean; // false if text on solid background should be dark
  glowHex: string;
}

export const ROLE_COLORS: Record<UserRole, RoleColorInfo> = {
  'Founder': { hex: '#000000', isLightTextOnSolid: false, glowHex: '#000000' },
  'Owner': { hex: '#ff0000', isLightTextOnSolid: true, glowHex: '#ff0000' },
  'Manager': { hex: '#C70C0E', isLightTextOnSolid: true, glowHex: '#C70C0E' },
  'Supervisor': { hex: '#0015ff', isLightTextOnSolid: true, glowHex: '#0015ff' },
  'Moderator': { hex: '#8400ff', isLightTextOnSolid: true, glowHex: '#8400ff' },
  'Administrator': { hex: '#fb00ff', isLightTextOnSolid: false, glowHex: '#fb00ff' },
  'Development Team': { hex: '#C0C0C0', isLightTextOnSolid: false, glowHex: '#C0C0C0' },
  'Faction Manager': { hex: '#00ffaa', isLightTextOnSolid: false, glowHex: '#00ffaa' },
  'Faction Advisor': { hex: '#00ff62', isLightTextOnSolid: false, glowHex: '#00ff62' },
  'Head Admin': { hex: '#ff7300', isLightTextOnSolid: false, glowHex: '#ff7300' },
  'Senior Admin': { hex: '#00fffb', isLightTextOnSolid: false, glowHex: '#00fffb' }, // rgb(0, 255, 251)
  'Admin': { hex: '#fff700', isLightTextOnSolid: false, glowHex: '#fff700' },
  'Trial Admin': { hex: '#008cff', isLightTextOnSolid: true, glowHex: '#008cff' },
  'Helper Manager': { hex: '#009903', isLightTextOnSolid: true, glowHex: '#009903' },
  'Helper': { hex: '#00ff04', isLightTextOnSolid: false, glowHex: '#00ff04' },
};

/**
 * Returns inline styles for a rank badge
 * variant 'badge': subtle dark background, full border in rank color, rank text in rank color or white with colored glow, plus glowing dot
 * variant 'solid': filled background with rank color
 */
export function getRoleStyle(role: UserRole, variant: 'badge' | 'solid' | 'text' = 'badge') {
  const info = ROLE_COLORS[role] || { hex: '#38bdf8', isLightTextOnSolid: true, glowHex: '#38bdf8' };
  const isBlack = info.hex === '#000000' || role === 'Founder';

  if (isBlack) {
    return {
      style: {
        backgroundColor: '#ffffff',
        borderColor: '#000000',
        borderWidth: '1.5px',
        borderStyle: 'solid',
        color: '#000000',
        fontWeight: '800',
        boxShadow: '0 0 12px rgba(255, 255, 255, 0.8), 0 0 4px rgba(0, 0, 0, 0.5)',
      },
      dotColor: '#000000',
    };
  }

  if (variant === 'solid') {
    return {
      style: {
        backgroundColor: info.hex,
        borderColor: info.hex,
        borderWidth: '1.5px',
        borderStyle: 'solid',
        color: info.isLightTextOnSolid ? '#ffffff' : '#090d16',
        boxShadow: `0 0 12px ${info.glowHex}60`,
      },
      dotColor: info.isLightTextOnSolid ? '#ffffff' : '#090d16',
    };
  }

  if (variant === 'text') {
    return {
      style: {
        color: info.hex,
        fontWeight: 'bold',
      },
      dotColor: info.hex,
    };
  }

  // default 'badge'
  return {
    style: {
      backgroundColor: `${info.hex}18`,
      borderColor: info.hex,
      borderWidth: '1.5px',
      borderStyle: 'solid',
      color: info.isLightTextOnSolid ? '#ffffff' : info.hex,
      boxShadow: `0 0 10px ${info.glowHex}35`,
    },
    dotColor: info.hex,
  };
}

/**
 * Generates custom border colors, backgrounds, text colors, and hover glow styles
 * for buttons matching the specific rank's hex code (e.g. #000000 Founder, #ff0000 Owner, #8400ff Moderator, etc.)
 */
export function getRoleButtonStyle(
  role: UserRole,
  variant: 'outline' | 'solid' | 'subtle' | 'glow' = 'outline',
  isActive: boolean = false
): CSSProperties {
  const info = ROLE_COLORS[role] || { hex: '#38bdf8', isLightTextOnSolid: true, glowHex: '#38bdf8' };
  const hex = info.hex;
  const isFounderBlack = hex === '#000000' || role === 'Founder';

  // Founder special treatment: white background, black text, black border line
  if (isFounderBlack) {
    return {
      backgroundColor: '#ffffff',
      borderColor: '#000000',
      borderWidth: '1.5px',
      borderStyle: 'solid',
      color: '#000000',
      fontWeight: '800',
      boxShadow: isActive
        ? '0 0 20px rgba(255, 255, 255, 0.95), 0 0 8px rgba(0, 0, 0, 0.6)'
        : '0 0 10px rgba(255, 255, 255, 0.6), 0 0 4px rgba(0, 0, 0, 0.3)',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    };
  }

  // Founder special treatment (#000000): pitch black background with solid white border line
  const borderHex = isFounderBlack ? '#ffffff' : hex;
  const glowHex = isFounderBlack ? '#ffffff' : info.glowHex;

  if (variant === 'solid') {
    return {
      backgroundColor: isFounderBlack ? '#000000' : hex,
      borderColor: '#ffffff',
      borderWidth: '1.5px',
      borderStyle: 'solid',
      color: '#ffffff',
      boxShadow: isActive
        ? `0 0 20px ${glowHex}a0, 0 0 6px #ffffff`
        : `0 0 10px ${glowHex}40`,
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    };
  }

  if (variant === 'glow') {
    return {
      backgroundColor: isFounderBlack ? '#000000' : `${hex}22`,
      borderColor: '#ffffff',
      borderWidth: '1.5px',
      borderStyle: 'solid',
      color: '#ffffff',
      boxShadow: isActive
        ? `0 0 24px rgba(255, 255, 255, 0.8), inset 0 0 12px rgba(255, 255, 255, 0.3)`
        : `0 0 14px rgba(255, 255, 255, 0.4)`,
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    };
  }

  if (variant === 'subtle') {
    return {
      backgroundColor: isFounderBlack ? '#000000' : `${hex}12`,
      borderColor: '#ffffff',
      borderWidth: '1.5px',
      borderStyle: 'solid',
      color: '#ffffff',
      boxShadow: isActive ? `0 0 14px rgba(255, 255, 255, 0.6)` : '0 0 6px rgba(255, 255, 255, 0.2)',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    };
  }

  // default 'outline'
  return {
    backgroundColor: isFounderBlack
      ? '#000000'
      : isActive ? `${hex}30` : `${hex}15`,
    borderColor: '#ffffff',
    borderWidth: '1.5px',
    borderStyle: 'solid',
    color: '#ffffff',
    boxShadow: isActive
      ? `0 0 18px rgba(255, 255, 255, 0.8), 0 0 6px #ffffff`
      : `0 0 10px rgba(255, 255, 255, 0.35)`,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  };
}
