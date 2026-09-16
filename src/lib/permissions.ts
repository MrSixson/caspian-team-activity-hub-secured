import { User, UserRole } from '../types';

export const TOP_FOUR_RANKS: UserRole[] = [
  'Founder',
  'Owner',
  'Supervisor',
  'Moderator',
  'Manager',
];

export const MANAGEMENT_RANKS: UserRole[] = [
  'Founder',
  'Owner',
  'Supervisor',
  'Moderator',
  'Manager',
];

export function isTopFourRank(role: UserRole): boolean {
  return TOP_FOUR_RANKS.includes(role);
}

export function isManagementRank(role: UserRole): boolean {
  return MANAGEMENT_RANKS.includes(role);
}

/**
 * Check if a user is one of the 4 Top Admin Ranks who can manage, assign roles, and handle tickets
 */
export function canManageTickets(user: User | null): boolean {
  if (!user) return false;
  if (isTopFourRank(user.role) || isManagementRank(user.role)) return true;
  if (user.permissionLevel === 'Founder' || user.permissionLevel === 'Owner') return true;
  return !!user.customPermissions?.canManageUsers;
}

/**
 * Check if a user can review, approve, reject, or comment on activity reports
 */
export function canReviewReports(user: User | null): boolean {
  if (!user) return false;
  if (isManagementRank(user.role)) return true;
  return !!user.customPermissions?.canReviewReports;
}

/**
 * Check if a user can issue warnings to members
 */
export function canIssueWarnings(user: User | null): boolean {
  if (!user) return false;
  if (isManagementRank(user.role)) return true;
  return !!user.customPermissions?.canIssueWarnings;
}

/**
 * Check if a user can manage accounts (approve registrations, suspend/unsuspend, delete, or change roles)
 */
export function canManageUsers(user: User | null): boolean {
  if (!user) return false;
  if (isManagementRank(user.role)) return true;
  return !!user.customPermissions?.canManageUsers;
}

/**
 * Check if a user can grant or revoke custom permissions for other staff members
 */
export function canManagePermissions(user: User | null): boolean {
  if (!user) return false;
  if (isManagementRank(user.role)) return true;
  return !!user.customPermissions?.canManagePermissions;
}
