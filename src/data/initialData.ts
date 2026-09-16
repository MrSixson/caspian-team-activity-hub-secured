import { User, ActivityReport, Warning, AppNotification, StaffTask, MeetingAnnouncement, MeetingReport } from '../types';

// Helper to generate realistic SVG screenshots for TeamSpeak logs
export function generateSampleTsScreenshot(tsName: string, channel: string, timeStr: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
    <rect width="800" height="450" fill="#0f172a"/>
    <rect x="10" y="10" width="780" height="40" rx="6" fill="#1e293b"/>
    <circle cx="30" cy="30" r="6" fill="#ef4444"/>
    <circle cx="50" cy="30" r="6" fill="#f59e0b"/>
    <circle cx="70" cy="30" r="6" fill="#10b981"/>
    <text x="100" y="35" fill="#94a3b8" font-family="monospace" font-size="14" font-weight="bold">TeamSpeak 3 Client - [Caspian Community Server - ${timeStr}]</text>
    
    <!-- Sidebar -->
    <rect x="10" y="60" width="220" height="380" rx="6" fill="#182238" stroke="#334155" stroke-width="1"/>
    <text x="25" y="85" fill="#38bdf8" font-family="sans-serif" font-size="13" font-weight="bold">CASPIAN TEAMSPEAK</text>
    <text x="25" y="110" fill="#475569" font-family="sans-serif" font-size="11">▼ Default Channel</text>
    <text x="35" y="130" fill="#10b981" font-family="sans-serif" font-size="12">● ${tsName} [ONLINE]</text>
    <text x="25" y="160" fill="#38bdf8" font-family="sans-serif" font-size="12">▼ ${channel}</text>
    <text x="40" y="180" fill="#a7f3d0" font-family="sans-serif" font-size="12">🎙 ${tsName} (Active Speaker)</text>
    <text x="40" y="200" fill="#94a3b8" font-family="sans-serif" font-size="12">👤 User_Kian [Admin]</text>
    <text x="40" y="220" fill="#94a3b8" font-family="sans-serif" font-size="12">👤 User_Sina [Helper]</text>

    <!-- Main Content Chat/Log -->
    <rect x="240" y="60" width="550" height="380" rx="6" fill="#0b132b" stroke="#334155" stroke-width="1"/>
    <text x="260" y="90" fill="#38bdf8" font-family="monospace" font-size="14">--- Shift Verification Session Log ---</text>
    <text x="260" y="120" fill="#cbd5e1" font-family="monospace" font-size="12">[${timeStr}] Connected to server: ts.caspian-community.ir</text>
    <text x="260" y="145" fill="#cbd5e1" font-family="monospace" font-size="12">[${timeStr}] Switched to channel: ${channel}</text>
    <text x="260" y="170" fill="#60a5fa" font-family="monospace" font-size="12">[System] User '${tsName}' permission level verified.</text>
    <text x="260" y="195" fill="#34d399" font-family="monospace" font-size="12">[Shift Log] Started duty session. Active support handling enabled.</text>
    <text x="260" y="220" fill="#cbd5e1" font-family="monospace" font-size="12">[Client] Handled 8 player support requests in channel.</text>
    <text x="260" y="245" fill="#cbd5e1" font-family="monospace" font-size="12">[Client] Resolved TS rank assignment issue for user #104.</text>
    <text x="260" y="270" fill="#f59e0b" font-family="monospace" font-size="12">[Shift Log] Ending session. Screenshot captured for Caspian Team Activity.</text>

    <rect x="260" y="310" width="510" height="100" rx="4" fill="#1e293b" stroke="#0284c7" stroke-dasharray="4"/>
    <text x="280" y="340" fill="#e2e8f0" font-family="sans-serif" font-size="13" font-weight="bold">Verified TeamSpeak Stamp</text>
    <text x="280" y="365" fill="#94a3b8" font-family="sans-serif" font-size="12">User: ${tsName} | Channel: ${channel} | Status: VERIFIED</text>
    <text x="280" y="385" fill="#38bdf8" font-family="sans-serif" font-size="11">Caspian Team Activity System • Automated Duty Capture</text>
  </svg>`;
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

export const INITIAL_USERS: User[] = [
  {
    id: 'user-behnam-founder-1',
    username: 'Behnam Bahramian',
    firstName: 'بهنام',
    lastName: 'بهرامیان',
    email: 'behnam@caspian.ir',
    teamspeakName: 'Behnam_Founder',
    role: 'Founder',
    permissionLevel: 'Founder',
    isFounder: true,
    status: 'Active',
    isRankAssigned: true,
    registrationDate: '2026-08-01',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=behnam_founder',
    customPermissions: {
      canReviewReports: true,
      canIssueWarnings: true,
      canManageUsers: true,
      canManagePermissions: true,
    },
  },
  {
    id: 'user-amirhossein-supervisor-1',
    username: 'Amirhossein Jafari',
    firstName: 'امیرحسین',
    lastName: 'جعفری',
    email: 'amirhossein@caspian.ir',
    teamspeakName: 'Amirhossein_Supervisor',
    role: 'Supervisor',
    permissionLevel: 'Staff',
    isFounder: false,
    status: 'Active',
    isRankAssigned: true,
    registrationDate: '2026-08-01',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=amirhossein_supervisor',
    customPermissions: {
      canReviewReports: true,
      canIssueWarnings: true,
      canManageUsers: true,
      canManagePermissions: true,
    },
  },
  {
    id: 'user-amin-owner-1',
    username: 'Amin Jodaie',
    firstName: 'امین',
    lastName: 'جدایی',
    email: 'aminjodaie314@gmail.com',
    teamspeakName: 'Amin_Moderator',
    role: 'Moderator',
    permissionLevel: 'Owner',
    isFounder: true,
    status: 'Active',
    isRankAssigned: true,
    registrationDate: '2026-08-01',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=amin_jodaie',
    customPermissions: {
      canReviewReports: true,
      canIssueWarnings: true,
      canManageUsers: true,
      canManagePermissions: true,
    },
  },
];

export const INITIAL_REPORTS: ActivityReport[] = [];

export const INITIAL_WARNINGS: Warning[] = [];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [];

export const INITIAL_TICKETS: import('../types').Ticket[] = [
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
  {
    id: 'ticket-102',
    userId: 'user-amirhossein-supervisor-1',
    userName: 'امیرحسین جعفری',
    userRole: 'Supervisor',
    type: 'LeaveRequest',
    title: 'درخواست مرخصی ۳ روزه پایان هفته',
    subject: 'مرخصی به علت سفر کاری',
    status: 'Open',
    startDate: '1405-05-25',
    endDate: '1405-05-28',
    leaveReason: 'سفر کاری فشرده و عدم دسترسی به تیم اسپیک',
    emergencyContact: '09120000000',
    createdAt: '2026-08-12T09:00:00Z',
    updatedAt: '2026-08-12T09:00:00Z',
    messages: [
      {
        id: 'msg-3',
        senderId: 'user-amirhossein-supervisor-1',
        senderName: 'امیرحسین جعفری',
        senderRole: 'Supervisor',
        message: 'درخواست مرخصی از تاریخ ۲۵ تا ۲۸ مرداد را دارم. جانشین بنده در تیم اسپیک مشخص شده است.',
        createdAt: '2026-08-12T09:00:00Z',
      },
    ],
  },
];

export const INITIAL_SYSTEM_ALERTS: import('../types').SystemAlert[] = [
  {
    id: 'alert-1',
    title: 'کنسول مدیریت ارشد فعال است',
    message: 'تمامی تغییرات رنک، اخطارها و صورت‌جلسات مستقیماً در سامانه ثبت می‌شوند.',
    severity: 'danger',
    active: true,
    createdByName: 'بهنام بهرامیان',
    createdByRole: 'Founder',
    createdAt: '2026-08-13T00:00:00Z',
  },
];

// No demo preset accounts - new users sign up and Amin Jodaie assigns their ranks & permissions
export const SAMPLE_DEMO_USERS: User[] = [];

export const INITIAL_TASKS: StaffTask[] = [
  {
    id: 'task-1',
    title: 'بررسی و به‌روزرسانی قوانین جدید فکشن‌ها',
    description: 'تمامی ادمین‌ها و فکشن منیجرها موظف هستند قوانین جدید ورود به فکشن و ثبت فعالیت در تیم اسپیک را بررسی کرده و تایید نمایند.',
    priority: 'High',
    assignedToType: 'Rank',
    targetRole: 'Faction Manager',
    createdById: 'user-behnam-founder-1',
    createdByName: 'بهنام بهرامیان',
    createdByRole: 'Founder',
    createdAt: '2026-08-01T10:00:00Z',
    deadlineDate: '2026-08-20',
    monthYear: 'مرداد ۱۴۰۵',
    status: 'In Progress',
    completionNotes: 'قوانین در حال بازبینی با اعضای ارشد فکشن است.',
  },
  {
    id: 'task-2',
    title: 'برگزاری کلاس آموزشی هلپرهای جدید (Trial Helper)',
    description: 'آموزش دستورات عمومی سرور، نحوه پاسخگویی به ریپورت‌ها و قوانین فعالیت ساعتی به اعضای جدید ورودی مرداد ماه.',
    priority: 'Critical',
    assignedToType: 'Rank',
    targetRole: 'Helper Manager',
    createdById: 'user-behnam-founder-1',
    createdByName: 'بهنام بهرامیان',
    createdByRole: 'Founder',
    createdAt: '2026-08-03T12:00:00Z',
    deadlineDate: '2026-08-25',
    monthYear: 'مرداد ۱۴۰۵',
    status: 'Pending',
  },
  {
    id: 'task-3',
    title: 'ثبت مرتب گزارش کار ساعتی در سامانه کاسپین',
    description: 'کلیه ادمین‌ها، هلپرها و ناظرین باید اسکرین‌شات‌های تایم شیفت خود را روزانه ثبت نمایند.',
    priority: 'Medium',
    assignedToType: 'All',
    createdById: 'user-owner-1',
    createdByName: 'امیرحسین (Owner)',
    createdByRole: 'Owner',
    createdAt: '2026-08-01T08:00:00Z',
    deadlineDate: '2026-08-31',
    monthYear: 'مرداد ۱۴۰۵',
    status: 'In Progress',
  },
];

export const INITIAL_MEETING_ANNOUNCEMENTS: MeetingAnnouncement[] = [];

export const INITIAL_MEETING_REPORTS: MeetingReport[] = [
  {
    id: 'meeting-rep-1',
    meetingTitle: 'صورت‌جلسه ماهانه بررسی فعالیت کادر مدیریت - تیر ماه ۱۴۰۵',
    meetingDate: '2026-07-28',
    meetingTime: '21:30',
    founderStatements: 'فاندر محترم (بهنام بهرامیان) ضمن تشکر از زحمات تمامی اعضا در تیر ماه، بر لزوم برخورد صبورانه و محترمانه با تمام پلیرها تاکید کردند. همچنین مقرر شد افرادی که سیستم ثبت فعالیت را به موقع پر کنند پاداش بنوس ماهانه دریافت کنند.',
    keyDecisions: [
      'تایید ساخت و راه‌اندازی کامل سامانه آنلاین ثبت فعالیت و لینوکس انالیز',
      'تعیین حد حداقل ۱۰ ساعت فعالیت مفید هفتگی برای هلپرها و ۱۵ ساعت برای ادمین‌ها',
      'برگزاری دوره‌های آموزشی تخصصی برای هلپرهای جدیدالورود',
    ],
    actionItems: [
      'ارسال گزارش‌های ریویو شده توسط مدیران تا ۳۰ام هر ماه',
      'آماده‌سازی جدول ارتقا و تنزیل رنک‌ها توسط ناظرین سرور',
    ],
    fullSummary: 'جلسه راس ساعت ۲۱:۳۰ در تیم اسپیک رسمی کاسپین با حضور ۲۴ نفر از اعضای کادر شروع شد. در بخش اول به نظرات و پیشنهادات اعضا پاسخ داده شد و در ادامه فاندر بهنام بهرامیان دستورالعمل‌های جدید مدیریتی را ابلاغ نمودند.',
    attachmentUrl: 'https://caspian-community.ir/reports/july-2026-meeting.pdf',
    recordedById: 'user-behnam-founder-1',
    recordedByName: 'بهنام بهرامیان',
    recordedByRole: 'Founder',
    createdAt: '2026-07-28T23:00:00Z',
  },
];
