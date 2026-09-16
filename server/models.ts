// ==========================================
// Domain models shared by the backend
// NOTE: passwords are NEVER stored here in plaintext.
//       Only `passwordHash` (scrypt) is persisted.
// ==========================================

export type UserRole =
  | 'Founder'
  | 'Owner'
  | 'Supervisor'
  | 'Moderator'
  | 'Manager'
  | 'Head Admin'
  | 'Senior Admin'
  | 'Admin'
  | 'Trial Admin'
  | 'Senior Helper'
  | 'Helper'
  | 'Trial Helper';

export type PermissionLevel = 'Founder' | 'Owner' | 'HighRank' | 'Staff' | 'User';

export interface CustomPermissions {
  canReviewReports?: boolean;
  canIssueWarnings?: boolean;
  canManageUsers?: boolean;
  canManagePermissions?: boolean;
}

export interface User {
  id: string;
  username: string;
  /** scrypt hash — never a plaintext password. */
  passwordHash: string;
  mustChangePassword?: boolean;
  firstName: string;
  lastName: string;
  email: string;
  teamspeakName: string;
  role: UserRole;
  permissionLevel: PermissionLevel;
  isFounder: boolean;
  status: 'Active' | 'Pending' | 'Suspended';
  isRankAssigned: boolean;
  registrationDate: string;
  avatarUrl?: string;
  customPermissions?: CustomPermissions;
  passwordUpdatedAt?: string;
}

/** What the client is allowed to see. Never includes credential material. */
export type PublicUser = Omit<User, 'passwordHash'> & { hasPassword: boolean };

export interface ActivityReport {
  id: string;
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  date: string;
  loginTime: string;
  logoutTime: string;
  totalHours: number;
  teamspeakScreenshot: string;
  description: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  adminComment?: string;
  points?: number;
  createdAt: string;
}

export interface Warning {
  id: string;
  userId: string;
  targetUsername: string;
  targetRole: UserRole;
  issuedBy: string;
  issuedByRole: UserRole;
  reason: string;
  type: 'Verbal' | 'Warning_1' | 'Warning_2' | 'Final_Warning';
  pointsDeduction: number;
  date: string;
  createdAt: string;
}

export interface StaffTask {
  id: string;
  title: string;
  description: string;
  assignedToRole?: UserRole | 'All';
  assignedToUserId?: string;
  assignedToName?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Pending' | 'InProgress' | 'Completed' | 'Cancelled';
  dueDate: string;
  createdById: string;
  createdByName: string;
  createdByRole: UserRole;
  createdAt: string;
  completedAt?: string;
  proofUrl?: string;
  notes?: string;
}

export interface MeetingAnnouncement {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  targetAudience: string;
  status: 'Upcoming' | 'Live' | 'Concluded' | 'Cancelled';
  createdById: string;
  createdByName: string;
  createdByRole: UserRole;
  createdAt: string;
  attendees: string[];
}

export interface MeetingReport {
  id: string;
  announcementId?: string;
  title: string;
  date: string;
  time: string;
  recordedById: string;
  recordedByName: string;
  recordedByRole: UserRole;
  founderStatements: string;
  decisions: string[];
  actionItems: string[];
  summary: string;
  attachmentUrl?: string;
  createdAt: string;
}

export interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  message: string;
  createdAt: string;
  isStaffReply?: boolean;
  isInternalNote?: boolean;
  attachmentUrl?: string;
}

export interface Ticket {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  userAvatar?: string;
  userTeamspeak?: string;
  type: 'RoleRequest' | 'LeaveRequest' | 'HighRankTalk' | 'GeneralSupport' | 'TechnicalSupport';
  title: string;
  subject: string;
  status: 'Open' | 'InReview' | 'Answered' | 'Closed' | 'OnHold';
  priority?: 'Low' | 'Normal' | 'High' | 'Urgent';
  assignedAdminId?: string;
  assignedAdminName?: string;
  assignedAdminRole?: UserRole;
  startDate?: string;
  endDate?: string;
  leaveReason?: string;
  emergencyContact?: string;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
}

export interface SystemAlert {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'urgent';
  createdAt: string;
  expiresAt?: string;
  active: boolean;
  createdByName: string;
}

// ==========================================
// Role hierarchy
// ==========================================

/** Higher number == more authority. Used to block privilege escalation. */
export const ROLE_RANK: Record<UserRole, number> = {
  Founder: 100,
  Owner: 90,
  Supervisor: 80,
  Moderator: 75,
  Manager: 70,
  'Head Admin': 65,
  'Senior Admin': 60,
  Admin: 55,
  'Trial Admin': 50,
  'Senior Helper': 40,
  Helper: 30,
  'Trial Helper': 20,
};

export const ALL_ROLES = Object.keys(ROLE_RANK) as UserRole[];

export function isValidRole(value: unknown): value is UserRole {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(ROLE_RANK, value);
}

export function rankOf(role: UserRole | undefined): number {
  if (!role || !isValidRole(role)) return 0;
  return ROLE_RANK[role];
}

/** The permission level that a role implies. Clients cannot pick this themselves. */
export function permissionLevelForRole(role: UserRole): PermissionLevel {
  if (role === 'Founder') return 'Founder';
  if (role === 'Owner') return 'Owner';
  if (['Supervisor', 'Moderator', 'Manager', 'Head Admin'].includes(role)) return 'HighRank';
  return 'Staff';
}

// ==========================================
// Abilities
// ==========================================

export type Ability =
  | 'reviewReports'
  | 'issueWarnings'
  | 'manageUsers'
  | 'managePermissions'
  | 'manageContent'
  | 'manageTickets';

const HIGH_LEVELS: PermissionLevel[] = ['Founder', 'Owner', 'HighRank'];

export function hasAbility(user: User | undefined | null, ability: Ability): boolean {
  if (!user) return false;
  if (user.status !== 'Active') return false;
  if (user.permissionLevel === 'Founder') return true;

  const custom = user.customPermissions || {};
  const isHigh = HIGH_LEVELS.includes(user.permissionLevel);

  switch (ability) {
    case 'reviewReports':
      return custom.canReviewReports === true || isHigh;
    case 'issueWarnings':
      return custom.canIssueWarnings === true || isHigh;
    case 'manageUsers':
      return custom.canManageUsers === true || isHigh;
    case 'managePermissions':
      return custom.canManagePermissions === true || user.permissionLevel === 'Owner';
    case 'manageContent':
      return isHigh || custom.canManageUsers === true;
    case 'manageTickets':
      return isHigh || custom.canManageUsers === true || custom.canReviewReports === true;
    default:
      return false;
  }
}

/**
 * An actor may only act on a target of strictly lower rank (Founders excepted,
 * who may act on peers but never on themselves for role changes).
 */
export function canActOn(actor: User, target: User): boolean {
  if (actor.id === target.id) return true;
  const a = rankOf(actor.role);
  const t = rankOf(target.role);
  if (actor.permissionLevel === 'Founder') return true;
  return a > t;
}

// ==========================================
// Output sanitizing
// ==========================================

/**
 * Strips every credential field before a user object leaves the process.
 * `viewer` controls whether contact details are included.
 */
export function toPublicUser(user: User, viewer?: User | null): PublicUser {
  const { passwordHash, ...rest } = user;
  const isSelf = viewer?.id === user.id;
  const isManager = hasAbility(viewer, 'manageUsers');

  const safe: PublicUser = {
    ...rest,
    hasPassword: Boolean(passwordHash),
  };

  // Contact details are only exposed to the owner of the account and to managers.
  if (!isSelf && !isManager) {
    safe.email = '';
    safe.teamspeakName = user.teamspeakName;
  }
  return safe;
}

export function toPublicUsers(users: User[], viewer?: User | null): PublicUser[] {
  return users.map((u) => toPublicUser(u, viewer));
}
