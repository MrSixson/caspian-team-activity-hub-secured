import React, { useState } from 'react';
import {
  ShieldCheck,
  LayoutDashboard,
  FilePlus,
  FolderArchive,
  CheckSquare,
  Users,
  Bell,
  LogOut,
  RotateCcw,
  Sparkles,
  ChevronDown,
  UserCheck,
  User as UserIcon,
  Radio,
  Menu,
} from 'lucide-react';
import { User, AppNotification } from '../types';
import { RoleBadge } from './RoleBadge';
import { canReviewReports, canManageUsers, canManagePermissions } from '../lib/permissions';
import { getRoleButtonStyle } from '../lib/roleColors';
import { RoleButton } from './RoleButton';

interface NavbarProps {
  currentUser: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  notifications: AppNotification[];
  onOpenNotifications: () => void;
  onLogout: () => void;
  allUsers: User[];
  onSwitchUser: (user: User) => void;
  onResetData: () => void;
  onOpenProfile?: () => void;
  onOpenDrawer: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  notifications,
  onOpenNotifications,
  onLogout,
  allUsers,
  onSwitchUser,
  onResetData,
  onOpenProfile,
  onOpenDrawer,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const canReview = canReviewReports(currentUser);
  const canManage = canManageUsers(currentUser) || canManagePermissions(currentUser);
  const userRole = currentUser?.role || 'Helper';
  const pendingUsersCount = (allUsers || []).filter((u) => u.status === 'Pending').length;

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/85 backdrop-blur-2xl border-b border-slate-800/80 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Main Drawer Trigger */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Drawer Collapsible Open Button */}
            <button
              onClick={onOpenDrawer}
              className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-sky-500/20 via-blue-600/20 to-indigo-600/20 hover:from-sky-500/30 hover:to-indigo-600/30 text-sky-300 border border-sky-500/40 rounded-2xl text-xs font-black shadow-md hover:shadow-sky-500/20 transition-all cursor-pointer group"
              title="باز کردن منوی کشویی دسترسی‌ها"
            >
              <Menu className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform" />
              <span>منوی اصلی و دسترسی‌ها</span>
            </button>

            {/* Logo */}
            <div
              className="hidden sm:flex items-center gap-2 cursor-pointer group"
              onClick={() => setActiveTab('dashboard')}
            >
              <div className="relative p-2 bg-slate-900 border border-slate-700/80 rounded-xl flex items-center justify-center text-sky-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="hidden lg:block">
                <h1 className="text-sm font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-200 to-indigo-300 tracking-tight">
                  CASPIAN TEAM
                </h1>
              </div>
            </div>
          </div>

          {/* Clean Quick Navigation Pills */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800/80">
            {currentUser?.isRankAssigned === false ? (
              <button
                onClick={() => setActiveTab('tickets')}
                style={getRoleButtonStyle(userRole, 'glow', true)}
                className="flex items-center gap-2 px-4 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer shadow-lg text-amber-300"
              >
                <Users className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>سامانه تیکت و تعیین رنک</span>
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] rounded-md border border-amber-500/40">
                  تنها دسترسی مجاز
                </span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  style={getRoleButtonStyle(userRole, 'outline', activeTab === 'dashboard')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    activeTab === 'dashboard' ? 'shadow-lg' : 'opacity-80 hover:opacity-100'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-sky-400" /> اصلی
                </button>

                <button
                  onClick={() => setActiveTab('members')}
                  style={getRoleButtonStyle(userRole, 'outline', activeTab === 'members')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    activeTab === 'members' ? 'shadow-lg' : 'opacity-80 hover:opacity-100'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> اعضا آنلاین
                </button>

                <button
                  onClick={() => setActiveTab('tickets')}
                  style={getRoleButtonStyle(userRole, 'outline', activeTab === 'tickets')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    activeTab === 'tickets' ? 'shadow-lg' : 'opacity-80 hover:opacity-100'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-indigo-400" /> تیکت‌ها
                </button>

                <button
                  onClick={() => setActiveTab('daily_report')}
                  style={getRoleButtonStyle(userRole, 'outline', activeTab === 'daily_report')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    activeTab === 'daily_report' ? 'shadow-lg' : 'opacity-80 hover:opacity-100'
                  }`}
                >
                  <FilePlus className="w-3.5 h-3.5 text-sky-400" /> ثبت شیفت
                </button>

                {canReview && (
                  <button
                    onClick={() => setActiveTab('review_activities')}
                    style={getRoleButtonStyle(userRole, 'glow', activeTab === 'review_activities')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      activeTab === 'review_activities' ? 'shadow-lg' : 'opacity-85 hover:opacity-100'
                    }`}
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-400" /> بررسی
                  </button>
                )}

                {canManage && (
                  <button
                    onClick={() => setActiveTab('console')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer border ${
                      activeTab === 'console'
                        ? 'bg-rose-600 text-white border-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.5)]'
                        : 'bg-rose-950/40 text-rose-300 border-rose-800/80 hover:bg-rose-900/60'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    <span>کنسول مدیریت</span>
                    {pendingUsersCount > 0 && (
                      <span className="px-2 py-0.5 text-[10px] bg-amber-400 text-slate-950 font-black rounded-full animate-bounce shadow">
                        {pendingUsersCount} درخواست
                      </span>
                    )}
                  </button>
                )}
              </>
            )}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Current User Role Display */}
            {currentUser && (
              currentUser.isRankAssigned === false ? (
                <div className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-black rounded-xl flex items-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>در انتظار تعیین رنک</span>
                </div>
              ) : (
                <RoleBadge role={userRole} size="sm" />
              )
            )}

            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-300 hover:text-sky-400 transition-all cursor-pointer"
              title="اعلان‌ها"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-[10px] font-bold text-slate-950 bg-sky-400 rounded-full border-2 border-slate-950 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Profile Avatar Button */}
            {currentUser && (
              <button
                onClick={onOpenProfile}
                title="ویرایش عکس و پروفایل"
                className="flex items-center gap-2 pl-2 pr-2.5 py-1 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-sky-500/50 rounded-2xl transition-all cursor-pointer group shadow-sm"
              >
                <img
                  src={
                    currentUser.avatarUrl ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.username}`
                  }
                  alt={currentUser.username}
                  className="w-7 h-7 rounded-xl bg-slate-800 border border-slate-700 group-hover:border-sky-400 object-cover transition-all"
                />
                <span className="hidden lg:inline text-xs font-bold text-slate-200 group-hover:text-sky-300">
                  {currentUser.firstName}
                </span>
              </button>
            )}

            {/* Logout */}
            <button
              onClick={onLogout}
              className="p-2 bg-slate-900 border border-slate-800 hover:bg-rose-500/20 hover:border-rose-500/30 text-slate-400 hover:text-rose-300 rounded-xl transition-all cursor-pointer"
              title="خروج از حساب"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
