import React from 'react';
import {
  X,
  Sparkles,
  ArrowRight,
  Crown,
  HeartHandshake,
  ShieldCheck,
  FileText,
  Radio,
  Users,
  Award,
} from 'lucide-react';
import { User } from '../types';
import { RoleBadge } from './RoleBadge';

interface LoginAnnouncementModalProps {
  currentUser: User | null;
  onClose: () => void;
}

export const LoginAnnouncementModal: React.FC<LoginAnnouncementModalProps> = ({
  currentUser,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn dir-rtl">
      <div className="relative w-full max-w-xl bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl shadow-amber-500/25 overflow-hidden text-right">
        
        {/* Top Decorative Founder Header Banner */}
        <div className="p-6 bg-gradient-to-r from-amber-500/30 via-slate-900 to-amber-600/20 border-b border-amber-500/30 relative">
          <button
            onClick={onClose}
            className="absolute left-4 top-4 p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 rounded-xl transition-all"
            title="بستن پنل"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-amber-500/20 border border-amber-500/50 text-amber-300 rounded-2xl shadow-lg shadow-amber-500/20 shrink-0">
              <Crown className="w-8 h-8 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                پیام و خوش‌آمدگویی رسمی فاندر سرور
              </div>
              <h2 className="text-xl font-black text-slate-100">
                به سامانه مدیریت Caspian Staff خوش آمدید
              </h2>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto custom-scrollbar">
          
          {/* Personalized Founder Welcome Card */}
          <div className="p-4 bg-gradient-to-br from-amber-500/15 via-slate-950/95 to-indigo-950/40 border border-amber-500/35 rounded-2xl space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-amber-400" />
                <span className="text-sm font-black text-amber-300">
                  خوش آمدید {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'همکار گرامی'}!
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/40 px-3 py-1 rounded-full">
                <span className="text-[11px] font-black text-amber-200">فاندر سرور: بهنام بهرامیان</span>
                <RoleBadge role="Founder" size="xs" />
              </div>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed font-medium pt-1">
              سلام و درود خدمت شما. به سامانه جامع ارزیابی، مدیریت و ثبت فعالیت کادر سرور کاسپین خوش آمدید. تلاش، نظم و تعهد شما سرلوحه پیشرفت سرور ماست. تمامی گزارش‌ها و عملکرد شما به صورت دقیق بررسی و ارزش‌گذاری می‌شود.
            </p>
          </div>

          {/* Key Founder Guidelines & Reminders */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
            <div className="text-xs font-black text-amber-300 flex items-center gap-2 border-b border-slate-800/80 pb-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              دستورالعمل‌ها و نکات مهم کادر مدیریت:
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300">
              <div className="flex items-start gap-2 p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
                <FileText className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-200 block mb-0.5">ثبت گزارش کار روزانه:</span>
                  گزارش فعالیت‌های روزانه خود را قبل از پایان روز ثبت نمایید.
                </div>
              </div>

              <div className="flex items-start gap-2 p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
                <Radio className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-200 block mb-0.5">حضور در تیم‌اسپیک:</span>
                  حضور فعال و پاسخگویی محترمانه به اعضای سرور در چنل‌ها.
                </div>
              </div>

              <div className="flex items-start gap-2 p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
                <Users className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-200 block mb-0.5">رعایت سلسله مراتب:</span>
                  گزارش موارد به سرپرستان و مدیر ارشد (Amin Jodaie).
                </div>
              </div>

              <div className="flex items-start gap-2 p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
                <Award className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-200 block mb-0.5">پاداش و ارتقای رنک:</span>
                  ارتقای رنک بر اساس کیفیت عملکرد و فعالیت مستمر انجام می‌شود.
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="p-5 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5">
            <Crown className="w-4 h-4 text-amber-400" />
            مدیریت کل: بهنام بهرامیان (Founder)
          </div>

          <button
            onClick={onClose}
            className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl transition-all shadow-lg shadow-amber-500/25"
          >
            متوجه شدم و ورود به سامانه
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
