import {
  MeetingAnnouncement,
  StaffTask,
  Ticket,
  User,
  UserRole,
  CustomPermissions,
  permissionLevelForRole,
} from './models';
import { generateStrongPassword, hashPassword } from './security';

const FULL_PERMISSIONS: CustomPermissions = {
  canReviewReports: true,
  canIssueWarnings: true,
  canManageUsers: true,
  canManagePermissions: true,
};

/**
 * Core accounts, WITHOUT credentials.
 *
 * Passwords are supplied at runtime via environment variables (see .env.example).
 * If an env var is missing, a random password is generated on first boot and
 * printed to the server console exactly once. Nothing is ever hardcoded here,
 * so no credential can leak into git history or the frontend bundle.
 */
interface SeedDefinition {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  teamspeakName: string;
  role: UserRole;
  isFounder: boolean;
  /** env var holding the initial password for this account */
  passwordEnvVar: string;
  customPermissions?: CustomPermissions;
}

export const SEED_DEFINITIONS: SeedDefinition[] = [
  {
    id: 'user-behnam-founder-1',
    username: 'Behnam Bahramian',
    firstName: 'بهنام',
    lastName: 'بهرامیان',
    email: 'behnam@caspian.ir',
    teamspeakName: 'Behnam_Founder',
    role: 'Founder',
    isFounder: true,
    passwordEnvVar: 'SEED_FOUNDER_PASSWORD',
    customPermissions: FULL_PERMISSIONS,
  },
  {
    id: 'user-amin-owner-1',
    username: 'Amin Jodaie',
    firstName: 'امین',
    lastName: 'جدایی',
    email: 'aminjodaie314@gmail.com',
    teamspeakName: 'Amin_Moderator',
    role: 'Moderator',
    isFounder: true,
    passwordEnvVar: 'SEED_OWNER_PASSWORD',
    customPermissions: FULL_PERMISSIONS,
  },
  {
    id: 'user-amirhossein-supervisor-1',
    username: 'Amirhossein Jafari',
    firstName: 'امیرحسین',
    lastName: 'جعفری',
    email: 'amirhossein@caspian.ir',
    teamspeakName: 'Amirhossein_Supervisor',
    role: 'Supervisor',
    isFounder: false,
    passwordEnvVar: 'SEED_SUPERVISOR_PASSWORD',
    customPermissions: FULL_PERMISSIONS,
  },
];

export interface SeededCredential {
  username: string;
  password: string;
  envVar: string;
}

/**
 * Builds the seed users with hashed passwords.
 * Returns any credentials that had to be generated, so the caller can print
 * them to the operator console one time.
 */
export async function buildSeedUsers(): Promise<{ users: User[]; generated: SeededCredential[] }> {
  const users: User[] = [];
  const generated: SeededCredential[] = [];

  for (const def of SEED_DEFINITIONS) {
    const fromEnv = process.env[def.passwordEnvVar];
    const password = fromEnv && fromEnv.trim().length > 0 ? fromEnv.trim() : generateStrongPassword();
    const wasGenerated = !fromEnv || fromEnv.trim().length === 0;

    if (wasGenerated) {
      generated.push({ username: def.username, password, envVar: def.passwordEnvVar });
    }

    users.push({
      id: def.id,
      username: def.username,
      passwordHash: await hashPassword(password),
      // Force a change on first login when we had to invent the password.
      mustChangePassword: wasGenerated,
      firstName: def.firstName,
      lastName: def.lastName,
      email: def.email,
      teamspeakName: def.teamspeakName,
      role: def.role,
      permissionLevel: def.isFounder && def.role !== 'Founder' ? 'Owner' : permissionLevelForRole(def.role),
      isFounder: def.isFounder,
      status: 'Active',
      isRankAssigned: true,
      registrationDate: '2026-08-01',
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(def.id)}`,
      customPermissions: def.customPermissions,
      passwordUpdatedAt: new Date().toISOString(),
    });
  }

  return { users, generated };
}

export const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'ticket-101',
    userId: 'user-amirhossein-supervisor-1',
    userName: 'امیرحسین جعفری',
    userRole: 'Supervisor',
    type: 'HighRankTalk',
    title: 'هماهنگی جلسه ماهانه مدیریت ارشد سرور',
    subject: 'درخواست جلسه خصوصی بررسی عملکرد ادمین‌ها',
    status: 'InReview',
    createdAt: '2026-08-10T14:30:00Z',
    updatedAt: '2026-08-11T10:00:00Z',
    messages: [
      {
        id: 'msg-1',
        senderId: 'user-amirhossein-supervisor-1',
        senderName: 'امیرحسین جعفری',
        senderRole: 'Supervisor',
        message: 'سلام وقت بخیر. لطفاً زمان جلسه خصوصی بررسی عملکرد ادمین‌ها را مشخص کنید.',
        createdAt: '2026-08-10T14:30:00Z',
      },
      {
        id: 'msg-2',
        senderId: 'user-behnam-founder-1',
        senderName: 'بهنام بهرامیان',
        senderRole: 'Founder',
        message: 'سلام. جلسه روز جمعه ساعت ۲۱ در کانال اختصاصی برگزار می‌شود.',
        createdAt: '2026-08-11T10:00:00Z',
        isStaffReply: true,
      },
    ],
  },
];

export const INITIAL_TASKS: StaffTask[] = [
  {
    id: 'task-101',
    title: 'بررسی تیکت‌های پشتیبانی بخش پلیرها',
    description: 'تمام تیکت‌های پاسخ داده نشده در کانال هلپری تیم‌اسپیک تا ساعت ۲۲ بررسی و بسته شوند.',
    assignedToRole: 'Helper',
    priority: 'High',
    status: 'InProgress',
    dueDate: '2026-08-20',
    createdById: 'user-behnam-founder-1',
    createdByName: 'بهنام بهرامیان',
    createdByRole: 'Founder',
    createdAt: '2026-08-12T10:00:00Z',
  },
  {
    id: 'task-102',
    title: 'نظارت بر شیفت شبانه سرور',
    description: 'حضور منظم در روم Staff و ثبت گزارش کار شیفت شبانه در سامانه',
    assignedToRole: 'Admin',
    priority: 'Medium',
    status: 'Pending',
    dueDate: '2026-08-22',
    createdById: 'user-amin-owner-1',
    createdByName: 'امین جدایی',
    createdByRole: 'Moderator',
    createdAt: '2026-08-14T11:00:00Z',
  },
];

export const INITIAL_MEETING_ANNOUNCEMENTS: MeetingAnnouncement[] = [
  {
    id: 'meeting-101',
    title: 'جلسه عمومی کادر مدیریت و استف سرور کاسپین',
    description: 'بررسی ارتقاء رنک‌ها، تغییرات قوانین و تعیین شیفت‌های هفتگی جدید',
    date: '2026-08-20',
    time: '21:00',
    location: 'TeamSpeak 3 - Caspian Server (Ch: Staff Main Meeting)',
    targetAudience: 'تمامی اعضای استف (All Staff)',
    status: 'Upcoming',
    createdById: 'user-behnam-founder-1',
    createdByName: 'بهنام بهرامیان',
    createdByRole: 'Founder',
    createdAt: '2026-08-10T12:00:00Z',
    attendees: ['user-behnam-founder-1', 'user-amin-owner-1', 'user-amirhossein-supervisor-1'],
  },
];
