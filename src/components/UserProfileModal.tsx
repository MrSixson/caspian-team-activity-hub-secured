import React, { useState, useRef } from 'react';
import {
  X,
  User as UserIcon,
  Mail,
  Headphones,
  Shield,
  Sparkles,
  Save,
  CheckCircle2,
  Image as ImageIcon,
  MessageSquare,
  Gamepad2,
  Phone,
  Calendar,
  RefreshCw,
  Camera,
  Upload,
  Link,
  AlertCircle,
  FileImage,
  Trash2,
  Clock,
  Activity,
  FileText,
} from 'lucide-react';
import { User, ActivityReport } from '../types';
import { RoleBadge } from './RoleBadge';
import { RoleButton } from './RoleButton';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpdateProfile: (updatedData: Partial<User>) => void;
  reports?: ActivityReport[];
}

const AVATAR_STYLES = [
  { id: 'bottts', name: '🤖 رباتیک (Bottts)' },
  { id: 'avataaars', name: '👤 پرتره انسان (Avataaars)' },
  { id: 'personas', name: '🎨 پرسونا (Personas)' },
  { id: 'adventurer', name: '⚔️ ماجراجو (Adventurer)' },
  { id: 'pixel-art', name: '👾 پیکسلی (Pixel Art)' },
  { id: 'micah', name: '🌟 مدرن (Micah)' },
  { id: 'lorelei', name: '🎭 فانتزی (Lorelei)' },
];

const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=amin_jodaie',
  'https://api.dicebear.com/7.x/bottts/svg?seed=behnam_bahramian',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=caspian_commander',
  'https://api.dicebear.com/7.x/personas/svg?seed=shield_operator',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=cyber_mod_1',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=tactical_helper',
  'https://api.dicebear.com/7.x/micah/svg?seed=caspian_founder',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=shadow_admin',
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateProfile,
  reports = [],
}) => {
  const [firstName, setFirstName] = useState(currentUser.firstName || '');
  const [lastName, setLastName] = useState(currentUser.lastName || '');
  const [teamspeakName, setTeamspeakName] = useState(currentUser.teamspeakName || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || PRESET_AVATARS[0]);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [discordTag, setDiscordTag] = useState(currentUser.discordTag || '');
  const [steamId, setSteamId] = useState(currentUser.steamId || '');
  const [phoneNumber, setPhoneNumber] = useState(currentUser.phoneNumber || '');

  // Photo Upload State
  const [avatarTab, setAvatarTab] = useState<'upload' | 'preset' | 'generator' | 'url'>('upload');
  const [selectedStyle, setSelectedStyle] = useState('bottts');
  const [customSeed, setCustomSeed] = useState(currentUser.username || 'caspian');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Find user's most recent submitted activity report
  const userReports = reports.filter((r) => r.userId === currentUser.id);
  const sortedReports = [...userReports].sort((a, b) => {
    const timeA = new Date(a.createdAt || a.date).getTime();
    const timeB = new Date(b.createdAt || b.date).getTime();
    return timeB - timeA;
  });
  const latestReport = sortedReports[0];

  if (!isOpen) return null;

  // Compress & read custom file image
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('لطفا یک فایل تصویری معتبر انتخاب کنید (PNG, JPG, WEBP, GIF).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setUploadError('حجم فایل تصویر نباید بیشتر از ۸ مگابایت باشد.');
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 320;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setAvatarUrl(compressedDataUrl);
        } else {
          setAvatarUrl(event.target?.result as string);
        }
        setIsUploading(false);
      };
      img.onerror = () => {
        setAvatarUrl(event.target?.result as string);
        setIsUploading(false);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setUploadError('خطا در خواندن فایل تصویر.');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateRandomAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(2, 9);
    setCustomSeed(randomSeed);
    setAvatarUrl(`https://api.dicebear.com/7.x/${selectedStyle}/svg?seed=${randomSeed}`);
  };

  const handleStyleChange = (styleId: string) => {
    setSelectedStyle(styleId);
    setAvatarUrl(`https://api.dicebear.com/7.x/${styleId}/svg?seed=${customSeed}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      firstName,
      lastName,
      teamspeakName,
      email,
      avatarUrl,
      bio,
      discordTag,
      steamId,
      phoneNumber,
    });

    setIsSavedSuccess(true);
    setTimeout(() => {
      setIsSavedSuccess(false);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn dir-rtl text-right">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="relative px-6 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-500/10 border border-sky-500/30 rounded-2xl text-sky-400">
              <UserIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-100 flex items-center gap-2">
                تنظیمات پروفایل و عکس کاربری (Profile & Photo Settings)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                تغییر و بارگذاری عکس پروفایل، اطلاعات شخصی، آی‌دی‌های گیمینگ و بیوگرافی.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 no-scrollbar">
          {/* Active User Summary & Profile Picture Main Card */}
          <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-5 relative overflow-hidden">
            <div className="flex items-center gap-4 min-w-0">
              {/* Avatar Preview with Direct Upload Badge */}
              <div className="relative shrink-0 group">
                <img
                  src={avatarUrl}
                  alt={currentUser.username}
                  className="w-20 h-20 rounded-2xl bg-slate-900 border-2 border-sky-500/50 object-cover shadow-xl group-hover:border-sky-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="تغییر عکس پروفایل از کامپیوتر یا گوشی"
                  className="absolute -bottom-1 -right-1 p-2 bg-sky-400 hover:bg-sky-300 text-slate-950 rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center border-2 border-slate-950"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-extrabold text-slate-100">
                    {firstName} {lastName}
                  </h3>
                  <RoleBadge role={currentUser.role} size="sm" />
                </div>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  @{currentUser.username} • TS: {teamspeakName}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1.5">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> تاریخ عضویت: {currentUser.registrationDate}
                  </span>
                  <span>•</span>
                  <span className="text-emerald-400 font-semibold">حساب {currentUser.status}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <RoleButton role={currentUser.role} variant="glow" showRankDot className="text-xs px-3 py-1.5">
                رنک {currentUser.role}
              </RoleButton>
              <div className="text-[10px] text-slate-400 font-mono">
                سطح دسترسی: <span className="text-slate-200 font-semibold">{currentUser.permissionLevel}</span>
              </div>
            </div>
          </div>

          {/* Last Submitted Activity Report Timestamp Banner */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-sky-500/10 border border-sky-500/30 text-sky-400 rounded-xl shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-slate-200 flex items-center gap-2">
                  <span>آخرین فعالیت ثبت‌شده (Last Activity Timestamp):</span>
                  {latestReport && (
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                        latestReport.status === 'Approved'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : latestReport.status === 'Rejected'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {latestReport.status === 'Approved'
                        ? 'تایید شده'
                        : latestReport.status === 'Rejected'
                        ? 'رد شده'
                        : 'در انتظار بررسی'}
                    </span>
                  )}
                </div>

                {latestReport ? (
                  <div className="text-xs text-slate-300 mt-1 space-y-0.5">
                    <p className="font-semibold text-sky-300">
                      📅 تاریخ شیفت: {latestReport.date} | ⏱️ ساعت {latestReport.loginTime} تا {latestReport.logoutTime} ({latestReport.totalHours} ساعت کارکرد)
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      زمان دقیق ارسال در سامانه: {new Date(latestReport.createdAt).toLocaleDateString('fa-IR')} - ساعت {new Date(latestReport.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 mt-0.5">
                    هنوز هیچ گزارش فعالیتی توسط شما در سامانه ثبت نشده است.
                  </p>
                )}
              </div>
            </div>

            {latestReport && (
              <div className="text-left shrink-0 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400">تعداد کل گزارشات شما:</div>
                <div className="text-xs font-black text-emerald-400">{userReports.length} شیفت ثبت‌شده</div>
              </div>
            )}
          </div>

          {/* Profile Edit Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Upload / Selector Section */}
            <div className="p-5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <label className="text-xs font-black text-sky-400 uppercase tracking-wider flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-sky-400" />
                  <span>تنظیم عکس پروفایل (Profile Picture & Avatar)</span>
                </label>
                <span className="text-[10px] text-slate-400">عکس دلخواه آپلود کنید یا آواتار بپوشید</span>
              </div>

              {/* Avatar Source Tabs */}
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setAvatarTab('upload')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all border cursor-pointer ${
                    avatarTab === 'upload'
                      ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md shadow-sky-500/20'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" /> آپلود عکس از دستگاه
                </button>

                <button
                  type="button"
                  onClick={() => setAvatarTab('generator')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all border cursor-pointer ${
                    avatarTab === 'generator'
                      ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md shadow-sky-500/20'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" /> ساخت آواتار هوشمند
                </button>

                <button
                  type="button"
                  onClick={() => setAvatarTab('preset')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all border cursor-pointer ${
                    avatarTab === 'preset'
                      ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md shadow-sky-500/20'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <FileImage className="w-3.5 h-3.5" /> آواتارهای آماده
                </button>

                <button
                  type="button"
                  onClick={() => setAvatarTab('url')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all border cursor-pointer ${
                    avatarTab === 'url'
                      ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md shadow-sky-500/20'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Link className="w-3.5 h-3.5" /> لینک تصویر
                </button>
              </div>

              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />

              {/* TAB 1: Direct File Upload */}
              {avatarTab === 'upload' && (
                <div className="space-y-3 pt-2">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-6 border-2 border-dashed border-sky-500/40 hover:border-sky-400 bg-sky-500/5 hover:bg-sky-500/10 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
                  >
                    <div className="p-3 bg-sky-500/20 text-sky-400 rounded-2xl group-hover:scale-110 transition-transform mb-2">
                      <Camera className="w-8 h-8" />
                    </div>
                    <div className="text-sm font-extrabold text-slate-100">
                      انتخاب یا رها کردن فایل عکس از دستگاه
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      فرمت‌های پشتیبانی شده: JPG, PNG, WEBP, GIF (حداکثر حجم ۸ مگابایت)
                    </p>
                    <button
                      type="button"
                      className="mt-3 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all pointer-events-none"
                    >
                      مرور فایل‌های کامپیوتر یا گوشی
                    </button>
                  </div>

                  {isUploading && (
                    <div className="text-xs text-sky-400 font-bold flex items-center justify-center gap-2 py-2">
                      <RefreshCw className="w-4 h-4 animate-spin" /> در حال پردازش و بهینه‌سازی تصویر...
                    </div>
                  )}

                  {uploadError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{uploadError}</span>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: DiceBear Generator */}
              {avatarTab === 'generator' && (
                <div className="space-y-3 pt-2">
                  <div className="text-xs font-bold text-slate-300">سبک آواتار مورد نظر خود را انتخاب کنید:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {AVATAR_STYLES.map((style) => (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => handleStyleChange(style.id)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all border cursor-pointer ${
                          selectedStyle === style.id
                            ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {style.name}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="نام یا کلمه کلیدی آواتار..."
                      value={customSeed}
                      onChange={(e) => {
                        setCustomSeed(e.target.value);
                        setAvatarUrl(`https://api.dicebear.com/7.x/${selectedStyle}/svg?seed=${e.target.value}`);
                      }}
                      className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-sky-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateRandomAvatar}
                      className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow transition-all cursor-pointer shrink-0"
                    >
                      <RefreshCw className="w-4 h-4" /> ساخت تصادفی
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: Presets */}
              {avatarTab === 'preset' && (
                <div className="pt-2 space-y-2">
                  <div className="text-xs font-bold text-slate-300">آواتارهای آماده برای اعضای کادر:</div>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
                    {PRESET_AVATARS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAvatarUrl(preset)}
                        className={`p-1.5 rounded-2xl border transition-all cursor-pointer ${
                          avatarUrl === preset
                            ? 'border-sky-400 bg-sky-500/20 shadow-lg shadow-sky-500/20 scale-105'
                            : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                        }`}
                      >
                        <img src={preset} alt="preset" className="w-full h-12 object-cover rounded-xl" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: Direct URL */}
              {avatarTab === 'url' && (
                <div className="pt-2 space-y-2">
                  <div className="text-xs font-bold text-slate-300">لینک مستقیم تصویر آنلاین (Image URL):</div>
                  <input
                    type="url"
                    placeholder="https://example.com/my-photo.jpg"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-sky-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-400">
                    می‌توانید آدرس هر عکسی که در اینترنت آپلود کرده‌اید را در اینجا وارد نمایید.
                  </p>
                </div>
              )}
            </div>

            {/* Personal Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  نام (First Name)
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute right-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full pr-9 pl-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-sky-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  نام خانوادگی (Last Name)
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute right-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full pr-9 pl-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-sky-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  نام در تیم‌اسپیک (TeamSpeak Nickname)
                </label>
                <div className="relative">
                  <Headphones className="w-4 h-4 absolute right-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={teamspeakName}
                    onChange={(e) => setTeamspeakName(e.target.value)}
                    className="w-full pr-9 pl-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-sky-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  آدرس ایمیل (Email Address)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute right-3 top-2.5 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pr-9 pl-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-sky-500 transition-all font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Social & Gaming Tags */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  آیدی دیسکورد (Discord)
                </label>
                <div className="relative">
                  <MessageSquare className="w-4 h-4 absolute right-3 top-2.5 text-indigo-400" />
                  <input
                    type="text"
                    placeholder="مثلاً: amin_j"
                    value={discordTag}
                    onChange={(e) => setDiscordTag(e.target.value)}
                    className="w-full pr-9 pl-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-all font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Bio / Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                درباره من / بیوگرافی (About Me / Bio)
              </label>
              <textarea
                rows={3}
                placeholder="توضیحات کوتاه درباره خودتان، مسئولیت‌ها در تیم Caspian یا زمان‌بندی حضور..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-sky-500 transition-all resize-none"
              />
            </div>

            {/* Save Action */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              {isSavedSuccess ? (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 animate-fadeIn">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>اطلاعات و عکس پروفایل با موفقیت بروزرسانی شد!</span>
                </div>
              ) : (
                <div className="text-xs text-slate-400">
                  برای اعمال تغییرات روی دکمه ذخیره پروفایل کلیک کنید.
                </div>
              )}

              <button
                type="submit"
                className="px-6 py-2.5 bg-sky-400 hover:bg-sky-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-sky-400/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" /> ذخیره تغییرات پروفایل
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
