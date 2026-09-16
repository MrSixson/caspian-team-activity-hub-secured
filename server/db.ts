import fs from 'fs';
import path from 'path';
import {
  ActivityReport,
  MeetingAnnouncement,
  MeetingReport,
  StaffTask,
  SystemAlert,
  Ticket,
  User,
  Warning,
} from './models';
import { hashPassword, isHashedPassword } from './security';
import {
  INITIAL_MEETING_ANNOUNCEMENTS,
  INITIAL_TASKS,
  INITIAL_TICKETS,
  SeededCredential,
  buildSeedUsers,
} from './seed';

export class DatabaseStore {
  public users: User[] = [];
  public reports: ActivityReport[] = [];
  public warnings: Warning[] = [];
  public tasks: StaffTask[] = [...INITIAL_TASKS];
  public meetingAnnouncements: MeetingAnnouncement[] = [...INITIAL_MEETING_ANNOUNCEMENTS];
  public meetingReports: MeetingReport[] = [];
  public tickets: Ticket[] = [...INITIAL_TICKETS];
  public alerts: SystemAlert[] = [];

  private storageFile = process.env.DATA_STORE_PATH
    ? path.resolve(process.env.DATA_STORE_PATH)
    : path.join(process.cwd(), 'data_store.json');

  /** Credentials generated on this boot that the operator must be shown once. */
  public pendingCredentialNotices: SeededCredential[] = [];

  async init(): Promise<void> {
    const { users: seedUsers, generated } = await buildSeedUsers();
    this.pendingCredentialNotices = generated;
    this.users = seedUsers;

    await this.loadFromDisk(seedUsers);
  }

  private async loadFromDisk(seedUsers: User[]): Promise<void> {
    try {
      if (!fs.existsSync(this.storageFile)) {
        this.saveToDisk();
        return;
      }

      const raw = fs.readFileSync(this.storageFile, 'utf-8');
      const data = JSON.parse(raw);

      if (Array.isArray(data.users)) this.users = data.users;
      if (Array.isArray(data.reports)) this.reports = data.reports;
      if (Array.isArray(data.warnings)) this.warnings = data.warnings;
      if (Array.isArray(data.tasks)) this.tasks = data.tasks;
      if (Array.isArray(data.meetingAnnouncements)) this.meetingAnnouncements = data.meetingAnnouncements;
      if (Array.isArray(data.meetingReports)) this.meetingReports = data.meetingReports;
      if (Array.isArray(data.tickets)) this.tickets = data.tickets;
      if (Array.isArray(data.alerts)) this.alerts = data.alerts;

      await this.migrateLegacyPasswords();
      this.ensureCoreUsers(seedUsers);
      this.saveToDisk();
    } catch (err) {
      console.warn('[db] data_store.json could not be read; continuing with seed data.', err);
    }
  }

  /**
   * Older versions of this app stored `password` in plaintext.
   * Any such value is hashed on load and the plaintext field is dropped,
   * so an existing deployment self-heals on the next restart.
   */
  private async migrateLegacyPasswords(): Promise<void> {
    let migrated = 0;

    for (const user of this.users as Array<User & { password?: string }>) {
      if (isHashedPassword(user.passwordHash)) {
        delete user.password;
        continue;
      }

      const legacy = typeof user.password === 'string' ? user.password : undefined;
      if (legacy && legacy.length > 0) {
        user.passwordHash = await hashPassword(legacy);
        // The old plaintext value was exposed in the frontend bundle and via
        // GET /api/users, so it must be treated as compromised.
        user.mustChangePassword = true;
        migrated++;
      } else if (!user.passwordHash) {
        // No usable credential: lock the account rather than allow a blank login.
        user.passwordHash = await hashPassword(`locked-${Math.random().toString(36).slice(2)}`);
        user.mustChangePassword = true;
      }
      delete user.password;
    }

    if (migrated > 0) {
      console.warn(
        `[db] ${migrated} plaintext password(s) were migrated to scrypt hashes. ` +
          'Those accounts are flagged to change their password on next login.'
      );
    }
  }

  /** Re-add core accounts if they were deleted, without ever resetting their password. */
  private ensureCoreUsers(seedUsers: User[]): void {
    for (const seed of seedUsers) {
      const exists = this.users.some(
        (u) =>
          u.id === seed.id ||
          u.username.toLowerCase() === seed.username.toLowerCase() ||
          (seed.email && u.email && u.email.toLowerCase() === seed.email.toLowerCase())
      );
      if (!exists) {
        this.users.push(seed);
      }
    }
  }

  public saveToDisk(): void {
    try {
      const payload = {
        users: this.users,
        reports: this.reports,
        warnings: this.warnings,
        tasks: this.tasks,
        meetingAnnouncements: this.meetingAnnouncements,
        meetingReports: this.meetingReports,
        tickets: this.tickets,
        alerts: this.alerts,
        updatedAt: new Date().toISOString(),
      };

      const tmp = `${this.storageFile}.tmp`;
      // 0600: the store holds password hashes, so only the service account may read it.
      fs.writeFileSync(tmp, JSON.stringify(payload, null, 2), { encoding: 'utf-8', mode: 0o600 });
      fs.renameSync(tmp, this.storageFile);
      try {
        fs.chmodSync(this.storageFile, 0o600);
      } catch {
        /* chmod is best-effort on non-POSIX hosts */
      }
    } catch (err) {
      console.error('[db] Error saving data_store.json', err);
    }
  }

  public async resetAll(): Promise<void> {
    const { users, generated } = await buildSeedUsers();
    this.pendingCredentialNotices = generated;
    this.users = users;
    this.reports = [];
    this.warnings = [];
    this.tasks = [...INITIAL_TASKS];
    this.meetingAnnouncements = [...INITIAL_MEETING_ANNOUNCEMENTS];
    this.meetingReports = [];
    this.tickets = [...INITIAL_TICKETS];
    this.alerts = [];
    this.saveToDisk();
  }

  public findUserById(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  public findUserByIdentifier(identifier: string): User | undefined {
    const needle = identifier.trim().toLowerCase();
    return this.users.find(
      (u) =>
        u.username.toLowerCase() === needle ||
        (u.email || '').toLowerCase() === needle ||
        (u.teamspeakName || '').toLowerCase() === needle
    );
  }
}
