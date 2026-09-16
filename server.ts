import express, { NextFunction, Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

import { DatabaseStore } from './server/db';
import {
  Ability,
  ActivityReport,
  MeetingAnnouncement,
  MeetingReport,
  StaffTask,
  SystemAlert,
  Ticket,
  TicketMessage,
  User,
  UserRole,
  Warning,
  canActOn,
  hasAbility,
  isValidRole,
  permissionLevelForRole,
  rankOf,
  toPublicUser,
  toPublicUsers,
} from './server/models';
import {
  clearRateLimit,
  createSession,
  destroyAllSessionsForUser,
  destroySession,
  extractBearerToken,
  hashPassword,
  rateLimit,
  readSession,
  startSecurityJanitor,
  validatePasswordStrength,
  verifyPassword,
} from './server/security';

dotenv.config();

const db = new DatabaseStore();

interface AuthedRequest extends Request {
  authUser?: User;
  authToken?: string;
}

// ==========================================
// Helpers
// ==========================================

function clientIp(req: Request): string {
  return (req.ip || req.socket.remoteAddress || 'unknown').toString();
}

function fail(res: Response, status: number, message: string): void {
  res.status(status).json({ success: false, message });
}

function str(value: unknown, max = 2000): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Internal notes must never reach a non-staff viewer. */
function visibleTicket(ticket: Ticket, viewer: User): Ticket {
  if (hasAbility(viewer, 'manageTickets')) return ticket;
  return { ...ticket, messages: ticket.messages.filter((m) => !m.isInternalNote) };
}

function canSeeTicket(ticket: Ticket, viewer: User): boolean {
  return ticket.userId === viewer.id || hasAbility(viewer, 'manageTickets');
}

function activeFounderCount(): number {
  return db.users.filter((u) => u.permissionLevel === 'Founder' && u.status === 'Active').length;
}

// ==========================================
// Auth middleware
// ==========================================

function loadSession(req: AuthedRequest, _res: Response, next: NextFunction): void {
  const token = extractBearerToken(req.header('authorization'));
  const session = readSession(token);
  if (session) {
    const user = db.findUserById(session.userId);
    // A suspended or deleted account loses its session immediately.
    if (!user || user.status === 'Suspended') {
      destroySession(token);
    } else {
      req.authUser = user;
      req.authToken = token;
    }
  }
  next();
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  if (!req.authUser) {
    fail(res, 401, 'برای دسترسی به این بخش باید وارد حساب کاربری خود شوید.');
    return;
  }
  if (req.authUser.status !== 'Active') {
    fail(res, 403, 'حساب کاربری شما فعال نیست.');
    return;
  }
  next();
}

function requireAbility(ability: Ability) {
  return (req: AuthedRequest, res: Response, next: NextFunction): void => {
    if (!req.authUser) {
      fail(res, 401, 'برای دسترسی به این بخش باید وارد حساب کاربری خود شوید.');
      return;
    }
    if (!hasAbility(req.authUser, ability)) {
      fail(res, 403, 'شما مجوز لازم برای انجام این عملیات را ندارید.');
      return;
    }
    next();
  };
}

function requireFounder(req: AuthedRequest, res: Response, next: NextFunction): void {
  if (!req.authUser) {
    fail(res, 401, 'برای دسترسی به این بخش باید وارد حساب کاربری خود شوید.');
    return;
  }
  if (req.authUser.permissionLevel !== 'Founder') {
    fail(res, 403, 'این عملیات تنها توسط فاندر سرور قابل انجام است.');
    return;
  }
  next();
}

// ==========================================
// Gemini
// ==========================================

/**
 * The Gemini SDK is loaded on demand, not at startup. If the package is
 * missing, only partially installed, or has a broken export map on a given
 * platform, this only disables the AI endpoints (which already have a
 * rule-based fallback) instead of crashing the whole server.
 */
let cachedAiClient: any | null | undefined;

async function getAiClient(): Promise<any | null> {
  if (cachedAiClient !== undefined) return cachedAiClient;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    cachedAiClient = null;
    return null;
  }

  try {
    const mod: any = await import('@google/genai');
    const GoogleGenAI = mod.GoogleGenAI;
    cachedAiClient = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });
  } catch (err) {
    console.warn(
      '[ai] @google/genai could not be loaded (package missing or broken install). ' +
        'AI endpoints will use their built-in text fallback instead. Details:',
      (err as Error)?.message || err
    );
    cachedAiClient = null;
  }

  return cachedAiClient;
}

// ==========================================
// Bootstrap
// ==========================================

async function startServer() {
  await db.init();

  if (db.pendingCredentialNotices.length > 0) {
    console.warn('');
    console.warn('=======================================================================');
    console.warn(' INITIAL CREDENTIALS GENERATED (shown once — store them securely now)');
    console.warn(' Set the matching env var to control these passwords yourself.');
    console.warn('-----------------------------------------------------------------------');
    for (const cred of db.pendingCredentialNotices) {
      console.warn(` ${cred.username}`);
      console.warn(`   password: ${cred.password}`);
      console.warn(`   env var : ${cred.envVar}`);
    }
    console.warn(' These accounts must change their password on first login.');
    console.warn('=======================================================================');
    console.warn('');
    db.pendingCredentialNotices = [];
  }

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.disable('x-powered-by');
  // Needed for correct client IPs (rate limiting) behind Cloud Run / a reverse proxy.
  app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : false);

  const BODY_LIMIT = process.env.BODY_LIMIT || '12mb';
  app.use(express.json({ limit: BODY_LIMIT }));
  app.use(express.urlencoded({ extended: true, limit: BODY_LIMIT }));

  // ---------- CORS: explicit allow-list only, never "*" ----------
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.header('origin');
    res.header('Vary', 'Origin');

    const originAllowed = Boolean(origin && allowedOrigins.includes(origin));
    if (origin && originAllowed) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
      res.header('Access-Control-Max-Age', '600');
    }
    // Any other origin receives no CORS headers, so the browser blocks the response.

    if (req.method === 'OPTIONS') {
      res.sendStatus(originAllowed ? 204 : 403);
      return;
    }
    next();
  });

  // ---------- Baseline security headers ----------
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('Referrer-Policy', 'no-referrer');
    res.header('Cross-Origin-Opener-Policy', 'same-origin');
    res.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
  });

  // ---------- Request log (never logs bodies or tokens) ----------
  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api/')) {
      console.log(`[API] ${req.method} ${req.path}`);
    }
    next();
  });

  app.use('/api', loadSession);

  // ==========================================
  // Health
  // ==========================================
  app.get('/api/health', (_req: Request, res: Response) => {
    // Deliberately minimal: no user counts for anonymous callers.
    res.json({ status: 'ok', service: 'Caspian Management Backend', timestamp: new Date().toISOString() });
  });

  app.get('/api/system/stats', requireAuth, (req: AuthedRequest, res: Response) => {
    const viewer = req.authUser!;
    const totalHours = db.reports
      .filter((r) => r.status === 'Approved')
      .reduce((sum, r) => sum + (Number(r.totalHours) || 0), 0);

    const baseStats = {
      totalUsers: db.users.length,
      activeStaff: db.users.filter((u) => u.status === 'Active' && u.isRankAssigned).length,
      approvedReports: db.reports.filter((r) => r.status === 'Approved').length,
      totalShiftHours: Math.round(totalHours * 10) / 10,
      activeTasks: db.tasks.filter((t) => t.status !== 'Completed' && t.status !== 'Cancelled').length,
      upcomingMeetings: db.meetingAnnouncements.filter((m) => m.status === 'Upcoming' || m.status === 'Live').length,
    };

    if (!hasAbility(viewer, 'manageUsers')) {
      res.json({ success: true, stats: baseStats });
      return;
    }

    res.json({
      success: true,
      stats: {
        ...baseStats,
        pendingRequests:
          db.users.filter((u) => u.status === 'Pending').length +
          db.tickets.filter((t) => t.type === 'RoleRequest' && t.status !== 'Closed').length,
        pendingReports: db.reports.filter((r) => r.status === 'Pending').length,
        openTickets: db.tickets.filter((t) => t.status !== 'Closed').length,
      },
    });
  });

  // ==========================================
  // Auth
  // ==========================================
  app.post('/api/auth/login', async (req: AuthedRequest, res: Response) => {
    const identifier = str(req.body?.username, 150);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!identifier || !password) {
      fail(res, 400, 'نام کاربری و کلمه عبور الزامی است.');
      return;
    }

    const ip = clientIp(req);
    const byIp = rateLimit(`login:ip:${ip}`, 20, 15 * 60 * 1000);
    if (!byIp.allowed) {
      res.setHeader('Retry-After', String(byIp.retryAfterSeconds));
      fail(res, 429, 'تعداد تلاش‌های ورود بیش از حد مجاز است. لطفاً چند دقیقه دیگر تلاش کنید.');
      return;
    }
    const accountKey = `login:id:${identifier.toLowerCase()}`;
    const byAccount = rateLimit(accountKey, 8, 15 * 60 * 1000);
    if (!byAccount.allowed) {
      res.setHeader('Retry-After', String(byAccount.retryAfterSeconds));
      fail(res, 429, 'این حساب کاربری موقتاً به دلیل تلاش‌های ناموفق قفل شده است.');
      return;
    }

    const user = db.findUserByIdentifier(identifier);
    // The same generic message is returned whether the account exists or the
    // password is wrong, so this endpoint cannot be used to enumerate accounts.
    const GENERIC = 'نام کاربری یا کلمه عبور نادرست است.';

    if (!user) {
      // Equalize response timing against the real hashing path.
      await verifyPassword(password, `scrypt$0000$${'0'.repeat(128)}`);
      fail(res, 401, GENERIC);
      return;
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      fail(res, 401, GENERIC);
      return;
    }

    if (user.status === 'Suspended') {
      fail(res, 403, 'حساب کاربری شما توسط مدیریت تعلیق شده است.');
      return;
    }
    if (user.status === 'Pending') {
      fail(res, 403, 'حساب شما هنوز توسط مدیریت ارشد تایید نشده است.');
      return;
    }

    clearRateLimit(accountKey);
    const { token, expiresAt } = createSession(user.id, ip);

    res.json({
      success: true,
      message: 'ورود موفقیت‌آمیز بود.',
      token,
      expiresAt,
      mustChangePassword: user.mustChangePassword === true,
      user: toPublicUser(user, user),
    });
  });

  app.post('/api/auth/register', async (req: Request, res: Response) => {
    const ip = clientIp(req);
    const limitCheck = rateLimit(`register:ip:${ip}`, 5, 60 * 60 * 1000);
    if (!limitCheck.allowed) {
      res.setHeader('Retry-After', String(limitCheck.retryAfterSeconds));
      fail(res, 429, 'تعداد درخواست‌های ثبت‌نام بیش از حد مجاز است.');
      return;
    }

    const firstName = str(req.body?.firstName, 60);
    const lastName = str(req.body?.lastName, 60);
    const username = str(req.body?.username, 40);
    const email = str(req.body?.email, 120).toLowerCase();
    const teamspeakName = str(req.body?.teamspeakName, 60) || username;
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!firstName || !lastName || !username || !email || !password) {
      fail(res, 400, 'لطفاً تمامی فیلدهای الزامی را پر نمایید.');
      return;
    }
    if (username.length < 3) {
      fail(res, 400, 'نام کاربری باید حداقل ۳ کاراکتر باشد.');
      return;
    }
    if (!isEmail(email)) {
      fail(res, 400, 'آدرس ایمیل معتبر نیست.');
      return;
    }

    const strength = validatePasswordStrength(password);
    if (!strength.ok) {
      fail(res, 400, strength.message!);
      return;
    }

    const exists = db.users.some(
      (u) => u.username.toLowerCase() === username.toLowerCase() || (u.email || '').toLowerCase() === email
    );
    if (exists) {
      fail(res, 409, 'نام کاربری یا ایمیل وارد شده قبلاً ثبت شده است.');
      return;
    }

    // SECURITY: role / permissionLevel / status / isFounder are set by the server
    // only. Anything the client sends in those fields is ignored.
    const newUser: User = {
      id: newId('user'),
      username,
      passwordHash: await hashPassword(password),
      firstName,
      lastName,
      email,
      teamspeakName,
      role: 'Trial Helper',
      permissionLevel: 'User',
      isFounder: false,
      status: 'Pending',
      isRankAssigned: false,
      registrationDate: new Date().toISOString().split('T')[0],
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`,
      passwordUpdatedAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    db.saveToDisk();

    res.status(201).json({
      success: true,
      message: 'ثبت‌نام انجام شد. حساب شما پس از تایید مدیریت فعال خواهد شد.',
      user: toPublicUser(newUser, newUser),
    });
  });

  app.post('/api/auth/logout', (req: AuthedRequest, res: Response) => {
    destroySession(req.authToken);
    res.json({ success: true, message: 'از حساب کاربری خارج شدید.' });
  });

  app.get('/api/auth/me', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.authUser!;
    res.json({
      success: true,
      user: toPublicUser(user, user),
      mustChangePassword: user.mustChangePassword === true,
    });
  });

  app.post('/api/auth/change-password', requireAuth, async (req: AuthedRequest, res: Response) => {
    const user = req.authUser!;
    const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';

    const ok = await verifyPassword(currentPassword, user.passwordHash);
    if (!ok) {
      fail(res, 401, 'کلمه عبور فعلی نادرست است.');
      return;
    }

    const strength = validatePasswordStrength(newPassword);
    if (!strength.ok) {
      fail(res, 400, strength.message!);
      return;
    }
    if (newPassword === currentPassword) {
      fail(res, 400, 'کلمه عبور جدید باید با کلمه عبور فعلی متفاوت باشد.');
      return;
    }

    user.passwordHash = await hashPassword(newPassword);
    user.mustChangePassword = false;
    user.passwordUpdatedAt = new Date().toISOString();
    db.saveToDisk();

    // Invalidate every existing session, then issue a fresh one for this client.
    destroyAllSessionsForUser(user.id);
    const { token, expiresAt } = createSession(user.id, clientIp(req));

    res.json({ success: true, message: 'کلمه عبور با موفقیت تغییر کرد.', token, expiresAt });
  });

  // ==========================================
  // Users
  // ==========================================
  app.get('/api/users', requireAuth, (req: AuthedRequest, res: Response) => {
    // Sanitized: password hashes never leave the server.
    res.json({ success: true, users: toPublicUsers(db.users, req.authUser) });
  });

  app.get('/api/users/:id', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = db.findUserById(req.params.id);
    if (!user) {
      fail(res, 404, 'کاربر یافت نشد.');
      return;
    }
    res.json({ success: true, user: toPublicUser(user, req.authUser) });
  });

  app.post('/api/users', requireAbility('manageUsers'), async (req: AuthedRequest, res: Response) => {
    const actor = req.authUser!;
    const username = str(req.body?.username, 40);
    const email = str(req.body?.email, 120).toLowerCase();
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const requestedRole = req.body?.role;

    if (!username || !email || !password) {
      fail(res, 400, 'نام کاربری، ایمیل و کلمه عبور الزامی است.');
      return;
    }
    if (!isEmail(email)) {
      fail(res, 400, 'آدرس ایمیل معتبر نیست.');
      return;
    }

    const strength = validatePasswordStrength(password);
    if (!strength.ok) {
      fail(res, 400, strength.message!);
      return;
    }

    let role: UserRole = 'Trial Helper';
    if (requestedRole !== undefined) {
      if (!isValidRole(requestedRole)) {
        fail(res, 400, 'رنک انتخاب‌شده معتبر نیست.');
        return;
      }
      if (!hasAbility(actor, 'managePermissions')) {
        fail(res, 403, 'شما مجوز تعیین رنک را ندارید.');
        return;
      }
      // Nobody may create an account at or above their own rank.
      if (rankOf(requestedRole) >= rankOf(actor.role) && actor.permissionLevel !== 'Founder') {
        fail(res, 403, 'امکان ایجاد حساب با رنک مساوی یا بالاتر از رنک شما وجود ندارد.');
        return;
      }
      role = requestedRole;
    }

    const duplicate = db.users.some(
      (u) => u.username.toLowerCase() === username.toLowerCase() || (u.email || '').toLowerCase() === email
    );
    if (duplicate) {
      fail(res, 409, 'نام کاربری یا ایمیل تکراری است.');
      return;
    }

    const created: User = {
      id: newId('user'),
      username,
      passwordHash: await hashPassword(password),
      mustChangePassword: true,
      firstName: str(req.body?.firstName, 60) || username,
      lastName: str(req.body?.lastName, 60),
      email,
      teamspeakName: str(req.body?.teamspeakName, 60) || username,
      role,
      permissionLevel: permissionLevelForRole(role),
      isFounder: role === 'Founder',
      status: 'Active',
      isRankAssigned: true,
      registrationDate: new Date().toISOString().split('T')[0],
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`,
      passwordUpdatedAt: new Date().toISOString(),
    };

    db.users.push(created);
    db.saveToDisk();
    res.status(201).json({ success: true, user: toPublicUser(created, actor) });
  });

  app.put('/api/users/:id', requireAuth, (req: AuthedRequest, res: Response) => {
    const actor = req.authUser!;
    const target = db.findUserById(req.params.id);
    if (!target) {
      fail(res, 404, 'کاربر یافت نشد.');
      return;
    }

    const isSelf = actor.id === target.id;
    const isManager = hasAbility(actor, 'manageUsers');
    if (!isSelf && !isManager) {
      fail(res, 403, 'شما مجوز ویرایش این کاربر را ندارید.');
      return;
    }
    if (!isSelf && !canActOn(actor, target)) {
      fail(res, 403, 'امکان ویرایش کاربری با رنک مساوی یا بالاتر وجود ندارد.');
      return;
    }

    // SECURITY: strict allow-list. role, permissionLevel, isFounder, status,
    // passwordHash and id can never be set through this endpoint.
    const body = req.body || {};
    if (typeof body.firstName === 'string') target.firstName = str(body.firstName, 60);
    if (typeof body.lastName === 'string') target.lastName = str(body.lastName, 60);
    if (typeof body.teamspeakName === 'string') target.teamspeakName = str(body.teamspeakName, 60);
    if (typeof body.avatarUrl === 'string') target.avatarUrl = str(body.avatarUrl, 500);
    if (typeof body.email === 'string') {
      const email = str(body.email, 120).toLowerCase();
      if (!isEmail(email)) {
        fail(res, 400, 'آدرس ایمیل معتبر نیست.');
        return;
      }
      if (db.users.some((u) => u.id !== target.id && (u.email || '').toLowerCase() === email)) {
        fail(res, 409, 'این ایمیل قبلاً ثبت شده است.');
        return;
      }
      target.email = email;
    }

    // Granular permissions are a privileged field, and never self-assignable.
    if (body.customPermissions && typeof body.customPermissions === 'object') {
      if (!hasAbility(actor, 'managePermissions') || isSelf) {
        fail(res, 403, 'شما مجوز تغییر دسترسی‌های این کاربر را ندارید.');
        return;
      }
      target.customPermissions = {
        canReviewReports: body.customPermissions.canReviewReports === true,
        canIssueWarnings: body.customPermissions.canIssueWarnings === true,
        canManageUsers: body.customPermissions.canManageUsers === true,
        canManagePermissions: body.customPermissions.canManagePermissions === true,
      };
    }

    db.saveToDisk();
    res.json({ success: true, user: toPublicUser(target, actor) });
  });

  app.post('/api/users/:id/role', requireAbility('managePermissions'), (req: AuthedRequest, res: Response) => {
    const actor = req.authUser!;
    const role = req.body?.role;
    const target = db.findUserById(req.params.id);

    if (!target) {
      fail(res, 404, 'کاربر یافت نشد.');
      return;
    }
    if (!isValidRole(role)) {
      fail(res, 400, 'رنک انتخاب‌شده معتبر نیست.');
      return;
    }
    if (actor.id === target.id) {
      fail(res, 403, 'امکان تغییر رنک حساب خودتان وجود ندارد.');
      return;
    }
    if (!canActOn(actor, target)) {
      fail(res, 403, 'امکان تغییر رنک کاربری با رنک مساوی یا بالاتر وجود ندارد.');
      return;
    }
    if (role === 'Founder' && actor.permissionLevel !== 'Founder') {
      fail(res, 403, 'تنها فاندر می‌تواند رنک فاندر اعطا کند.');
      return;
    }
    if (actor.permissionLevel !== 'Founder' && rankOf(role) >= rankOf(actor.role)) {
      fail(res, 403, 'امکان اعطای رنک مساوی یا بالاتر از رنک خودتان وجود ندارد.');
      return;
    }
    if (target.permissionLevel === 'Founder' && role !== 'Founder' && activeFounderCount() <= 1) {
      fail(res, 409, 'امکان حذف آخرین فاندر فعال سامانه وجود ندارد.');
      return;
    }

    const wasRank = rankOf(target.role);
    target.role = role;
    target.permissionLevel = permissionLevelForRole(role);
    target.isFounder = role === 'Founder';
    target.isRankAssigned = true;
    if (target.status === 'Pending') target.status = 'Active';

    // On demotion, granular grants are revoked so old elevated access cannot survive.
    if (rankOf(role) < wasRank) {
      target.customPermissions = undefined;
      destroyAllSessionsForUser(target.id);
    }

    db.saveToDisk();
    res.json({ success: true, message: `رنک کاربر به ${role} تغییر یافت.`, user: toPublicUser(target, actor) });
  });

  app.post('/api/users/:id/suspend', requireAbility('manageUsers'), (req: AuthedRequest, res: Response) => {
    const actor = req.authUser!;
    const target = db.findUserById(req.params.id);
    if (!target) {
      fail(res, 404, 'کاربر یافت نشد.');
      return;
    }
    if (actor.id === target.id) {
      fail(res, 403, 'امکان تعلیق حساب خودتان وجود ندارد.');
      return;
    }
    if (!canActOn(actor, target)) {
      fail(res, 403, 'امکان تعلیق کاربری با رنک مساوی یا بالاتر وجود ندارد.');
      return;
    }

    const suspended = req.body?.suspended === true;
    if (suspended && target.permissionLevel === 'Founder' && activeFounderCount() <= 1) {
      fail(res, 409, 'امکان تعلیق آخرین فاندر فعال وجود ندارد.');
      return;
    }

    target.status = suspended ? 'Suspended' : 'Active';
    if (suspended) destroyAllSessionsForUser(target.id);
    db.saveToDisk();

    res.json({
      success: true,
      message: suspended ? 'اکانت تعلیق شد.' : 'تعلیق اکانت برداشته شد.',
      user: toPublicUser(target, actor),
    });
  });

  app.post('/api/users/:id/reset-password', requireAbility('manageUsers'), async (req: AuthedRequest, res: Response) => {
    const actor = req.authUser!;
    const target = db.findUserById(req.params.id);
    if (!target) {
      fail(res, 404, 'کاربر یافت نشد.');
      return;
    }
    if (!canActOn(actor, target)) {
      fail(res, 403, 'امکان بازنشانی کلمه عبور کاربری با رنک مساوی یا بالاتر وجود ندارد.');
      return;
    }

    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';
    const strength = validatePasswordStrength(newPassword);
    if (!strength.ok) {
      fail(res, 400, strength.message!);
      return;
    }

    target.passwordHash = await hashPassword(newPassword);
    target.mustChangePassword = true;
    target.passwordUpdatedAt = new Date().toISOString();
    destroyAllSessionsForUser(target.id);
    db.saveToDisk();

    // The plaintext is never echoed back, logged, or stored.
    res.json({ success: true, message: 'کلمه عبور بازنشانی شد. کاربر در ورود بعدی باید آن را تغییر دهد.' });
  });

  app.delete('/api/users/:id', requireAbility('manageUsers'), (req: AuthedRequest, res: Response) => {
    const actor = req.authUser!;
    const target = db.findUserById(req.params.id);
    if (!target) {
      fail(res, 404, 'کاربر یافت نشد.');
      return;
    }
    if (actor.id === target.id) {
      fail(res, 403, 'امکان حذف حساب خودتان وجود ندارد.');
      return;
    }
    if (!canActOn(actor, target)) {
      fail(res, 403, 'امکان حذف کاربری با رنک مساوی یا بالاتر وجود ندارد.');
      return;
    }
    if (target.permissionLevel === 'Founder' && activeFounderCount() <= 1) {
      fail(res, 409, 'امکان حذف آخرین فاندر فعال وجود ندارد.');
      return;
    }

    db.users = db.users.filter((u) => u.id !== target.id);
    destroyAllSessionsForUser(target.id);
    db.saveToDisk();
    res.json({ success: true, message: 'کاربر حذف گردید.' });
  });

  // ==========================================
  // Activity reports
  // ==========================================
  app.get('/api/reports', requireAuth, (req: AuthedRequest, res: Response) => {
    const viewer = req.authUser!;
    const reports = hasAbility(viewer, 'reviewReports')
      ? db.reports
      : db.reports.filter((r) => r.userId === viewer.id);
    res.json({ success: true, reports });
  });

  app.post('/api/reports', requireAuth, (req: AuthedRequest, res: Response) => {
    const author = req.authUser!;
    // Identity and review fields come from the session, not the request body.
    const report: ActivityReport = {
      ...req.body,
      id: newId('rep'),
      userId: author.id,
      username: author.username,
      firstName: author.firstName,
      lastName: author.lastName,
      role: author.role,
      status: 'Pending',
      points: undefined,
      reviewedBy: undefined,
      reviewedAt: undefined,
      adminComment: undefined,
      createdAt: new Date().toISOString(),
    };
    db.reports.unshift(report);
    db.saveToDisk();
    res.status(201).json({ success: true, report });
  });

  app.put('/api/reports/:id', requireAuth, (req: AuthedRequest, res: Response) => {
    const viewer = req.authUser!;
    const index = db.reports.findIndex((r) => r.id === req.params.id);
    if (index === -1) {
      fail(res, 404, 'گزارش کار یافت نشد.');
      return;
    }

    const existing = db.reports[index];
    const isReviewer = hasAbility(viewer, 'reviewReports');
    const isOwnPending = existing.userId === viewer.id && existing.status === 'Pending';
    if (!isReviewer && !isOwnPending) {
      fail(res, 403, 'امکان ویرایش این گزارش وجود ندارد.');
      return;
    }

    db.reports[index] = {
      ...existing,
      ...req.body,
      id: existing.id,
      userId: existing.userId,
      // Only a reviewer can move a report out of Pending or change its points.
      status: isReviewer ? req.body?.status || existing.status : existing.status,
      points: isReviewer ? req.body?.points ?? existing.points : existing.points,
    };
    db.saveToDisk();
    res.json({ success: true, report: db.reports[index] });
  });

  function reviewReport(status: 'Approved' | 'Rejected') {
    return (req: AuthedRequest, res: Response): void => {
      const reviewer = req.authUser!;
      const report = db.reports.find((r) => r.id === req.params.id);
      if (!report) {
        fail(res, 404, 'گزارش یافت نشد.');
        return;
      }
      report.status = status;
      report.adminComment = str(req.body?.comment, 1000) || (status === 'Approved' ? 'تایید شد.' : 'رد شد.');
      report.reviewedBy = `${reviewer.firstName} ${reviewer.lastName}`.trim() || reviewer.username;
      report.reviewedAt = new Date().toISOString();
      report.points = status === 'Approved' ? Math.round(Number(report.totalHours || 1) * 10) : 0;
      db.saveToDisk();
      res.json({ success: true, message: status === 'Approved' ? 'گزارش تایید شد.' : 'گزارش رد شد.', report });
    };
  }

  app.post('/api/reports/:id/approve', requireAbility('reviewReports'), reviewReport('Approved'));
  app.post('/api/reports/:id/reject', requireAbility('reviewReports'), reviewReport('Rejected'));

  app.post('/api/reports/:id/comment', requireAbility('reviewReports'), (req: AuthedRequest, res: Response) => {
    const report = db.reports.find((r) => r.id === req.params.id);
    if (!report) {
      fail(res, 404, 'گزارش یافت نشد.');
      return;
    }
    report.adminComment = str(req.body?.comment, 1000);
    db.saveToDisk();
    res.json({ success: true, message: 'نظر مدیر ثبت شد.', report });
  });

  app.delete('/api/reports/:id', requireAbility('reviewReports'), (req: Request, res: Response) => {
    db.reports = db.reports.filter((r) => r.id !== req.params.id);
    db.saveToDisk();
    res.json({ success: true, message: 'گزارش کار حذف شد.' });
  });

  // ==========================================
  // Warnings
  // ==========================================
  app.get('/api/warnings', requireAuth, (req: AuthedRequest, res: Response) => {
    const viewer = req.authUser!;
    const warnings = hasAbility(viewer, 'issueWarnings')
      ? db.warnings
      : db.warnings.filter((w) => w.userId === viewer.id);
    res.json({ success: true, warnings });
  });

  app.post('/api/warnings', requireAbility('issueWarnings'), (req: AuthedRequest, res: Response) => {
    const actor = req.authUser!;
    const target = db.findUserById(str(req.body?.userId, 80));
    if (!target) {
      fail(res, 404, 'کاربر هدف یافت نشد.');
      return;
    }
    if (!canActOn(actor, target) || actor.id === target.id) {
      fail(res, 403, 'امکان ثبت اخطار برای این کاربر وجود ندارد.');
      return;
    }

    const warning: Warning = {
      ...req.body,
      id: newId('warn'),
      userId: target.id,
      targetUsername: target.username,
      targetRole: target.role,
      issuedBy: `${actor.firstName} ${actor.lastName}`.trim() || actor.username,
      issuedByRole: actor.role,
      createdAt: new Date().toISOString(),
    };
    db.warnings.unshift(warning);
    db.saveToDisk();
    res.status(201).json({ success: true, warning });
  });

  app.delete('/api/warnings/:id', requireAbility('issueWarnings'), (req: Request, res: Response) => {
    db.warnings = db.warnings.filter((w) => w.id !== req.params.id);
    db.saveToDisk();
    res.json({ success: true, message: 'اخطار حذف شد.' });
  });

  // ==========================================
  // Tasks
  // ==========================================
  app.get('/api/tasks', requireAuth, (_req: Request, res: Response) => {
    res.json({ success: true, tasks: db.tasks });
  });

  app.post('/api/tasks', requireAbility('manageContent'), (req: AuthedRequest, res: Response) => {
    const actor = req.authUser!;
    const task: StaffTask = {
      ...req.body,
      id: newId('task'),
      createdById: actor.id,
      createdByName: `${actor.firstName} ${actor.lastName}`.trim() || actor.username,
      createdByRole: actor.role,
      createdAt: new Date().toISOString(),
      status: req.body?.status || 'Pending',
    };
    db.tasks.unshift(task);
    db.saveToDisk();
    res.status(201).json({ success: true, task });
  });

  app.put('/api/tasks/:id', requireAbility('manageContent'), (req: Request, res: Response) => {
    const index = db.tasks.findIndex((t) => t.id === req.params.id);
    if (index === -1) {
      fail(res, 404, 'وظیفه یافت نشد.');
      return;
    }
    db.tasks[index] = { ...db.tasks[index], ...req.body, id: req.params.id };
    db.saveToDisk();
    res.json({ success: true, task: db.tasks[index] });
  });

  app.post('/api/tasks/:id/status', requireAuth, (req: AuthedRequest, res: Response) => {
    const viewer = req.authUser!;
    const task = db.tasks.find((t) => t.id === req.params.id);
    if (!task) {
      fail(res, 404, 'وظیفه یافت نشد.');
      return;
    }

    const isAssignee =
      task.assignedToUserId === viewer.id ||
      task.assignedToRole === 'All' ||
      task.assignedToRole === viewer.role;
    if (!isAssignee && !hasAbility(viewer, 'manageContent')) {
      fail(res, 403, 'این وظیفه به شما محول نشده است.');
      return;
    }

    task.status = req.body?.status;
    if (req.body?.proofUrl) task.proofUrl = str(req.body.proofUrl, 500);
    if (req.body?.notes) task.notes = str(req.body.notes, 2000);
    if (task.status === 'Completed') task.completedAt = new Date().toISOString();
    db.saveToDisk();
    res.json({ success: true, task });
  });

  app.delete('/api/tasks/:id', requireAbility('manageContent'), (req: Request, res: Response) => {
    db.tasks = db.tasks.filter((t) => t.id !== req.params.id);
    db.saveToDisk();
    res.json({ success: true, message: 'وظیفه حذف گردید.' });
  });

  // ==========================================
  // Meetings
  // ==========================================
  app.get('/api/meetings/announcements', requireAuth, (_req: Request, res: Response) => {
    res.json({ success: true, announcements: db.meetingAnnouncements });
  });

  app.post('/api/meetings/announcements', requireAbility('manageContent'), (req: AuthedRequest, res: Response) => {
    const actor = req.authUser!;
    const announcement: MeetingAnnouncement = {
      ...req.body,
      id: newId('meet'),
      createdById: actor.id,
      createdByName: `${actor.firstName} ${actor.lastName}`.trim() || actor.username,
      createdByRole: actor.role,
      createdAt: new Date().toISOString(),
      status: req.body?.status || 'Upcoming',
      attendees: [],
    };
    db.meetingAnnouncements.unshift(announcement);
    db.saveToDisk();
    res.status(201).json({ success: true, announcement });
  });

  app.put('/api/meetings/announcements/:id', requireAbility('manageContent'), (req: Request, res: Response) => {
    const index = db.meetingAnnouncements.findIndex((m) => m.id === req.params.id);
    if (index === -1) {
      fail(res, 404, 'اطلاعیه جلسه یافت نشد.');
      return;
    }
    db.meetingAnnouncements[index] = { ...db.meetingAnnouncements[index], ...req.body, id: req.params.id };
    db.saveToDisk();
    res.json({ success: true, announcement: db.meetingAnnouncements[index] });
  });

  app.post('/api/meetings/announcements/:id/rsvp', requireAuth, (req: AuthedRequest, res: Response) => {
    const viewer = req.authUser!;
    const announcement = db.meetingAnnouncements.find((m) => m.id === req.params.id);
    if (!announcement) {
      fail(res, 404, 'جلسه یافت نشد.');
      return;
    }
    // A user may only RSVP for themselves — the body's userId is ignored.
    const attending = announcement.attendees.includes(viewer.id);
    announcement.attendees = attending
      ? announcement.attendees.filter((id) => id !== viewer.id)
      : [...announcement.attendees, viewer.id];
    db.saveToDisk();
    res.json({ success: true, attendees: announcement.attendees, hasAttended: !attending });
  });

  app.delete('/api/meetings/announcements/:id', requireAbility('manageContent'), (req: Request, res: Response) => {
    db.meetingAnnouncements = db.meetingAnnouncements.filter((m) => m.id !== req.params.id);
    db.saveToDisk();
    res.json({ success: true, message: 'اطلاعیه جلسه حذف شد.' });
  });

  app.get('/api/meetings/reports', requireAuth, (_req: Request, res: Response) => {
    res.json({ success: true, reports: db.meetingReports });
  });

  app.post('/api/meetings/reports', requireAbility('manageContent'), (req: AuthedRequest, res: Response) => {
    const actor = req.authUser!;
    const report: MeetingReport = {
      ...req.body,
      id: newId('mrep'),
      recordedById: actor.id,
      recordedByName: `${actor.firstName} ${actor.lastName}`.trim() || actor.username,
      recordedByRole: actor.role,
      createdAt: new Date().toISOString(),
      decisions: Array.isArray(req.body?.decisions) ? req.body.decisions : [],
      actionItems: Array.isArray(req.body?.actionItems) ? req.body.actionItems : [],
    };
    db.meetingReports.unshift(report);
    db.saveToDisk();
    res.status(201).json({ success: true, report });
  });

  app.put('/api/meetings/reports/:id', requireAbility('manageContent'), (req: Request, res: Response) => {
    const index = db.meetingReports.findIndex((m) => m.id === req.params.id);
    if (index === -1) {
      fail(res, 404, 'گزارش جلسه یافت نشد.');
      return;
    }
    db.meetingReports[index] = { ...db.meetingReports[index], ...req.body, id: req.params.id };
    db.saveToDisk();
    res.json({ success: true, report: db.meetingReports[index] });
  });

  app.delete('/api/meetings/reports/:id', requireAbility('manageContent'), (req: Request, res: Response) => {
    db.meetingReports = db.meetingReports.filter((m) => m.id !== req.params.id);
    db.saveToDisk();
    res.json({ success: true, message: 'گزارش جلسه حذف گردید.' });
  });

  // ==========================================
  // Tickets
  // ==========================================
  app.get('/api/tickets', requireAuth, (req: AuthedRequest, res: Response) => {
    const viewer = req.authUser!;
    const tickets = db.tickets.filter((t) => canSeeTicket(t, viewer)).map((t) => visibleTicket(t, viewer));
    res.json({ success: true, tickets });
  });

  app.post('/api/tickets', requireAuth, (req: AuthedRequest, res: Response) => {
    const author = req.authUser!;
    const ticket: Ticket = {
      ...req.body,
      id: newId('ticket'),
      // Ticket ownership always comes from the session.
      userId: author.id,
      userName: `${author.firstName} ${author.lastName}`.trim() || author.username,
      userRole: author.role,
      userAvatar: author.avatarUrl,
      userTeamspeak: author.teamspeakName,
      status: 'Open',
      assignedAdminId: undefined,
      assignedAdminName: undefined,
      assignedAdminRole: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };

    const firstMessage = str(req.body?.message, 4000) || str(req.body?.subject, 4000);
    if (firstMessage) {
      ticket.messages.push({
        id: newId('msg'),
        senderId: author.id,
        senderName: ticket.userName,
        senderRole: author.role,
        message: firstMessage,
        createdAt: new Date().toISOString(),
      });
    }

    db.tickets.unshift(ticket);
    db.saveToDisk();
    res.status(201).json({ success: true, ticket });
  });

  app.post('/api/tickets/:id/reply', requireAuth, (req: AuthedRequest, res: Response) => {
    const sender = req.authUser!;
    const ticket = db.tickets.find((t) => t.id === req.params.id);
    if (!ticket) {
      fail(res, 404, 'تیکت یافت نشد.');
      return;
    }
    if (!canSeeTicket(ticket, sender)) {
      fail(res, 403, 'شما به این تیکت دسترسی ندارید.');
      return;
    }
    if (ticket.status === 'Closed') {
      fail(res, 409, 'این تیکت بسته شده است.');
      return;
    }

    const message = str(req.body?.message, 4000);
    if (!message) {
      fail(res, 400, 'متن پیام نمی‌تواند خالی باشد.');
      return;
    }

    // "Staff reply" is derived from the sender's real permissions, not a flag in the body.
    const isStaffReply = hasAbility(sender, 'manageTickets') && ticket.userId !== sender.id;
    const newMsg: TicketMessage = {
      id: newId('msg'),
      senderId: sender.id,
      senderName: `${sender.firstName} ${sender.lastName}`.trim() || sender.username,
      senderRole: sender.role,
      message,
      createdAt: new Date().toISOString(),
      isStaffReply,
    };

    ticket.messages.push(newMsg);
    ticket.updatedAt = new Date().toISOString();
    if (isStaffReply && ticket.status === 'Open') ticket.status = 'Answered';
    db.saveToDisk();
    res.json({ success: true, ticket: visibleTicket(ticket, sender) });
  });

  app.post('/api/tickets/:id/status', requireAbility('manageTickets'), (req: AuthedRequest, res: Response) => {
    const ticket = db.tickets.find((t) => t.id === req.params.id);
    if (!ticket) {
      fail(res, 404, 'تیکت یافت نشد.');
      return;
    }
    ticket.status = req.body?.status;
    ticket.updatedAt = new Date().toISOString();
    db.saveToDisk();
    res.json({ success: true, ticket: visibleTicket(ticket, req.authUser!) });
  });

  app.post('/api/tickets/:id/priority', requireAbility('manageTickets'), (req: AuthedRequest, res: Response) => {
    const ticket = db.tickets.find((t) => t.id === req.params.id);
    if (!ticket) {
      fail(res, 404, 'تیکت یافت نشد.');
      return;
    }
    ticket.priority = req.body?.priority;
    ticket.updatedAt = new Date().toISOString();
    db.saveToDisk();
    res.json({ success: true, message: 'اولویت تیکت تغییر یافت.', ticket: visibleTicket(ticket, req.authUser!) });
  });

  app.post('/api/tickets/:id/assign-admin', requireAbility('manageTickets'), (req: AuthedRequest, res: Response) => {
    const ticket = db.tickets.find((t) => t.id === req.params.id);
    if (!ticket) {
      fail(res, 404, 'تیکت یافت نشد.');
      return;
    }
    const admin = db.findUserById(str(req.body?.adminId, 80));
    if (!admin || !hasAbility(admin, 'manageTickets')) {
      fail(res, 400, 'کاربر انتخاب‌شده مجوز رسیدگی به تیکت را ندارد.');
      return;
    }
    ticket.assignedAdminId = admin.id;
    ticket.assignedAdminName = `${admin.firstName} ${admin.lastName}`.trim() || admin.username;
    ticket.assignedAdminRole = admin.role;
    ticket.updatedAt = new Date().toISOString();
    db.saveToDisk();
    res.json({
      success: true,
      message: `تیکت به ${ticket.assignedAdminName} ارجاع داده شد.`,
      ticket: visibleTicket(ticket, req.authUser!),
    });
  });

  app.post('/api/tickets/:id/note', requireAbility('manageTickets'), (req: AuthedRequest, res: Response) => {
    const actor = req.authUser!;
    const ticket = db.tickets.find((t) => t.id === req.params.id);
    if (!ticket) {
      fail(res, 404, 'تیکت یافت نشد.');
      return;
    }
    const note = str(req.body?.note, 4000);
    if (!note) {
      fail(res, 400, 'متن یادداشت نمی‌تواند خالی باشد.');
      return;
    }

    const noteMsg: TicketMessage = {
      id: newId('note'),
      senderId: actor.id,
      senderName: `${actor.firstName} ${actor.lastName}`.trim() || actor.username,
      senderRole: actor.role,
      message: note,
      createdAt: new Date().toISOString(),
      isStaffReply: true,
      isInternalNote: true,
    };
    ticket.messages.push(noteMsg);
    ticket.updatedAt = new Date().toISOString();
    db.saveToDisk();
    res.json({ success: true, message: 'یادداشت محرمانه ثبت شد.', ticket, note: noteMsg });
  });

  app.post('/api/tickets/:id/assign-role', requireAbility('managePermissions'), (req: AuthedRequest, res: Response) => {
    const actor = req.authUser!;
    const ticket = db.tickets.find((t) => t.id === req.params.id);
    if (!ticket) {
      fail(res, 404, 'تیکت یافت نشد.');
      return;
    }

    const newRole = req.body?.newRole;
    if (!isValidRole(newRole)) {
      fail(res, 400, 'رنک انتخاب‌شده معتبر نیست.');
      return;
    }

    const target = db.findUserById(ticket.userId);
    if (!target) {
      fail(res, 404, 'کاربر این تیکت یافت نشد.');
      return;
    }
    if (target.id === actor.id) {
      fail(res, 403, 'امکان تغییر رنک حساب خودتان وجود ندارد.');
      return;
    }
    if (!canActOn(actor, target)) {
      fail(res, 403, 'امکان تغییر رنک این کاربر را ندارید.');
      return;
    }
    if (newRole === 'Founder' && actor.permissionLevel !== 'Founder') {
      fail(res, 403, 'تنها فاندر می‌تواند رنک فاندر اعطا کند.');
      return;
    }
    if (actor.permissionLevel !== 'Founder' && rankOf(newRole) >= rankOf(actor.role)) {
      fail(res, 403, 'امکان اعطای رنک مساوی یا بالاتر از رنک خودتان وجود ندارد.');
      return;
    }

    const wasRank = rankOf(target.role);
    target.role = newRole;
    target.permissionLevel = permissionLevelForRole(newRole);
    target.isFounder = newRole === 'Founder';
    target.isRankAssigned = true;
    target.status = 'Active';
    if (rankOf(newRole) < wasRank) {
      target.customPermissions = undefined;
      destroyAllSessionsForUser(target.id);
    }

    ticket.messages.push({
      id: newId('msg'),
      senderId: actor.id,
      senderName: `${actor.firstName} ${actor.lastName}`.trim() || actor.username,
      senderRole: actor.role,
      message: `رنک سازمانی شما با تایید مدیریت به «${newRole}» تغییر یافت.`,
      createdAt: new Date().toISOString(),
      isStaffReply: true,
    });
    ticket.status = 'Answered';
    ticket.updatedAt = new Date().toISOString();
    db.saveToDisk();

    res.json({
      success: true,
      message: `رنک کاربر به ${newRole} تعیین شد.`,
      ticket: visibleTicket(ticket, actor),
      user: toPublicUser(target, actor),
    });
  });

  app.delete('/api/tickets/:id', requireAbility('manageContent'), (req: Request, res: Response) => {
    db.tickets = db.tickets.filter((t) => t.id !== req.params.id);
    db.saveToDisk();
    res.json({ success: true, message: 'تیکت حذف شد.' });
  });

  // ==========================================
  // System alerts
  // ==========================================
  app.get('/api/alerts', requireAuth, (_req: Request, res: Response) => {
    res.json({ success: true, alerts: db.alerts.filter((a) => a.active) });
  });

  app.post('/api/alerts', requireAbility('manageContent'), (req: AuthedRequest, res: Response) => {
    const actor = req.authUser!;
    const alert: SystemAlert = {
      id: newId('alert'),
      title: str(req.body?.title, 200) || 'پیام همگانی کادر مدیریت',
      message: str(req.body?.message, 2000),
      type: ['info', 'warning', 'urgent'].includes(req.body?.type) ? req.body.type : 'info',
      createdAt: new Date().toISOString(),
      active: true,
      createdByName: `${actor.firstName} ${actor.lastName}`.trim() || actor.username,
    };
    db.alerts.unshift(alert);
    db.saveToDisk();
    res.status(201).json({ success: true, alert });
  });

  app.delete('/api/alerts/:id', requireAbility('manageContent'), (req: Request, res: Response) => {
    db.alerts = db.alerts.filter((a) => a.id !== req.params.id);
    db.saveToDisk();
    res.json({ success: true, message: 'اعلان حذف شد.' });
  });

  // ==========================================
  // AI endpoints — authenticated and rate limited, so the Gemini key
  // cannot be drained by anonymous callers.
  // ==========================================
  function aiQuota(req: AuthedRequest, res: Response, next: NextFunction): void {
    const check = rateLimit(`ai:${req.authUser!.id}`, 30, 60 * 60 * 1000);
    if (!check.allowed) {
      res.setHeader('Retry-After', String(check.retryAfterSeconds));
      fail(res, 429, 'سهمیه استفاده از دستیار هوشمند به پایان رسیده است. لطفاً بعداً تلاش کنید.');
      return;
    }
    next();
  }

  app.post('/api/ai/generate-meeting-summary', requireAuth, aiQuota, async (req: Request, res: Response) => {
    const rawNotes = str(req.body?.rawNotes, 8000);
    const title = str(req.body?.title, 200);
    if (!rawNotes) {
      fail(res, 400, 'نکات یا متن خام جلسه ارسال نشده است.');
      return;
    }

    try {
      const ai = await getAiClient();
      if (!ai) throw new Error('GEMINI_API_KEY is not configured on server.');

      const prompt = `شما دستیار ارشد هوش مصنوعی سرور بازی Caspian هستید.
بر اساس اطلاعات خام یا یادداشت‌های جلسه زیر، یک صورت‌جلسه کاملاً حرفه‌ای، منسجم و رسمی به زبان فارسی تولید کنید.

عنوان جلسه: ${title || 'جلسه عمومی کادر مدیریت'}
نکات و مباحث مطرح شده در جلسه:
${rawNotes}

پاسخ شما باید الزاما یک JSON معتبر باشد با ساختار دقیق زیر و بدون هیچ متن یا کد بلاک اضافی:
{
  "founderStatements": "متن منسجم و رسمی سخنان و تأکیدات فاندر سرور",
  "decisions": ["تصمیم مصوب ۱", "تصمیم مصوب ۲", "تصمیم مصوب ۳"],
  "actionItems": ["دستور و وظیفه تعیین شده ۱ برای اعضا", "دستور و وظیفه ۲"],
  "summary": "خلاصه تحلیلی و جمع‌بندی کامل جلسه"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      const jsonMatch = (response.text || '').match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        res.json({ success: true, data: JSON.parse(jsonMatch[0]) });
        return;
      }
    } catch (err: any) {
      console.warn('AI Meeting Summary fallback triggered:', err?.message || err);
    }

    const lines = rawNotes.split('\n').map((l) => l.trim()).filter(Boolean);
    res.json({
      success: true,
      data: {
        founderStatements:
          lines[0] || 'تأکید بر رعایت نظم، هماهنگی کامل بین رنک‌های کادر و پاسخ‌گویی سریع به بازیکنان سرور.',
        decisions:
          lines.length > 1
            ? lines.slice(1, 4)
            : ['تصویب ساعات حضور منظم اعضا در تیم‌اسپیک', 'الزام ثبت گزارش کار روزانه قبل از ساعت ۲۴'],
        actionItems: ['بررسی کامل لاگ‌های سرور توسط تیم ادمینی', 'پاسخگویی به موقع به تیکت‌های پشتیبانی کاربران'],
        summary: rawNotes,
      },
    });
  });

  app.post('/api/ai/audit-report', requireAuth, aiQuota, async (req: AuthedRequest, res: Response) => {
    const actor = req.authUser!;
    const username = str(req.body?.username, 80) || actor.username;
    const role = str(req.body?.role, 40) || actor.role;
    const hoursNum = Number(req.body?.hours) || 0;
    const loginTime = str(req.body?.loginTime, 20);
    const logoutTime = str(req.body?.logoutTime, 20);
    const description = str(req.body?.description, 5000);

    try {
      const ai = await getAiClient();
      if (!ai) throw new Error('GEMINI_API_KEY is not configured on server.');

      const prompt = `شما ممیز هوشمند مدیریت سرور بازی Caspian هستید.
گزارش شیفت آنلاین و فعالیت روزانه عضو زیر را ارزیابی تخصصی کنید:

نام کاربر: ${username}
رنک سازمانی: ${role}
ساعت ورود: ${loginTime} | ساعت خروج: ${logoutTime}
مجموع ساعات آنلاین: ${hoursNum} ساعت
توضیحات و گزارش کار ثبت‌شده:
${description}

پاسخ را الزاما به صورت یک JSON معتبر فارسی بدون متن اضافه برگردانید:
{
  "rating": "عالی / مناسب / نیازمند بررسی / ناقص",
  "recommendation": "پیشنهاد تایید / پیشنهاد پاداش و تشویق / نیاز به اخذ توضیح / پیشنهاد رد گزارش",
  "feedback": "تحلیل کوتاه ۲ جمله‌ای برای مدیران جهت ارزیابی کارایی این شیفت",
  "keyHighlights": ["نکته مثبت یا کار مفید ۱", "نکته یا فعالیت مفید ۲"]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      const jsonMatch = (response.text || '').match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        res.json({ success: true, data: JSON.parse(jsonMatch[0]) });
        return;
      }
    } catch (err: any) {
      console.warn('AI Audit Report fallback triggered:', err?.message || err);
    }

    const isGreat = hoursNum >= 3;
    res.json({
      success: true,
      data: {
        rating: isGreat ? 'عالی' : 'مناسب',
        recommendation: isGreat ? 'پیشنهاد تایید و اعطای امتیاز ویژه' : 'پیشنهاد تایید',
        feedback: `شیفت کاری ${hoursNum} ساعته عضو محترم ${username} با شرح فعالیت منظم ثبت شده و طبق استانداردهای سرور ارزیابی می‌گردد.`,
        keyHighlights: [
          `پوشش کامل شیفت به مدت ${hoursNum} ساعت`,
          'پاسخگویی به درخواست‌های تیم‌اسپیک و حل مسائل پلیرها',
        ],
      },
    });
  });

  app.post(
    '/api/ai/generate-announcement',
    requireAbility('manageContent'),
    aiQuota,
    async (req: Request, res: Response) => {
      const topic = str(req.body?.topic, 300);
      const audience = str(req.body?.audience, 200);
      const priority = str(req.body?.priority, 50);

      try {
        const ai = await getAiClient();
        if (ai) {
          const prompt = `یک متن اعلان یا اطلاعیه رسمی و زیبا به زبان فارسی برای سرور Caspian بنویسید:
موضوع: ${topic || 'اطلاعیه عمومی کادر'}
مخاطب: ${audience || 'تمام اعضای کادر'}
اولویت: ${priority || 'عادی'}

پاسخ را به صورت JSON با ساختار:
{"title": "عنوان جذاب رسمی", "body": "متن کامل رسمی و ساختاریافته"}`;

          const response = await ai.models.generateContent({
            model: 'gemini-3.7-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' },
          });

          const jsonMatch = (response.text || '').match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            res.json({ success: true, data: JSON.parse(jsonMatch[0]) });
            return;
          }
        }
      } catch (err) {
        console.warn('AI Announcement fallback triggered', err);
      }

      res.json({
        success: true,
        data: {
          title: `اطلاعیه مهم: ${topic || 'کادر مدیریت کاسپین'}`,
          body: 'به اطلاع تمامی اعضای محترم می‌رساند که رعایت دقیق ضوابط، حضور منظم در شیفت‌ها و انجام وظایف محوله در اولویت قرار دارد.',
        },
      });
    }
  );

  // ==========================================
  // System reset / backup / restore — Founder only
  // ==========================================
  app.post('/api/system/reset', requireFounder, async (_req: Request, res: Response) => {
    await db.resetAll();
    const notices = db.pendingCredentialNotices;
    db.pendingCredentialNotices = [];
    if (notices.length > 0) {
      console.warn('[system] Reset complete. New seed credentials:');
      for (const n of notices) console.warn(`  ${n.username} -> ${n.password}`);
    }
    res.json({ success: true, message: 'سامانه بازنشانی شد. کلمه‌های عبور جدید در کنسول سرور چاپ شده است.' });
  });

  app.get('/api/system/backup', requireFounder, (_req: Request, res: Response) => {
    // Password hashes are excluded from the export.
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        users: db.users.map(({ passwordHash, ...rest }) => rest),
        reports: db.reports,
        warnings: db.warnings,
        tasks: db.tasks,
        meetingAnnouncements: db.meetingAnnouncements,
        meetingReports: db.meetingReports,
        tickets: db.tickets,
        alerts: db.alerts,
      },
    });
  });

  app.post('/api/system/restore', requireFounder, (req: Request, res: Response) => {
    const data = req.body?.data;
    if (!data || typeof data !== 'object') {
      fail(res, 400, 'داده‌های پشتیبان نامعتبر است.');
      return;
    }

    if (Array.isArray(data.users)) {
      // Existing credentials are preserved: a backup file can never inject a
      // password hash, resurrect a plaintext password, or create a new account.
      const byId = new Map(db.users.map((u) => [u.id, u]));
      const restored: User[] = [];
      for (const incoming of data.users) {
        if (!incoming || typeof incoming.id !== 'string') continue;
        const current = byId.get(incoming.id);
        if (!current) continue;
        const { password, passwordHash, ...safe } = incoming as Record<string, unknown>;
        restored.push({ ...current, ...(safe as Partial<User>), passwordHash: current.passwordHash } as User);
        byId.delete(incoming.id);
      }
      // Accounts that exist only on the server are kept as-is.
      db.users = [...restored, ...byId.values()];
    }
    if (Array.isArray(data.reports)) db.reports = data.reports;
    if (Array.isArray(data.warnings)) db.warnings = data.warnings;
    if (Array.isArray(data.tasks)) db.tasks = data.tasks;
    if (Array.isArray(data.meetingAnnouncements)) db.meetingAnnouncements = data.meetingAnnouncements;
    if (Array.isArray(data.meetingReports)) db.meetingReports = data.meetingReports;
    if (Array.isArray(data.tickets)) db.tickets = data.tickets;
    if (Array.isArray(data.alerts)) db.alerts = data.alerts;

    db.saveToDisk();
    res.json({ success: true, message: 'بازیابی اطلاعات انجام شد (کلمه‌های عبور دست‌نخورده باقی ماندند).' });
  });

  // Unknown API routes must not fall through to the SPA handler.
  app.use('/api', (_req: Request, res: Response) => {
    fail(res, 404, 'مسیر مورد نظر یافت نشد.');
  });

  // ==========================================
  // Vite / static assets
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Error handler — internal details stay in the log, not in the response.
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled server error:', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'خطای غیرمنتظره در سرور رخ داده است.' });
    }
  });

  startSecurityJanitor();

  app.listen(PORT, '0.0.0.0', () => {
    console.log('=============================================');
    console.log('🔐 Caspian Management Backend is RUNNING on');
    console.log(`   http://0.0.0.0:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   CORS allow-list: ${allowedOrigins.length ? allowedOrigins.join(', ') : '(same-origin only)'}`);
    console.log('=============================================');
  });
}

startServer().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
