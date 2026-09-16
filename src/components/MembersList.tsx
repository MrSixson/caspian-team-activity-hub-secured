import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Circle,
  Radio,
  Headphones,
  UserCheck,
  Clock,
  Calendar,
  MessageSquare,
  Shield,
  Activity,
  User as UserIcon,
  Sparkles,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { User, ActivityReport, UserRole, ALL_ROLES } from '../types';
import { RoleBadge } from './RoleBadge';
import { toJalaliDate } from '../lib/jalali';
import { playUiSound } from '../lib/audioFx';

interface MembersListProps {
  allUsers: User[];
  currentUser: User;
  reports: ActivityReport[];
  onOpenProfile?: () => void;
  onToggleUserOnline?: (userId: string) => void;
  soundFx?: boolean;
}

export const MembersList: React.FC<MembersListProps> = ({
  allUsers,
  currentUser,
  reports,
  onOpenProfile,
  onToggleUserOnline,
  soundFx = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Determine online status helper
  const isUserOnline = (user: User) => {
    if (user.id === currentUser.id) return true; // Current active session is always online
    return !!user.isOnline;
  };

  // Helper to get latest activity report for a user
  const getUserLatestReport = (userId: string) => {
    const userReports = reports.filter((r) => r.userId === userId);
    if (userReports.length === 0) return null;
    return [...userReports].sort((a, b) => {
      const timeA = new Date(a.createdAt || a.date).getTime();
      const timeB = new Date(b.createdAt || b.date).getTime();
      return timeB - timeA;
    })[0];
  };

  // Filtered users
  const filteredUsers = allUsers.filter((u) => {
    const online = isUserOnline(u);

    // Status filter
    if (statusFilter === 'online' && !online) return false;
    if (statusFilter === 'offline' && online) return false;

    // Role filter
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = `${u.firstName} ${u.lastName}`.toLowerCase().includes(q);
      const matchUser = u.username.toLowerCase().includes(q);
      const matchTs = u.teamspeakName.toLowerCase().includes(q);
      const matchDiscord = u.discordTag?.toLowerCase().includes(q) || false;
      return matchName || matchUser || matchTs || matchDiscord;
    }

    return true;
  });

  const onlineCount = allUsers.filter((u) => isUserOnline(u)).length;
  const offlineCount = allUsers.length - onlineCount;

  const handleStatusFilterChange = (filter: 'all' | 'online' | 'offline') => {
    playUiSound('tab', soundFx);
    setStatusFilter(filter);
  };

  return (
    <div className="space-y-6 animate-fadeIn dir-rtl text-right">
      {/* Header Banner */}
      <div className="relative p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 rgb-halo-border">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

        <div className="relative flex items-center gap-4">
          <div className="p-3.5 bg-sky-500/10 border border-sky-500/30 rounded-2xl text-sky-400 shrink-0 shadow-lg shadow-sky-500/10">
            <Radio className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-black text-slate-100">
                فهرست اعضا و وضعیت آنلاین (Staff Directory & Live Status)
              </h1>
              <span className="px-2.5 py-0.5 bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-black rounded-lg">
                عمومی برای تمامی اعضا
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              مشاهده تمامی اعضای کادر سرور کاسپین، وضعیت آنلاین/آفلاین لحظه‌ای، آخرین شیفت‌های ثبت‌شده و راه‌های ارتباطی.
            </p>
          </div>
        </div>

        {/* Live Counters */}
        <div className="relative flex items-center gap-3 shrink-0 bg-slate-900/90 p-2.5 rounded-2xl border border-slate-800 shadow-md">
          <div className="px-3.5 py-1.5 bg-slate-950 rounded-xl border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400 font-semibold">مجموع اعضا</div>
            <div className="text-sm font-extrabold text-slate-100">{allUsers.length} نفر</div>
          </div>

          <div className="px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center">
            <div className="text-[10px] text-emerald-400 font-semibold flex items-center justify-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> آنلاین
            </div>
            <div className="text-sm font-black text-emerald-400">{onlineCount} نفر</div>
          </div>

          <div className="px-3.5 py-1.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-center">
            <div className="text-[10px] text-rose-400 font-semibold flex items-center justify-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> آفلاین
            </div>
            <div className="text-sm font-black text-rose-400">{offlineCount} نفر</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-md">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute right-3.5 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="جستجوی نام، تیم‌اسپیک یا دیسکورد..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-sky-500 transition-all placeholder:text-slate-500"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 text-xs w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => handleStatusFilterChange('all')}
            className={`px-3.5 py-1.5 font-bold rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            همه اعضا ({allUsers.length})
          </button>

          <button
            onClick={() => handleStatusFilterChange('online')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 font-bold rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'online'
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                : 'bg-slate-950 text-emerald-400 border-slate-800 hover:border-emerald-500/40'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            فقط آنلاین‌ها ({onlineCount})
          </button>

          <button
            onClick={() => handleStatusFilterChange('offline')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 font-bold rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'offline'
                ? 'bg-rose-500 text-slate-950 border-rose-400 shadow-md shadow-rose-500/20'
                : 'bg-slate-950 text-rose-400 border-slate-800 hover:border-rose-500/40'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            فقط آفلاین‌ها ({offlineCount})
          </button>
        </div>

        {/* Role Filter */}
        <div className="w-full md:w-52">
          <select
            value={roleFilter}
            onChange={(e) => {
              playUiSound('click', soundFx);
              setRoleFilter(e.target.value);
            }}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-sky-500 font-semibold cursor-pointer"
          >
            <option value="all">تمامی رنک‌ها (All Ranks)</option>
            {ALL_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Members Directory Grid */}
      {filteredUsers.length === 0 ? (
        <div className="p-12 bg-slate-900/60 border border-slate-800 rounded-3xl text-center space-y-3">
          <Users className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">هیچ عضوی با این مشخصات یافت نشد!</h3>
          <p className="text-xs text-slate-500">
            لطفاً عبارت جستجو یا فیلتر‌های انتخاب‌شده را تغییر دهید.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => {
            const online = isUserOnline(user);
            const latestReport = getUserLatestReport(user.id);
            const isSelf = user.id === currentUser.id;

            return (
              <div
                key={user.id}
                className={`p-5 rounded-2xl border transition-all duration-300 relative flex flex-col justify-between ${
                  online
                    ? 'bg-gradient-to-b from-slate-900/90 via-slate-900/95 to-slate-950 border-emerald-500/40 hover:border-emerald-400 shadow-xl shadow-emerald-500/10'
                    : 'bg-slate-900/60 border-slate-800/90 hover:border-slate-700 opacity-90'
                }`}
              >
                <div>
                  {/* Top Header Row */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Avatar with Status Badge Circle */}
                      <div className="relative shrink-0">
                        <img
                          src={
                            user.avatarUrl ||
                            `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`
                          }
                          alt={user.username}
                          className={`w-14 h-14 rounded-2xl bg-slate-900 object-cover border-2 shadow-md ${
                            online ? 'border-emerald-500 shadow-emerald-500/20' : 'border-rose-500/50'
                          }`}
                        />

                        {/* Status Circle Dot */}
                        <div
                          title={online ? 'آنلاین در سامانه' : 'آفلاین'}
                          className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-950 flex items-center justify-center shadow-md ${
                            online ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              online ? 'bg-slate-950 animate-ping' : 'bg-slate-950'
                            }`}
                          ></span>
                        </div>
                      </div>

                      {/* User Info */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-sm font-extrabold text-slate-100 truncate">
                            {user.firstName} {user.lastName}
                          </h3>
                          {isSelf && (
                            <span className="px-1.5 py-0.2 bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[9px] font-black rounded">
                              شما
                            </span>
                          )}
                        </div>

                        <div className="mt-1">
                          <RoleBadge role={user.role} size="xs" />
                        </div>

                        <p className="text-[11px] text-slate-400 font-mono mt-1 truncate">
                          TS: <span className="text-sky-300 font-bold">{user.teamspeakName}</span>
                        </p>
                      </div>
                    </div>

                    {/* Online / Offline Status Badge */}
                    <div className="shrink-0">
                      <div
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black border ${
                          online
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            online ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                          }`}
                        ></span>
                        <span>{online ? '🟢 آنلاین' : '🔴 آفلاین'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Last Submitted Activity Report Card */}
                  <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl space-y-1 my-3">
                    <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-sky-400" />
                      <span>آخرین فعالیت ثبت‌شده:</span>
                    </div>

                    {latestReport ? (
                      <div className="text-xs text-slate-200">
                        <div className="font-bold text-sky-300">
                          {toJalaliDate(latestReport.date)} | ساعت {latestReport.loginTime} تا {latestReport.logoutTime}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          مدت: {latestReport.totalHours} ساعت ({latestReport.status === 'Approved' ? 'تاییدشده' : latestReport.status === 'Rejected' ? 'ردشده' : 'در انتظار'})
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-500 italic">
                        هنوز گزارشی ثبت نکرده است
                      </div>
                    )}
                  </div>

                  {/* Discord Tag */}
                  {user.discordTag && (
                    <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-800/60 flex items-center gap-2 text-xs text-slate-300 font-mono">
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="truncate">Discord: {user.discordTag}</span>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-slate-800/80 mt-3 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-semibold flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-sky-400" /> عضویت: {toJalaliDate(user.registrationDate)}
                  </span>

                  {onToggleUserOnline && !isSelf && (
                    <button
                      onClick={() => {
                        playUiSound('toggle', soundFx);
                        onToggleUserOnline(user.id);
                      }}
                      title="تغییر وضعیت آنلاین/آفلاین برای این کاربر"
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded-lg border border-slate-700 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3 text-amber-400" />
                      <span>{online ? 'تنظیم آفلاین' : 'تنظیم آنلاین'}</span>
                    </button>
                  )}

                  {isSelf && onOpenProfile && (
                    <button
                      onClick={() => {
                        playUiSound('click', soundFx);
                        onOpenProfile();
                      }}
                      className="px-2.5 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 text-[10px] font-bold rounded-lg border border-sky-500/30 transition-all cursor-pointer"
                    >
                      ویرایش پروفایل من
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
