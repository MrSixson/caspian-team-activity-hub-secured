import React from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Award,
  Camera,
  Menu,
  Sparkles,
  Zap,
  Sliders,
  Radio,
  User as UserIcon,
  Eye,
} from 'lucide-react';
import { User, ActivityReport, Warning } from '../types';
import { RoleBadge } from './RoleBadge';
import { toJalaliDate } from '../lib/jalali';

interface MemberDashboardProps {
  currentUser: User;
  userReports: ActivityReport[];
  userWarnings: Warning[];
  onAcknowledgeWarning: (warningId: string) => void;
  onOpenScreenshot: (report: ActivityReport) => void;
  onOpenProfile?: () => void;
  onOpenDrawer?: () => void;
  rgbFx?: boolean;
  onToggleRgb?: () => void;
  themeMode?: 'dark' | 'midnight' | 'light';
  onToggleTheme?: (theme: 'dark' | 'midnight' | 'light') => void;
}

export const MemberDashboard: React.FC<MemberDashboardProps> = ({
  currentUser,
  userReports,
  userWarnings,
  onAcknowledgeWarning,
  onOpenScreenshot,
  onOpenProfile,
  onOpenDrawer,
  rgbFx = true,
  onToggleRgb,
  themeMode = 'dark',
  onToggleTheme,
}) => {
  // Calculations
  const totalOnlineHours = userReports.reduce((sum, r) => sum + r.totalHours, 0);
  const totalReports = userReports.length;
  const approvedReports = userReports.filter((r) => r.status === 'Approved').length;
  const unacknowledgedWarnings = userWarnings.filter((w) => !w.acknowledged);

  const recentReports = [...userReports]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn py-2">
      
      {/* 1. Main Minimal Profile & Welcome Card */}
      <div className={`relative overflow-hidden p-6 sm:p-8 bg-slate-900/90 border border-slate-800/80 rounded-3xl backdrop-blur-2xl shadow-2xl transition-all ${rgbFx ? 'rgb-halo-border' : ''}`}>
        {/* Glow ambient accent */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* User Info & Avatar */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-right">
            {/* Avatar with Camera Trigger */}
            <div
              className="relative group cursor-pointer shrink-0"
              onClick={onOpenProfile}
              title="ویرایش پروفایل و عکس"
            >
              <img
                src={
                  currentUser.avatarUrl ||
                  `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.username}`
                }
                alt={currentUser.username}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-slate-800 border-2 border-slate-700/80 group-hover:border-sky-400 object-cover shadow-2xl transition-all group-hover:scale-105"
              />
              <div className="absolute -bottom-1 -right-1 p-2 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-2xl shadow-lg border-2 border-slate-900 transition-all">
                <Camera className="w-4 h-4" />
              </div>
              {/* Online Indicator */}
              <div className="absolute top-1 left-1 w-4 h-4 bg-emerald-500 border-2 border-slate-950 rounded-full animate-pulse" title="وضعیت: آنلاین" />
            </div>

            {/* Profile Text */}
            <div className="space-y-2">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <RoleBadge role={currentUser.role} size="md" />
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Radio className="w-3 h-3 animate-pulse" /> کادر فعال
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
                {currentUser.firstName} {currentUser.lastName}
              </h1>

              <div className="text-xs text-slate-400 font-medium dir-ltr text-right">
                @{currentUser.username} &bull; <span className="text-sky-400 dir-rtl font-semibold">تیم کاسپین</span>
              </div>

              {currentUser.bio && (
                <p className="text-xs text-slate-300/90 leading-relaxed max-w-md pt-1">
                  {currentUser.bio}
                </p>
              )}
            </div>
          </div>

          {/* Quick Action Button for Drawer & Profile */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto shrink-0">
            <button
              onClick={onOpenDrawer}
              className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-sky-500/20 hover:shadow-sky-500/30 transition-all cursor-pointer transform active:scale-95"
            >
              <Menu className="w-5 h-5" />
              <span>باز کردن پنل کشویی منو</span>
            </button>

            <button
              onClick={onOpenProfile}
              className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 hover:text-white border border-slate-700/80 rounded-2xl text-xs font-bold transition-all cursor-pointer"
            >
              <UserIcon className="w-4 h-4 text-sky-400" />
              <span>ویرایش عکس و مشخصات</span>
            </button>
          </div>

        </div>
      </div>

      {/* 2. Sleek Quick Controls Panel (Theme & RGB Direct Toggles) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* RGB Toggle Card */}
        <div
          onClick={onToggleRgb}
          className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
            rgbFx
              ? 'bg-gradient-to-r from-indigo-950/80 via-slate-900 to-purple-950/80 border-purple-500/50 shadow-lg shadow-purple-500/10'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${rgbFx ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-800 text-slate-400'}`}>
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-200">افکت نورپردازی RGB</div>
              <div className="text-[11px] text-slate-400">{rgbFx ? 'فعال (Gamer Mode)' : 'غیرفعال'}</div>
            </div>
          </div>
          <div className={`w-11 h-6 rounded-full transition-colors relative ${rgbFx ? 'bg-purple-600' : 'bg-slate-800'}`}>
            <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${rgbFx ? 'left-5' : 'left-0.5'}`} />
          </div>
        </div>

        {/* Theme Control Card */}
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl">
              <Zap className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black text-slate-200 truncate">تم و ظاهر برنامه</div>
              <div className="text-[11px] text-slate-400 truncate">
                {themeMode === 'midnight' ? 'سرمه‌ای تیره (Midnight)' : themeMode === 'light' ? 'روشن (Clean Dark)' : 'تاریک استاندارد (Dark)'}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              const nextTheme = themeMode === 'dark' ? 'midnight' : themeMode === 'midnight' ? 'light' : 'dark';
              onToggleTheme?.(nextTheme);
            }}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all cursor-pointer shrink-0"
          >
            تغییر
          </button>
        </div>

        {/* Settings Drawer Button */}
        <div
          onClick={onOpenDrawer}
          className="p-5 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-sky-500/40 rounded-2xl transition-all cursor-pointer flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-200">تنظیمات پیشرفته</div>
              <div className="text-[11px] text-slate-400">انیمیشن، صدا و بخش‌ها</div>
            </div>
          </div>
          <span className="text-xs font-bold text-sky-400">&larr;</span>
        </div>
      </div>

      {/* 3. Minimal Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 bg-slate-900/70 border border-slate-800/80 rounded-2xl backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">کل کارکرد آنلاین</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-slate-100">{totalOnlineHours} <span className="text-xs font-normal text-slate-400">ساعت</span></div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 bg-slate-900/70 border border-slate-800/80 rounded-2xl backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">شیفت‌های تاییدشده</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{approvedReports} <span className="text-xs font-normal text-slate-400">از {totalReports}</span></div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 bg-slate-900/70 border border-slate-800/80 rounded-2xl backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">اخطارهای فعال</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className={`text-2xl font-black ${unacknowledgedWarnings.length > 0 ? 'text-amber-400' : 'text-slate-100'}`}>
            {unacknowledgedWarnings.length} <span className="text-xs font-normal text-slate-400">مورد</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 bg-slate-900/70 border border-slate-800/80 rounded-2xl backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">سطح دسترسی</span>
            <Award className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-1">
            <RoleBadge role={currentUser.role} size="sm" />
          </div>
        </div>
      </div>

      {/* 4. Minimal Recent Activity Section */}
      <div className="p-6 bg-slate-900/80 border border-slate-800/80 rounded-3xl backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-400" /> گزارش‌های اخیر ثبت‌شده
          </h3>
          <span className="text-xs text-slate-400 font-semibold">4 فعالیت آخر</span>
        </div>

        {recentReports.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 font-medium">
            هنوز گزارشی ثبت نکرده‌اید. برای ثبت اولین شیفت از منوی کشویی گزینه «ثبت شیفت» را انتخاب کنید.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recentReports.map((report) => (
              <div
                key={report.id}
                className="p-4 bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-2xl flex items-center justify-between gap-3 transition-all"
              >
                <div>
                  <div className="text-xs font-bold text-slate-200 dir-ltr text-right">
                    {toJalaliDate(report.date)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    مدت آنلاین: <span className="font-bold text-sky-300">{report.totalHours} ساعت</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-lg ${
                      report.status === 'Approved'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : report.status === 'Rejected'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {report.status === 'Approved' ? 'تاییدشده' : report.status === 'Rejected' ? 'ردشده' : 'در انتظار'}
                  </span>

                  {report.screenshotUrl && (
                    <button
                      onClick={() => onOpenScreenshot(report)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg text-xs transition-colors"
                      title="مشاهده اسکرین‌شات"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
