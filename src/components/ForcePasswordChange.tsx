import React, { useState } from 'react';
import { KeyRound, ShieldAlert, Eye, EyeOff, Loader2 } from 'lucide-react';
import { changePassword } from '../lib/api';

interface ForcePasswordChangeProps {
  /** Shown when the server flags the account with `mustChangePassword`. */
  onCompleted: () => void;
  onLogout: () => void;
  displayName: string;
}

/**
 * Blocking screen for accounts whose credential is known to be compromised
 * (migrated from the old plaintext store) or was just reset by an admin.
 * The old password must be supplied, so a hijacked session cannot silently
 * take ownership of the account.
 */
export const ForcePasswordChange: React.FC<ForcePasswordChangeProps> = ({
  onCompleted,
  onLogout,
  displayName,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError(null);

    if (newPassword.length < 8) {
      setError('رمز عبور جدید باید حداقل ۸ کاراکتر باشد.');
      return;
    }
    if (!/[0-9]/.test(newPassword) || !/[a-zA-Z\u0600-\u06FF]/.test(newPassword)) {
      setError('رمز عبور جدید باید حداقل شامل یک حرف و یک عدد باشد.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('رمز عبور جدید و تکرار آن یکسان نیستند.');
      return;
    }

    setBusy(true);
    const result = await changePassword(currentPassword, newPassword);
    setBusy(false);

    // Never keep the typed values in component state.
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');

    if (!result.success) {
      setError(result.error || 'تغییر رمز عبور ناموفق بود.');
      return;
    }
    onCompleted();
  };

  const inputType = showPasswords ? 'text' : 'password';

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-slate-900 border border-amber-700/40 rounded-2xl shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-500/10 border border-amber-600/40 rounded-xl">
            <ShieldAlert className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">تغییر اجباری رمز عبور</h2>
            <p className="text-[11px] text-slate-400">{displayName}</p>
          </div>
        </div>

        <p className="text-xs leading-6 text-slate-300 bg-slate-950/60 border border-slate-800 rounded-xl p-3 mb-5">
          رمز عبور فعلی این حساب یا توسط مدیریت بازنشانی شده یا در نسخه‌های قبلی سامانه به صورت
          متن ساده ذخیره می‌شده است. برای ادامه، لطفاً یک رمز عبور جدید و اختصاصی انتخاب کنید.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1.5">رمز عبور فعلی</label>
            <input
              type={inputType}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full bg-slate-950 border border-slate-800 focus:border-sky-600 rounded-xl px-3 py-2.5 text-sm text-slate-100 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1.5">رمز عبور جدید</label>
            <input
              type={inputType}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full bg-slate-950 border border-slate-800 focus:border-sky-600 rounded-xl px-3 py-2.5 text-sm text-slate-100 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1.5">تکرار رمز عبور جدید</label>
            <input
              type={inputType}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full bg-slate-950 border border-slate-800 focus:border-sky-600 rounded-xl px-3 py-2.5 text-sm text-slate-100 outline-none transition"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowPasswords((v) => !v)}
            className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-200 transition"
          >
            {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showPasswords ? 'پنهان کردن رمزها' : 'نمایش رمزها'}
          </button>

          {error && (
            <div className="text-[11px] text-red-300 bg-red-950/40 border border-red-900/50 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white font-bold rounded-xl py-2.5 text-sm transition"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            ثبت رمز عبور جدید
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="w-full text-[11px] text-slate-500 hover:text-slate-300 transition pt-1"
          >
            خروج از حساب
          </button>
        </form>
      </div>
    </div>
  );
};
