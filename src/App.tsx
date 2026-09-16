import React, { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { LoginRegister } from './components/LoginRegister';
import { MemberDashboard } from './components/MemberDashboard';
import { DailyActivityForm } from './components/DailyActivityForm';
import { ActivityReview } from './components/ActivityReview';
import { MonthlyArchiveView } from './components/MonthlyArchiveView';
import { AdminDashboard } from './components/AdminDashboard';
import { ScreenshotModal } from './components/ScreenshotModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { WarningModal } from './components/WarningModal';
import { AnimatedBackground } from './components/AnimatedBackground';
import { UserProfileModal } from './components/UserProfileModal';
import { MonthlyTasks } from './components/MonthlyTasks';
import { MeetingsHub } from './components/MeetingsHub';
import { LoginAnnouncementModal } from './components/LoginAnnouncementModal';
import { LeaderboardPanel } from './components/LeaderboardPanel';
import { MembersList } from './components/MembersList';
import { SideDrawerMenu } from './components/SideDrawerMenu';
import { TicketSystem } from './components/TicketSystem';
import { AdminManagementConsole } from './components/AdminManagementConsole';
import { SystemAlertBanner } from './components/SystemAlertBanner';
import { ForcePasswordChange } from './components/ForcePasswordChange';
import {
  User,
  ActivityReport,
  Warning,
  AppNotification,
  UserRole,
  WarningSeverity,
  UserPermissions,
  PermissionLevel,
  StaffTask,
  MeetingAnnouncement,
  MeetingReport,
  TaskStatus,
  Ticket,
  SystemAlert,
  TicketType,
  TicketStatus,
  TicketMessage,
} from './types';
import { isManagementRank, isTopFourRank, canManageTickets } from './lib/permissions';
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  fetchMe,
  fetchUsers as apiFetchUsers,
  adminResetPassword,
  adminCreateUser,
  getToken,
  setToken,
} from './lib/api';
import {
  getStoredUsers,
  saveUsers,
  deduplicateUsers,
  deduplicateById,
  getStoredReports,
  saveReports,
  getStoredWarnings,
  saveWarnings,
  getStoredNotifications,
  saveNotifications,
  getStoredTasks,
  saveTasks,
  getStoredMeetingAnnouncements,
  saveMeetingAnnouncements,
  getStoredMeetingReports,
  saveMeetingReports,
  getStoredTickets,
  saveTickets,
  getStoredSystemAlerts,
  saveSystemAlerts,
  getCurrentUserId,
  setCurrentUserId,
  resetToSeedData,
} from './lib/storage';

export default function App() {
  const [users, setUsers] = useState<User[]>(getStoredUsers);
  const [reports, setReports] = useState<ActivityReport[]>(getStoredReports);
  const [warnings, setWarnings] = useState<Warning[]>(getStoredWarnings);
  const [notifications, setNotifications] = useState<AppNotification[]>(getStoredNotifications);
  const [tasks, setTasks] = useState<StaffTask[]>(getStoredTasks);
  const [meetingAnnouncements, setMeetingAnnouncements] = useState<MeetingAnnouncement[]>(getStoredMeetingAnnouncements);
  const [meetingReports, setMeetingReports] = useState<MeetingReport[]>(getStoredMeetingReports);
  const [tickets, setTickets] = useState<Ticket[]>(getStoredTickets);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>(getStoredSystemAlerts);

  const [currentUserId, setCurrentUserIdState] = useState<string | null>(getCurrentUserId);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  /**
   * The server is the source of truth for "am I logged in".
   * A stale `currentUserId` in localStorage grants nothing on its own — without
   * a valid session token every API call is rejected with 401.
   */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!getToken()) {
        if (!cancelled) {
          setCurrentUserIdState(null);
          setSessionChecked(true);
        }
        return;
      }

      const me = await fetchMe();
      if (cancelled) return;

      if (!me) {
        setToken(null);
        setCurrentUserIdState(null);
      } else {
        upsertUserFromServer(me.user);
        setCurrentUserIdState(me.user.id);
        setMustChangePassword(me.mustChangePassword === true);
        void refreshUsersFromServer();
      }
      setSessionChecked(true);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Modals & Drawers
  const [screenshotModalReport, setScreenshotModalReport] = useState<ActivityReport | null>(null);
  const [warningModalTarget, setWarningModalTarget] = useState<User | null>(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [hasDismissedAnnouncement, setHasDismissedAnnouncement] = useState(false);

  // Appearance & Cyber Settings
  const [rgbFx, setRgbFx] = useState(true);
  const [particlesFx, setParticlesFx] = useState(true);
  const [themeMode, setThemeMode] = useState<'dark' | 'midnight' | 'emerald' | 'light'>('dark');
  const [soundFx, setSoundFx] = useState(true);

  // Sync body classes for RGB and Theme
  useEffect(() => {
    document.body.classList.toggle('rgb-disabled', !rgbFx);
  }, [rgbFx]);

  useEffect(() => {
    document.body.classList.remove('theme-light', 'theme-midnight', 'theme-emerald', 'theme-dark');
    document.body.classList.add(`theme-${themeMode}`);
  }, [themeMode]);

  // Live cross-tab and real-time storage synchronization
  useEffect(() => {
    const syncFromStorage = () => {
      const latestUsers = deduplicateUsers(getStoredUsers());
      setUsers((prev) => (JSON.stringify(prev) !== JSON.stringify(latestUsers) ? latestUsers : prev));

      const latestReports = deduplicateById(getStoredReports());
      setReports((prev) => (JSON.stringify(prev) !== JSON.stringify(latestReports) ? latestReports : prev));

      const latestWarnings = deduplicateById(getStoredWarnings());
      setWarnings((prev) => (JSON.stringify(prev) !== JSON.stringify(latestWarnings) ? latestWarnings : prev));

      const latestNotifications = deduplicateById(getStoredNotifications());
      setNotifications((prev) => (JSON.stringify(prev) !== JSON.stringify(latestNotifications) ? latestNotifications : prev));

      const latestTasks = deduplicateById(getStoredTasks());
      setTasks((prev) => (JSON.stringify(prev) !== JSON.stringify(latestTasks) ? latestTasks : prev));

      const latestAnnouncements = deduplicateById(getStoredMeetingAnnouncements());
      setMeetingAnnouncements((prev) => (JSON.stringify(prev) !== JSON.stringify(latestAnnouncements) ? latestAnnouncements : prev));

      const latestMeetingReports = deduplicateById(getStoredMeetingReports());
      setMeetingReports((prev) => (JSON.stringify(prev) !== JSON.stringify(latestMeetingReports) ? latestMeetingReports : prev));

      const latestTickets = deduplicateById(getStoredTickets());
      setTickets((prev) => (JSON.stringify(prev) !== JSON.stringify(latestTickets) ? latestTickets : prev));

      const latestSystemAlerts = deduplicateById(getStoredSystemAlerts());
      setSystemAlerts((prev) => (JSON.stringify(prev) !== JSON.stringify(latestSystemAlerts) ? latestSystemAlerts : prev));
    };

    // Initial sync
    syncFromStorage();

    const handleStorageEvent = () => syncFromStorage();
    const handleCustomEvent = () => syncFromStorage();
    const handleFocus = () => syncFromStorage();

    let bc: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        bc = new BroadcastChannel('caspian_storage_sync_channel');
        bc.onmessage = () => syncFromStorage();
      } catch (e) {
        console.warn('BroadcastChannel error', e);
      }
    }

    const intervalId = setInterval(syncFromStorage, 1000);

    window.addEventListener('storage', handleStorageEvent);
    window.addEventListener('caspian_storage_update', handleCustomEvent);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('caspian_storage_update', handleCustomEvent);
      window.removeEventListener('focus', handleFocus);
      if (bc) bc.close();
    };
  }, []);

  useEffect(() => {
    setCurrentUserId(currentUserId);
  }, [currentUserId]);

  const currentUser = users.find((u) => u.id === currentUserId) || null;

  // Filter current user notifications
  const userNotifications = notifications.filter(
    (n) => n.userId === (currentUser?.id || '')
  );

  // Handlers
  /**
   * SECURITY: authentication happens on the server. The browser never compares
   * passwords and never holds one; it only receives a short-lived session token.
   */
  const handleLogin = async (username: string, pass: string) => {
    const result = await apiLogin(username, pass);
    if (!result.success || !result.user) {
      return { success: false, error: result.error || 'ورود ناموفق بود.' };
    }

    // Trust the server's copy of the account (role, permissions, status).
    upsertUserFromServer(result.user);
    setCurrentUserIdState(result.user.id);
    setMustChangePassword(result.mustChangePassword === true);
    void refreshUsersFromServer();
    return { success: true };
  };

  /** Replaces the locally cached copy of an account with the server's version. */
  function upsertUserFromServer(serverUser: User) {
    setUsers((prev) => {
      const merged = prev.some((u) => u.id === serverUser.id)
        ? prev.map((u) => (u.id === serverUser.id ? { ...u, ...serverUser } : u))
        : [serverUser, ...prev];
      const clean = deduplicateUsers(merged);
      saveUsers(clean);
      return clean;
    });
  }

  /** Pulls the authoritative (sanitized) member list from the API. */
  async function refreshUsersFromServer() {
    const serverUsers = await apiFetchUsers();
    if (!serverUsers) return;
    setUsers((prev) => {
      const byId = new Map(prev.map((u) => [u.id, u]));
      for (const su of serverUsers) {
        byId.set(su.id, { ...(byId.get(su.id) || {}), ...su } as User);
      }
      const clean = deduplicateUsers([...byId.values()]);
      saveUsers(clean);
      return clean;
    });
  }

  const handleRegister = async (data: {
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    email: string;
    teamspeakName: string;
  }) => {
    // The server decides role, permission level and status. Nothing the client
    // sends can grant a rank, so the old client-side escalation path is gone.
    const result = await apiRegister(data);
    if (!result.success || !result.user) {
      return { success: false, error: result.error || 'ثبت‌نام ناموفق بود.' };
    }
    upsertUserFromServer(result.user);
    return { success: true, user: result.user };
  };

  const handleToggleUserOnline = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isOnline: !u.isOnline } : u))
    );
  };

  const handleLogout = () => {
    void apiLogout();
    setToken(null);
    setCurrentUserIdState(null);
    setMustChangePassword(false);
  };

  /**
   * Switching accounts requires a real login. Impersonating another user from
   * the UI without a password is no longer possible.
   */
  const handleSwitchUserRequest = (_user?: User) => {
    handleLogout();
  };

  const handleResetData = () => {
    resetToSeedData();
    setUsers(getStoredUsers());
    setReports(getStoredReports());
    setWarnings(getStoredWarnings());
    setNotifications(getStoredNotifications());
    setTasks(getStoredTasks());
    setMeetingAnnouncements(getStoredMeetingAnnouncements());
    setMeetingReports(getStoredMeetingReports());
    setCurrentUserIdState('user-owner-1');
  };

  const handleSubmitReport = (
    reportData: Omit<ActivityReport, 'id' | 'createdAt' | 'status'>
  ) => {
    const newReport: ActivityReport = {
      ...reportData,
      id: `report-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'Pending',
    };
    setReports((prev) => {
      const updated = [newReport, ...prev];
      saveReports(updated);
      return updated;
    });
  };

  const handleApproveReport = (reportId: string, comment?: string) => {
    setReports((prev) => {
      const updated = prev.map((r) => {
        if (r.id === reportId) {
          return {
            ...r,
            status: 'Approved' as const,
            reviewerId: currentUser?.id,
            reviewerName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Admin',
            reviewerComment: comment || 'Approved by Administration',
            reviewedAt: new Date().toISOString(),
          };
        }
        return r;
      });
      saveReports(updated);
      return updated;
    });

    const report = reports.find((r) => r.id === reportId);
    if (report) {
      const notif: AppNotification = {
        id: `notif-${Date.now()}`,
        userId: report.userId,
        title: 'Shift Report Approved',
        message: `Your shift report for ${report.date} (${report.totalHours} hrs) has been approved.`,
        type: 'activity_approved',
        createdAt: new Date().toISOString(),
        read: false,
        linkTab: 'dashboard',
      };
      setNotifications((prev) => {
        const updated = [notif, ...prev];
        saveNotifications(updated);
        return updated;
      });
    }
  };

  const handleRejectReport = (reportId: string, comment?: string) => {
    setReports((prev) => {
      const updated = prev.map((r) => {
        if (r.id === reportId) {
          return {
            ...r,
            status: 'Rejected' as const,
            reviewerId: currentUser?.id,
            reviewerName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Admin',
            reviewerComment: comment || 'Rejected due to insufficient details',
            reviewedAt: new Date().toISOString(),
          };
        }
        return r;
      });
      saveReports(updated);
      return updated;
    });

    const report = reports.find((r) => r.id === reportId);
    if (report) {
      const notif: AppNotification = {
        id: `notif-${Date.now()}`,
        userId: report.userId,
        title: 'Shift Report Rejected',
        message: `Your shift report for ${report.date} was rejected. Feedback: ${
          comment || 'Please contact administration.'
        }`,
        type: 'activity_rejected',
        createdAt: new Date().toISOString(),
        read: false,
        linkTab: 'dashboard',
      };
      setNotifications((prev) => {
        const updated = [notif, ...prev];
        saveNotifications(updated);
        return updated;
      });
    }
  };

  const handleCommentReport = (reportId: string, comment: string) => {
    setReports((prev) => {
      const updated = prev.map((r) => (r.id === reportId ? { ...r, reviewerComment: comment } : r));
      saveReports(updated);
      return updated;
    });
  };

  const handleDeleteReport = (reportId: string) => {
    setReports((prev) => {
      const updated = prev.filter((r) => r.id !== reportId);
      saveReports(updated);
      return updated;
    });
  };

  const handleIssueWarning = (
    userId: string,
    reason: string,
    description: string,
    severity: WarningSeverity
  ) => {
    const newWarn: Warning = {
      id: `warn-${Date.now()}`,
      userId,
      issuedById: currentUser?.id || 'admin',
      issuedByName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Admin',
      issuedByRole: currentUser?.role || 'Owner',
      reason,
      description,
      severity,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      acknowledged: false,
    };

    setWarnings((prev) => {
      const updated = [newWarn, ...prev];
      saveWarnings(updated);
      return updated;
    });

    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      userId,
      title: 'Formal Warning Issued',
      message: `${newWarn.issuedByRole} ${newWarn.issuedByName} issued a warning: ${reason}`,
      type: 'warning',
      createdAt: new Date().toISOString(),
      read: false,
      linkTab: 'dashboard',
    };
    setNotifications((prev) => {
      const updated = [notif, ...prev];
      saveNotifications(updated);
      return updated;
    });
  };

  const handleAcknowledgeWarning = (warningId: string) => {
    setWarnings((prev) => {
      const updated = prev.map((w) => (w.id === warningId ? { ...w, acknowledged: true } : w));
      saveWarnings(updated);
      return updated;
    });
  };

  const handleDeleteWarning = (warningId: string) => {
    setWarnings((prev) => {
      const updated = prev.filter((w) => w.id !== warningId);
      saveWarnings(updated);
      return updated;
    });
  };

  const handleApproveAccount = (userId: string, newRole?: UserRole) => {
    setUsers((prev) => {
      const freshStored = getStoredUsers();
      const base = freshStored.length > 0 ? freshStored : prev;
      const updated = base.map((u) => {
        if (u.id === userId) {
          const finalRole = newRole || u.role;
          const isMgmt = isManagementRank(finalRole);
          const isF = finalRole === 'Founder' || finalRole === 'Owner';
          return {
            ...u,
            status: 'Active' as const,
            role: finalRole,
            permissionLevel: isF ? (finalRole as PermissionLevel) : 'Staff',
            isFounder: isF,
            customPermissions: isMgmt
              ? {
                  canReviewReports: true,
                  canIssueWarnings: true,
                  canManageUsers: true,
                  canManagePermissions: true,
                }
              : u.customPermissions,
          };
        }
        return u;
      });
      const clean = deduplicateUsers(updated);
      saveUsers(clean);
      return clean;
    });

    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      userId,
      title: 'تایید عضویت در کادر مدیریت',
      message: 'درخواست عضویت شما توسط مدیریت ارشد (Founder, Owner, Supervisor, Moderator) تایید و فعال شد. خوش آمدید!',
      type: 'account_approved',
      createdAt: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => {
      const updated = [notif, ...prev];
      saveNotifications(updated);
      return updated;
    });
  };

  const handleSuspendAccount = (userId: string) => {
    setUsers((prev) => {
      const updated = prev.map((u) => (u.id === userId ? { ...u, status: 'Suspended' as const } : u));
      saveUsers(updated);
      return updated;
    });
  };

  const handleUnsuspendAccount = (userId: string) => {
    setUsers((prev) => {
      const updated = prev.map((u) => (u.id === userId ? { ...u, status: 'Active' as const } : u));
      saveUsers(updated);
      return updated;
    });
  };

  const handleDeleteAccount = (userId: string) => {
    setUsers((prev) => {
      const updated = prev.filter((u) => u.id !== userId);
      saveUsers(updated);
      return updated;
    });
  };

  const handleApproveAllPending = () => {
    setUsers((prev) => {
      const freshStored = getStoredUsers();
      const base = freshStored.length > 0 ? freshStored : prev;
      const updated = base.map((u) => {
        if (u.status === 'Pending') {
          const isMgmt = isManagementRank(u.role);
          const isF = u.role === 'Founder' || u.role === 'Owner';
          return {
            ...u,
            status: 'Active' as const,
            permissionLevel: isF ? (u.role as PermissionLevel) : 'Staff',
            isFounder: isF,
            customPermissions: isMgmt
              ? {
                  canReviewReports: true,
                  canIssueWarnings: true,
                  canManageUsers: true,
                  canManagePermissions: true,
                }
              : u.customPermissions,
          };
        }
        return u;
      });
      const clean = deduplicateUsers(updated);
      saveUsers(clean);
      return clean;
    });
  };

  const handleRejectAllPending = () => {
    setUsers((prev) => {
      const updated = prev.filter((u) => u.status !== 'Pending');
      saveUsers(updated);
      return updated;
    });
  };

  const handleChangeRole = (userId: string, role: UserRole) => {
    setUsers((prev) => {
      const updated = prev.map((u) => {
        if (u.id === userId) {
          const isMgmt = isManagementRank(role);
          const isF = role === 'Founder' || role === 'Owner';
          return {
            ...u,
            role,
            isRankAssigned: true,
            permissionLevel: isF ? (role as PermissionLevel) : u.permissionLevel,
            isFounder: isF ? true : u.isFounder,
            customPermissions: isMgmt
              ? {
                  canReviewReports: true,
                  canIssueWarnings: true,
                  canManageUsers: true,
                  canManagePermissions: true,
                  ...(u.customPermissions || {}),
                }
              : u.customPermissions,
          };
        }
        return u;
      });
      saveUsers(updated);
      return updated;
    });
    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      userId,
      title: 'ارتقا / تغییر رنک سازمانی',
      message: `رنک شما در کادر سرور کاسپین به ${role} تغییر یافت.`,
      type: 'role_changed',
      createdAt: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => {
      const updated = [notif, ...prev];
      saveNotifications(updated);
      return updated;
    });
  };

  const handleAssignUserRole = (userId: string, newRole: UserRole, ticketId?: string) => {
    setUsers((prev) => {
      const freshStored = getStoredUsers();
      const base = freshStored.length > 0 ? freshStored : prev;
      const updated = base.map((u) => {
        if (u.id === userId) {
          const isMgmt = isManagementRank(newRole);
          const isF = newRole === 'Founder' || newRole === 'Owner';
          return {
            ...u,
            role: newRole,
            isRankAssigned: true,
            status: 'Active' as const,
            permissionLevel: isF ? (newRole as PermissionLevel) : 'Staff',
            isFounder: isF,
            customPermissions: isMgmt
              ? {
                  canReviewReports: true,
                  canIssueWarnings: true,
                  canManageUsers: true,
                  canManagePermissions: true,
                  ...(u.customPermissions || {}),
                }
              : u.customPermissions,
          };
        }
        return u;
      });
      const clean = deduplicateUsers(updated);
      saveUsers(clean);
      return clean;
    });

    if (ticketId) {
      setTickets((prev) => {
        const fresh = getStoredTickets();
        const base = fresh.length > 0 ? fresh : prev;
        const updated = base.map((t) => {
          if (t.id === ticketId) {
            const systemMsg: TicketMessage = {
              id: `msg-${Date.now()}`,
              senderId: currentUser?.id || 'mgmt',
              senderName: `${currentUser?.firstName || 'مدیریت'} ${currentUser?.lastName || ''}`,
              senderRole: currentUser?.role || 'Founder',
              message: `✅ رنک سازمانی شما با تایید ۴ رنک اصلی به «${newRole}» ارتقا یافت و دسترسی به تمام امکانات سرور فعال گردید.`,
              createdAt: new Date().toISOString(),
              isStaffReply: true,
            };
            return {
              ...t,
              userRole: newRole,
              status: 'Answered' as const,
              updatedAt: new Date().toISOString(),
              messages: [...(t.messages || []), systemMsg],
            };
          }
          return t;
        });
        saveTickets(updated);
        return updated;
      });
    }

    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      userId,
      title: '👑 تعیین رنک رسمی توسط ۴ رنک اصلی',
      message: `رنک شما در کادر سرور با موفقیت به ${newRole} ارتقا و تنظیم شد. دسترسی کامل به تمامی پنل‌های سرور فعال گردید.`,
      type: 'role_changed',
      createdAt: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => {
      const updated = [notif, ...prev];
      saveNotifications(updated);
      return updated;
    });
  };

  const handleToggleFounder = (userId: string, makeFounder: boolean) => {
    if (currentUser?.permissionLevel !== 'Owner' && currentUser?.role !== 'Founder') return;
    setUsers((prev) => {
      const updated = prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              isFounder: makeFounder,
              permissionLevel: makeFounder ? ('Founder' as const) : ('Staff' as const),
              role: makeFounder ? ('Founder' as const) : u.role,
            }
          : u
      );
      saveUsers(updated);
      return updated;
    });
  };

  const handleResetPassword = async (userId: string, newPass: string) => {
    // The server hashes the new password and revokes the target's sessions.
    const result = await adminResetPassword(userId, newPass);
    if (!result.success) {
      console.warn('Password reset rejected by server:', result.error);
      return;
    }

    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      userId,
      title: 'بازنشانی رمز عبور حساب',
      // SECURITY: the new password is never echoed into a stored notification.
      message: 'رمز عبور حساب شما توسط مدیریت ارشد بازنشانی شد. لطفاً پس از ورود آن را تغییر دهید.',
      type: 'password_changed',
      createdAt: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => {
      const updated = [notif, ...prev];
      saveNotifications(updated);
      return updated;
    });
  };

  const handleUpdateUser = (userId: string, updatedData: Partial<User>) => {
    setUsers((prev) => {
      const updated = prev.map((u) => (u.id === userId ? { ...u, ...updatedData } : u));
      saveUsers(updated);
      return updated;
    });
  };

  const handleCreateAccountByAdmin = async (data: {
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    email: string;
    teamspeakName: string;
    role: UserRole;
  }) => {
    // The server refuses any rank at or above the creator's own rank, and
    // derives permissionLevel / isFounder itself.
    const result = await adminCreateUser({
      username: data.username.trim(),
      password: data.password,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: data.email.trim(),
      teamspeakName: data.teamspeakName.trim(),
      role: data.role,
    });

    if (!result.success || !result.user) {
      console.warn('Account creation rejected by server:', result.error);
      return;
    }
    upsertUserFromServer(result.user);
  };

  const handleMarkAllNotifsRead = () => {
    setNotifications((prev) =>
      prev.map((n) => (n.userId === currentUser?.id ? { ...n, read: true } : n))
    );
  };

  const handleClearAllNotifs = () => {
    setNotifications((prev) => prev.filter((n) => n.userId !== currentUser?.id));
  };

  const handleUpdateProfile = (updatedData: Partial<User>) => {
    if (!currentUser) return;
    setUsers((prev) => {
      const updated = prev.map((u) => (u.id === currentUser.id ? { ...u, ...updatedData } : u));
      saveUsers(updated);
      return updated;
    });
  };

  // Task Handlers
  const handleAddTask = (taskData: Omit<StaffTask, 'id' | 'createdAt' | 'createdById' | 'createdByName' | 'createdByRole'>) => {
    if (!currentUser) return;
    const newTask: StaffTask = {
      ...taskData,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
      createdById: currentUser.id,
      createdByName: `${currentUser.firstName} ${currentUser.lastName}`,
      createdByRole: currentUser.role,
    };
    setTasks((prev) => {
      const fresh = getStoredTasks();
      const base = fresh.length > 0 ? fresh : prev;
      const updated = deduplicateById([newTask, ...base]);
      saveTasks(updated);
      return updated;
    });

    // Send notifications if assigned to specific user
    if (taskData.assignedToType === 'User' && taskData.targetUserId) {
      const notif: AppNotification = {
        id: `notif-${Date.now()}`,
        userId: taskData.targetUserId,
        title: 'وظیفه جدید تخصیص داده شد',
        message: `وظیفه "${taskData.title}" توسط ${currentUser.firstName} (${currentUser.role}) به شما محول شد.`,
        type: 'task_assigned',
        createdAt: new Date().toISOString(),
        read: false,
        linkTab: 'tasks',
      };
      setNotifications((prev) => {
        const updated = [notif, ...prev];
        saveNotifications(updated);
        return updated;
      });
    }
  };

  const handleUpdateTaskStatus = (
    taskId: string,
    status: TaskStatus,
    notes?: string,
    proofUrl?: string
  ) => {
    setTasks((prev) => {
      const fresh = getStoredTasks();
      const base = fresh.length > 0 ? fresh : prev;
      const updated = base.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status,
              completionNotes: notes || t.completionNotes,
              proofUrl: proofUrl || t.proofUrl,
              completedAt: status === 'Completed' || status === 'Verified' ? new Date().toISOString() : t.completedAt,
            }
          : t
      );
      saveTasks(updated);
      return updated;
    });
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => {
      const fresh = getStoredTasks();
      const base = fresh.length > 0 ? fresh : prev;
      const updated = base.filter((t) => t.id !== taskId);
      saveTasks(updated);
      return updated;
    });
  };

  // Meeting Handlers
  const handleAddMeetingAnnouncement = (
    annData: Omit<MeetingAnnouncement, 'id' | 'createdAt' | 'createdById' | 'createdByName' | 'createdByRole' | 'status' | 'attendees'>
  ) => {
    if (!currentUser) return;
    const newAnn: MeetingAnnouncement = {
      ...annData,
      id: `meeting-ann-${Date.now()}`,
      createdAt: new Date().toISOString(),
      createdById: currentUser.id,
      createdByName: `${currentUser.firstName} ${currentUser.lastName}`,
      createdByRole: currentUser.role,
      status: 'Upcoming',
      attendees: [currentUser.id],
    };
    setMeetingAnnouncements((prev) => {
      const fresh = getStoredMeetingAnnouncements();
      const base = fresh.length > 0 ? fresh : prev;
      const updated = deduplicateById([newAnn, ...base]);
      saveMeetingAnnouncements(updated);
      return updated;
    });
  };

  const handleUpdateMeetingAnnouncement = (
    announcementId: string,
    updatedData: Partial<MeetingAnnouncement>
  ) => {
    setMeetingAnnouncements((prev) => {
      const fresh = getStoredMeetingAnnouncements();
      const base = fresh.length > 0 ? fresh : prev;
      const updated = base.map((a) => (a.id === announcementId ? { ...a, ...updatedData } : a));
      saveMeetingAnnouncements(updated);
      return updated;
    });
  };

  const handleToggleMeetingRSVP = (announcementId: string) => {
    if (!currentUser) return;
    setMeetingAnnouncements((prev) => {
      const fresh = getStoredMeetingAnnouncements();
      const base = fresh.length > 0 ? fresh : prev;
      const updated = base.map((a) => {
        if (a.id !== announcementId) return a;
        const hasAttended = a.attendees.includes(currentUser.id);
        const newAttendees = hasAttended
          ? a.attendees.filter((id) => id !== currentUser.id)
          : [...a.attendees, currentUser.id];
        return { ...a, attendees: newAttendees };
      });
      saveMeetingAnnouncements(updated);
      return updated;
    });
  };

  const handleDeleteMeetingAnnouncement = (announcementId: string) => {
    setMeetingAnnouncements((prev) => {
      const fresh = getStoredMeetingAnnouncements();
      const base = fresh.length > 0 ? fresh : prev;
      const updated = base.filter((a) => a.id !== announcementId);
      saveMeetingAnnouncements(updated);
      return updated;
    });
  };

  const handleAddMeetingReport = (
    repData: Omit<MeetingReport, 'id' | 'createdAt' | 'recordedById' | 'recordedByName' | 'recordedByRole'>
  ) => {
    if (!currentUser) return;
    const newRep: MeetingReport = {
      ...repData,
      id: `meeting-rep-${Date.now()}`,
      createdAt: new Date().toISOString(),
      recordedById: currentUser.id,
      recordedByName: `${currentUser.firstName} ${currentUser.lastName}`,
      recordedByRole: currentUser.role,
    };
    setMeetingReports((prev) => {
      const fresh = getStoredMeetingReports();
      const base = fresh.length > 0 ? fresh : prev;
      const updated = deduplicateById([newRep, ...base]);
      saveMeetingReports(updated);
      return updated;
    });
  };

  const handleUpdateMeetingReport = (
    reportId: string,
    updatedData: Partial<MeetingReport>
  ) => {
    setMeetingReports((prev) => {
      const fresh = getStoredMeetingReports();
      const base = fresh.length > 0 ? fresh : prev;
      const updated = base.map((r) => (r.id === reportId ? { ...r, ...updatedData } : r));
      saveMeetingReports(updated);
      return updated;
    });
  };

  const handleDeleteMeetingReport = (reportId: string) => {
    setMeetingReports((prev) => {
      const fresh = getStoredMeetingReports();
      const base = fresh.length > 0 ? fresh : prev;
      const updated = base.filter((r) => r.id !== reportId);
      saveMeetingReports(updated);
      return updated;
    });
  };

  const handleResetMonthlyLeaderboard = (newMonthName: string) => {
    const newNotifs: AppNotification[] = users.map((u) => ({
      id: `notif-monthly-reset-${Date.now()}-${u.id}`,
      userId: u.id,
      title: `📢 ماه جدید سرور Caspian (${newMonthName}) آغاز شد!`,
      message: `سلام ${u.firstName} عزیز. ماه کاری جدید آغاز گردید. تمامی ساعات کارکرد و رتبه‌بندی مجدداً صفر شده و مسابقه ماهانه آغاز گردید.`,
      type: 'meeting_announced',
      createdAt: new Date().toISOString(),
      read: false,
      linkTab: 'leaderboard',
    }));
    setNotifications((prev) => {
      const updated = [...newNotifs, ...prev];
      saveNotifications(updated);
      return updated;
    });
  };

  const handleBroadcastAlert = (title: string, message: string) => {
    const newNotifs: AppNotification[] = users.map((u) => ({
      id: `notif-broadcast-${Date.now()}-${u.id}`,
      userId: u.id,
      title,
      message,
      type: 'role_changed',
      createdAt: new Date().toISOString(),
      read: false,
    }));
    setNotifications((prev) => {
      const updated = [...newNotifs, ...prev];
      saveNotifications(updated);
      return updated;
    });
  };

  // Ticket System & System Alert Handlers
  const handleCreateTicket = (
    ticketData: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'userName' | 'userRole' | 'messages'>,
    initialMessage: string
  ) => {
    if (!currentUser) return;
    const newTicket: Ticket = {
      ...ticketData,
      id: `ticket-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      userRole: currentUser.role,
      userAvatar: currentUser.avatarUrl,
      userTeamspeak: currentUser.teamspeakName,
      status: 'Open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: `msg-${Date.now()}`,
          senderId: currentUser.id,
          senderName: `${currentUser.firstName} ${currentUser.lastName}`,
          senderRole: currentUser.role,
          message: initialMessage,
          createdAt: new Date().toISOString(),
        },
      ],
    };

    setTickets((prev) => {
      const freshStored = getStoredTickets();
      const base = freshStored.length > 0 ? freshStored : prev;
      const updated = deduplicateById([newTicket, ...base]);
      saveTickets(updated);
      return updated;
    });

    // Sync to backend API asynchronously
    fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTicket),
    }).catch((err) => console.warn('API ticket sync error', err));

    // Target the 4 main Admin Ranks for notifications (Founder, Owner, Supervisor, Moderator, Manager)
    const mgmtUsers = users.filter(
      (u) =>
        isManagementRank(u.role) ||
        isTopFourRank(u.role) ||
        u.permissionLevel === 'Founder' ||
        u.permissionLevel === 'Owner' ||
        u.permissionLevel === 'HighRank' ||
        u.role === 'Moderator' ||
        u.role === 'Supervisor'
    );
    const notifs: AppNotification[] = mgmtUsers.map((u) => ({
      id: `notif-ticket-${Date.now()}-${u.id}`,
      userId: u.id,
      title: `📩 تیکت جدید کادر (${newTicket.type === 'RoleRequest' ? '👑 تعیین رنک' : newTicket.type === 'LeaveRequest' ? '🏖️ مرخصی' : '💬 صحبت'}): ${newTicket.title}`,
      message: `تیکت جدیدی توسط ${currentUser.firstName} ${currentUser.lastName} (${currentUser.role}) برای بررسی ۴ رنک اصلی ارسال شد.`,
      type: 'activity_approved',
      createdAt: new Date().toISOString(),
      read: false,
      linkTab: 'tickets',
    }));

    setNotifications((prev) => {
      const updatedN = [...notifs, ...prev];
      saveNotifications(updatedN);
      return updatedN;
    });

    soundFx?.playSuccess?.();
    return newTicket;
  };

  const handleAddTicketReply = (ticketId: string, message: string) => {
    if (!currentUser) return;
    setTickets((prev) => {
      const freshStored = getStoredTickets();
      const base = freshStored.length > 0 ? freshStored : prev;
      const isStaff = isManagementRank(currentUser.role) || isTopFourRank(currentUser.role);
      const updated = base.map((t) => {
        if (t.id === ticketId) {
          const newMsg: TicketMessage = {
            id: `msg-${Date.now()}`,
            senderId: currentUser.id,
            senderName: `${currentUser.firstName} ${currentUser.lastName}`,
            senderRole: currentUser.role,
            message,
            createdAt: new Date().toISOString(),
            isStaffReply: isStaff,
          };

          if (isStaff && t.userId !== currentUser.id) {
            const notif: AppNotification = {
              id: `notif-ticket-reply-${Date.now()}`,
              userId: t.userId,
              title: `💬 پاسخ جدید ۴ رنک اصلی به تیکت: ${t.title}`,
              message: `مدیریت (${currentUser.firstName} ${currentUser.lastName} - ${currentUser.role}) به تیکت شما پاسخ داد.`,
              type: 'activity_approved',
              createdAt: new Date().toISOString(),
              read: false,
              linkTab: 'tickets',
            };
            setNotifications((n) => {
              const updatedNotifs = [notif, ...n];
              saveNotifications(updatedNotifs);
              return updatedNotifs;
            });
          }

          return {
            ...t,
            status: isStaff ? ('Answered' as const) : ('InReview' as const),
            updatedAt: new Date().toISOString(),
            messages: [...(t.messages || []), newMsg],
          };
        }
        return t;
      });
      saveTickets(updated);
      return updated;
    });

    // Sync to backend API
    fetch(`/api/tickets/${ticketId}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: currentUser.id,
        senderName: `${currentUser.firstName} ${currentUser.lastName}`,
        senderRole: currentUser.role,
        message,
        isStaffReply: isManagementRank(currentUser.role) || isTopFourRank(currentUser.role),
      }),
    }).catch((err) => console.warn('API ticket reply sync error', err));
  };

  const handleUpdateTicketStatus = (ticketId: string, status: TicketStatus) => {
    setTickets((prev) => {
      const freshStored = getStoredTickets();
      const base = freshStored.length > 0 ? freshStored : prev;
      const updated = base.map((t) => (t.id === ticketId ? { ...t, status, updatedAt: new Date().toISOString() } : t));
      saveTickets(updated);
      return updated;
    });

    // Sync to backend API
    fetch(`/api/tickets/${ticketId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).catch((err) => console.warn('API ticket status sync error', err));
  };

  const handleDeleteTicket = (ticketId: string) => {
    setTickets((prev) => {
      const freshStored = getStoredTickets();
      const base = freshStored.length > 0 ? freshStored : prev;
      const updated = base.filter((t) => t.id !== ticketId);
      saveTickets(updated);
      return updated;
    });

    // Sync deletion to backend API
    fetch(`/api/tickets/${ticketId}`, {
      method: 'DELETE',
    }).catch((err) => console.warn('API ticket delete sync error', err));
  };

  const handleDismissSystemAlert = (alertId: string) => {
    setSystemAlerts((prev) => {
      const freshStored = getStoredSystemAlerts();
      const base = freshStored.length > 0 ? freshStored : prev;
      const updated = base.map((a) => (a.id === alertId ? { ...a, active: false } : a));
      saveSystemAlerts(updated);
      return updated;
    });
  };

  if (!sessionChecked) {
    return (
      <div className="relative min-h-screen bg-slate-950 text-slate-100 font-sans flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <ShieldCheck className="w-5 h-5 text-sky-400 animate-pulse" />
          <span className="text-sm">در حال بررسی نشست کاربری...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="relative min-h-screen bg-slate-950 text-slate-100 font-sans overflow-x-hidden">
        <AnimatedBackground />
        <LoginRegister
          onLogin={handleLogin}
          onRegister={handleRegister}
          allUsers={users}
        />
      </div>
    );
  }

  if (mustChangePassword) {
    return (
      <div className="relative min-h-screen bg-slate-950 text-slate-100 font-sans">
        <AnimatedBackground />
        <ForcePasswordChange
          displayName={`${currentUser.firstName} ${currentUser.lastName}`.trim() || currentUser.username}
          onCompleted={() => setMustChangePassword(false)}
          onLogout={handleLogout}
        />
      </div>
    );
  }

  const userReportsList = reports.filter((r) => r.userId === currentUser.id);
  const userWarningsList = warnings.filter((w) => w.userId === currentUser.id);

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-sky-500 selection:text-slate-950">
      {/* Animated Epic Background */}
      <AnimatedBackground particlesFx={particlesFx} themeMode={themeMode} rgbFx={rgbFx} />

      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        notifications={userNotifications}
        onOpenNotifications={() => setIsNotificationOpen(true)}
        onLogout={handleLogout}
        allUsers={users}
        onSwitchUser={handleSwitchUserRequest}
        onResetData={handleResetData}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenDrawer={() => setIsDrawerOpen(true)}
      />

      {/* High-Level System Broadcast Alerts Banner */}
      <SystemAlertBanner alerts={systemAlerts} onDismiss={handleDismissSystemAlert} />

      {/* Main Container Viewport */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Unassigned Rank Notice Banner for new registrants */}
        {currentUser.isRankAssigned === false && (
          <div className="mb-6 p-5 bg-gradient-to-r from-amber-950/70 via-indigo-950/70 to-slate-900 border-2 border-amber-500/50 rounded-2xl shadow-2xl space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-2xl shrink-0 animate-pulse">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-amber-200">
                    ثبت‌نام با موفقیت انجام شد — در انتظار تایید و ست شدن رنک توسط ۴ رنک اصلی
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    حساب کاربری شما فعال است. دسترسی شما تا زمان ست شدن رنک فقط به بخش تیکت‌ها محدود می‌باشد. لطفاً از طریق دکمه «ارسال تیکت جدید» یک تیکت درخواست تعیین رنک ثبت فرمایید تا ۴ رنک اصلی سرور (Founder, Owner, Manager, Supervisor) رنک شما را تایید و تنظیم نمایند.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* If user is waiting for rank assignment, only show TicketSystem */}
        {currentUser.isRankAssigned === false ? (
          <TicketSystem
            currentUser={currentUser}
            tickets={tickets}
            allUsers={users}
            onCreateTicket={handleCreateTicket}
            onReplyTicket={handleAddTicketReply}
            onUpdateTicketStatus={handleUpdateTicketStatus}
            onAssignUserRole={handleAssignUserRole}
            soundFx={soundFx}
          />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <MemberDashboard
                currentUser={currentUser}
                userReports={userReportsList}
                userWarnings={userWarningsList}
                onAcknowledgeWarning={handleAcknowledgeWarning}
                onOpenScreenshot={setScreenshotModalReport}
                onOpenProfile={() => setIsProfileModalOpen(true)}
                onOpenDrawer={() => setIsDrawerOpen(true)}
                rgbFx={rgbFx}
                onToggleRgb={() => setRgbFx(!rgbFx)}
                themeMode={themeMode}
                onToggleTheme={(theme) => setThemeMode(theme)}
              />
            )}

            {activeTab === 'leaderboard' && (
              <LeaderboardPanel
                currentUser={currentUser}
                allUsers={users}
                allReports={reports}
                onResetMonthlyLeaderboard={handleResetMonthlyLeaderboard}
              />
            )}

            {activeTab === 'members' && (
              <MembersList
                allUsers={users}
                currentUser={currentUser}
                reports={reports}
                onOpenProfile={() => setIsProfileModalOpen(true)}
                onToggleUserOnline={handleToggleUserOnline}
              />
            )}

            {activeTab === 'tasks' && (
              <MonthlyTasks
                currentUser={currentUser}
                tasks={tasks}
                allUsers={users}
                onAddTask={handleAddTask}
                onUpdateTaskStatus={handleUpdateTaskStatus}
                onDeleteTask={handleDeleteTask}
              />
            )}

            {activeTab === 'meetings' && (
              <MeetingsHub
                currentUser={currentUser}
                announcements={meetingAnnouncements}
                reports={meetingReports}
                allUsers={users}
                onAddAnnouncement={handleAddMeetingAnnouncement}
                onUpdateAnnouncement={handleUpdateMeetingAnnouncement}
                onToggleRSVP={handleToggleMeetingRSVP}
                onDeleteAnnouncement={handleDeleteMeetingAnnouncement}
                onAddReport={handleAddMeetingReport}
                onUpdateReport={handleUpdateMeetingReport}
                onDeleteReport={handleDeleteMeetingReport}
                soundFx={soundFx}
              />
            )}

            {activeTab === 'tickets' && (
              <TicketSystem
                currentUser={currentUser}
                tickets={tickets}
                allUsers={users}
                onCreateTicket={handleCreateTicket}
                onReplyTicket={handleAddTicketReply}
                onUpdateTicketStatus={handleUpdateTicketStatus}
                onAssignUserRole={handleAssignUserRole}
                onDeleteTicket={handleDeleteTicket}
                soundFx={soundFx}
              />
            )}

            {activeTab === 'daily_report' && (
              <DailyActivityForm
                currentUser={currentUser}
                onSubmitReport={handleSubmitReport}
              />
            )}

            {activeTab === 'monthly_archive' && (
              <MonthlyArchiveView
                currentUser={currentUser}
                allUsers={users}
                reports={reports}
                warnings={warnings}
                onOpenScreenshot={setScreenshotModalReport}
              />
            )}

            {activeTab === 'review_activities' && (
              <ActivityReview
                currentUser={currentUser}
                reports={reports}
                onApprove={handleApproveReport}
                onReject={handleRejectReport}
                onComment={handleCommentReport}
                onDelete={handleDeleteReport}
                onOpenScreenshot={setScreenshotModalReport}
              />
            )}

            {activeTab === 'console' && (
              <AdminManagementConsole
                currentUser={currentUser}
                allUsers={users}
                reports={reports}
                warnings={warnings}
                meetingAnnouncements={meetingAnnouncements}
                meetingReports={meetingReports}
                tickets={tickets}
                systemAlerts={systemAlerts}
                onApproveUser={handleApproveAccount}
                onRejectUser={handleDeleteAccount}
                onDeleteUser={handleDeleteAccount}
                onSuspendUser={handleSuspendAccount}
                onUnsuspendUser={handleUnsuspendAccount}
                onChangeRole={handleChangeRole}
                onAssignUserRole={handleAssignUserRole}
                onToggleFounder={handleToggleFounder}
                onResetPassword={handleResetPassword}
                onTogglePermission={handleTogglePermission}
                onCreateUser={handleCreateAccountByAdmin}
                onUpdateUser={handleUpdateUser}
                onApproveAllPending={handleApproveAllPending}
                onRejectAllPending={handleRejectAllPending}
                onIssueWarning={handleIssueWarning}
                onDeleteWarning={handleDeleteWarning}
                onAddMeetingAnnouncement={handleAddMeetingAnnouncement}
                onUpdateMeetingAnnouncement={handleUpdateMeetingAnnouncement}
                onDeleteMeetingAnnouncement={handleDeleteMeetingAnnouncement}
                onAddMeetingReport={handleAddMeetingReport}
                onUpdateMeetingReport={handleUpdateMeetingReport}
                onDeleteMeetingReport={handleDeleteMeetingReport}
                onBroadcastAlert={handleBroadcastAlert}
                onResetMonthlyLeaderboard={handleResetMonthlyLeaderboard}
                onUpdateTicketStatus={handleUpdateTicketStatus}
                onReplyTicket={handleAddTicketReply}
                onDeleteTicket={handleDeleteTicket}
                onApproveReport={handleApproveReport}
                onRejectReport={handleRejectReport}
                onCommentReport={handleCommentReport}
                onDeleteReport={handleDeleteReport}
                onOpenScreenshot={setScreenshotModalReport}
                soundFx={soundFx}
              />
            )}

            {activeTab === 'admin_console' && (
              <AdminDashboard
                currentUser={currentUser}
                allUsers={users}
                allReports={reports}
                allWarnings={warnings}
                onApproveAccount={handleApproveAccount}
                onSuspendAccount={handleSuspendAccount}
                onUnsuspendAccount={handleUnsuspendAccount}
                onDeleteAccount={handleDeleteAccount}
                onChangeRole={handleChangeRole}
                onToggleFounder={handleToggleFounder}
                onResetPassword={handleResetPassword}
                onTogglePermission={handleTogglePermission}
                onCreateAccount={handleCreateAccountByAdmin}
                onOpenWarningModal={setWarningModalTarget}
                onDeleteWarning={handleDeleteWarning}
                onOpenScreenshot={setScreenshotModalReport}
                onBroadcastAlert={handleBroadcastAlert}
                onResetMonthlyLeaderboard={handleResetMonthlyLeaderboard}
              />
            )}
          </>
        )}
      </main>

      {/* Screenshot Lightbox Modal */}
      <ScreenshotModal
        report={screenshotModalReport}
        onClose={() => setScreenshotModalReport(null)}
      />

      {/* Issue Warning Modal */}
      <WarningModal
        isOpen={!!warningModalTarget}
        onClose={() => setWarningModalTarget(null)}
        targetUser={warningModalTarget}
        onIssueWarning={handleIssueWarning}
      />

      {/* Notification Center Drawer */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        notifications={userNotifications}
        onMarkAllRead={handleMarkAllNotifsRead}
        onClearAll={handleClearAllNotifs}
        onSelectNotification={(notif) => {
          if (notif.linkTab) setActiveTab(notif.linkTab);
          setIsNotificationOpen(false);
        }}
      />

      {/* User Profile Customization Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onUpdateProfile={handleUpdateProfile}
        reports={reports}
      />

      {/* Entry Founder Welcome Popup Modal */}
      {!hasDismissedAnnouncement && currentUser && (
        <LoginAnnouncementModal
          currentUser={currentUser}
          onClose={() => setHasDismissedAnnouncement(true)}
        />
      )}

      {/* Side Slide-Over Drawer Navigation & Cyber Controls */}
      <SideDrawerMenu
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        allUsers={users}
        onSwitchUser={handleSwitchUserRequest}
        onResetData={handleResetData}
        rgbFx={rgbFx}
        onToggleRgb={() => setRgbFx(!rgbFx)}
        particlesFx={particlesFx}
        onToggleParticles={() => setParticlesFx(!particlesFx)}
        themeMode={themeMode}
        onToggleTheme={(theme) => setThemeMode(theme)}
        soundFx={soundFx}
        onToggleSound={() => setSoundFx(!soundFx)}
        onOpenProfile={() => {
          setIsProfileModalOpen(true);
          setIsDrawerOpen(false);
        }}
        onLogout={handleLogout}
      />
    </div>
  );
}

