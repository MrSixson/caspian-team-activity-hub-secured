import React, { useState } from 'react';
import {
  Trophy,
  Medal,
  Award,
  Crown,
  Search,
  Clock,
  Sparkles,
  Calendar,
  RotateCcw,
  CheckCircle2,
  BellRing,
  Shield,
  Zap,
} from 'lucide-react';
import { User, ActivityReport } from '../types';
import { RoleBadge } from './RoleBadge';
import { isTopFourRank } from '../lib/permissions';

interface LeaderboardPanelProps {
  currentUser: User;
  allUsers: User[];
  allReports: ActivityReport[];
  onResetMonthlyLeaderboard?: (newMonthName: string) => void;
}

export const LeaderboardPanel: React.FC<LeaderboardPanelProps> = ({
  currentUser,
  allUsers,
  allReports,
  onResetMonthlyLeaderboard,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [newMonthInput, setNewMonthInput] = useState('شهریور ۱۴۰۵');
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);

  // Current Month Name
  const currentMonthName = 'مرداد ۱۴۰۵';

  // Calculate statistics for each active user
  const userStats = allUsers.map((user) => {
    const userReports = allReports.filter(
      (r) => r.userId === user.id && r.status === 'Approved'
    );
    const totalHours = userReports.reduce((acc, r) => acc + (r.totalHours || 0), 0);
    const shiftCount = userReports.length;

    return {
      user,
      totalHours: parseFloat(totalHours.toFixed(1)),
      shiftCount,
    };
  });

  // Sort descending by total hours
  const rankedUsers = userStats.sort((a, b) => b.totalHours - a.totalHours);

  // Search filter
  const filteredRanked = rankedUsers.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.user.firstName.toLowerCase().includes(q) ||
      item.user.lastName.toLowerCase().includes(q) ||
      item.user.username.toLowerCase().includes(q) ||
      item.user.teamspeakName.toLowerCase().includes(q) ||
      item.user.role.toLowerCase().includes(q)
    );
  });

  const maxHours = rankedUsers[0]?.totalHours || 1;

  // Podium
  const firstPlace = rankedUsers[0];
  const secondPlace = rankedUsers[1];
  const thirdPlace = rankedUsers[2];

  const canReset = isTopFourRank(currentUser.role) || currentUser.isFounder;

  const handleConfirmReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (onResetMonthlyLeaderboard) {
      onResetMonthlyLeaderboard(newMonthInput);
    }
    setShowResetModal(false);
    setResetSuccessMsg(`ماه جدید (${newMonthInput}) با موفقیت آغاز شد و اعلامیه همگانی ارسال گردید.`);
    setTimeout(() => setResetSuccessMsg(null), 6000);
  };

  return (
    <div className="space-y-6 dir-rtl text-right">
      {/* Header Banner */}
      <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-2xl shadow-lg shadow-amber-500/10">
              <Trophy className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
                جدول رتبه‌بندی و ساعات کارکرد اعضا (Staff Leaderboard)
                <span className="text-xs px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-amber-400 font-semibold flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {currentMonthName}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                رتبه‌بندی تمامی اعضای کادر سرور Caspian از نفر اول تا آخر بر اساس مجموع ساعات کارکرد آنلاین تایید شده.
              </p>
            </div>
          </div>

          {canReset && (
            <button
              onClick={() => setShowResetModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-2xl shadow-lg shadow-amber-400/20 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              ریست ماهانه و اعلان ماه جدید
            </button>
          )}
        </div>
      </div>

      {resetSuccessMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-sm flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{resetSuccessMsg}</span>
        </div>
      )}

      {/* New Month Announcement Banner for ALL Users */}
      <div className="p-5 bg-gradient-to-r from-amber-500/10 via-sky-500/10 to-indigo-500/10 border border-amber-500/30 rounded-3xl backdrop-blur-xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl shrink-0">
            <BellRing className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <div className="text-sm font-black text-amber-300 flex items-center gap-1.5">
              <span>اطلاعیه رسمی ماه جدید ({currentMonthName})</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              رتبه‌بندی برای ماه جاری فعال است! تمام ساعات کارکرد ثبت‌شده در شیفت‌های تاییدشده محاسبه شده و برترین اعضا مشخص می‌گردند.
            </p>
          </div>
        </div>
        <div className="text-xs font-mono px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-300 shrink-0">
          تعداد کل اعضای کادر: <span className="text-amber-400 font-bold">{allUsers.length} نفر</span>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 2nd Place */}
        {secondPlace ? (
          <div className="order-2 md:order-1 p-5 bg-slate-900/80 border border-slate-400/30 rounded-3xl flex flex-col items-center justify-center text-center space-y-3 relative overflow-hidden group hover:border-slate-300 transition-all">
            <div className="absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded-full flex items-center gap-1">
              <Medal className="w-3.5 h-3.5 text-slate-300" /> مقام دوم (نقره)
            </div>
            <div className="relative mt-4">
              <img
                src={secondPlace.user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${secondPlace.user.username}`}
                alt={secondPlace.user.username}
                className="w-20 h-20 rounded-2xl bg-slate-950 border-2 border-slate-300 object-cover shadow-xl shadow-slate-500/10"
              />
              <span className="absolute -bottom-2 -right-2 w-7 h-7 bg-slate-300 text-slate-950 font-black rounded-full text-xs flex items-center justify-center shadow-md">
                2
              </span>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-100">
                {secondPlace.user.firstName} {secondPlace.user.lastName}
              </h3>
              <p className="text-xs text-slate-400 font-mono">@{secondPlace.user.username}</p>
            </div>
            <RoleBadge role={secondPlace.user.role} size="xs" />
            <div className="pt-2 border-t border-slate-800 w-full flex items-center justify-around text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block">ساعات کارکرد</span>
                <span className="font-extrabold text-slate-200">{secondPlace.totalHours} ساعت</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">تعداد شیفت</span>
                <span className="font-extrabold text-slate-200">{secondPlace.shiftCount}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="order-2 md:order-1 p-5 bg-slate-950/40 border border-slate-800 rounded-3xl text-center text-slate-600 text-xs">
            هنوز ثبت نشده
          </div>
        )}

        {/* 1st Place - Champion */}
        {firstPlace ? (
          <div className="order-1 md:order-2 p-6 bg-gradient-to-b from-amber-500/20 via-slate-900 to-slate-900 border-2 border-amber-500/60 rounded-3xl flex flex-col items-center justify-center text-center space-y-3 relative overflow-hidden group hover:border-amber-400 transition-all shadow-2xl shadow-amber-500/20 scale-105">
            <div className="absolute top-3 right-3 text-[10px] font-black px-3 py-1 bg-amber-500 text-slate-950 rounded-full flex items-center gap-1 shadow-md">
              <Crown className="w-4 h-4 text-slate-950" /> قهرمان ماه (مقام اول)
            </div>
            <div className="relative mt-4">
              <div className="absolute -inset-2 bg-amber-500/30 rounded-3xl blur-lg animate-pulse"></div>
              <img
                src={firstPlace.user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${firstPlace.user.username}`}
                alt={firstPlace.user.username}
                className="relative w-24 h-24 rounded-2xl bg-slate-950 border-2 border-amber-400 object-cover shadow-2xl"
              />
              <span className="absolute -bottom-2 -right-2 w-8 h-8 bg-amber-400 text-slate-950 font-black rounded-full text-sm flex items-center justify-center shadow-lg border-2 border-slate-950">
                1
              </span>
            </div>
            <div>
              <h3 className="text-lg font-black text-amber-200 flex items-center justify-center gap-1.5">
                {firstPlace.user.firstName} {firstPlace.user.lastName}
                <Crown className="w-4 h-4 text-amber-400" />
              </h3>
              <p className="text-xs text-amber-400/80 font-mono">@{firstPlace.user.username} • TS: {firstPlace.user.teamspeakName}</p>
            </div>
            <RoleBadge role={firstPlace.user.role} size="sm" />
            <div className="pt-3 border-t border-amber-500/30 w-full flex items-center justify-around text-xs">
              <div>
                <span className="text-[10px] text-amber-300/80 block">مجموع کارکرد آنلاین</span>
                <span className="font-black text-amber-300 text-base">{firstPlace.totalHours} ساعت</span>
              </div>
              <div>
                <span className="text-[10px] text-amber-300/80 block">شیفت تاییدشده</span>
                <span className="font-black text-amber-300 text-base">{firstPlace.shiftCount}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="order-1 md:order-2 p-6 bg-slate-950/40 border border-slate-800 rounded-3xl text-center text-slate-600 text-xs">
            هنوز ثبت نشده
          </div>
        )}

        {/* 3rd Place */}
        {thirdPlace ? (
          <div className="order-3 p-5 bg-slate-900/80 border border-amber-700/30 rounded-3xl flex flex-col items-center justify-center text-center space-y-3 relative overflow-hidden group hover:border-amber-700/50 transition-all">
            <div className="absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 bg-slate-800 text-amber-600 border border-amber-800/40 rounded-full flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-600" /> مقام سوم (برنز)
            </div>
            <div className="relative mt-4">
              <img
                src={thirdPlace.user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${thirdPlace.user.username}`}
                alt={thirdPlace.user.username}
                className="w-20 h-20 rounded-2xl bg-slate-950 border-2 border-amber-700/60 object-cover shadow-xl shadow-amber-900/10"
              />
              <span className="absolute -bottom-2 -right-2 w-7 h-7 bg-amber-700 text-slate-100 font-black rounded-full text-xs flex items-center justify-center shadow-md">
                3
              </span>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-100">
                {thirdPlace.user.firstName} {thirdPlace.user.lastName}
              </h3>
              <p className="text-xs text-slate-400 font-mono">@{thirdPlace.user.username}</p>
            </div>
            <RoleBadge role={thirdPlace.user.role} size="xs" />
            <div className="pt-2 border-t border-slate-800 w-full flex items-center justify-around text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block">ساعات کارکرد</span>
                <span className="font-extrabold text-slate-200">{thirdPlace.totalHours} ساعت</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">تعداد شیفت</span>
                <span className="font-extrabold text-slate-200">{thirdPlace.shiftCount}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="order-3 p-5 bg-slate-950/40 border border-slate-800 rounded-3xl text-center text-slate-600 text-xs">
            هنوز ثبت نشده
          </div>
        )}
      </div>

      {/* Complete Member Leaderboard Table (1st to Last Place) */}
      <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" /> لیست کامل رتبه‌بندی تمامی اعضا (نفر اول تا آخر)
            </h3>
            <p className="text-xs text-slate-400">مرتب‌سازی هوشمند بر اساس ساعات کارکرد آنلاین تایید شده در ماه {currentMonthName}</p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="جستجوی اعضا بر اساس نام، نام کاربری یا رنک..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-amber-500 transition-all placeholder:text-slate-600"
            />
          </div>
        </div>

        {/* Leaderboard Rows */}
        <div className="space-y-2">
          {filteredRanked.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs font-medium">
              عضوی مطابق با جستجوی شما یافت نشد.
            </div>
          ) : (
            filteredRanked.map((item, index) => {
              const rankNum = index + 1;
              const isCurrentUser = item.user.id === currentUser.id;
              const pct = Math.min(100, Math.round((item.totalHours / (maxHours || 1)) * 100));

              return (
                <div
                  key={item.user.id}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isCurrentUser
                      ? 'bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/5'
                      : rankNum === 1
                      ? 'bg-amber-500/5 border-amber-500/30'
                      : rankNum === 2
                      ? 'bg-slate-800/40 border-slate-700/50'
                      : rankNum === 3
                      ? 'bg-amber-900/10 border-amber-800/30'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-8 h-8 rounded-xl shrink-0 text-xs font-black flex items-center justify-center ${
                        rankNum === 1
                          ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30'
                          : rankNum === 2
                          ? 'bg-slate-300 text-slate-950'
                          : rankNum === 3
                          ? 'bg-amber-700 text-slate-100'
                          : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {rankNum}
                    </span>

                    <img
                      src={item.user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${item.user.username}`}
                      alt={item.user.username}
                      className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 object-cover shrink-0"
                    />

                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5 flex-wrap">
                        <span className="truncate">
                          {item.user.firstName} {item.user.lastName}
                        </span>
                        {item.user.isFounder && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                        {isCurrentUser && (
                          <span className="text-[9px] px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full font-extrabold">
                            شما
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                        <span>@{item.user.username}</span>
                        <span>•</span>
                        <span>TS: {item.user.teamspeakName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                    <RoleBadge role={item.user.role} size="xs" />

                    {/* Hours visual progress */}
                    <div className="w-32 hidden md:block">
                      <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                        <span>نسبت به رتبه ۱</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="text-left font-mono">
                      <div className="text-sm font-black text-amber-300">{item.totalHours} ساعت</div>
                      <div className="text-[10px] text-slate-400">{item.shiftCount} شیفت ثبت‌شده</div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Monthly Reset Modal for Top 4 / Founder */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn dir-rtl text-right">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-400" /> شروع ماه جدید و ریست کارکردها
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              با این اقدام، اعلامیه شروع ماه جدید برای تمامی اعضای کادر ارسال شده و جدول رتبه‌بندی برای ماه جدید تنظیم می‌گردد.
            </p>

            <form onSubmit={handleConfirmReset} className="space-y-4 text-xs">
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

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-[11px]">
                اعلامیه همگانی با متن زیر برای کلیه اعضا صادر خواهد شد:
                <div className="font-bold mt-1 text-amber-200">
                  "📢 ماه جدید ({newMonthInput}) آغاز شد! رتبه‌بندی جدید سرور Caspian فعال گردید."
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-200 bg-slate-800 rounded-xl"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-lg shadow-amber-400/20"
                >
                  تایید و شروع ماه جدید
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
