import React from 'react';
import {
  X,
  LayoutDashboard,
  Trophy,
  Radio,
  ListTodo,
  Calendar,
  FilePlus,
  FolderArchive,
  CheckSquare,
  Users,
  User as UserIcon,
  Sparkles,
  Sun,
  Moon,
  Zap,
  Activity,
  Palette,
  RotateCcw,
  Volume2,
  VolumeX,
  ChevronLeft,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { User } from '../types';
import { RoleBadge } from './RoleBadge';
import { canReviewReports, canManageUsers, canManagePermissions } from '../lib/permissions';

import { playUiSound } from '../lib/audioFx';

interface SideDrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  allUsers?: User[];
  onSwitchUser?: (user: User) => void;
  onResetData?: () => void;
  onOpenProfile?: () => void;
  onLogout?: () => void;

  // Customization props
  themeMode?: 'dark' | 'midnight' | 'emerald' | 'light';
  setThemeMode?: (mode: 'dark' | 'midnight' | 'emerald' | 'light') => void;
  onToggleTheme?: (mode: 'dark' | 'midnight' | 'emerald' | 'light') => void;
  rgbFx?: boolean;
  setRgbFx?: (val: boolean) => void;
  onToggleRgb?: () => void;
  particlesFx?: boolean;
  setParticlesFx?: (val: boolean) => void;
  onToggleParticles?: () => void;
  soundFx?: boolean;
  setSoundFx?: (val: boolean) => void;
  onToggleSound?: () => void;
}

export const SideDrawerMenu: React.FC<SideDrawerMenuProps> = ({
  isOpen,
  onClose,
  currentUser,
  activeTab,
  setActiveTab,
  allUsers = [],
  onSwitchUser,
  onResetData,
  onOpenProfile,
  onLogout,
  themeMode = 'dark',
  setThemeMode,
  onToggleTheme,
  rgbFx = true,
  setRgbFx,
  onToggleRgb,
  particlesFx = true,
  setParticlesFx,
  onToggleParticles,
  soundFx = true,
  setSoundFx,
  onToggleSound,
}) => {
  if (!isOpen) return null;

  const canReview = canReviewReports(currentUser);
  const canManage = canManageUsers(currentUser) || canManagePermissions(currentUser);

  const handleSelectTab = (tab: string) => {
    setActiveTab(tab);
    onClose();
  };

  const handleSetTheme = (mode: 'dark' | 'midnight' | 'emerald' | 'light') => {
    playUiSound('toggle', soundFx);
    if (setThemeMode) setThemeMode(mode);
    else if (onToggleTheme) onToggleTheme(mode);
  };

  const handleToggleRgb = () => {
    playUiSound('toggle', soundFx);
    if (onToggleRgb) onToggleRgb();
    else if (setRgbFx) setRgbFx(!rgbFx);
  };

  const handleToggleParticles = () => {
    playUiSound('toggle', soundFx);
    if (onToggleParticles) onToggleParticles();
    else if (setParticlesFx) setParticlesFx(!particlesFx);
  };

  const handleToggleSound = () => {
    playUiSound('toggle', soundFx);
    if (onToggleSound) onToggleSound();
    else if (setSoundFx) setSoundFx(!soundFx);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden dir-rtl text-right">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* Slide-over Panel from Right */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-950 border-l border-slate-800/90 shadow-2xl flex flex-col justify-between animate-slideLeft">
          
          {/* Drawer Header */}
          <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-sky-500/10 border border-sky-500/30 rounded-2xl text-sky-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                  منوی دسترسی و تنظیمات (Main Menu)
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  سرور کاسپین - سامانه جامع کادر
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-100 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body - Scrollable */}
          <div className="p-5 space-y-6 overflow-y-auto flex-1 no-scrollbar">
            
            {/* User Quick Info Card */}
            {currentUser && (
              <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={
                      currentUser.avatarUrl ||
                      `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.username}`
                    }
                    alt={currentUser.username}
                    className="w-12 h-12 rounded-xl bg-slate-950 border border-sky-500/40 object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-black text-slate-100 truncate">
                      {currentUser.firstName} {currentUser.lastName}
                    </div>
                    <div className="mt-0.5">
                      {currentUser.isRankAssigned === false ? (
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black rounded-lg">
                          در انتظار تعیین رنک
                        </span>
                      ) : (
                        <RoleBadge role={currentUser.role} size="xs" />
                      )}
                    </div>
                  </div>
                </div>

                {onOpenProfile && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenProfile();
                    }}
                    className="p-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-xl transition-all text-xs font-bold shrink-0 cursor-pointer"
                    title="تنظیمات پروفایل"
                  >
                    <UserIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Navigation Groups */}
            <div className="space-y-4">
              {currentUser?.isRankAssigned === false ? (
                <div className="space-y-3">
                  <div className="p-4 bg-amber-950/40 border border-amber-500/40 rounded-2xl space-y-2 text-right">
                    <div className="flex items-center gap-2 text-amber-300 text-xs font-black">
                      <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>دسترسی موقت (فقط تیکت)</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      به سرور کاسپین خوش آمدید. حساب شما فعال است اما رنک رسمی هنوز توسط ۴ رنک اصلی ست نشده است. جهت تایید رنک، یک تیکت تعیین رنک ارسال نمایید.
                    </p>
                  </div>

                  <button
                    onClick={() => handleSelectTab('tickets')}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl transition-all font-black text-xs cursor-pointer bg-gradient-to-r from-amber-500/20 to-indigo-500/20 border border-amber-500/50 text-amber-200 shadow-lg"
                  >
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                      <span>سامانه تیکت‌ها و درخواست رنک</span>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-amber-400" />
                  </button>
                </div>
              ) : (
                <>
                  {/* Group 1: Core Navigation */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-black text-sky-400 uppercase tracking-wider px-2">
                      📌 منوی اصلی و عمومی
                    </div>

                    <button
                      onClick={() => handleSelectTab('dashboard')}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all font-bold text-xs cursor-pointer ${
                        activeTab === 'dashboard'
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-md'
                          : 'bg-slate-900/60 text-slate-300 hover:bg-slate-900 border border-slate-800/80 hover:text-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <LayoutDashboard className="w-4 h-4 text-sky-400" />
                        <span>داشبورد اصلی (Home)</span>
                      </div>
                      <ChevronLeft className="w-4 h-4 text-slate-500" />
                    </button>

                    <button
                      onClick={() => handleSelectTab('leaderboard')}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all font-bold text-xs cursor-pointer ${
                        activeTab === 'leaderboard'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-md'
                          : 'bg-slate-900/60 text-slate-300 hover:bg-slate-900 border border-slate-800/80 hover:text-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Trophy className="w-4 h-4 text-amber-400" />
                        <span>جدول رتبه‌بندی اعضا (Leaderboard)</span>
                      </div>
                      <ChevronLeft className="w-4 h-4 text-slate-500" />
                    </button>

                    <button
                      onClick={() => handleSelectTab('members')}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all font-bold text-xs cursor-pointer ${
                        activeTab === 'members'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-md'
                          : 'bg-slate-900/60 text-slate-300 hover:bg-slate-900 border border-slate-800/80 hover:text-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                        <span>اعضای کادر و وضعیت آنلاین</span>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black rounded-lg">
                        آنلاین
                      </span>
                    </button>

                    <button
                      onClick={() => handleSelectTab('tasks')}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all font-bold text-xs cursor-pointer ${
                        activeTab === 'tasks'
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-md'
                          : 'bg-slate-900/60 text-slate-300 hover:bg-slate-900 border border-slate-800/80 hover:text-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <ListTodo className="w-4 h-4 text-sky-400" />
                        <span>لیست کارهای این ماه</span>
                      </div>
                      <ChevronLeft className="w-4 h-4 text-slate-500" />
                    </button>

                    <button
                      onClick={() => handleSelectTab('meetings')}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all font-bold text-xs cursor-pointer ${
                        activeTab === 'meetings'
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-md'
                          : 'bg-slate-900/60 text-slate-300 hover:bg-slate-900 border border-slate-800/80 hover:text-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Calendar className="w-4 h-4 text-indigo-400" />
                        <span>جلسات و صورت‌جلسات</span>
                      </div>
                      <ChevronLeft className="w-4 h-4 text-slate-500" />
                    </button>

                    <button
                      onClick={() => handleSelectTab('tickets')}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all font-bold text-xs cursor-pointer ${
                        activeTab === 'tickets'
                          ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-md'
                          : 'bg-slate-900/60 text-slate-300 hover:bg-slate-900 border border-slate-800/80 hover:text-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <span>تیکت‌های های‌رنک و مرخصی</span>
                      </div>
                      <ChevronLeft className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>

                  {/* Group 2: Staff Actions */}
                  <div className="space-y-1.5 pt-2">
                    <div className="text-[10px] font-black text-amber-400 uppercase tracking-wider px-2">
                      ⚡ ثبت و سوابق فعالیت
                    </div>

                    <button
                      onClick={() => handleSelectTab('daily_report')}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all font-bold text-xs cursor-pointer ${
                        activeTab === 'daily_report'
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-md'
                          : 'bg-slate-900/60 text-slate-300 hover:bg-slate-900 border border-slate-800/80 hover:text-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <FilePlus className="w-4 h-4 text-sky-400" />
                        <span>ثبت شیفت جدید</span>
                      </div>
                      <ChevronLeft className="w-4 h-4 text-slate-500" />
                    </button>

                    <button
                      onClick={() => handleSelectTab('monthly_archive')}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all font-bold text-xs cursor-pointer ${
                        activeTab === 'monthly_archive'
                          ? 'bg-slate-800 text-slate-200 border border-slate-700 shadow-md'
                          : 'bg-slate-900/60 text-slate-300 hover:bg-slate-900 border border-slate-800/80 hover:text-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <FolderArchive className="w-4 h-4 text-slate-400" />
                        <span>آرشیو کامل فعالیت‌ها</span>
                      </div>
                      <ChevronLeft className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>

                  {/* Group 3: Management */}
                  {(canReview || canManage) && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-800">
                      <div className="text-[10px] font-black text-emerald-400 uppercase tracking-wider px-2">
                        👑 بازرسی و مدیریت
                      </div>

                      {canReview && (
                        <button
                          onClick={() => handleSelectTab('review_activities')}
                          className={`w-full flex items-center justify-between p-3 rounded-xl transition-all font-bold text-xs cursor-pointer ${
                            activeTab === 'review_activities'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-md'
                              : 'bg-slate-900/60 text-slate-300 hover:bg-slate-900 border border-slate-800/80 hover:text-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <CheckSquare className="w-4 h-4 text-emerald-400" />
                            <span>بررسی و تایید شیفت‌ها</span>
                          </div>
                          <ChevronLeft className="w-4 h-4 text-slate-500" />
                        </button>
                      )}

                      {canManage && (
                        <button
                          onClick={() => handleSelectTab('console')}
                          className={`w-full flex items-center justify-between p-3 rounded-xl transition-all font-bold text-xs cursor-pointer border ${
                            activeTab === 'console'
                              ? 'bg-rose-600 text-white border-rose-500 shadow-[0_0_20px_rgba(225,29,72,0.6)]'
                              : 'bg-rose-950/40 text-rose-300 border-rose-800/80 hover:bg-rose-900/60'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                            <span className="font-black text-white">🔴 کنسول مدیریت (حالت قرمز)</span>
                          </div>
                          <ChevronLeft className="w-4 h-4 text-rose-400" />
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Customization & Visual Effects Panel in Drawer */}
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4">
              <div className="text-xs font-black text-sky-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>تنظیمات جلوه‌های بصری و افکت‌ها</span>
              </div>

              {/* Theme Selector */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                  <span>تم و رنگ‌بندی سامانه:</span>
                  <span className="text-slate-200 font-bold">
                    {themeMode === 'dark' ? 'تاریک سایبر' : themeMode === 'midnight' ? 'ناوی شب' : themeMode === 'emerald' ? 'زمردی نئون' : 'روشن مدرن'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <button
                    onClick={() => handleSetTheme('dark')}
                    className={`px-2 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      themeMode === 'dark'
                        ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" /> سایبر
                  </button>

                  <button
                    onClick={() => handleSetTheme('midnight')}
                    className={`px-2 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      themeMode === 'midnight'
                        ? 'bg-indigo-500 text-slate-950 border-indigo-400 shadow-md'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" /> ناوی
                  </button>

                  <button
                    onClick={() => handleSetTheme('emerald')}
                    className={`px-2 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      themeMode === 'emerald'
                        ? 'bg-emerald-400 text-slate-950 border-emerald-300 shadow-md'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" /> زمردی
                  </button>

                  <button
                    onClick={() => handleSetTheme('light')}
                    className={`px-2 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      themeMode === 'light'
                        ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" /> روشن
                  </button>
                </div>
              </div>

              {/* RGB Rainbow Glow Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-fuchsia-400" />
                  <span>نورپردازی و هلا هاله RGB</span>
                </div>
                <button
                  onClick={handleToggleRgb}
                  className={`px-3 py-1 rounded-xl text-[11px] font-black border transition-all cursor-pointer ${
                    rgbFx
                      ? 'bg-fuchsia-500 text-slate-950 border-fuchsia-400 shadow-md shadow-fuchsia-500/20'
                      : 'bg-slate-950 text-slate-500 border-slate-800'
                  }`}
                >
                  {rgbFx ? 'روشن (ON)' : 'خاموش (OFF)'}
                </button>
              </div>

              {/* Background Particles Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span>انیمیشن و ذرات پیش‌زمینه</span>
                </div>
                <button
                  onClick={handleToggleParticles}
                  className={`px-3 py-1 rounded-xl text-[11px] font-black border transition-all cursor-pointer ${
                    particlesFx
                      ? 'bg-cyan-400 text-slate-950 border-cyan-300 shadow-md shadow-cyan-400/20'
                      : 'bg-slate-950 text-slate-500 border-slate-800'
                  }`}
                >
                  {particlesFx ? 'روشن (ON)' : 'خاموش (OFF)'}
                </button>
              </div>

              {/* Sound Effects Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  {soundFx ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                  <span>جلوه‌های صوتی UI</span>
                </div>
                <button
                  onClick={handleToggleSound}
                  className={`px-3 py-1 rounded-xl text-[11px] font-black border transition-all cursor-pointer ${
                    soundFx
                      ? 'bg-emerald-400 text-slate-950 border-emerald-300 shadow-md shadow-emerald-400/20'
                      : 'bg-slate-950 text-slate-500 border-slate-800'
                  }`}
                >
                  {soundFx ? 'روشن (ON)' : 'خاموش (OFF)'}
                </button>
              </div>
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
            <button
              onClick={() => {
                onResetData?.();
                onClose();
              }}
              className="px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors border border-rose-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> ریست داده‌های دمو
            </button>

            <span className="text-[10px] text-slate-500 font-mono">Caspian v3.5 RTL</span>
          </div>

        </div>
      </div>
    </div>
  );
};
