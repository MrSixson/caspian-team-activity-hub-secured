import React, { useState, useEffect } from 'react';
import {
  Upload,
  Clock,
  User,
  ShieldCheck,
  Calendar,
  Sparkles,
  Send,
  CheckCircle2,
  FileText,
  Trash2,
  AlertCircle,
  HelpCircle,
  Loader2,
} from 'lucide-react';
import { User as UserType, ActivityReport } from '../types';
import { RoleBadge } from './RoleBadge';
import { RoleButton } from './RoleButton';

interface DailyActivityFormProps {
  currentUser: UserType;
  onSubmitReport: (report: Omit<ActivityReport, 'id' | 'createdAt' | 'status'>) => void;
}

export const DailyActivityForm: React.FC<DailyActivityFormProps> = ({
  currentUser,
  onSubmitReport,
}) => {
  const [screenshot, setScreenshot] = useState<string>('');
  const [loginTime, setLoginTime] = useState<string>('14:00');
  const [logoutTime, setLogoutTime] = useState<string>('18:30');
  const [totalHours, setTotalHours] = useState<number>(4.5);
  const [description, setDescription] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // AI polishing state
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Auto calculate total online hours
  useEffect(() => {
    if (!loginTime || !logoutTime) return;
    const [inH, inM] = loginTime.split(':').map(Number);
    const [outH, outM] = logoutTime.split(':').map(Number);

    let start = inH * 60 + inM;
    let end = outH * 60 + outM;

    if (end < start) {
      end += 24 * 60;
    }

    const diffMins = end - start;
    const hours = Math.max(0, parseFloat((diffMins / 60).toFixed(1)));
    setTotalHours(hours);
  }, [loginTime, logoutTime]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('لطفاً یک تصویر معتبر (PNG, JPG, WebP) آپلود کنید.');
      return;
    }

    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setScreenshot(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('لطفاً فایل تصویری معتبر آپلود کنید.');
      return;
    }
    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setScreenshot(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const appendTemplateText = (template: string) => {
    setDescription((prev) => (prev ? `${prev}\n• ${template}` : `• ${template}`));
  };

  const handlePolishWithAi = async () => {
    if (!description.trim()) {
      setErrorMsg('لطفاً ابتدا خلاصه‌ای از فعالیت‌های خود را تایپ کنید تا هوش مصنوعی آن را تنسیق کند.');
      return;
    }

    setIsAiLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/ai/generate-meeting-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `گزارش شیفت ${currentUser.firstName} ${currentUser.lastName}`,
          rawNotes: description,
        }),
      });

      const resData = await response.json();
      if (resData.success && resData.data?.summary) {
        setDescription(resData.data.summary);
      }
    } catch (err) {
      console.error('AI Polish Error:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!screenshot) {
      setErrorMsg('بارگذاری اسکرین‌شات تیم‌اسپیک جهت تایید شیفت الزامی است.');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('لطفاً شرح فعالیت‌های انجام‌شده در شیفت کاری را وارد کنید.');
      return;
    }

    const dateObj = new Date(selectedDate);
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    const month = monthNames[dateObj.getUTCMonth()];
    const year = dateObj.getUTCFullYear();

    onSubmitReport({
      userId: currentUser.id,
      username: currentUser.username,
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      role: currentUser.role,
      teamspeakScreenshot: screenshot,
      loginTime,
      logoutTime,
      totalHours,
      description,
      date: selectedDate,
      month,
      year,
    });

    setIsSuccess(true);
    setErrorMsg(null);
    setDescription('');
    setTimeout(() => setIsSuccess(false), 5000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 dir-rtl text-right">
      {/* Header Banner */}
      <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3.5 bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-2xl shadow-lg shadow-sky-500/10">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
              ثبت گزارش شیفت کاری روزانه (Shift Activity Log)
              <span className="text-xs px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-sky-400 font-semibold">
                ثبت رسمی
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              پس از اتمام شیفت آنلاین خود، اسکرین‌شات تیم‌اسپیک و گزارش جزئیات کارکرد را ثبت کنید.
            </p>
          </div>
        </div>
      </div>

      {isSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-sm flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold">گزارش شیفت کاری با موفقیت ثبت شد!</div>
              <p className="text-xs text-emerald-300/80">
                گزارش شما برای تایید در لیست <strong>در انتظار بررسی مدیریت</strong> قرار گرفت.
              </p>
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-sm flex items-center gap-3 animate-shake">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        {/* Read-Only Member Identity Row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              نام
            </label>
            <div className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
              <User className="w-4 h-4 text-sky-400" />
              {currentUser.firstName}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              نام خانوادگی
            </label>
            <div className="text-sm font-semibold text-slate-200">{currentUser.lastName}</div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              نام کاربری
            </label>
            <div className="text-sm font-mono text-sky-400">@{currentUser.username}</div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              رنک فعلی
            </label>
            <RoleBadge role={currentUser.role} size="xs" />
          </div>
        </div>

        {/* Date and Time Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-sky-400" /> تاریخ شیفت
            </label>
            <input
              type="date"
              required
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-400" /> زمان ورود (Start)
            </label>
            <input
              type="time"
              required
              value={loginTime}
              onChange={(e) => setLoginTime(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-rose-400" /> زمان خروج (End)
            </label>
            <input
              type="time"
              required
              value={logoutTime}
              onChange={(e) => setLogoutTime(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" /> کارکرد محاسبه‌شده
            </label>
            <div className="w-full px-3.5 py-2.5 bg-slate-950 border border-sky-500/40 rounded-xl text-sky-400 font-black text-sm flex items-center justify-between">
              <span>{totalHours} ساعت</span>
              <span className="text-[10px] font-normal text-slate-500">خودکار</span>
            </div>
          </div>
        </div>

        {/* TeamSpeak Screenshot Upload Section */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-sky-400" /> اسکرین‌شات تیم‌اسپیک (الزامی)
            </span>
            <span className="text-[11px] text-amber-400">باید چنل آنلاین بودن را نشان دهد</span>
          </label>

          {screenshot ? (
            <div className="relative group rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 max-h-64 flex items-center justify-center p-2">
              <img
                src={screenshot}
                alt="Uploaded TS Verification"
                className="max-h-60 rounded-xl object-contain"
              />
              <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setScreenshot('')}
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" /> حذف اسکرین‌شات
                </button>
              </div>
            </div>
          ) : (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-slate-800 hover:border-sky-500/60 bg-slate-950/60 hover:bg-slate-900/80 rounded-2xl p-8 text-center transition-all cursor-pointer group"
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="ts-screenshot-upload"
              />
              <label htmlFor="ts-screenshot-upload" className="cursor-pointer space-y-3 block">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-200">
                    برای آپلود کلیک کنید یا اسکرین‌شات تیم‌اسپیک را کشیده و رها کنید
                  </div>
                  <p className="text-xs text-slate-500 mt-1">فرمت‌های تصویری PNG, JPG, WebP پشتیبانی می‌شوند</p>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Activity Editor */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-sky-400" />
              در طول این شیفت چه فعالیت‌هایی انجام دادید؟
            </label>
            <button
              type="button"
              onClick={handlePolishWithAi}
              disabled={isAiLoading}
              className="text-xs font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-3 py-1 rounded-xl flex items-center gap-1 transition-all cursor-pointer"
            >
              {isAiLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              )}
              بهینه‌سازی با Gemini AI
            </button>
          </div>

          {/* Quick Preset Badges */}
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-[10px] text-slate-500 font-semibold self-center">درج سریع:</span>
            <button
              type="button"
              onClick={() => appendTemplateText('پاسخگویی به تیکت‌های پشتیبانی کاربران در تیم‌اسپیک')}
              className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-lg transition-colors border border-slate-700 cursor-pointer"
            >
              + پاسخ به تیکت‌ها
            </button>
            <button
              type="button"
              onClick={() => appendTemplateText('نظارت بر عملکرد اعضا و برقراری نظم فکشن‌ها')}
              className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg transition-colors border border-slate-700 cursor-pointer"
            >
              + نظارت بر فکشن‌ها
            </button>
            <button
              type="button"
              onClick={() => appendTemplateText('کنترل چنل‌های عمومی تیم‌اسپیک و رسیدگی به شکایات')}
              className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-lg transition-colors border border-slate-700 cursor-pointer"
            >
              + نظارت چنل عمومی
            </button>
            <button
              type="button"
              onClick={() => appendTemplateText('آموزش و بررسی عملکرد هلپرها و کادر جدید')}
              className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg transition-colors border border-slate-700 cursor-pointer"
            >
              + آموزش هلپرها
            </button>
          </div>

          <textarea
            required
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="شرح کامل کارکرد، تیکت‌ها، ایونت‌ها و نظارت انجام شده در شیفت..."
            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-100 text-sm focus:outline-none focus:border-sky-500 transition-all placeholder:text-slate-600 resize-y"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex justify-end">
          <RoleButton
            role={currentUser.role}
            variant="solid"
            type="submit"
            className="flex items-center gap-2 px-8 py-3 font-extrabold text-sm rounded-2xl shadow-xl cursor-pointer"
            showRankDot
          >
            <Send className="w-4 h-4" /> ثبت گزارش شیفت ({currentUser.role})
          </RoleButton>
        </div>
      </form>
    </div>
  );
};
