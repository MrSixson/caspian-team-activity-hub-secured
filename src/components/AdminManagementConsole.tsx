import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Crown,
  Users,
  UserPlus,
  Megaphone,
  FileText,
  AlertTriangle,
  Activity,
  MessageSquare,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  XCircle,
  Sparkles,
  Award,
  Volume2,
  Ban,
  UserCheck,
  Search,
  Filter,
  Calendar,
  Clock,
  Radio,
  Send,
  KeyRound,
  Lock,
  UserX,
  FileSpreadsheet,
  RotateCcw,
  Eye,
  CheckSquare,
  X,
} from 'lucide-react';
import {
  User,
  UserRole,
  ALL_ROLES,
  MeetingAnnouncement,
  MeetingReport,
  Warning,
  WarningSeverity,
  Ticket,
  TicketStatus,
  SystemAlert,
  ActivityReport,
  UserPermissions,
  PermissionLevel,
} from '../types';
import { RoleBadge } from './RoleBadge';
import { TicketSystem } from './TicketSystem';
import { isTopFourRank, isManagementRank } from '../lib/permissions';
import { exportReportsToExcel, exportUserSummaryToPDF } from '../lib/export';

interface AdminManagementConsoleProps {
  currentUser: User;
  allUsers?: User[];
  announcements?: MeetingAnnouncement[];
  meetingAnnouncements?: MeetingAnnouncement[];
  meetingReports?: MeetingReport[];
  warnings?: Warning[];
  tickets?: Ticket[];
  systemAlerts?: SystemAlert[];
  activityReports?: ActivityReport[];
  reports?: ActivityReport[];
  onSaveUsers?: (users: User[]) => void;
  onSaveAnnouncements?: (announcements: MeetingAnnouncement[]) => void;
  onSaveMeetingReports?: (reports: MeetingReport[]) => void;
  onSaveWarnings?: (warnings: Warning[]) => void;
  onSaveTickets?: (tickets: Ticket[]) => void;
  onSaveSystemAlerts?: (alerts: SystemAlert[]) => void;
  onChangeRole?: (userId: string, newRole: UserRole) => void;
  onApproveUser?: (userId: string, newRole?: UserRole) => void;
  onRejectUser?: (userId: string) => void;
  onDeleteUser?: (userId: string) => void;
  onSuspendUser?: (userId: string) => void;
  onUnsuspendUser?: (userId: string) => void;
  onToggleFounder?: (userId: string, makeFounder: boolean) => void;
  onResetPassword?: (userId: string, newPass: string) => void;
  onTogglePermission?: (userId: string, permKey: keyof UserPermissions, enabled: boolean) => void;
  onCreateUser?: (data: {
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    email: string;
    teamspeakName: string;
    role: UserRole;
  }) => void;
  onUpdateUser?: (userId: string, updatedData: Partial<User>) => void;
  onApproveAllPending?: () => void;
  onRejectAllPending?: () => void;
  onIssueWarning?: (userId: string, reason: string, severity: WarningSeverity, desc?: string) => void;
  onDeleteWarning?: (warnId: string) => void;
  onAddMeetingAnnouncement?: (ann: any) => void;
  onUpdateMeetingAnnouncement?: (id: string, updatedData: Partial<MeetingAnnouncement>) => void;
  onDeleteMeetingAnnouncement?: (id: string) => void;
  onAddMeetingReport?: (rep: any) => void;
  onUpdateMeetingReport?: (id: string, updatedData: Partial<MeetingReport>) => void;
  onDeleteMeetingReport?: (id: string) => void;
  onBroadcastAlert?: (title: string, message: string, severity?: 'info' | 'warning' | 'danger') => void;
  onResetMonthlyLeaderboard?: (newMonthName: string) => void;
  onUpdateTicketStatus?: (ticketId: string, status: TicketStatus) => void;
  onReplyTicket?: (ticketId: string, message: string) => void;
  onDeleteTicket?: (ticketId: string) => void;
  onAssignUserRole?: (userId: string, newRole: UserRole, ticketId?: string) => void;
  onApproveReport?: (reportId: string, comment?: string) => void;
  onRejectReport?: (reportId: string, comment?: string) => void;
  onCommentReport?: (reportId: string, comment: string) => void;
  onDeleteReport?: (reportId: string) => void;
  onOpenScreenshot?: (report: ActivityReport) => void;
  soundFx?: any;
}

export const AdminManagementConsole: React.FC<AdminManagementConsoleProps> = ({
  currentUser,
  allUsers = [],
  announcements = [],
  meetingAnnouncements = [],
  meetingReports = [],
  warnings = [],
  tickets = [],
  systemAlerts = [],
  activityReports = [],
  reports = [],
  onSaveUsers,
  onApproveUser,
  onRejectUser,
  onDeleteUser,
  onSuspendUser,
  onUnsuspendUser,
  onToggleFounder,
  onResetPassword,
  onTogglePermission,
  onCreateUser,
  onUpdateUser,
  onApproveAllPending,
  onRejectAllPending,
  onSaveAnnouncements,
  onSaveMeetingReports,
  onSaveWarnings,
  onSaveTickets,
  onSaveSystemAlerts,
  onChangeRole,
  onIssueWarning,
  onDeleteWarning,
  onAddMeetingAnnouncement,
  onUpdateMeetingAnnouncement,
  onDeleteMeetingAnnouncement,
  onAddMeetingReport,
  onUpdateMeetingReport,
  onDeleteMeetingReport,
  onBroadcastAlert,
  onResetMonthlyLeaderboard,
  onUpdateTicketStatus,
  onReplyTicket,
  onDeleteTicket,
  onAssignUserRole,
  onApproveReport,
  onRejectReport,
  onCommentReport,
  onDeleteReport,
  onOpenScreenshot,
  soundFx,
}) => {
  const announcementsList = announcements.length > 0 ? announcements : meetingAnnouncements || [];
  const activityReportsList = activityReports.length > 0 ? activityReports : reports || [];
  const safeUsers = allUsers || [];
  const pendingUsers = safeUsers.filter((u) => u.status === 'Pending');
  const unrankedUsers = safeUsers.filter((u) => u.isRankAssigned === false && u.status !== 'Suspended');
  const safeWarnings = warnings || [];
  const safeMeetingReports = meetingReports || [];
  const safeTickets = tickets || [];
  const safeSystemAlerts = systemAlerts || [];
  const roleRequestTickets = safeTickets.filter((t) => t.type === 'RoleRequest' && t.status !== 'Closed');
  const totalPendingRequests = pendingUsers.length + unrankedUsers.length + roleRequestTickets.length;

  // Active Tab
  const [activeTab, setActiveTab] = useState<'requests' | 'users' | 'meetings' | 'warnings' | 'activity' | 'tickets' | 'broadcast'>(
    totalPendingRequests > 0 ? 'requests' : 'users'
  );

  // Search & Filters
  const [pendingRolesMap, setPendingRolesMap] = useState<Record<string, UserRole>>({});
  const [ticketRolesMap, setTicketRolesMap] = useState<Record<string, UserRole>>({});
  const [requestSearch, setRequestSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [warningSearch, setWarningSearch] = useState('');

  // Toast / Feedback message
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'danger' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'danger' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Speech Announcement
  const handlePlayVoiceWelcome = () => {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const welcomeText = `به کنسول مدیریت خوش آمدید ${currentUser.firstName} ${currentUser.lastName}`;
        const utterance = new SpeechSynthesisUtterance(welcomeText);
        utterance.lang = 'fa-IR';
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
        showToast('پیام صوتی خوش‌آمدگویی پخش گردید.', 'info');
      } catch (e) {
        console.log('Speech synthesis error', e);
      }
    }
  };

  useEffect(() => {
    handlePlayVoiceWelcome();
  }, []);

  // Modals state
  const [selectedUserForRank, setSelectedUserForRank] = useState<User | null>(null);
  const [newRoleInput, setNewRoleInput] = useState<UserRole>('Helper');

  const [selectedUserForDelete, setSelectedUserForDelete] = useState<User | null>(null);
  const [selectedUserForResetPass, setSelectedUserForResetPass] = useState<User | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');

  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editTsName, setEditTsName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editDiscord, setEditDiscord] = useState('');

  const [selectedUserForPerms, setSelectedUserForPerms] = useState<User | null>(null);

  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [newUserFName, setNewUserFName] = useState('');
  const [newUserLName, setNewUserLName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserTsName, setNewUserTsName] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('Helper');

  const [showResetLeaderboardModal, setShowResetLeaderboardModal] = useState(false);
  const [newMonthInput, setNewMonthInput] = useState('شهریور ۱۴۰۵');

  // Warning Form state
  const [warningUserId, setWarningUserId] = useState('');
  const [warningReason, setWarningReason] = useState('');
  const [warningDesc, setWarningDesc] = useState('');
  const [warningSeverity, setWarningSeverity] = useState<WarningSeverity>('Medium');

  // Meeting Announcement modal state
  const [isCreatingAnnouncement, setIsCreatingAnnouncement] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annDesc, setAnnDesc] = useState('');
  const [annDate, setAnnDate] = useState('');
  const [annTime, setAnnTime] = useState('۲۱:۰۰');
  const [annLocation, setAnnLocation] = useState('کانال عمومی تیم‌اسپیک');
  const [annAudience, setAnnAudience] = useState('تمامی اعضای کادر');

  // Meeting Report modal state
  const [isCreatingReport, setIsCreatingReport] = useState(false);
  const [repTitle, setRepTitle] = useState('');
  const [repDate, setRepDate] = useState('');
  const [repTime, setRepTime] = useState('۲۱:۰۰');
  const [repFounderStmt, setRepFounderStmt] = useState('');
  const [repDecisions, setRepDecisions] = useState('');
  const [repActionItems, setRepActionItems] = useState('');
  const [repSummary, setRepSummary] = useState('');

  // System Broadcast state
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'info' | 'warning' | 'danger'>('danger');

  // Activity Review Feedback state
  const [reviewCommentMap, setReviewCommentMap] = useState<Record<string, string>>({});

  // User Actions Handlers
  const handleApproveUserAction = (userId: string, role?: UserRole) => {
    if (onApproveUser) {
      onApproveUser(userId, role);
    } else if (onSaveUsers) {
      const updated = safeUsers.map((u) => (u.id === userId ? { ...u, status: 'Active' as const, role: role || u.role } : u));
      onSaveUsers(updated);
    }
    soundFx?.playSuccess?.();
    showToast('درخواست عضویت کاربر با موفقیت تایید و فعال شد.', 'success');
  };

  const handleAssignRankAction = (userId: string, newRole: UserRole, ticketId?: string) => {
    if (onAssignUserRole) {
      onAssignUserRole(userId, newRole, ticketId);
    } else if (onChangeRole) {
      onChangeRole(userId, newRole);
    } else if (onApproveUser) {
      onApproveUser(userId, newRole);
    } else if (onSaveUsers) {
      const updated = safeUsers.map((u) =>
        u.id === userId ? { ...u, role: newRole, isRankAssigned: true, status: 'Active' as const } : u
      );
      onSaveUsers(updated);
    }

    if (ticketId && onUpdateTicketStatus) {
      onUpdateTicketStatus(ticketId, 'Answered');
    }

    soundFx?.playSuccess?.();
    showToast(`رنک کاربر با موفقیت به «${newRole}» تعیین گردید و دسترسی‌ها فعال شد.`, 'success');
  };

  const handleRejectUserAction = (userId: string) => {
    if (onRejectUser) {
      onRejectUser(userId);
    } else if (onDeleteUser) {
      onDeleteUser(userId);
    } else if (onSaveUsers) {
      const updated = safeUsers.filter((u) => u.id !== userId);
      onSaveUsers(updated);
    }
    soundFx?.playClick?.();
    showToast('درخواست عضویت رد و از سامانه حذف گردید.', 'danger');
  };

  const handleConfirmDeleteUser = () => {
    if (!selectedUserForDelete) return;
    if (onDeleteUser) {
      onDeleteUser(selectedUserForDelete.id);
    } else if (onRejectUser) {
      onRejectUser(selectedUserForDelete.id);
    } else if (onSaveUsers) {
      const updated = safeUsers.filter((u) => u.id !== selectedUserForDelete.id);
      onSaveUsers(updated);
    }
    soundFx?.playClick?.();
    showToast(`اکانت کاربر ${selectedUserForDelete.firstName} ${selectedUserForDelete.lastName} برای همیشه از سامانه حذف شد.`, 'danger');
    setSelectedUserForDelete(null);
  };

  const handleToggleUserStatus = (user: User) => {
    if (user.status === 'Active') {
      if (onSuspendUser) onSuspendUser(user.id);
      else if (onSaveUsers) onSaveUsers(safeUsers.map((u) => (u.id === user.id ? { ...u, status: 'Suspended' as const } : u)));
      showToast(`حساب کاربری ${user.firstName} به حالت تعلیق درآمد.`, 'danger');
    } else {
      if (onUnsuspendUser) onUnsuspendUser(user.id);
      else if (onSaveUsers) onSaveUsers(safeUsers.map((u) => (u.id === user.id ? { ...u, status: 'Active' as const } : u)));
      showToast(`حساب کاربری ${user.firstName} مجدداً فعال گردید.`, 'success');
    }
    soundFx?.playClick?.();
  };

  const handleApplyRoleChange = () => {
    if (!selectedUserForRank) return;
    if (onChangeRole) {
      onChangeRole(selectedUserForRank.id, newRoleInput);
    } else if (onSaveUsers) {
      const updated = safeUsers.map((u) => (u.id === selectedUserForRank.id ? { ...u, role: newRoleInput } : u));
      onSaveUsers(updated);
    }
    soundFx?.playSuccess?.();
    showToast(`رنک کاربر ${selectedUserForRank.firstName} با موفقیت به ${newRoleInput} ارتقا/تغییر یافت.`, 'success');
    setSelectedUserForRank(null);
  };

  const handleApplyResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForResetPass || !newPasswordInput.trim()) return;
    // SECURITY: the only path is the server-side reset. There is no local
    // fallback, because that would write a plaintext password into storage.
    if (!onResetPassword) {
      showToast('بازنشانی رمز عبور در این نما در دسترس نیست.', 'danger');
      return;
    }
    onResetPassword(selectedUserForResetPass.id, newPasswordInput.trim());
    soundFx?.playSuccess?.();
    showToast(`رمز عبور جدید برای ${selectedUserForResetPass.firstName} با موفقیت ثبت گردید.`, 'success');
    setSelectedUserForResetPass(null);
    setNewPasswordInput('');
  };

  const handleOpenEditUser = (user: User) => {
    setSelectedUserForEdit(user);
    setEditFirstName(user.firstName || '');
    setEditLastName(user.lastName || '');
    setEditEmail(user.email || '');
    setEditTsName(user.teamspeakName || '');
    setEditBio(user.bio || '');
    setEditDiscord(user.discordTag || '');
  };

  const handleApplyEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForEdit) return;
    const updatedData: Partial<User> = {
      firstName: editFirstName.trim(),
      lastName: editLastName.trim(),
      email: editEmail.trim(),
      teamspeakName: editTsName.trim(),
      bio: editBio.trim(),
      discordTag: editDiscord.trim(),
    };
    if (onUpdateUser) {
      onUpdateUser(selectedUserForEdit.id, updatedData);
    } else if (onSaveUsers) {
      const updated = safeUsers.map((u) => (u.id === selectedUserForEdit.id ? { ...u, ...updatedData } : u));
      onSaveUsers(updated);
    }
    soundFx?.playSuccess?.();
    showToast('مشخصات عضو کادر با موفقیت بروزرسانی شد.', 'success');
    setSelectedUserForEdit(null);
  };

  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newUserFName.trim() || !newUserLName.trim()) return;

    // SECURITY: no weak default password. The server also enforces a minimum
    // length and rejects anything weaker.
    if (newUserPass.trim().length < 8) {
      showToast('رمز عبور اولیه باید حداقل ۸ کاراکتر و شامل حرف و عدد باشد.', 'danger');
      return;
    }

    if (onCreateUser) {
      onCreateUser({
        username: newUsername.trim(),
        password: newUserPass.trim(),
        firstName: newUserFName.trim(),
        lastName: newUserLName.trim(),
        email: newUserEmail.trim() || `${newUsername.trim()}@caspian.team`,
        teamspeakName: newUserTsName.trim() || newUsername.trim(),
        role: newUserRole,
      });
    }
    soundFx?.playSuccess?.();
    showToast(`عضو جدید (${newUserFName} ${newUserLName} - ${newUserRole}) با موفقیت ایجاد گردید.`, 'success');
    setShowCreateUserModal(false);
    setNewUsername('');
    setNewUserFName('');
    setNewUserLName('');
    setNewUserEmail('');
    setNewUserTsName('');
  };

  const handleTogglePermItem = (permKey: keyof UserPermissions) => {
    if (!selectedUserForPerms) return;
    const currentVal = selectedUserForPerms.customPermissions?.[permKey] || false;
    const nextVal = !currentVal;
    if (onTogglePermission) {
      onTogglePermission(selectedUserForPerms.id, permKey, nextVal);
    }
    setSelectedUserForPerms((prev) =>
      prev
        ? {
            ...prev,
            customPermissions: {
              ...(prev.customPermissions || {}),
              [permKey]: nextVal,
            },
          }
        : null
    );
    showToast('سطح دسترسی با موفقیت بروزرسانی شد.', 'info');
  };

  // Warning Actions
  const handleIssueWarningAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!warningUserId || !warningReason.trim()) return;
    const targetUser = safeUsers.find((u) => u.id === warningUserId);
    if (!targetUser) return;

    if (onIssueWarning) {
      onIssueWarning(targetUser.id, warningReason.trim(), warningSeverity, warningDesc.trim());
    } else if (onSaveWarnings) {
      const newWarn: Warning = {
        id: `warn-${Date.now()}`,
        userId: targetUser.id,
        issuedById: currentUser.id,
        issuedByName: `${currentUser.firstName} ${currentUser.lastName}`,
        issuedByRole: currentUser.role,
        reason: warningReason.trim(),
        description: warningDesc.trim(),
        severity: warningSeverity,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        acknowledged: false,
      };
      onSaveWarnings([newWarn, ...safeWarnings]);
    }
    soundFx?.playSuccess?.();
    showToast(`اخطار انضباطی با موفقیت برای ${targetUser.firstName} ${targetUser.lastName} صادر شد.`, 'danger');
    setWarningReason('');
    setWarningDesc('');
  };

  const handleDeleteWarningAction = (warnId: string) => {
    if (onDeleteWarning) {
      onDeleteWarning(warnId);
    } else if (onSaveWarnings) {
      onSaveWarnings(safeWarnings.filter((w) => w.id !== warnId));
    }
    soundFx?.playClick?.();
    showToast('اخطار با موفقیت حذف/بخشیده شد.', 'info');
  };

  // Meeting Announcement Actions
  const handleCreateAnnouncementAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annDate.trim()) return;

    const newAnn: MeetingAnnouncement = {
      id: `ann-${Date.now()}`,
      title: annTitle.trim(),
      description: annDesc.trim(),
      meetingDate: annDate.trim(),
      meetingTime: annTime.trim() || '۲۱:۰۰',
      locationOrRoom: annLocation.trim(),
      targetAudience: annAudience.trim(),
      createdById: currentUser.id,
      createdByName: `${currentUser.firstName} ${currentUser.lastName}`,
      createdByRole: currentUser.role,
      createdAt: new Date().toISOString(),
      status: 'Upcoming',
      attendees: [],
    };

    if (onAddMeetingAnnouncement) {
      onAddMeetingAnnouncement(newAnn);
    } else if (onSaveAnnouncements) {
      onSaveAnnouncements([newAnn, ...announcementsList]);
    }
    soundFx?.playSuccess?.();
    showToast('اعلامیه جلسه با موفقیت ثبت شد.', 'success');
    setIsCreatingAnnouncement(false);
    setAnnTitle('');
    setAnnDesc('');
  };

  const handleDeleteAnnouncementAction = (id: string) => {
    if (onDeleteMeetingAnnouncement) {
      onDeleteMeetingAnnouncement(id);
    } else if (onSaveAnnouncements) {
      onSaveAnnouncements(announcementsList.filter((a) => a.id !== id));
    }
    soundFx?.playClick?.();
    showToast('اعلامیه جلسه حذف گردید.', 'info');
  };

  // Meeting Report Actions
  const handleCreateReportAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repTitle.trim() || !repSummary.trim()) return;

    const decisionsArr = repDecisions
      .split('\n')
      .map((d) => d.trim())
      .filter(Boolean);
    const actionsArr = repActionItems
      .split('\n')
      .map((a) => a.trim())
      .filter(Boolean);

    const newRep: MeetingReport = {
      id: `mrep-${Date.now()}`,
      meetingTitle: repTitle.trim(),
      meetingDate: repDate.trim() || new Date().toISOString().split('T')[0],
      meetingTime: repTime.trim() || '۲۱:۰۰',
      founderStatements: repFounderStmt.trim(),
      keyDecisions: decisionsArr,
      actionItems: actionsArr,
      fullSummary: repSummary.trim(),
      recordedById: currentUser.id,
      recordedByName: `${currentUser.firstName} ${currentUser.lastName}`,
      recordedByRole: currentUser.role,
      createdAt: new Date().toISOString(),
    };

    if (onAddMeetingReport) {
      onAddMeetingReport(newRep);
    } else if (onSaveMeetingReports) {
      onSaveMeetingReports([newRep, ...safeMeetingReports]);
    }
    soundFx?.playSuccess?.();
    showToast('صورت‌جلسه جدید با موفقیت در آرشیو ثبت شد.', 'success');
    setIsCreatingReport(false);
    setRepTitle('');
    setRepFounderStmt('');
    setRepDecisions('');
    setRepActionItems('');
    setRepSummary('');
  };

  const handleDeleteReportAction = (id: string) => {
    if (onDeleteMeetingReport) {
      onDeleteMeetingReport(id);
    } else if (onSaveMeetingReports) {
      onSaveMeetingReports(safeMeetingReports.filter((r) => r.id !== id));
    }
    soundFx?.playClick?.();
    showToast('صورت‌جلسه حذف گردید.', 'info');
  };

  // System Broadcast Actions
  const handleCreateBroadcastAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertTitle.trim() || !alertMessage.trim()) return;

    if (onBroadcastAlert) {
      onBroadcastAlert(alertTitle.trim(), alertMessage.trim(), alertSeverity);
    } else if (onSaveSystemAlerts) {
      const newAlert: SystemAlert = {
        id: `alert-${Date.now()}`,
        title: alertTitle.trim(),
        message: alertMessage.trim(),
        severity: alertSeverity,
        active: true,
        createdByName: `${currentUser.firstName} ${currentUser.lastName}`,
        createdByRole: currentUser.role,
        createdAt: new Date().toISOString(),
      };
      onSaveSystemAlerts([newAlert, ...safeSystemAlerts]);
    }
    soundFx?.playSuccess?.();
    showToast('اعلامیه فوری در تمام صفحات منتشر شد.', 'success');
    setAlertTitle('');
    setAlertMessage('');
  };

  const handleToggleAlertActive = (id: string) => {
    if (onSaveSystemAlerts) {
      const updated = safeSystemAlerts.map((a) => (a.id === id ? { ...a, active: !a.active } : a));
      onSaveSystemAlerts(updated);
    }
    showToast('وضعیت اعلامیه تغییر یافت.', 'info');
  };

  const handleDeleteAlertAction = (id: string) => {
    if (onSaveSystemAlerts) {
      onSaveSystemAlerts(safeSystemAlerts.filter((a) => a.id !== id));
    }
    showToast('اعلامیه حذف شد.', 'info');
  };

  // Monthly Leaderboard Reset
  const handleResetLeaderboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMonthInput.trim()) return;
    if (onResetMonthlyLeaderboard) {
      onResetMonthlyLeaderboard(newMonthInput.trim());
    }
    soundFx?.playSuccess?.();
    showToast(`ماه کاری جدید (${newMonthInput}) آغاز و اعلان به تمامی اعضا ارسال گردید.`, 'success');
    setShowResetLeaderboardModal(false);
  };

  // Filtered Users List
  const filteredUsers = safeUsers.filter((u) => {
    const q = userSearch.toLowerCase().trim();
    const nameMatch =
      !q ||
      `${u.firstName || ''} ${u.lastName || ''} ${u.username || ''} ${u.teamspeakName || ''} ${u.email || ''}`
        .toLowerCase()
        .includes(q);
    const roleMatch = selectedRoleFilter === 'all' || u.role === selectedRoleFilter;
    const statusMatch = selectedStatusFilter === 'all' || u.status === selectedStatusFilter;
    return nameMatch && roleMatch && statusMatch;
  });

  // Filtered Warnings List
  const filteredWarnings = safeWarnings.filter((w) => {
    if (!warningSearch.trim()) return true;
    const q = warningSearch.toLowerCase();
    const target = safeUsers.find((u) => u.id === w.userId);
    const name = target ? `${target.firstName} ${target.lastName} ${target.username}`.toLowerCase() : '';
    return name.includes(q) || w.reason.toLowerCase().includes(q) || w.issuedByName.toLowerCase().includes(q);
  });

  // Pending Activity Reports
  const pendingActivityReports = activityReportsList.filter((r) => r.status === 'Pending');

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 left-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border text-xs font-bold transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-500 text-emerald-200 shadow-emerald-950/50'
              : toastMessage.type === 'danger'
              ? 'bg-rose-950/95 border-rose-500 text-rose-200 shadow-rose-950/50'
              : 'bg-sky-950/95 border-sky-500 text-sky-200 shadow-sky-950/50'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : toastMessage.type === 'danger' ? (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          ) : (
            <Sparkles className="w-5 h-5 text-sky-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="mr-2 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Red Alert Cyber HUD Top Banner */}
      <div className="bg-slate-950 border-2 border-rose-600/80 rounded-2xl p-6 shadow-[0_0_35px_rgba(225,29,72,0.3)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute top-2 left-2 flex items-center gap-2">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
          </span>
          <span className="text-[10px] font-mono font-black tracking-widest text-rose-500 uppercase">
            RED ALERT: MANAGEMENT CONSOLE MODE
          </span>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10 pt-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-600/20 border border-rose-500/50 text-rose-400 shadow-[0_0_15px_rgba(225,29,72,0.4)]">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-wide flex items-center gap-2">
                  <span>کنسول مدیریت ارشد</span>
                  <span className="text-rose-500">Caspian Staff</span>
                </h1>
                <p className="text-xs text-rose-300/90 font-medium flex items-center gap-2 mt-1">
                  <span>به کنسول مدیریت خوش آمدید {currentUser.firstName} {currentUser.lastName}</span>
                  <button
                    onClick={handlePlayVoiceWelcome}
                    className="p-1 hover:bg-rose-900/60 rounded-lg text-rose-400 transition-colors"
                    title="پخش مجدد پیام صوتی"
                  >
                    <Volume2 className="w-4 h-4 animate-pulse" />
                  </button>
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => exportReportsToExcel(activityReportsList)}
              className="px-3 py-2 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>خروجی اکسل کارکرد</span>
            </button>

            <button
              onClick={() => exportUserSummaryToPDF(currentUser, activityReportsList.filter(r => r.userId === currentUser.id), safeWarnings.filter(w => w.userId === currentUser.id))}
              className="px-3 py-2 bg-sky-950/80 hover:bg-sky-900 border border-sky-700/80 text-sky-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <FileText className="w-4 h-4 text-sky-400" />
              <span>گزارش PDF</span>
            </button>

            <div className="flex items-center gap-2.5 bg-slate-900/90 border border-rose-900/80 rounded-xl p-2.5 text-xs text-rose-200">
              <Crown className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <div className="font-bold text-white leading-tight">{currentUser.firstName} {currentUser.lastName}</div>
                <div className="text-[10px] text-rose-400 font-mono">سطح: {currentUser.role}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Quick Counters Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-6 pt-5 border-t border-rose-900/40">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 text-center">
            <div className="text-lg font-black text-white font-mono">{safeUsers.length}</div>
            <div className="text-[10px] text-slate-400 font-bold">کل کاربران کادر</div>
          </div>

          <div className="bg-slate-900/80 border border-amber-500/40 rounded-xl p-2.5 text-center">
            <div className="text-lg font-black text-amber-400 font-mono">{totalPendingRequests}</div>
            <div className="text-[10px] text-amber-300/90 font-bold">درخواست‌ها و تعیین رنک</div>
          </div>

          <div className="bg-slate-900/80 border border-rose-500/40 rounded-xl p-2.5 text-center">
            <div className="text-lg font-black text-rose-400 font-mono">{safeWarnings.length}</div>
            <div className="text-[10px] text-rose-300/90 font-bold">اخطارهای صادره</div>
          </div>

          <div className="bg-slate-900/80 border border-indigo-500/40 rounded-xl p-2.5 text-center">
            <div className="text-lg font-black text-indigo-400 font-mono">{safeTickets.filter(t => t.status === 'Open').length}</div>
            <div className="text-[10px] text-indigo-300/90 font-bold">تیکت‌های باز</div>
          </div>

          <div className="bg-slate-900/80 border border-emerald-500/40 rounded-xl p-2.5 text-center">
            <div className="text-lg font-black text-emerald-400 font-mono">{pendingActivityReports.length}</div>
            <div className="text-[10px] text-emerald-300/90 font-bold">شیفت‌های معلق</div>
          </div>

          <div className="bg-slate-900/80 border border-sky-500/40 rounded-xl p-2.5 text-center">
            <div className="text-lg font-black text-sky-400 font-mono">
              {activityReportsList.reduce((acc, r) => acc + (r.totalHours || 0), 0).toFixed(0)}h
            </div>
            <div className="text-[10px] text-sky-300/90 font-bold">کل کارکرد ماه</div>
          </div>
        </div>
      </div>

      {/* Console Navigation Tabs */}
      <div className="bg-slate-950 border border-rose-900/60 rounded-2xl p-2 flex flex-wrap gap-2 shadow-lg">
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 min-w-[150px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'requests'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-[0_0_20px_rgba(245,158,11,0.5)]'
              : totalPendingRequests > 0
              ? 'bg-amber-950/60 text-amber-300 border border-amber-500/60 animate-pulse'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>درخواست‌ها و تعیین رنک</span>
          {totalPendingRequests > 0 ? (
            <span className="px-2 py-0.5 text-[10px] bg-amber-400 text-slate-950 font-black rounded-full shadow">
              {totalPendingRequests} جدید
            </span>
          ) : (
            <span className="px-2 py-0.5 text-[10px] bg-slate-800 text-slate-400 font-semibold rounded-full">
              0
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'users'
              ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-[0_0_15px_rgba(225,29,72,0.4)]'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>اعضا و پرمیشن‌ها ({safeUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('meetings')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'meetings'
              ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-[0_0_15px_rgba(225,29,72,0.4)]'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>جلسات و صورت‌جلسات ({announcementsList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('warnings')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'warnings'
              ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-[0_0_15px_rgba(225,29,72,0.4)]'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>سیستم انضباطی ({safeWarnings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'activity'
              ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-[0_0_15px_rgba(225,29,72,0.4)]'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>پایش و تایید شیفت‌ها ({pendingActivityReports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tickets')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'tickets'
              ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-[0_0_15px_rgba(225,29,72,0.4)]'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>تیکت‌ها ({safeTickets.filter((t) => t.status === 'Open').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('broadcast')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'broadcast'
              ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-[0_0_15px_rgba(225,29,72,0.4)]'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>اعلامیه سایت و ریست ماه</span>
        </button>
      </div>

      {/* Tab 0: Membership Registration Requests & Rank Assignment */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-950 via-amber-950/50 to-slate-950 border-2 border-amber-500/70 rounded-2xl p-5 md:p-6 shadow-[0_0_30px_rgba(245,158,11,0.2)] relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="p-2.5 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400 shadow-md">
                    <UserPlus className="w-5 h-5" />
                  </span>
                  <div>
                    <h2 className="text-base font-black text-amber-200">
                      مدیریت درخواست‌های عضویت و تعیین رنک کادر (Rank & Membership Requests)
                    </h2>
                    <span className="text-[10px] text-amber-400/90 font-mono">
                      مخصوص مدیریت ارشد: Founder, Owner, Supervisor, Moderator
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed mt-2">
                  در این بخش تمامی تیکت‌های تعیین رنک کادر جدید و اعضای تازه ثبت‌نام‌شده تجمیع شده‌اند تا بتوانید فوراً رنک آن‌ها را بررسی، تایید و در سیستم اعمال فرمایید.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {pendingUsers.length > 1 && (
                  <>
                    <button
                      onClick={() => {
                        if (onApproveAllPending) onApproveAllPending();
                        soundFx?.playSuccess?.();
                        showToast('تمامی درخواست‌های معلق با موفقیت تایید و فعال شدند.', 'success');
                      }}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>تایید دسته‌جمعی همه ({pendingUsers.length})</span>
                    </button>

                    <button
                      onClick={() => {
                        if (window.confirm('آیا از رد و حذف تمامی درخواست‌های عضویت معلق اطمینان دارید؟')) {
                          if (onRejectAllPending) onRejectAllPending();
                          soundFx?.playClick?.();
                          showToast('تمامی درخواست‌های معلق حذف شدند.', 'danger');
                        }
                      }}
                      className="px-3 py-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                    >
                      <UserX className="w-4 h-4" />
                      <span>رد همه</span>
                    </button>
                  </>
                )}

                <div className="flex items-center gap-3 bg-slate-900/90 border border-amber-500/40 px-4 py-2.5 rounded-xl shadow-lg">
                  <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">در انتظار بررسی</div>
                    <div className="text-base font-black text-amber-300 font-mono">
                      {totalPendingRequests} مورد
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stat Pill Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4 pt-4 border-t border-amber-500/20">
              <div className="bg-slate-900/80 border border-amber-500/30 rounded-xl px-3 py-2 flex items-center justify-between">
                <span className="text-xs text-amber-300 font-bold flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                  تیکت‌های درخواست رنک:
                </span>
                <span className="text-sm font-black text-amber-400 font-mono">{roleRequestTickets.length}</span>
              </div>
              <div className="bg-slate-900/80 border border-sky-500/30 rounded-xl px-3 py-2 flex items-center justify-between">
                <span className="text-xs text-sky-300 font-bold flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-sky-400" />
                  اعضای در انتظار رنک:
                </span>
                <span className="text-sm font-black text-sky-400 font-mono">{unrankedUsers.length}</span>
              </div>
              <div className="bg-slate-900/80 border border-emerald-500/30 rounded-xl px-3 py-2 flex items-center justify-between">
                <span className="text-xs text-emerald-300 font-bold flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                  ثبت‌نام‌های معلق:
                </span>
                <span className="text-sm font-black text-emerald-400 font-mono">{pendingUsers.length}</span>
              </div>
            </div>

            {/* Search Filter for Requests */}
            {totalPendingRequests > 0 && (
              <div className="mt-4 pt-4 border-t border-amber-500/20 flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={requestSearch}
                    onChange={(e) => setRequestSearch(e.target.value)}
                    placeholder="جستجو در نام، نام کاربری یا تیم اسپیک..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-950/90 border border-amber-500/30 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition-all"
                  />
                </div>
                <div className="text-[11px] text-slate-400">
                  مجموع کل در صف: <strong className="text-amber-300">{totalPendingRequests} مورد</strong>
                </div>
              </div>
            )}
          </div>

          {/* Section 1: Role Request Tickets */}
          {roleRequestTickets.length > 0 && (
            <div className="bg-slate-950 border-2 border-indigo-500/60 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-indigo-500/20 border border-indigo-500/40 rounded-lg text-indigo-400">
                    <MessageSquare className="w-4 h-4" />
                  </span>
                  <h3 className="text-sm font-black text-white">
                    تیکت‌های فوری درخواست تعیین رنک کادر ({roleRequestTickets.length})
                  </h3>
                </div>
                <span className="text-[11px] bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-bold px-2.5 py-1 rounded-full">
                  اقدام سریع مدیریت
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roleRequestTickets
                  .filter((t) => {
                    if (!requestSearch.trim()) return true;
                    const q = requestSearch.toLowerCase();
                    return (
                      t.userName.toLowerCase().includes(q) ||
                      t.subject.toLowerCase().includes(q) ||
                      t.message.toLowerCase().includes(q)
                    );
                  })
                  .map((ticket) => {
                    const sender = safeUsers.find((u) => u.id === ticket.userId);
                    const selectedRole = ticketRolesMap[ticket.id] || (sender?.role || 'Helper');

                    return (
                      <div
                        key={ticket.id}
                        className="bg-slate-900/90 border border-indigo-500/40 hover:border-indigo-400 rounded-xl p-4 space-y-3 shadow-lg transition-all"
                      >
                        <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={ticket.userAvatar || sender?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${ticket.userName}`}
                              alt={ticket.userName}
                              className="w-10 h-10 rounded-xl bg-slate-800 border border-indigo-500/40 p-0.5 shrink-0"
                            />
                            <div>
                              <div className="text-xs font-black text-white flex items-center gap-1.5">
                                <span>{ticket.userName}</span>
                                <span className="text-[10px] text-indigo-400 font-mono">(@{sender?.username || 'user'})</span>
                              </div>
                              <div className="text-[10px] text-slate-400">
                                تیم‌اسپیک: <strong className="text-sky-300">{sender?.teamspeakName || 'ثبت‌نشده'}</strong> | {ticket.createdAt?.split('T')[0] || 'امروز'}
                              </div>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 text-[9px] font-black rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40">
                            درخواست رنک
                          </span>
                        </div>

                        {/* Ticket Message Body */}
                        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-300 leading-relaxed max-h-24 overflow-y-auto">
                          <div className="font-bold text-indigo-300 text-xs mb-1">موضوع: {ticket.subject}</div>
                          <p className="text-slate-300">{ticket.message}</p>
                        </div>

                        {/* Role Selection & Direct Approval */}
                        <div className="space-y-1.5 pt-1">
                          <label className="block text-[10px] font-bold text-slate-400">
                            انتخاب رنک سازمانی برای تایید:
                          </label>
                          <div className="flex items-center gap-2">
                            <select
                              value={selectedRole}
                              onChange={(e) =>
                                setTicketRolesMap((prev) => ({
                                  ...prev,
                                  [ticket.id]: e.target.value as UserRole,
                                }))
                              }
                              className="flex-1 px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-amber-300 font-bold outline-none focus:border-amber-400 cursor-pointer"
                            >
                              {ALL_ROLES.map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>

                            <button
                              onClick={() => handleAssignRankAction(ticket.userId, selectedRole, ticket.id)}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-lg shadow-md hover:shadow-emerald-600/30 flex items-center gap-1 cursor-pointer transition-all shrink-0"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>تایید و ست رنک</span>
                            </button>
                          </div>
                        </div>

                        <div className="flex justify-end pt-1 border-t border-slate-800/80">
                          <button
                            onClick={() => setActiveTab('tickets')}
                            className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                          >
                            <span>مشاهده در تب تیکت‌ها</span>
                            <Eye className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Section 2: Unranked Registered Members */}
          {unrankedUsers.length > 0 && (
            <div className="bg-slate-950 border-2 border-sky-500/60 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-sky-500/20 border border-sky-500/40 rounded-lg text-sky-400">
                    <Users className="w-4 h-4" />
                  </span>
                  <h3 className="text-sm font-black text-white">
                    اعضای جدید کادر در انتظار تعیین رنک سازمانی ({unrankedUsers.length})
                  </h3>
                </div>
                <span className="text-[11px] bg-sky-500/20 border border-sky-500/40 text-sky-300 font-bold px-2.5 py-1 rounded-full">
                  کادر تأیید هویت شده
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {unrankedUsers
                  .filter((u) => {
                    if (!requestSearch.trim()) return true;
                    const q = requestSearch.toLowerCase();
                    return (
                      u.firstName.toLowerCase().includes(q) ||
                      u.lastName.toLowerCase().includes(q) ||
                      u.username.toLowerCase().includes(q) ||
                      (u.teamspeakName && u.teamspeakName.toLowerCase().includes(q))
                    );
                  })
                  .map((uUser) => {
                    const currentSelectedRole = pendingRolesMap[uUser.id] || uUser.role || 'Helper';

                    return (
                      <div
                        key={uUser.id}
                        className="bg-slate-900/90 border border-sky-500/40 hover:border-sky-400 rounded-xl p-4 space-y-3 shadow-lg transition-all"
                      >
                        <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={uUser.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${uUser.username}`}
                              alt={uUser.username}
                              className="w-11 h-11 rounded-xl bg-slate-800 border border-sky-500/40 p-0.5 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-black text-white truncate">
                                {uUser.firstName} {uUser.lastName}
                              </div>
                              <div className="text-[10px] text-sky-400 font-mono truncate">@{uUser.username}</div>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                            فاقد رنک کادر
                          </span>
                        </div>

                        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] space-y-1 text-slate-300">
                          <div className="flex justify-between">
                            <span className="text-slate-400">تیم‌اسپیک:</span>
                            <span className="font-mono text-sky-300 font-bold">{uUser.teamspeakName || '-'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">ایمیل:</span>
                            <span className="font-mono truncate max-w-[140px] text-slate-200">{uUser.email || '-'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">ثبت‌نام:</span>
                            <span className="font-mono text-amber-300">{uUser.registrationDate || 'امروز'}</span>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-slate-400">
                            تعیین رنک کاربری:
                          </label>
                          <select
                            value={currentSelectedRole}
                            onChange={(e) =>
                              setPendingRolesMap((prev) => ({
                                ...prev,
                                [uUser.id]: e.target.value as UserRole,
                              }))
                            }
                            className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-amber-300 font-bold outline-none focus:border-amber-400 cursor-pointer"
                          >
                            {ALL_ROLES.map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => handleAssignRankAction(uUser.id, currentSelectedRole)}
                            className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-lg flex items-center justify-center gap-1 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>تایید و اعطای رنک</span>
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm(`آیا از حذف این کاربر اطمینان دارید؟`)) {
                                handleRejectUserAction(uUser.id);
                              }
                            }}
                            className="py-2 px-2.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-bold rounded-lg cursor-pointer"
                            title="حذف حساب"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Section 3: Pending Registration Requests */}
          {pendingUsers.length > 0 && (
            <div className="bg-slate-950 border-2 border-amber-500/60 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-amber-500/20 border border-amber-500/40 rounded-lg text-amber-400">
                    <UserPlus className="w-4 h-4" />
                  </span>
                  <h3 className="text-sm font-black text-white">
                    درخواست‌های ثبت‌نام معلق در سامانه ({pendingUsers.length})
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingUsers
                  .filter((u) => {
                    if (!requestSearch.trim()) return true;
                    const q = requestSearch.toLowerCase();
                    return (
                      u.firstName.toLowerCase().includes(q) ||
                      u.lastName.toLowerCase().includes(q) ||
                      u.username.toLowerCase().includes(q) ||
                      (u.teamspeakName && u.teamspeakName.toLowerCase().includes(q))
                    );
                  })
                  .map((pUser) => {
                    const currentSelectedRole = pendingRolesMap[pUser.id] || pUser.role || 'Helper';
                    return (
                      <div
                        key={pUser.id}
                        className="bg-slate-950 border-2 border-amber-500/60 rounded-2xl p-4 space-y-3.5 relative group shadow-xl hover:border-amber-400 transition-all"
                      >
                        <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={pUser.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${pUser.username}`}
                              alt={pUser.username}
                              className="w-12 h-12 rounded-2xl bg-slate-900 border border-amber-500/40 p-1 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-black text-white truncate">
                                <span>{pUser.firstName} {pUser.lastName}</span>
                              </div>
                              <div className="text-[11px] text-amber-400 font-mono truncate">@{pUser.username}</div>
                            </div>
                          </div>
                          <RoleBadge role={currentSelectedRole} size="xs" />
                        </div>

                        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-[11px] space-y-1.5 text-slate-300">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">تیم اسپیک:</span>
                            <span className="font-mono text-sky-300 font-bold">{pUser.teamspeakName || '-'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">ایمیل:</span>
                            <span className="font-mono truncate max-w-[150px] text-slate-200">{pUser.email || '-'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">تاریخ ثبت‌نام:</span>
                            <span className="font-mono text-amber-300">{pUser.registrationDate || 'امروز'}</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            تعیین رنک کاربری هنگام تایید:
                          </label>
                          <select
                            value={currentSelectedRole}
                            onChange={(e) =>
                              setPendingRolesMap((prev) => ({
                                ...prev,
                                [pUser.id]: e.target.value as UserRole,
                              }))
                            }
                            className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-amber-200 font-bold focus:outline-none focus:border-amber-400 cursor-pointer"
                          >
                            {ALL_ROLES.map((role) => (
                              <option key={role} value={role} className="bg-slate-900 text-slate-100">
                                {role}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => handleApproveUserAction(pUser.id, currentSelectedRole)}
                            className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>تایید عضویت</span>
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm(`آیا از رد درخواست عضویت ${pUser.firstName} ${pUser.lastName} اطمینان دارید؟`)) {
                                handleRejectUserAction(pUser.id);
                              }
                            }}
                            className="py-2.5 px-3 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 hover:text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer"
                            title="رد درخواست و حذف کاربر"
                          >
                            <XCircle className="w-4 h-4 text-rose-400" />
                            <span>رد</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Empty State when everything is clear */}
          {totalPendingRequests === 0 && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto text-emerald-400 shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-200">
                هیچ درخواست عضویت یا تیکت تعیین رنک معلقی وجود ندارد
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                تمامی ثبت‌نام‌ها، رنک‌های درخواستی و تیکت‌های اعضای جدید بررسی و تعیین تکلیف شده‌اند. به محض ثبت درخواست جدید توسط اعضا، فوراً در این بخش و نوتیفیکیشن‌ها ظاهر خواهد شد.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 1: Users, Roles, Permissions & Full Account Management */}
      {activeTab === 'users' && (
        <div className="space-y-5">
          {/* Controls Bar */}
          <div className="bg-slate-950 border border-rose-900/60 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto items-center flex-1">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="جستجوی نام، یوزرنام، ایمیل، تیم‌اسپیک..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-3 pl-9 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedRoleFilter}
                  onChange={(e) => setSelectedRoleFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-rose-500 cursor-pointer"
                >
                  <option value="all">همه رنک‌ها ({safeUsers.length})</option>
                  {ALL_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-rose-500 cursor-pointer"
                >
                  <option value="all">همه وضعیت‌ها</option>
                  <option value="Active">فعال (Active)</option>
                  <option value="Suspended">معلق (Suspended)</option>
                  <option value="Pending">در انتظار (Pending)</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => setShowCreateUserModal(true)}
              className="w-full md:w-auto px-4 py-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all cursor-pointer shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ ایجاد دستی حساب عضو کادر</span>
            </button>
          </div>

          {/* Users Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((u) => (
              <div
                key={u.id}
                className="bg-slate-950 border border-slate-800 hover:border-rose-800/80 rounded-2xl p-4 space-y-3 transition-all relative group shadow-md"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={u.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`}
                      alt={u.username}
                      className="w-11 h-11 rounded-2xl bg-slate-900 border border-slate-700 p-1 shrink-0"
                    />
                    <div className="min-w-0">
                      <h3 className="text-xs font-black text-white truncate flex items-center gap-1.5">
                        <span>{u.firstName} {u.lastName}</span>
                        {u.status === 'Suspended' && (
                          <span className="px-1.5 py-0.5 text-[9px] bg-rose-500/20 text-rose-400 rounded border border-rose-500/30 font-bold shrink-0">
                            مسدود
                          </span>
                        )}
                        {u.status === 'Pending' && (
                          <span className="px-1.5 py-0.5 text-[9px] bg-amber-500/20 text-amber-400 rounded border border-amber-500/30 font-bold shrink-0">
                            در انتظار
                          </span>
                        )}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono truncate">@{u.username} | TS: {u.teamspeakName || '-'}</p>
                    </div>
                  </div>
                  <RoleBadge role={u.role} size="xs" />
                </div>

                {/* Details */}
                <div className="text-[11px] text-slate-400 space-y-1 bg-slate-900/60 p-2.5 rounded-xl border border-slate-900">
                  <div className="flex justify-between">
                    <span>ایمیل:</span>
                    <span className="text-slate-200 font-mono truncate max-w-[150px]">{u.email || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>سطح پرمیشن:</span>
                    <span className="text-amber-400 font-bold font-mono">{u.permissionLevel}</span>
                  </div>
                  {u.discordTag && (
                    <div className="flex justify-between">
                      <span>دیسکورد:</span>
                      <span className="text-indigo-300 font-mono truncate max-w-[150px]">{u.discordTag}</span>
                    </div>
                  )}
                </div>

                {/* Primary Action Row */}
                <div className="pt-2 border-t border-slate-900 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setSelectedUserForRank(u);
                      setNewRoleInput(u.role);
                    }}
                    className="py-1.5 px-2 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/60 text-rose-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5 text-rose-400" />
                    <span>تغییر رنک</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedUserForResetPass(u);
                      setNewPasswordInput('');
                    }}
                    className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>تغییر پسورد</span>
                  </button>
                </div>

                {/* Secondary Action Row */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditUser(u)}
                    className="flex-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer"
                    title="ویرایش مشخصات کاربر"
                  >
                    <Edit className="w-3.5 h-3.5 text-sky-400" />
                    <span>ویرایش</span>
                  </button>

                  <button
                    onClick={() => setSelectedUserForPerms(u)}
                    className="flex-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer"
                    title="مدیریت دسترسی‌های اختصاصی"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>دسترسی‌ها</span>
                  </button>

                  <button
                    onClick={() => handleToggleUserStatus(u)}
                    className={`p-1.5 text-xs font-bold rounded-xl border transition-all flex items-center justify-center cursor-pointer ${
                      u.status === 'Active'
                        ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-900'
                        : 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                    }`}
                    title={u.status === 'Active' ? 'تعلیق کاربر' : 'فعال‌سازی کاربر'}
                  >
                    {u.status === 'Active' ? <Ban className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => setSelectedUserForDelete(u)}
                    className="p-1.5 bg-rose-950/40 hover:bg-rose-900/80 border border-rose-900/60 text-rose-400 hover:text-rose-200 rounded-xl transition-all cursor-pointer"
                    title="حذف دائمی کاربر از سیستم"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Modal 1: Change Rank */}
          {selectedUserForRank && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-slate-950 border-2 border-rose-600 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-[0_0_50px_rgba(225,29,72,0.4)]">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-rose-400">
                    <Award className="w-5 h-5" />
                    <h3 className="text-sm font-black text-white">تغییر و ارتقای رنک سازمانی</h3>
                  </div>
                  <button onClick={() => setSelectedUserForRank(null)} className="text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl text-xs space-y-1">
                  <div>نام کاربر: <span className="font-bold text-white">{selectedUserForRank.firstName} {selectedUserForRank.lastName}</span></div>
                  <div className="flex items-center gap-2">رنک فعلی: <RoleBadge role={selectedUserForRank.role} size="xs" /></div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">انتخاب رنک جدید</label>
                  <select
                    value={newRoleInput}
                    onChange={(e) => setNewRoleInput(e.target.value as UserRole)}
                    className="w-full bg-slate-900 border border-rose-800 rounded-xl p-3 text-xs text-white outline-none focus:border-rose-500 font-bold cursor-pointer"
                  >
                    {ALL_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setSelectedUserForRank(null)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    onClick={handleApplyRoleChange}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/40 cursor-pointer"
                  >
                    تایید و ثبت رنک جدید
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal 2: Delete User Confirmation */}
          {selectedUserForDelete && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-slate-950 border-2 border-rose-600 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-[0_0_50px_rgba(225,29,72,0.5)]">
                <div className="flex items-center gap-3 text-rose-500 border-b border-slate-800 pb-3">
                  <AlertTriangle className="w-6 h-6 shrink-0 animate-bounce" />
                  <h3 className="text-sm font-black text-white">تایید حذف کامل اکانت از سرور</h3>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  آیا از حذف کامل حساب کاربری <strong className="text-rose-400">{selectedUserForDelete.firstName} {selectedUserForDelete.lastName}</strong> (@{selectedUserForDelete.username}) از سامانه اطمینان دارید؟ تمامی دسترسی‌ها و سوابق کاربر به طور دائم پاک خواهند شد.
                </p>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    onClick={() => setSelectedUserForDelete(null)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    onClick={handleConfirmDeleteUser}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/40 cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>حذف قطعی کاربر</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal 3: Reset Password */}
          {selectedUserForResetPass && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <form
                onSubmit={handleApplyResetPassword}
                className="bg-slate-950 border-2 border-amber-500 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-amber-400">
                    <KeyRound className="w-5 h-5" />
                    <h3 className="text-sm font-black text-white">بازنشانی رمز عبور کاربر</h3>
                  </div>
                  <button type="button" onClick={() => setSelectedUserForResetPass(null)} className="text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl text-xs space-y-1 text-slate-300">
                  <div>کاربر: <strong className="text-white">{selectedUserForResetPass.firstName} {selectedUserForResetPass.lastName}</strong></div>
                  <div>نام کاربری: <span className="font-mono text-amber-300">@{selectedUserForResetPass.username}</span></div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">رمز عبور جدید</label>
                  <input
                    type="text"
                    required
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="رمز عبور جدید را وارد کنید..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedUserForResetPass(null)}
                    className="px-4 py-2 bg-slate-900 text-slate-300 text-xs font-bold rounded-xl"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-lg"
                  >
                    ثبت رمز جدید
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Modal 4: Edit Staff Profile */}
          {selectedUserForEdit && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <form
                onSubmit={handleApplyEditUser}
                className="bg-slate-950 border-2 border-sky-600 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-sky-400">
                    <Edit className="w-5 h-5" />
                    <h3 className="text-sm font-black text-white">ویرایش مشخصات عضو کادر</h3>
                  </div>
                  <button type="button" onClick={() => setSelectedUserForEdit(null)} className="text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">نام</label>
                    <input
                      type="text"
                      required
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">نام خانوادگی</label>
                    <input
                      type="text"
                      required
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">نام در تیم‌اسپیک (TeamSpeak)</label>
                  <input
                    type="text"
                    required
                    value={editTsName}
                    onChange={(e) => setEditTsName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">ایمیل</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">تگ دیسکورد</label>
                  <input
                    type="text"
                    value={editDiscord}
                    onChange={(e) => setEditDiscord(e.target.value)}
                    placeholder="User#1234"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedUserForEdit(null)}
                    className="px-4 py-2 bg-slate-900 text-slate-300 text-xs font-bold rounded-xl"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl"
                  >
                    ذخیره تغییرات
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Modal 5: Custom Permissions Manager */}
          {selectedUserForPerms && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-slate-950 border-2 border-emerald-600 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <ShieldCheck className="w-5 h-5" />
                    <h3 className="text-sm font-black text-white">مدیریت دسترسی‌های اختصاصی</h3>
                  </div>
                  <button onClick={() => setSelectedUserForPerms(null)} className="text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl text-xs space-y-1">
                  <div>کاربر: <strong className="text-white">{selectedUserForPerms.firstName} {selectedUserForPerms.lastName}</strong></div>
                  <div>رنک: <RoleBadge role={selectedUserForPerms.role} size="xs" /></div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl cursor-pointer hover:border-emerald-500/50 transition-all">
                    <div>
                      <div className="text-xs font-bold text-white">بررسی و تایید گزارشات شیفت</div>
                      <div className="text-[10px] text-slate-400">امکان تایید یا رد گزارشات فعالیت اعضا</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedUserForPerms.customPermissions?.canReviewReports || false}
                      onChange={() => handleTogglePermItem('canReviewReports')}
                      className="w-4 h-4 accent-emerald-500 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl cursor-pointer hover:border-emerald-500/50 transition-all">
                    <div>
                      <div className="text-xs font-bold text-white">صدور اخطار و نظام‌نامه</div>
                      <div className="text-[10px] text-slate-400">امکان ثبت وارن انضباطی برای اعضا</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedUserForPerms.customPermissions?.canIssueWarnings || false}
                      onChange={() => handleTogglePermItem('canIssueWarnings')}
                      className="w-4 h-4 accent-emerald-500 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl cursor-pointer hover:border-emerald-500/50 transition-all">
                    <div>
                      <div className="text-xs font-bold text-white">مدیریت کاربران و تعلیق</div>
                      <div className="text-[10px] text-slate-400">تغییر رنک، تعلیق و مدیریت حساب‌ها</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedUserForPerms.customPermissions?.canManageUsers || false}
                      onChange={() => handleTogglePermItem('canManageUsers')}
                      className="w-4 h-4 accent-emerald-500 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl cursor-pointer hover:border-emerald-500/50 transition-all">
                    <div>
                      <div className="text-xs font-bold text-white">مدیریت پرمیشن‌های ادمین</div>
                      <div className="text-[10px] text-slate-400">کنترل دسترسی‌های سطح بالا</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedUserForPerms.customPermissions?.canManagePermissions || false}
                      onChange={() => handleTogglePermItem('canManagePermissions')}
                      className="w-4 h-4 accent-emerald-500 cursor-pointer"
                    />
                  </label>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setSelectedUserForPerms(null)}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    بستن
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal 6: Create New Account Directly */}
          {showCreateUserModal && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <form
                onSubmit={handleCreateUserSubmit}
                className="bg-slate-950 border-2 border-rose-600 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-rose-400">
                    <UserPlus className="w-5 h-5" />
                    <h3 className="text-sm font-black text-white">ایجاد حساب دستی جدید برای کادر</h3>
                  </div>
                  <button type="button" onClick={() => setShowCreateUserModal(false)} className="text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">نام</label>
                    <input
                      type="text"
                      required
                      value={newUserFName}
                      onChange={(e) => setNewUserFName(e.target.value)}
                      placeholder="مثال: علی"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">نام خانوادگی</label>
                    <input
                      type="text"
                      required
                      value={newUserLName}
                      onChange={(e) => setNewUserLName(e.target.value)}
                      placeholder="مثال: رضایی"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">نام کاربری انگلیسی (Username)</label>
                    <input
                      type="text"
                      required
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="ali_rezaei"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">رمز عبور</label>
                    <input
                      type="text"
                      required
                      value={newUserPass}
                      onChange={(e) => setNewUserPass(e.target.value)}
                      placeholder="حداقل ۸ کاراکتر شامل حرف و عدد"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">نام در تیم‌اسپیک</label>
                    <input
                      type="text"
                      value={newUserTsName}
                      onChange={(e) => setNewUserTsName(e.target.value)}
                      placeholder="Ali_R"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">ایمیل</label>
                    <input
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="ali@caspian.team"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">تعیین رنک کاربری</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold cursor-pointer"
                  >
                    {ALL_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateUserModal(false)}
                    className="px-4 py-2 bg-slate-900 text-slate-300 text-xs font-bold rounded-xl"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg"
                  >
                    ایجاد و فعال‌سازی حساب
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Meetings & Minutes Hub */}
      {activeTab === 'meetings' && (
        <div className="space-y-6">
          {/* Announcements Action Header */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-rose-500" />
                  <span>مدیریت اعلامیه‌های جلسات کادر ({announcementsList.length})</span>
                </h3>
                <p className="text-xs text-slate-400">امکان ثبت و انتشار جلسات رسمی برای تمامی اعضای کادر</p>
              </div>

              <button
                onClick={() => setIsCreatingAnnouncement(true)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>ثبت اعلامیه جلسه جدید</span>
              </button>
            </div>

            {/* Announcements List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {announcementsList.map((a) => (
                <div key={a.id} className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2 relative group shadow">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      <span>{a.title}</span>
                    </h4>
                    <button
                      onClick={() => {
                        if (window.confirm('آیا از حذف این اعلامیه جلسه اطمینان دارید؟')) {
                          handleDeleteAnnouncementAction(a.id);
                        }
                      }}
                      className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                      title="حذف اعلامیه"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">{a.description}</p>
                  <div className="text-[10px] text-rose-300 font-mono flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/80">
                    <span>📅 {a.meetingDate}</span>
                    <span>⏰ {a.meetingTime}</span>
                    <span>📍 {a.locationOrRoom}</span>
                    <span className="text-slate-400">👥 حاضرین: {a.attendees?.length || 0} نفر</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Meeting Reports Action Header */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-rose-500" />
                  <span>مدیریت صورت‌جلسات و مصوبات رسمی ({safeMeetingReports.length})</span>
                </h3>
                <p className="text-xs text-slate-400">ثبت رسمی سخنان Founder بهنام بهرامیان، تصمیمات، و مصوبات جلسات</p>
              </div>

              <button
                onClick={() => setIsCreatingReport(true)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>ثبت صورت‌جلسه جدید</span>
              </button>
            </div>

            {/* Meeting Reports List */}
            <div className="space-y-3">
              {safeMeetingReports.map((r) => (
                <div key={r.id} className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3 shadow">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs font-bold text-white">{r.meetingTitle}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">({r.meetingDate} - {r.meetingTime})</span>
                    </div>
                    <button
                      onClick={() => {
                        if (window.confirm('آیا از حذف این صورت‌جلسه اطمینان دارید؟')) {
                          handleDeleteReportAction(r.id);
                        }
                      }}
                      className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                      title="حذف صورت‌جلسه"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {r.founderStatements && (
                    <div className="bg-slate-950 p-3 rounded-xl border border-amber-500/30 text-xs text-amber-200 leading-relaxed">
                      <strong className="text-amber-400 block mb-1">👑 سخنان مستقیم بهنام بهرامیان (Founder):</strong>
                      {r.founderStatements}
                    </div>
                  )}

                  {r.keyDecisions && r.keyDecisions.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[11px] font-bold text-slate-300">📌 مصوبات کلیدی جلسه:</div>
                      <ul className="list-disc list-inside text-xs text-slate-300 space-y-0.5">
                        {r.keyDecisions.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    {r.fullSummary}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Modal Create Announcement */}
          {isCreatingAnnouncement && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <form
                onSubmit={handleCreateAnnouncementAction}
                className="bg-slate-950 border-2 border-rose-600 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white">ثبت دستی اعلامیه جلسه جدید</h3>
                  <button type="button" onClick={() => setIsCreatingAnnouncement(false)} className="text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">عنوان جلسه</label>
                  <input
                    type="text"
                    required
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    placeholder="مثال: جلسه فوری کادر ارشد سرور"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">تاریخ برگزاری</label>
                    <input
                      type="text"
                      required
                      value={annDate}
                      onChange={(e) => setAnnDate(e.target.value)}
                      placeholder="۱۴۰۵/۰۵/۲۵"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">ساعت برگزاری</label>
                    <input
                      type="text"
                      value={annTime}
                      onChange={(e) => setAnnTime(e.target.value)}
                      placeholder="۲۱:۰۰"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">محل برگزاری</label>
                    <input
                      type="text"
                      value={annLocation}
                      onChange={(e) => setAnnLocation(e.target.value)}
                      placeholder="کانال عمومی تیم‌اسپیک"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">مخاطبین جلسه</label>
                    <input
                      type="text"
                      value={annAudience}
                      onChange={(e) => setAnnAudience(e.target.value)}
                      placeholder="تمامی اعضای کادر"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">توضیحات و دستور جلسه</label>
                  <textarea
                    rows={3}
                    value={annDesc}
                    onChange={(e) => setAnnDesc(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingAnnouncement(false)}
                    className="px-4 py-2 bg-slate-900 text-slate-300 text-xs font-bold rounded-xl"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow"
                  >
                    ثبت و انتشار اعلامیه
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Modal Create Meeting Report */}
          {isCreatingReport && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <form
                onSubmit={handleCreateReportAction}
                className="bg-slate-950 border-2 border-rose-600 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white">ثبت دستی صورت‌جلسه و گزارش کامل</h3>
                  <button type="button" onClick={() => setIsCreatingReport(false)} className="text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">عنوان صورت‌جلسه</label>
                  <input
                    type="text"
                    required
                    value={repTitle}
                    onChange={(e) => setRepTitle(e.target.value)}
                    placeholder="صورت‌جلسه بررسی عملکرد مرداد ماه"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-400 mb-1">سخنان و دستورات مستقیم بهنام بهرامیان (Founder)</label>
                  <textarea
                    rows={2}
                    value={repFounderStmt}
                    onChange={(e) => setRepFounderStmt(e.target.value)}
                    placeholder="دستورات فاندر محترم در جلسه..."
                    className="w-full bg-slate-900 border border-amber-500/40 rounded-xl p-2.5 text-xs text-amber-200 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">مصوبات کلیدی (هر مصوبه در یک خط)</label>
                  <textarea
                    rows={2}
                    value={repDecisions}
                    onChange={(e) => setRepDecisions(e.target.value)}
                    placeholder="مصوبه اول&#10;مصوبه دوم"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">خلاصه کامل صورت‌جلسه</label>
                  <textarea
                    rows={3}
                    required
                    value={repSummary}
                    onChange={(e) => setRepSummary(e.target.value)}
                    placeholder="متن کامل صورت‌جلسه..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingReport(false)}
                    className="px-4 py-2 bg-slate-900 text-slate-300 text-xs font-bold rounded-xl"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow"
                  >
                    ثبت صورت‌جلسه
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Warnings & Disciplinary */}
      {activeTab === 'warnings' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Issue Warning Form */}
          <div className="md:col-span-5 bg-slate-950 border border-rose-900/60 rounded-2xl p-5 space-y-4 shadow-md">
            <h3 className="text-sm font-black text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span>صدور اخطار/وارن جدید</span>
            </h3>

            <form onSubmit={handleIssueWarningAction} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">انتخاب کاربر خاطی</label>
                <select
                  required
                  value={warningUserId}
                  onChange={(e) => setWarningUserId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white cursor-pointer"
                >
                  <option value="">انتخاب کنید...</option>
                  {safeUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">شدت اخطار</label>
                <select
                  value={warningSeverity}
                  onChange={(e) => setWarningSeverity(e.target.value as WarningSeverity)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white cursor-pointer font-bold"
                >
                  <option value="Low">Low (اخطار شفاهی)</option>
                  <option value="Medium">Medium (اخطار کتبی درجه ۱)</option>
                  <option value="High">High (اخطار کتبی درجه ۲)</option>
                  <option value="Critical">Critical (وارن نهایی / تعلیق)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">عنوان دلیل اخطار</label>
                <input
                  type="text"
                  required
                  value={warningReason}
                  onChange={(e) => setWarningReason(e.target.value)}
                  placeholder="مثال: عدم حضور در شیفت بدون هماهنگی"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">توضیحات تکمیلی</label>
                <textarea
                  rows={3}
                  value={warningDesc}
                  onChange={(e) => setWarningDesc(e.target.value)}
                  placeholder="جزییات و ادله تخلف..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
              >
                صدور و ثبت رسمی اخطار
              </button>
            </form>
          </div>

          {/* Warnings History List */}
          <div className="md:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white">
                تاریخچه اخطارهای ثبت‌شده ({filteredWarnings.length})
              </h3>
              <div className="relative w-full sm:w-48">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={warningSearch}
                  onChange={(e) => setWarningSearch(e.target.value)}
                  placeholder="جستجو در اخطارها..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-2.5 pl-8 py-1.5 text-xs text-slate-200 outline-none"
                />
              </div>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 no-scrollbar">
              {filteredWarnings.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">هیچ اخطاری یافت نشد.</div>
              ) : (
                filteredWarnings.map((w) => {
                  const target = safeUsers.find((u) => u.id === w.userId);
                  return (
                    <div key={w.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2 shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">
                            کاربر: {target ? `${target.firstName} ${target.lastName}` : 'ناشناس'}
                          </span>
                          {target && <RoleBadge role={target.role} size="xs" />}
                          <span
                            className={`px-2 py-0.5 text-[9px] font-black rounded-full ${
                              w.severity === 'Critical'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                : w.severity === 'High'
                                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            }`}
                          >
                            {w.severity}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            if (window.confirm('آیا از حذف/بخشش این اخطار اطمینان دارید؟')) {
                              handleDeleteWarningAction(w.id);
                            }
                          }}
                          className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                          title="حذف و بخشش اخطار"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-rose-300 font-bold">{w.reason}</p>
                      {w.description && <p className="text-[11px] text-slate-300">{w.description}</p>}
                      <div className="text-[10px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800">
                        <span>صادرکننده: {w.issuedByName} ({w.issuedByRole})</span>
                        <span>تاریخ: {w.date}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Staff Activity Monitor & Quick Review */}
      {activeTab === 'activity' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl text-center space-y-1 shadow">
              <div className="text-2xl font-black text-white font-mono">
                {activityReportsList.reduce((acc, r) => acc + (r.totalHours || 0), 0).toFixed(1)}
              </div>
              <div className="text-xs text-slate-400">مجموع کل ساعات ثبت‌شده</div>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl text-center space-y-1 shadow">
              <div className="text-2xl font-black text-emerald-400 font-mono">
                {activityReportsList.filter((r) => r.status === 'Approved').length}
              </div>
              <div className="text-xs text-slate-400">گزارشات تاییدشده</div>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl text-center space-y-1 shadow">
              <div className="text-2xl font-black text-amber-400 font-mono">
                {pendingActivityReports.length}
              </div>
              <div className="text-xs text-slate-400">در انتظار تایید مدیریت</div>
            </div>
          </div>

          {/* Pending Reports Quick Review Section */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md">
            <h3 className="text-sm font-black text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              <span>گزارشات شیفت در انتظار تایید ({pendingActivityReports.length})</span>
            </h3>

            {pendingActivityReports.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                هیچ گزارش کارکرد معلقی در سیستم وجود ندارد. تمامی شیفت‌ها بررسی شده‌اند.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingActivityReports.map((report) => (
                  <div key={report.id} className="bg-slate-900/90 border border-amber-500/40 rounded-xl p-4 space-y-3 shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <RoleBadge role={report.role} size="xs" />
                        <div>
                          <div className="text-xs font-bold text-white">{report.firstName} {report.lastName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">@{report.username} | {report.date}</div>
                        </div>
                      </div>
                      <div className="px-2 py-0.5 text-xs font-black bg-amber-500/20 text-amber-300 rounded border border-amber-500/40">
                        {report.totalHours} ساعت
                      </div>
                    </div>

                    <div className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      {report.description}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="نظر یا بازخورد مدیریت..."
                        value={reviewCommentMap[report.id] || ''}
                        onChange={(e) => setReviewCommentMap({ ...reviewCommentMap, [report.id]: e.target.value })}
                        className="flex-1 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white outline-none"
                      />
                      {report.teamspeakScreenshot && onOpenScreenshot && (
                        <button
                          onClick={() => onOpenScreenshot(report)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg"
                          title="مشاهده اسکرین‌شات"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => {
                          if (onApproveReport) onApproveReport(report.id, reviewCommentMap[report.id]);
                          soundFx?.playSuccess?.();
                          showToast(`شیفت ${report.firstName} تایید گردید.`, 'success');
                        }}
                        className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>تایید شیفت</span>
                      </button>

                      <button
                        onClick={() => {
                          if (onRejectReport) onRejectReport(report.id, reviewCommentMap[report.id]);
                          soundFx?.playClick?.();
                          showToast(`شیفت ${report.firstName} رد شد.`, 'danger');
                        }}
                        className="py-1.5 px-3 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>رد شیفت</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Ticket System */}
      {activeTab === 'tickets' && (
        <TicketSystem
          currentUser={currentUser}
          tickets={safeTickets}
          allUsers={safeUsers}
          onSaveTickets={onSaveTickets}
          onReplyTicket={onReplyTicket}
          onUpdateTicketStatus={onUpdateTicketStatus}
          onDeleteTicket={onDeleteTicket}
          onAssignUserRole={handleAssignRankAction}
          soundFx={soundFx}
        />
      )}

      {/* Tab 6: System Alert Broadcast & Monthly Reset */}
      {activeTab === 'broadcast' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-6 bg-slate-950 border border-rose-900/60 rounded-2xl p-5 space-y-4 shadow-md">
            <h3 className="text-sm font-black text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Radio className="w-4 h-4 text-rose-500" />
              <span>اعلامیه فوری تمام سایت (Broadcast Banner)</span>
            </h3>

            <form onSubmit={handleCreateBroadcastAction} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">عنوان بنر اعلامیه</label>
                <input
                  type="text"
                  required
                  value={alertTitle}
                  onChange={(e) => setAlertTitle(e.target.value)}
                  placeholder="مثال: برگزاری جلسه اضطراری کادر ارشد"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">شدت و رنگ بنر</label>
                <select
                  value={alertSeverity}
                  onChange={(e) => setAlertSeverity(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white cursor-pointer font-bold"
                >
                  <option value="danger">Danger (قرمز / اضطراری)</option>
                  <option value="warning">Warning (زرد / مهم)</option>
                  <option value="info">Info (آبی / اطلاع‌رسانی)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">متن کامل پیام هشدار</label>
                <textarea
                  rows={3}
                  required
                  value={alertMessage}
                  onChange={(e) => setAlertMessage(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                انتشار اعلامیه فوری در تمام صفحات
              </button>
            </form>

            {/* Active Alerts */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-slate-300">اعلامیه‌های فعال ({safeSystemAlerts.length})</h4>
              {safeSystemAlerts.map((a) => (
                <div key={a.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between shadow">
                  <div>
                    <h5 className="text-xs font-bold text-rose-300">{a.title}</h5>
                    <p className="text-[11px] text-slate-300">{a.message}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleAlertActive(a.id)}
                      className={`px-2 py-1 text-[10px] font-bold rounded cursor-pointer ${
                        a.active ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {a.active ? 'فعال' : 'غیرفعال'}
                    </button>
                    <button onClick={() => handleDeleteAlertAction(a.id)} className="text-slate-400 hover:text-rose-400 p-1 cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Reset Panel */}
          <div className="md:col-span-6 bg-slate-950 border border-amber-500/40 rounded-2xl p-5 space-y-4 shadow-md">
            <h3 className="text-sm font-black text-amber-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>شروع ماه کاری جدید و صفر کردن رتبه‌بندی</span>
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed">
              با شروع ماه جدید کاری سرور، تمامی ساعات کارکرد پرسنل برای لیدربورد ماهانه جدید ریست شده و اعلان شروع ماه به تمامی اعضای کادر ارسال می‌گردد (سوابق و آرشیو ماه‌های گذشته کاملاً محفوظ می‌مانند).
            </p>

            <form onSubmit={handleResetLeaderboardSubmit} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs text-slate-300 mb-1">نام ماه کاری جدید</label>
                <input
                  type="text"
                  required
                  value={newMonthInput}
                  onChange={(e) => setNewMonthInput(e.target.value)}
                  placeholder="شهریور ۱۴۰۵"
                  className="w-full bg-slate-900 border border-amber-500/40 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black rounded-xl shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>شروع ماه کاری جدید و ریست رتبه‌بندی</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
