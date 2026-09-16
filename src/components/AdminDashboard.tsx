import React, { useState } from 'react';
import {
  Users,
  Search,
  UserCheck,
  UserX,
  ShieldCheck,
  KeyRound,
  Crown,
  AlertTriangle,
  FileSpreadsheet,
  FileText as FilePdf,
  Trash2,
  X,
  UserPlus,
  ShieldAlert,
  Filter,
  Megaphone,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Lock,
  Activity,
  FileText,
  Clock,
  Send,
} from 'lucide-react';
import { User, ActivityReport, Warning, UserRole, ALL_ROLES, UserPermissions } from '../types';
import { exportReportsToExcel, exportUserSummaryToPDF } from '../lib/export';
import { RoleBadge } from './RoleBadge';
import { isTopFourRank, isManagementRank } from '../lib/permissions';
import { RoleButton } from './RoleButton';
import { getRoleButtonStyle } from '../lib/roleColors';

interface AdminDashboardProps {
  currentUser: User;
  allUsers: User[];
  allReports: ActivityReport[];
  allWarnings: Warning[];
  onApproveAccount: (userId: string) => void;
  onSuspendAccount: (userId: string) => void;
  onUnsuspendAccount: (userId: string) => void;
  onDeleteAccount: (userId: string) => void;
  onChangeRole: (userId: string, role: UserRole) => void;
  onToggleFounder: (userId: string, makeFounder: boolean) => void;
  onResetPassword: (userId: string, newPass: string) => void;
  onTogglePermission: (userId: string, permKey: keyof UserPermissions, enabled: boolean) => void;
  onCreateAccount: (data: {
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    email: string;
    teamspeakName: string;
    role: UserRole;
  }) => void;
  onOpenWarningModal: (user: User) => void;
  onDeleteWarning: (warningId: string) => void;
  onOpenScreenshot: (report: ActivityReport) => void;
  onBroadcastAlert?: (title: string, message: string) => void;
  onResetMonthlyLeaderboard?: (newMonthName: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  allUsers,
  allReports,
  allWarnings,
  onApproveAccount,
  onSuspendAccount,
  onUnsuspendAccount,
  onDeleteAccount,
  onChangeRole,
  onToggleFounder,
  onResetPassword,
  onTogglePermission,
  onCreateAccount,
  onOpenWarningModal,
  onDeleteWarning,
  onOpenScreenshot,
  onBroadcastAlert,
  onResetMonthlyLeaderboard,
}) => {
  const isFounderUser = currentUser.isFounder || currentUser.role === 'Founder' || currentUser.permissionLevel === 'Owner';
  const isTopFour = isTopFourRank(currentUser.role) || isFounderUser;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Pending' | 'Suspended'>('ALL');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResetPassModal, setShowResetPassModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showResetLeaderboardModal, setShowResetLeaderboardModal] = useState(false);

  // Broadcast Alert Form
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSuccessMsg, setBroadcastSuccessMsg] = useState<string | null>(null);

  // Reset Leaderboard Form
  const [newMonthInput, setNewMonthInput] = useState('شهریور ۱۴۰۵');

  // New Password
  const [newPasswordInput, setNewPasswordInput] = useState('');

  // New Account Form
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newTsName, setNewTsName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('Admin');

  // Filtered Roster
  const filteredUsers = allUsers.filter((u) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      u.username.toLowerCase().includes(q) ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
      u.teamspeakName.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q);
    const matchesRole = selectedRoleFilter === 'ALL' || u.role === selectedRoleFilter;
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
    return matchesQuery && matchesRole && matchesStatus;
  });

  const pendingUsers = allUsers.filter((u) => u.status === 'Pending');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword || !newFirstName || !newLastName) return;
    onCreateAccount({
      username: newUsername,
      password: newPassword,
      firstName: newFirstName,
      lastName: newLastName,
      email: newEmail,
      teamspeakName: newTsName,
      role: newRole,
    });
    setShowCreateModal(false);
    setNewUsername('');
    setNewPassword('');
    setNewFirstName('');
    setNewLastName('');
    setNewEmail('');
    setNewTsName('');
  };

  const handleResetPassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPasswordInput) return;
    onResetPassword(selectedUser.id, newPasswordInput);
    setShowResetPassModal(false);
    setNewPasswordInput('');
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;
    if (onBroadcastAlert) {
      onBroadcastAlert(broadcastTitle, broadcastMessage);
    }
    setShowBroadcastModal(false);
    setBroadcastTitle('');
    setBroadcastMessage('');
    setBroadcastSuccessMsg('اعلامیه همگانی با موفقیت برای تمامی اعضای کادر ارسال شد.');
    setTimeout(() => setBroadcastSuccessMsg(null), 5000);
  };

  const handleResetLeaderboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onResetMonthlyLeaderboard) {
      onResetMonthlyLeaderboard(newMonthInput);
    }
    setShowResetLeaderboardModal(false);
    setBroadcastSuccessMsg(`ماه جدید (${newMonthInput}) آغاز گردید و اعلان همگانی ارسال شد.`);
    setTimeout(() => setBroadcastSuccessMsg(null), 5000);
  };

  return (
    <div className="space-y-6 dir-rtl text-right">
      {/* Console Header */}
      <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl backdrop-blur-xl shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-2xl shadow-lg shadow-indigo-500/10">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
              کنسول مدیریتی و نظارت کامل اعضا (Caspian Admin Console)
              <span className="text-xs px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-indigo-400 font-semibold flex items-center gap-1">
                {isFounderUser && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                {currentUser.role}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              مدیریت کامل اکانت‌ها، دسترسی‌ها، تغییر رنک، ثبت اخطار، تایید ثبت‌نام‌ها و خروجی‌های گزارشات.
            </p>
          </div>
        </div>

        {/* Global Toolbar Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          {isFounderUser && (
            <button
              onClick={() => setShowBroadcastModal(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-2xl transition-all cursor-pointer"
            >
              <Megaphone className="w-4 h-4 text-amber-400" />
              ارسال اعلان همگانی (Broadcast)
            </button>
          )}

          {isTopFour && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-950 bg-indigo-400 hover:bg-indigo-300 rounded-2xl shadow-lg shadow-indigo-400/20 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              ساخت حساب جدید
            </button>
          )}

          <button
            onClick={() => exportReportsToExcel(allReports, 'Caspian_Full_Team_Activity_Report.xlsx')}
            className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-2xl transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            خروجی اکسل
          </button>
        </div>
      </div>

      {broadcastSuccessMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-sm flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{broadcastSuccessMsg}</span>
        </div>
      )}

      {/* Founder Special Control Hub Banner */}
      {isFounderUser && (
        <div className="p-5 bg-gradient-to-r from-amber-500/15 via-indigo-500/10 to-slate-900 border border-amber-500/40 rounded-3xl backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 text-amber-300 rounded-2xl border border-amber-500/30 shrink-0">
              <Crown className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <div className="text-sm font-black text-amber-300 flex items-center gap-2">
                مرکز اختیارات تام فاندر سرور (Founder Supreme Authority)
                <span className="text-[10px] px-2.5 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-200 rounded-full font-bold">
                  دسترسی کامل
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                شما به عنوان فاندر دارای اختیارات کامل روی تغییر رنک تمامی اعضا، اعطای پرمیشن‌های خاص، ریست ماهانه و ارسال اعلانات اضطراری هستید.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowResetLeaderboardModal(true)}
              className="px-3.5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              <RotateCcw className="w-4 h-4" />
              ریست ماهانه کارکرد اعضا
            </button>
          </div>
        </div>
      )}

      {/* Pending Account Approvals Notification Row */}
      {pendingUsers.length > 0 && (
        <div className="p-5 bg-amber-500/10 border border-amber-500/30 rounded-3xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-amber-300 flex items-center gap-2">
              <UserCheck className="w-4 h-4" /> ثبت‌نام‌های در انتظار تایید مدیریت ({pendingUsers.length} کاربر)
            </h3>
            <span className="text-xs text-amber-400/80">نیازمند بررسی و تایید</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingUsers.map((u) => (
              <div
                key={u.id}
                className="p-3.5 bg-slate-900 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-3"
              >
                <div>
                  <div className="text-xs font-bold text-slate-100">
                    {u.firstName} {u.lastName} (@{u.username})
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    TS: {u.teamspeakName} • درخواست رنک: {u.role}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onApproveAccount(u.id)}
                    className="px-3 py-1.5 text-[11px] font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all cursor-pointer shadow-md"
                  >
                    تایید ثبت‌نام
                  </button>
                  <button
                    onClick={() => onDeleteAccount(u.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-xl transition-all cursor-pointer"
                    title="رد درخواست ثبت‌نام"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Bar & Rank Filter Toolbar & Roster Grid */}
      <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl backdrop-blur-xl shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-400" /> لیست کامل اعضای کادر سرور ({filteredUsers.length} نفر)
            </h3>
            <p className="text-xs text-slate-400">برای دید کامل بر کارکرد، ساعات شیفت، اخطارها و مدیریت، روی عضو موردنظر کلیک کنید.</p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Status Quick Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="ALL">همه وضعیت‌ها</option>
              <option value="Active">فعال (Active)</option>
              <option value="Pending">در انتظار تایید</option>
              <option value="Suspended">معلق شده (Suspended)</option>
            </select>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="جستجو نام، اکانت، تیم‌اسپیک..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-9 pl-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-sky-500 transition-all placeholder:text-slate-600"
              />
            </div>
          </div>
        </div>

        {/* 15 Rank Toolbar Filters */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-2.5 uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-sky-400" />
              <span>فیلتر بر اساس رنک اعضا ({filteredUsers.length} نفر)</span>
            </div>
            {selectedRoleFilter !== 'ALL' && (
              <button
                onClick={() => setSelectedRoleFilter('ALL')}
                className="text-[10px] text-sky-400 hover:underline font-normal cursor-pointer"
              >
                پاک‌سازی فیلتر رنک
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto no-scrollbar p-1.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl">
            <button
              onClick={() => setSelectedRoleFilter('ALL')}
              className={`px-3 py-1 text-[11px] font-bold rounded-xl transition-all border cursor-pointer ${
                selectedRoleFilter === 'ALL'
                  ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md shadow-sky-500/20'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              همه رنک‌ها ({allUsers.length})
            </button>

            {ALL_ROLES.map((role) => {
              const count = allUsers.filter((u) => u.role === role).length;
              return (
                <RoleButton
                  key={role}
                  role={role}
                  variant={selectedRoleFilter === role ? 'glow' : 'outline'}
                  isActive={selectedRoleFilter === role}
                  onClick={() => setSelectedRoleFilter(role)}
                  className="px-2.5 py-1 text-[10px] font-bold rounded-xl cursor-pointer"
                  showRankDot
                >
                  {role} {count > 0 && <span className="opacity-75">({count})</span>}
                </RoleButton>
              );
            })}
          </div>
        </div>

        {/* Member Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {filteredUsers.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 text-xs font-medium bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
              هیچ عضوی مطابق با فیلتر رنک یا عبارت جستجوی انتخاب شده یافت نشد.
            </div>
          ) : (
            filteredUsers.map((user) => {
              const userRep = allReports.filter((r) => r.userId === user.id && r.status === 'Approved');
              const userWarn = allWarnings.filter((w) => w.userId === user.id);
              const totalHrs = userRep.reduce((acc, r) => acc + r.totalHours, 0);
              const isSelected = selectedUser?.id === user.id;

              return (
                <div
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  style={getRoleButtonStyle(user.role, isSelected ? 'glow' : 'outline', isSelected)}
                  className="p-4 rounded-2xl cursor-pointer transition-all space-y-3 relative group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                        alt={user.username}
                        className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 object-cover shadow-sm"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1">
                          {user.firstName} {user.lastName}
                          {user.isFounder && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-mono">@{user.username} • TS: {user.teamspeakName}</p>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                        user.status === 'Active'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : user.status === 'Suspended'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {user.status === 'Active' ? 'فعال' : user.status === 'Suspended' ? 'معلق' : 'در انتظار'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                    <RoleBadge role={user.role} size="xs" />
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 font-mono">
                      <span className="text-sky-400 font-semibold">{totalHrs.toFixed(1)} ساعت</span>
                      <span>•</span>
                      <span className="text-amber-400 font-semibold">{userWarn.length} اخطار</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Selected Member Inspector Modal / Drawer */}
      {selectedUser && (
        <div className="p-6 bg-slate-900/90 border border-indigo-500/40 rounded-3xl backdrop-blur-2xl shadow-2xl space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-4">
              <img
                src={selectedUser.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${selectedUser.username}`}
                alt={selectedUser.username}
                className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 object-cover"
              />
              <div>
                <h3 className="text-lg font-black text-slate-100 flex items-center gap-2 flex-wrap">
                  بازرسی کامل کارکرد: {selectedUser.firstName} {selectedUser.lastName}
                  <RoleBadge role={selectedUser.role} size="sm" />
                  {selectedUser.isFounder && (
                    <span className="text-xs px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full font-bold flex items-center gap-1">
                      <Crown className="w-3 h-3" /> Founder
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  نام کاربری: @{selectedUser.username} | نام تیم‌اسپیک: {selectedUser.teamspeakName} | تاریخ عضویت: {selectedUser.registrationDate}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => exportUserSummaryToPDF(selectedUser, allReports.filter(r => r.userId === selectedUser.id), allWarnings.filter(w => w.userId === selectedUser.id))}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 rounded-xl transition-all cursor-pointer"
              >
                <FilePdf className="w-4 h-4" /> خروجی PDF
              </button>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-100 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Member Stats Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-950/80 border border-slate-800 rounded-2xl">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">کل ساعات شیفت</span>
              <span className="text-base font-black text-sky-400 font-mono">
                {allReports.filter((r) => r.userId === selectedUser.id && r.status === 'Approved').reduce((a, b) => a + b.totalHours, 0).toFixed(1)} ساعت
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">شیفت‌های تایید شده</span>
              <span className="text-base font-black text-emerald-400 font-mono">
                {allReports.filter((r) => r.userId === selectedUser.id && r.status === 'Approved').length} شیفت
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">اخطارهای فعال</span>
              <span className="text-base font-black text-amber-400 font-mono">
                {allWarnings.filter((w) => w.userId === selectedUser.id).length} اخطار
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">وضعیت حساب</span>
              <span className="text-xs font-extrabold text-slate-200">
                {selectedUser.status}
              </span>
            </div>
          </div>

          {/* Quick Management Control Toolbar */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-950/80 border border-slate-800 rounded-2xl">
            {/* Role Change Selector */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                تغییر رنک عضویتی
              </label>
              <select
                value={selectedUser.role}
                onChange={(e) => onChangeRole(selectedUser.id, e.target.value as UserRole)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {ALL_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            {/* Issue Warning Button */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                ثبت انضباطی
              </label>
              <button
                onClick={() => onOpenWarningModal(selectedUser)}
                className="w-full px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4" /> ثبت اخطار جدید
              </button>
            </div>

            {/* Suspend / Unsuspend */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                وضعیت دسترسی حساب
              </label>
              {selectedUser.status === 'Suspended' ? (
                <button
                  onClick={() => onUnsuspendAccount(selectedUser.id)}
                  className="w-full px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" /> فعال‌سازی مجدد حساب
                </button>
              ) : (
                <button
                  onClick={() => onSuspendAccount(selectedUser.id)}
                  className="w-full px-3 py-2 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <UserX className="w-4 h-4" /> تعلیق حساب (Suspend)
                </button>
              )}
            </div>

            {/* Founder Powers */}
            {isFounderUser && (
              <div>
                <label className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                  اختیارات مستقیم فاندر
                </label>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => onToggleFounder(selectedUser.id, !selectedUser.isFounder)}
                    className="flex-1 px-2 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 font-bold text-[11px] rounded-xl transition-all cursor-pointer"
                    title="اعطا یا لغو مقام فاندر"
                  >
                    {selectedUser.isFounder ? 'لغو فاندر' : 'اعطای فاندر'}
                  </button>
                  <button
                    onClick={() => setShowResetPassModal(true)}
                    className="px-2.5 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-sky-300 rounded-xl cursor-pointer"
                    title="تغییر رمز عبور"
                  >
                    <KeyRound className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      onDeleteAccount(selectedUser.id);
                      setSelectedUser(null);
                    }}
                    className="px-2.5 py-2 bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl hover:bg-rose-500/30 cursor-pointer"
                    title="حذف حساب کاربر"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Custom Permissions Matrix */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <h4 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-400" /> ماتریس پرمیشن‌های تخصصی استف
              </h4>
              {isTopFourRank(selectedUser.role) ? (
                <span className="text-[10px] font-bold px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                  رنک Top 4 • دسترسی‌های کامل خودکار
                </span>
              ) : isManagementRank(selectedUser.role) ? (
                <span className="text-[10px] font-bold px-2.5 py-0.5 bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-full">
                  رنک مدیریتی • دسترسی ادمین
                </span>
              ) : (
                <span className="text-[10px] text-slate-400">پرمیشن‌های تفویض شده سفارشی</span>
              )}
            </div>

            {isTopFourRank(selectedUser.role) ? (
              <p className="text-xs text-slate-400 italic">
                رنک‌های Top 4 (فاندر، اونر، منجر، سوپروایزر) به صورت خودکار تمام اختیارات بررسی گزارشات، ثبت اخطار و مدیریت کامل سیستم را دارا هستند.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* canReviewReports */}
                <label className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl cursor-pointer">
                  <div>
                    <div className="font-bold text-slate-200">بررسی و تایید شیفت‌های اعضا</div>
                    <div className="text-[10px] text-slate-400">امکان تایید یا رد گزارش کار اعضا</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={
                      isManagementRank(selectedUser.role) ||
                      !!selectedUser.customPermissions?.canReviewReports
                    }
                    disabled={isManagementRank(selectedUser.role)}
                    onChange={(e) =>
                      onTogglePermission(selectedUser.id, 'canReviewReports', e.target.checked)
                    }
                    className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
                  />
                </label>

                {/* canIssueWarnings */}
                <label className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl cursor-pointer">
                  <div>
                    <div className="font-bold text-slate-200">ثبت اخطار انضباطی</div>
                    <div className="text-[10px] text-slate-400">امکان ثبت و درج اخطار انضباطی برای اعضا</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={
                      isManagementRank(selectedUser.role) ||
                      !!selectedUser.customPermissions?.canIssueWarnings
                    }
                    disabled={isManagementRank(selectedUser.role)}
                    onChange={(e) =>
                      onTogglePermission(selectedUser.id, 'canIssueWarnings', e.target.checked)
                    }
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                </label>

                {/* canManageUsers */}
                <label className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl cursor-pointer">
                  <div>
                    <div className="font-bold text-slate-200">مدیریت حساب کاربران</div>
                    <div className="text-[10px] text-slate-400">تایید ثبت‌نام و تعلیق اکانت‌ها</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={
                      isManagementRank(selectedUser.role) ||
                      !!selectedUser.customPermissions?.canManageUsers
                    }
                    disabled={isManagementRank(selectedUser.role)}
                    onChange={(e) =>
                      onTogglePermission(selectedUser.id, 'canManageUsers', e.target.checked)
                    }
                    className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                  />
                </label>

                {/* canManagePermissions */}
                <label className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl cursor-pointer">
                  <div>
                    <div className="font-bold text-slate-200">مدیریت پرمیشن سایر اعضا</div>
                    <div className="text-[10px] text-slate-400">اعطای دسترسی‌های خاص به اعضای پایین‌تر</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={
                      isManagementRank(selectedUser.role) ||
                      !!selectedUser.customPermissions?.canManagePermissions
                    }
                    disabled={isManagementRank(selectedUser.role)}
                    onChange={(e) =>
                      onTogglePermission(selectedUser.id, 'canManagePermissions', e.target.checked)
                    }
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Member Warnings Log */}
          <div>
            <h4 className="text-sm font-extrabold text-slate-100 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> سابقه اخطارهای انضباطی کاربر
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {allWarnings.filter((w) => w.userId === selectedUser.id).length === 0 ? (
                <div className="text-xs text-slate-500 italic p-3 bg-slate-950/40 rounded-xl border border-slate-800">
                  سابقه انضباطی کاملاً پاک است. هیچ اخطاری ثبت نشده است.
                </div>
              ) : (
                allWarnings
                  .filter((w) => w.userId === selectedUser.id)
                  .map((w) => (
                    <div
                      key={w.id}
                      className="p-3 bg-slate-950 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-amber-300">
                          [درجه: {w.severity}] علت: {w.reason}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          صادرکننده: {w.issuedByName} در تاریخ {w.date} • وضعیت:{' '}
                          {w.acknowledged ? 'مشاهده و تایید شده' : 'در انتظار تایید کاربر'}
                        </div>
                      </div>
                      <button
                        onClick={() => onDeleteWarning(w.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 rounded-lg cursor-pointer"
                        title="حذف اخطار"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Broadcast Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn dir-rtl text-right">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-400" /> ارسال اعلامیه همگانی به تمامی اعضا
              </h3>
              <button onClick={() => setShowBroadcastModal(false)} className="text-slate-400 hover:text-slate-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">عنوان اعلان:</label>
                <input
                  type="text"
                  required
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="مثلاً: اطلاعیه جدید فاندر - جلسه اضطراری"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">متن کامل پیام:</label>
                <textarea
                  required
                  rows={4}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="متن پیام و دستوارت مدیریت برای کلیه اعضای کادر..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500 resize-y"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-200 bg-slate-800 rounded-xl cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl flex items-center gap-1.5 shadow-lg shadow-amber-400/20 cursor-pointer"
                >
                  <Send className="w-4 h-4" /> ارسال فوری برای کلیه اعضا
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Monthly Leaderboard Modal */}
      {showResetLeaderboardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn dir-rtl text-right">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-400" /> ریست ماهانه و شروع دوره جدید
              </h3>
              <button onClick={() => setShowResetLeaderboardModal(false)} className="text-slate-400 hover:text-slate-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              با این اقدام دوره کاری جدید شروع شده و نوتیفیکیشن شروع ماه جدید برای تمامی اعضای کادر صادر می‌گردد.
            </p>

            <form onSubmit={handleResetLeaderboardSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">نام ماه جدید سرور:</label>
                <input
                  type="text"
                  required
                  value={newMonthInput}
                  onChange={(e) => setNewMonthInput(e.target.value)}
                  placeholder="مثلاً: شهریور ۱۴۰۵"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetLeaderboardModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-200 bg-slate-800 rounded-xl cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-lg shadow-amber-400/20 cursor-pointer"
                >
                  تایید و شروع ماه جدید
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Account Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn dir-rtl text-right">
          <div className="w-full max-w-md bg-slate-900 border border-indigo-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" /> ایجاد حساب کاربری جدید Caspian
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="نام"
                  required
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                />
                <input
                  type="text"
                  placeholder="نام خانوادگی"
                  required
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                />
              </div>

              <input
                type="text"
                placeholder="نام کاربری (Username)"
                required
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
              />

              <input
                type="email"
                placeholder="آدرس ایمیل"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
              />

              <input
                type="text"
                placeholder="نام در تیم‌اسپیک (TeamSpeak Name)"
                required
                value={newTsName}
                onChange={(e) => setNewTsName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
              />

              <input
                type="password"
                placeholder="رمز عبور اولیه"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
              />

              <div>
                <label className="block text-[10px] text-slate-400 mb-1 font-semibold uppercase">رنک اولیه کاربر</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 cursor-pointer"
                >
                  {ALL_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 cursor-pointer"
              >
                ایجاد و فعال‌سازی مستقیم حساب
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPassModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn dir-rtl text-right">
          <div className="w-full max-w-sm bg-slate-900 border border-sky-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-sky-400" /> تغییر رمز عبور (@{selectedUser.username})
              </h3>
              <button onClick={() => setShowResetPassModal(false)} className="text-slate-400 hover:text-slate-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPassSubmit} className="space-y-3 text-xs">
              <input
                type="password"
                placeholder="رمز عبور جدید را وارد کنید"
                required
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
              />

              <button
                type="submit"
                className="w-full py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl transition-all cursor-pointer"
              >
                تایید و تغییر رمز عبور
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
