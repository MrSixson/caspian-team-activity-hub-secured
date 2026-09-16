import {
  User,
  ActivityReport,
  Warning,
  AppNotification,
  UserRole,
  PermissionLevel,
  ActivityStatus,
  StaffTask,
  MeetingAnnouncement,
  MeetingReport,
  Ticket,
  SystemAlert,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_REPORTS,
  INITIAL_WARNINGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_TASKS,
  INITIAL_MEETING_ANNOUNCEMENTS,
  INITIAL_MEETING_REPORTS,
  INITIAL_TICKETS,
  INITIAL_SYSTEM_ALERTS,
} from '../data/initialData';

const STORAGE_KEYS = {
  USERS: 'caspian_users_v3',
  REPORTS: 'caspian_reports_v3',
  WARNINGS: 'caspian_warnings_v3',
  NOTIFICATIONS: 'caspian_notifications_v3',
  CURRENT_USER_ID: 'caspian_current_user_id_v3',
  TASKS: 'caspian_tasks_v3',
  MEETING_ANNOUNCEMENTS: 'caspian_meeting_announcements_v4',
  MEETING_REPORTS: 'caspian_meeting_reports_v3',
  TICKETS: 'caspian_tickets_v1',
  SYSTEM_ALERTS: 'caspian_system_alerts_v1',
};

// Cross-tab and live sync notification helper
const broadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('caspian_storage_sync_channel')
  : null;

export function notifyStorageSync(type: string) {
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type, timestamp: Date.now() });
    } catch (e) {
      console.warn('BroadcastChannel error', e);
    }
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('caspian_storage_update', { detail: { type } }));
  }
}

// Storage helper functions
export function deduplicateById<T extends { id: string }>(items: T[]): T[] {
  if (!Array.isArray(items)) return [];
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    if (item && item.id && !seen.has(item.id)) {
      seen.add(item.id);
      result.push(item);
    }
  }
  return result;
}

export function deduplicateUsers(users: User[]): User[] {
  if (!Array.isArray(users)) return [];
  const seenIds = new Set<string>();
  const seenUsernames = new Set<string>();
  const result: User[] = [];
  
  for (const u of users) {
    if (!u || !u.id) continue;
    const cleanUname = (u.username || '').trim().toLowerCase();
    if (seenIds.has(u.id)) continue;
    if (cleanUname && seenUsernames.has(cleanUname)) continue;
    
    seenIds.add(u.id);
    if (cleanUname) seenUsernames.add(cleanUname);
    result.push(u);
  }
  return result;
}

export function getStoredUsers(): User[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    if (data) {
      const rawParsed: User[] = JSON.parse(data);
      let parsed = deduplicateUsers(rawParsed);

      // Ensure default leadership accounts exist if missing
      for (const initUser of INITIAL_USERS) {
        const found = parsed.some(
          (u) =>
            u.id === initUser.id ||
            u.username.toLowerCase() === initUser.username.toLowerCase() ||
            (u.email && initUser.email && u.email.toLowerCase() === initUser.email.toLowerCase())
        );
        if (!found) {
          parsed.push(initUser);
        }
      }

      // Ensure Amin Jodaie keeps full Owner permissions.
      // SECURITY: no password is set here. Credentials are held only by the
      // server (hashed); nothing credential-related belongs in the bundle.
      const amin = parsed.find(
        (u) =>
          u.username.toLowerCase() === 'amin jodaie' ||
          u.username.toLowerCase() === 'amin' ||
          u.email === 'aminjodaie314@gmail.com'
      );
      if (amin) {
        amin.permissionLevel = 'Owner';
        amin.isFounder = true;
        amin.isRankAssigned = true;
        amin.status = 'Active';
        amin.customPermissions = {
          canReviewReports: true,
          canIssueWarnings: true,
          canManageUsers: true,
          canManagePermissions: true,
        };
      }

      // Also ensure Behnam and Amirhossein are marked as rank assigned
      const behnam = parsed.find((u) => u.username.toLowerCase().includes('behnam') || u.role === 'Founder');
      if (behnam) {
        behnam.isRankAssigned = true;
      }
      const amirhossein = parsed.find((u) => u.username.toLowerCase().includes('amirhossein') || u.role === 'Supervisor');
      if (amirhossein) {
        amirhossein.isRankAssigned = true;
      }

      parsed = deduplicateUsers(parsed);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(parsed));
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load users from localStorage', e);
  }
  // Initialize with seed
  const seedUsers = deduplicateUsers(INITIAL_USERS);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(seedUsers));
  return seedUsers;
}

export function saveUsers(users: User[]): void {
  try {
    const cleanUsers = deduplicateUsers(users);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(cleanUsers));
    notifyStorageSync('USERS');
  } catch (e) {
    console.error('Failed to save users', e);
  }
}

export function getStoredReports(): ActivityReport[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.REPORTS);
    if (data) return deduplicateById(JSON.parse(data));
  } catch (e) {
    console.error('Failed to load reports', e);
  }
  const clean = deduplicateById(INITIAL_REPORTS);
  localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(clean));
  return clean;
}

export function saveReports(reports: ActivityReport[]): void {
  try {
    const clean = deduplicateById(reports);
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(clean));
    notifyStorageSync('REPORTS');
  } catch (e) {
    console.error('Failed to save reports', e);
  }
}

export function getStoredWarnings(): Warning[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.WARNINGS);
    if (data) return deduplicateById(JSON.parse(data));
  } catch (e) {
    console.error('Failed to load warnings', e);
  }
  const clean = deduplicateById(INITIAL_WARNINGS);
  localStorage.setItem(STORAGE_KEYS.WARNINGS, JSON.stringify(clean));
  return clean;
}

export function saveWarnings(warnings: Warning[]): void {
  try {
    const clean = deduplicateById(warnings);
    localStorage.setItem(STORAGE_KEYS.WARNINGS, JSON.stringify(clean));
    notifyStorageSync('WARNINGS');
  } catch (e) {
    console.error('Failed to save warnings', e);
  }
}

export function getStoredNotifications(): AppNotification[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (data) return deduplicateById(JSON.parse(data));
  } catch (e) {
    console.error('Failed to load notifications', e);
  }
  const clean = deduplicateById(INITIAL_NOTIFICATIONS);
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(clean));
  return clean;
}

export function saveNotifications(notifications: AppNotification[]): void {
  try {
    const clean = deduplicateById(notifications);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(clean));
    notifyStorageSync('NOTIFICATIONS');
  } catch (e) {
    console.error('Failed to save notifications', e);
  }
}

// Tasks storage
export function getStoredTasks(): StaffTask[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (data) return deduplicateById(JSON.parse(data));
  } catch (e) {
    console.error('Failed to load tasks', e);
  }
  const clean = deduplicateById(INITIAL_TASKS);
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(clean));
  return clean;
}

export function saveTasks(tasks: StaffTask[]): void {
  try {
    const clean = deduplicateById(tasks);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(clean));
    notifyStorageSync('TASKS');
  } catch (e) {
    console.error('Failed to save tasks', e);
  }
}

// Meeting announcements storage
export function getStoredMeetingAnnouncements(): MeetingAnnouncement[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.MEETING_ANNOUNCEMENTS);
    if (data) return deduplicateById(JSON.parse(data));
  } catch (e) {
    console.error('Failed to load meeting announcements', e);
  }
  const clean = deduplicateById(INITIAL_MEETING_ANNOUNCEMENTS);
  localStorage.setItem(STORAGE_KEYS.MEETING_ANNOUNCEMENTS, JSON.stringify(clean));
  return clean;
}

export function saveMeetingAnnouncements(announcements: MeetingAnnouncement[]): void {
  try {
    const clean = deduplicateById(announcements);
    localStorage.setItem(STORAGE_KEYS.MEETING_ANNOUNCEMENTS, JSON.stringify(clean));
    notifyStorageSync('MEETING_ANNOUNCEMENTS');
  } catch (e) {
    console.error('Failed to save meeting announcements', e);
  }
}

// Meeting reports storage
export function getStoredMeetingReports(): MeetingReport[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.MEETING_REPORTS);
    if (data) return deduplicateById(JSON.parse(data));
  } catch (e) {
    console.error('Failed to load meeting reports', e);
  }
  const clean = deduplicateById(INITIAL_MEETING_REPORTS);
  localStorage.setItem(STORAGE_KEYS.MEETING_REPORTS, JSON.stringify(clean));
  return clean;
}

export function saveMeetingReports(reports: MeetingReport[]): void {
  try {
    const clean = deduplicateById(reports);
    localStorage.setItem(STORAGE_KEYS.MEETING_REPORTS, JSON.stringify(clean));
    notifyStorageSync('MEETING_REPORTS');
  } catch (e) {
    console.error('Failed to save meeting reports', e);
  }
}

// Tickets storage
export function getStoredTickets(): Ticket[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TICKETS);
    if (data) return deduplicateById(JSON.parse(data));
  } catch (e) {
    console.error('Failed to load tickets', e);
  }
  const clean = deduplicateById(INITIAL_TICKETS);
  localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(clean));
  return clean;
}

export function saveTickets(tickets: Ticket[]): void {
  try {
    const clean = deduplicateById(tickets);
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(clean));
    notifyStorageSync('TICKETS');
  } catch (e) {
    console.error('Failed to save tickets', e);
  }
}

// System Alerts storage
export function getStoredSystemAlerts(): SystemAlert[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SYSTEM_ALERTS);
    if (data) return deduplicateById(JSON.parse(data));
  } catch (e) {
    console.error('Failed to load system alerts', e);
  }
  const clean = deduplicateById(INITIAL_SYSTEM_ALERTS);
  localStorage.setItem(STORAGE_KEYS.SYSTEM_ALERTS, JSON.stringify(clean));
  return clean;
}

export function saveSystemAlerts(alerts: SystemAlert[]): void {
  const clean = deduplicateById(alerts);
  localStorage.setItem(STORAGE_KEYS.SYSTEM_ALERTS, JSON.stringify(clean));
  notifyStorageSync('SYSTEM_ALERTS');
}

export function getCurrentUserId(): string | null {
  return localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || null;
}

export function setCurrentUserId(userId: string | null): void {
  if (userId) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
  }
}

export function resetToSeedData(): void {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
  localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(INITIAL_REPORTS));
  localStorage.setItem(STORAGE_KEYS.WARNINGS, JSON.stringify(INITIAL_WARNINGS));
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(INITIAL_TASKS));
  localStorage.setItem(STORAGE_KEYS.MEETING_ANNOUNCEMENTS, JSON.stringify(INITIAL_MEETING_ANNOUNCEMENTS));
  localStorage.setItem(STORAGE_KEYS.MEETING_REPORTS, JSON.stringify(INITIAL_MEETING_REPORTS));
  localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(INITIAL_TICKETS));
  localStorage.setItem(STORAGE_KEYS.SYSTEM_ALERTS, JSON.stringify(INITIAL_SYSTEM_ALERTS));
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
}
