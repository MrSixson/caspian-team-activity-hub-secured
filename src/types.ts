export type PermissionLevel = 'Owner' | 'Founder' | 'Staff';

export type AccountStatus = 'Pending' | 'Active' | 'Suspended';

export type UserRole =
  | 'Founder'
  | 'Owner'
  | 'Manager'
  | 'Supervisor'
  | 'Moderator'
  | 'Administrator'
  | 'Development Team'
  | 'Faction Manager'
  | 'Faction Advisor'
  | 'Head Admin'
  | 'Senior Admin'
  | 'Admin'
  | 'Trial Admin'
  | 'Helper Manager'
  | 'Helper';

export const ALL_ROLES: UserRole[] = [
  'Founder',
  'Owner',
  'Manager',
  'Supervisor',
  'Moderator',
  'Administrator',
  'Development Team',
  'Faction Manager',
  'Faction Advisor',
  'Head Admin',
  'Senior Admin',
  'Admin',
  'Trial Admin',
  'Helper Manager',
  'Helper',
];

export interface UserPermissions {
  canReviewReports?: boolean;
  canIssueWarnings?: boolean;
  canManageUsers?: boolean;
  canManagePermissions?: boolean;
}

export interface User {
  id: string;
  username: string;
  // SECURITY: credentials never live on the client. Auth happens on the server.
  firstName: string;
  lastName: string;
  email: string;
  teamspeakName: string;
  role: UserRole;
  permissionLevel: PermissionLevel;
  isFounder: boolean;
  status: AccountStatus;
  registrationDate: string; // ISO date string
  avatarUrl?: string;
  lastLogin?: string;
  isOnline?: boolean;
  isRankAssigned?: boolean;
  customPermissions?: UserPermissions;
  bio?: string;
  discordTag?: string;
  steamId?: string;
  phoneNumber?: string;
}

export type ActivityStatus = 'Pending' | 'Approved' | 'Rejected';

export interface ActivityReport {
  id: string;
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  teamspeakScreenshot: string; // Base64 or URL
  loginTime: string; // e.g., "14:00" or ISO
  logoutTime: string; // e.g., "18:30" or ISO
  totalHours: number; // e.g., 4.5
  description: string;
  date: string; // YYYY-MM-DD
  month: string; // e.g. "August"
  year: number; // e.g. 2026
  createdAt: string; // ISO string
  status: ActivityStatus;
  reviewerId?: string;
  reviewerName?: string;
  reviewerComment?: string;
  reviewedAt?: string;
}

export type WarningSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Warning {
  id: string;
  userId: string;
  issuedById: string;
  issuedByName: string;
  issuedByRole: UserRole;
  reason: string;
  description: string;
  severity: WarningSeverity;
  date: string; // YYYY-MM-DD
  createdAt: string;
  acknowledged: boolean;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'activity_approved' | 'activity_rejected' | 'warning' | 'role_changed' | 'account_approved' | 'password_changed' | 'task_assigned' | 'meeting_announced';
  createdAt: string;
  read: boolean;
  linkTab?: string;
}

export interface MonthlyArchiveSummary {
  year: number;
  month: string;
  totalHours: number;
  activityCount: number;
  approvedCount: number;
  rejectedCount: number;
  warningsCount: number;
  roleAtPeriod: UserRole;
  reports: ActivityReport[];
}

export type TaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'Verified';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface StaffTask {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  assignedToType: 'All' | 'Rank' | 'User';
  targetRole?: UserRole;
  targetUserId?: string;
  targetUserName?: string;
  createdById: string;
  createdByName: string;
  createdByRole: UserRole;
  createdAt: string;
  deadlineDate: string; // YYYY-MM-DD
  monthYear: string; // e.g. "مرداد ۱۴۰۵"
  status: TaskStatus;
  completionNotes?: string;
  completedAt?: string;
  proofUrl?: string;
}

export type MeetingStatus = 'Upcoming' | 'Live' | 'Concluded' | 'Cancelled';

export interface MeetingAnnouncement {
  id: string;
  title: string;
  description: string;
  meetingDate: string; // YYYY-MM-DD
  meetingTime: string; // e.g., "21:00"
  locationOrRoom: string; // e.g., "TeamSpeak Channel #1"
  targetAudience: string; // e.g., "تمامی اعضای استف"
  createdById: string;
  createdByName: string;
  createdByRole: UserRole;
  createdAt: string;
  status: MeetingStatus;
  attendees: string[]; // List of user IDs who RSVP'd "شرکت می‌کنم"
}

export interface MeetingReport {
  id: string;
  meetingTitle: string;
  meetingDate: string; // YYYY-MM-DD
  meetingTime: string; // e.g., "21:00"
  founderStatements: string; // سخنان و دستورات فاندر
  keyDecisions: string[]; // تصمیمات اتخاذ شده
  actionItems: string[]; // مصوبات و وظایف بعدی
  fullSummary: string; // متن کامل و خلاصه صورت‌جلسه
  attachmentUrl?: string; // فایل / لینک پیوست
  recordedById: string;
  recordedByName: string;
  recordedByRole: UserRole;
  createdAt: string;
}

export type TicketType = 'HighRankTalk' | 'LeaveRequest' | 'RoleRequest' | 'TechnicalSupport';
export type TicketStatus = 'Open' | 'InReview' | 'Answered' | 'Closed' | 'OnHold';
export type TicketPriority = 'Low' | 'Normal' | 'High' | 'Urgent';

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
  type: TicketType;
  title: string;
  subject: string;
  status: TicketStatus;
  priority?: TicketPriority;
  assignedAdminId?: string;
  assignedAdminName?: string;
  assignedAdminRole?: UserRole;
  createdAt: string;
  updatedAt: string;
  // Leave request specific fields
  startDate?: string;
  endDate?: string;
  leaveReason?: string;
  emergencyContact?: string;
  messages: TicketMessage[];
}

export interface SystemAlert {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'danger';
  active: boolean;
  createdByName: string;
  createdByRole: UserRole;
  createdAt: string;
}

