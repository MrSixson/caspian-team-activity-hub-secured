import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  User as UserIcon,
  Mail,
  Headphones,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  Shield,
  Clock,
  RefreshCw,
  Eye,
  EyeOff,
  UserCheck,
  AlertTriangle,
  UserPlus,
  LogIn,
  BadgeAlert,
} from 'lucide-react';
import { User, UserRole, ALL_ROLES } from '../types';
import { RoleBadge } from './RoleBadge';
import { RoleButton } from './RoleButton';
import { getRoleButtonStyle } from '../lib/roleColors';
import { getStoredUsers } from '../lib/storage';

interface LoginRegisterProps {
  /** Verified against the server — this component never inspects credentials itself. */
  onLogin: (username: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  onRegister: (data: {
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    email: string;
    teamspeakName: string;
  }) => Promise<{ success: boolean; error?: string; user?: User }>;
  allUsers: User[];
}

export const LoginRegister: React.FC<LoginRegisterProps> = ({ onLogin, onRegister, allUsers }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Login Form States
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Registration Form States
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regTeamspeakName, setRegTeamspeakName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Post-Registration / Pending Status View
  const [pendingApplicant, setPendingApplicant] = useState<{
    id?: string;
    username: string;
    firstName: string;
    lastName: string;
    teamspeakName: string;
    email: string;
    role: UserRole;
  } | null>(null);

  const [isCheckingApproval, setIsCheckingApproval] = useState(false);
  const [approvalConfirmed, setApprovalConfirmed] = useState(false);

  // Auto-polling for approval when applicant is in pending screen
  useEffect(() => {
    if (!pendingApplicant || approvalConfirmed) return;

    const interval = setInterval(() => {
      checkLiveApproval(false);
    }, 2500);

    return () => clearInterval(interval);
  }, [pendingApplicant, approvalConfirmed]);

  const checkLiveApproval = (manualClick = false) => {
    if (!pendingApplicant) return;
    if (manualClick) setIsCheckingApproval(true);

    try {
      const freshUsers = getStoredUsers();
      const current = freshUsers.find(
        (u) =>
          u.username.toLowerCase() === pendingApplicant.username.toLowerCase() ||
          (pendingApplicant.id && u.id === pendingApplicant.id)
      );

      if (current && current.status === 'Active') {
        setApprovalConfirmed(true);
        // SECURITY: no cached password, no silent re-login. The user
        // authenticates again through the normal form.
        setSuccessMsg(
          `تبریک! درخواست عضویت شما با رنک «${current.role}» تایید شد. اکنون می‌توانید وارد شوید.`
        );
      } else if (manualClick) {
        setError('درخواست شما هنوز در وضعیت انتظار است. به محض تایید توسط مدیریت، به طور خودکار وارد خواهید شد.');
        setTimeout(() => setError(null), 4000);
      }
    } catch (e) {
      console.error('Error checking approval', e);
    } finally {
      if (manualClick) {
        setTimeout(() => setIsCheckingApproval(false), 500);
      }
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setError(null);
    setSuccessMsg(null);

    const cleanUsername = loginUsername.trim();
    if (!cleanUsername || !loginPassword) {
      setError('لطفاً نام کاربری و رمز عبور را وارد کنید.');
      setIsLoggingIn(false);
      return;
    }

    const result = await onLogin(cleanUsername, loginPassword);
    // The password is dropped from component state as soon as it has been used.
    setLoginPassword('');
    if (!result.success) {
      setError(result.error || 'اطلاعات ورود نامعتبر است.');
      // Check if user is pending to offer live tracking
      const fresh = getStoredUsers();
      const foundUser = fresh.find(
        (u) =>
          u.username.toLowerCase() === cleanUsername.toLowerCase() ||
          (u.email && u.email.toLowerCase() === cleanUsername.toLowerCase())
      );
      if (foundUser && foundUser.status === 'Pending') {
        setPendingApplicant({
          id: foundUser.id,
          username: foundUser.username,
          firstName: foundUser.firstName,
          lastName: foundUser.lastName,
          teamspeakName: foundUser.teamspeakName,
          email: foundUser.email,
          role: foundUser.role,
        });
      }
    }
    setIsLoggingIn(false);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegistering) return;
    setIsRegistering(true);
    setError(null);
    setSuccessMsg(null);

    const cleanFirst = regFirstName.trim();
    const cleanLast = regLastName.trim();
    const cleanUser = regUsername.trim();
    const cleanEmail = regEmail.trim();
    const cleanTS = regTeamspeakName.trim();

    if (!cleanFirst || !cleanLast || !cleanUser || !cleanEmail || !cleanTS || !regPassword) {
      setError('لطفاً تمام فیلدهای ستاره‌دار را تکمیل کنید.');
      setIsRegistering(false);
      return;
    }

    if (cleanUser.length < 3) {
      setError('نام کاربری باید حداقل ۳ کاراکتر باشد.');
      setIsRegistering(false);
      return;
    }

    // Mirrors the server policy in server/security.ts.
    if (regPassword.length < 8) {
      setError('رمز عبور باید حداقل ۸ کاراکتر باشد.');
      setIsRegistering(false);
      return;
    }

    if (!/[0-9]/.test(regPassword) || !/[a-zA-Z\u0600-\u06FF]/.test(regPassword)) {
      setError('رمز عبور باید حداقل شامل یک حرف و یک عدد باشد.');
      setIsRegistering(false);
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('رمز عبور و تکرار آن یکسان نیستند.');
      setIsRegistering(false);
      return;
    }

    const result = await onRegister({
      username: cleanUser,
      password: regPassword,
      firstName: cleanFirst,
      lastName: cleanLast,
      email: cleanEmail,
      teamspeakName: cleanTS,
    });

    // Clear the password from component state either way.
    setRegPassword('');
    setRegConfirmPassword('');

    if (!result.success) {
      setError(result.error || 'ثبت‌نام ناموفق بود. لطفاً مجدداً تلاش کنید.');
    } else {
      // The server creates every new account as Pending with the lowest rank.
      // There is no auto-login and no client-chosen role.
      setSuccessMsg(
        'ثبت‌نام شما ثبت شد. حساب پس از تایید مدیریت ارشد فعال می‌شود و سپس می‌توانید وارد شوید.'
      );
      if (result.user) {
        setPendingApplicant({
          id: result.user.id,
          username: result.user.username,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          teamspeakName: result.user.teamspeakName,
          email: result.user.email,
          role: result.user.role,
        });
      }
    }
    setIsRegistering(false);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans select-none">
      {/* Background Animated Glow Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-sky-600/15 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-blue-700/10 rounded-full blur-[130px] pointer-events-none"></div>
      <div className="absolute top-10 left-10 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[110px] pointer-events-none"></div>

      {/* Cyber Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>

      <div className="relative w-full max-w-lg z-10 my-8">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-slate-900/90 border border-slate-700/80 rounded-2xl shadow-2xl shadow-sky-500/10 mb-3 relative group">
            <div className="absolute -inset-2 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-500 rounded-2xl blur opacity-30 group-hover:opacity-70 transition duration-500"></div>
            <ShieldCheck className="w-10 h-10 text-sky-400 relative z-10" />
          </div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-sky-200 to-sky-400 tracking-tight">
            CASPIAN COMMUNITY
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            سامانه جامع مدیریت فعالیت و نظارت بر کادر اداری سرور
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-slate-900/85 border border-slate-800/90 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-2xl shadow-slate-950/90">
          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-start gap-2.5 animate-shake">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{error}</div>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="mb-5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{successMsg}</div>
            </div>
          )}

          {pendingApplicant ? (
            /* ========================================================================= */
            /* PENDING APPROVAL / LIVE STATUS TRACKER VIEW                                */
            /* ========================================================================= */
            <div className="space-y-5 text-right dir-rtl">
              <div className="p-5 bg-gradient-to-b from-amber-500/15 to-amber-950/30 border-2 border-amber-500/50 rounded-2xl text-center space-y-3 relative overflow-hidden">
                <div className="w-14 h-14 bg-amber-500/20 text-amber-300 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/40 shadow-lg">
                  {approvalConfirmed ? (
                    <CheckCircle2 className="w-7 h-7 text-emerald-400 animate-bounce" />
                  ) : (
                    <Clock className="w-7 h-7 animate-pulse text-amber-400" />
                  )}
                </div>

                <div>
                  <h3 className="text-base font-black text-amber-200">
                    {approvalConfirmed ? 'عضویت شما تایید گردید!' : 'درخواست عضویت شما در حال بررسی است'}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {approvalConfirmed
                      ? 'مدیریت ارشد عضویت شما را فعال کرد. خوش آمدید!'
                      : 'درخواست شما برای ۴ رنک اصلی (Founder, Owner, Supervisor, Moderator) ارسال گردید.'}
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-[11px] text-amber-300 font-bold">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                  <span>وضعیت: {approvalConfirmed ? 'فعال (تایید شده)' : 'در انتظار تایید مدیریت'}</span>
                </div>
              </div>

              {/* Applicant Details Summary Box */}
              <div className="bg-slate-950/90 p-4 rounded-2xl border border-slate-800 space-y-2.5 text-xs">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800/80">
                  خلاصه اطلاعات ارسالی شما:
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">نام و نام خانوادگی:</span>
                  <span className="font-bold text-white">{pendingApplicant.firstName} {pendingApplicant.lastName}</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">نام کاربری:</span>
                  <span className="font-mono text-amber-300">@{pendingApplicant.username}</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">تیم‌اسپیک:</span>
                  <span className="font-mono text-sky-300 font-bold">{pendingApplicant.teamspeakName}</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">رنک درخواستی:</span>
                  <RoleBadge role={pendingApplicant.role} size="xs" />
                </div>
              </div>

              {/* Live Status Re-check Actions */}
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => checkLiveApproval(true)}
                  disabled={isCheckingApproval || approvalConfirmed}
                  className="w-full py-3 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <RefreshCw className={`w-4 h-4 ${isCheckingApproval ? 'animate-spin' : ''}`} />
                  <span>{isCheckingApproval ? 'در حال بررسی...' : '🔄 استعلام لحظه‌ای تایید مدیریت'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPendingApplicant(null);
                    setActiveTab('login');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>بازگشت به صفحه ورود</span>
                </button>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* TAB SWITCHER: LOGIN VS REGISTER                                            */
            /* ========================================================================= */
            <div>
              {/* Tabs Switcher Bar */}
              <div className="flex items-center bg-slate-950 p-1.5 rounded-2xl border border-slate-800/80 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === 'login'
                      ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>ورود به حساب</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === 'register'
                      ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>ثبت‌نام و عضویت</span>
                </button>
              </div>

              {activeTab === 'login' ? (
                /* ===================================================================== */
                /* LOGIN FORM                                                            */
                /* ===================================================================== */
                <form onSubmit={handleLoginSubmit} className="space-y-4 text-right dir-rtl">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      نام کاربری یا ایمیل
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 absolute right-3.5 top-3.5 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        placeholder="نام کاربری خود را وارد کنید..."
                        className="w-full pr-10 pl-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-sky-500 transition-all placeholder:text-slate-600 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-bold text-slate-300">رمز عبور</label>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute right-3.5 top-3.5 text-slate-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pr-10 pl-10 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-sky-500 transition-all placeholder:text-slate-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-3 text-slate-500 hover:text-slate-300 transition-colors"
                        title={showPassword ? 'مخفی‌سازی رمز' : 'نمایش رمز'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full py-3 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-black rounded-xl shadow-lg shadow-sky-600/25 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                  >
                    <span>{isLoggingIn ? 'در حال ورود...' : 'ورود به سامانه کاسپین'}</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => setActiveTab('register')}
                      className="text-xs text-slate-400 hover:text-sky-400 transition-colors cursor-pointer"
                    >
                      عضو جدید هستید؟ <span className="font-bold text-sky-400 underline">ارسال درخواست عضویت جدید</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* ===================================================================== */
                /* REGISTRATION FORM                                                     */
                /* ===================================================================== */
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-right dir-rtl">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        نام <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={regFirstName}
                        onChange={(e) => setRegFirstName(e.target.value)}
                        placeholder="مثلاً: علی"
                        className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-sky-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        نام خانوادگی <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={regLastName}
                        onChange={(e) => setRegLastName(e.target.value)}
                        placeholder="مثلاً: رضایی"
                        className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-sky-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      نام کاربری انگلیسی (Username) <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <UserIcon className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        placeholder="Ali_Rezaei"
                        className="w-full pr-9 pl-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-sky-500 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        ایمیل معتبر <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-500" />
                        <input
                          type="email"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="ali@email.com"
                          className="w-full pr-9 pl-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-sky-500 transition-all font-mono text-[11px]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        نام در تیم‌اسپیک <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <Headphones className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-500" />
                        <input
                          type="text"
                          required
                          value={regTeamspeakName}
                          onChange={(e) => setRegTeamspeakName(e.target.value)}
                          placeholder="Ali_TS"
                          className="w-full pr-9 pl-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-sky-500 transition-all font-mono text-[11px]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Role Assignment Explanation Badge */}
                  <div className="p-3.5 bg-gradient-to-r from-sky-950/60 via-slate-900 to-indigo-950/60 border border-sky-500/30 rounded-2xl text-[11px] text-sky-200 leading-relaxed space-y-1.5 shadow-inner">
                    <div className="font-black flex items-center gap-1.5 text-sky-300">
                      <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                      <span>ثبت‌نام آزاد کادر و فعال‌سازی فوری</span>
                    </div>
                    <p className="text-slate-300 text-[11px]">
                      ثبت‌نام شما بدون معطلی فعال می‌شود و فوراً وارد سامانه می‌شوید. جهت حفظ امنیت و نظم سرور، رنک سازمانی شما در بخش <strong>«سامانه تیکت»</strong> توسط ۴ رنک اصلی مدیریت (Founder, Owner, Supervisor, Moderator) بررسی و ست خواهد شد.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        رمز عبور <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <KeyRound className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-500" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pr-9 pl-8 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-sky-500 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-2.5 top-2.5 text-slate-500 hover:text-slate-300"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        تکرار رمز عبور <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <KeyRound className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-500" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pr-9 pl-8 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-sky-500 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute left-2.5 top-2.5 text-slate-500 hover:text-slate-300"
                        >
                          {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isRegistering}
                    className="w-full py-3 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg shadow-sky-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{isRegistering ? 'در حال ایجاد حساب...' : 'ثبت‌نام و ورود مستقیم به سامانه'}</span>
                  </button>

                  <div className="text-center pt-1 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setActiveTab('login')}
                      className="text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      قبلاً ثبت‌نام کرده‌اید؟ <span className="text-sky-400 font-bold underline">ورود به حساب</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Security notice — quick login without a password has been removed. */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <div className="flex items-start gap-2 p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
              <Shield className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
              <p className="text-[11px] leading-5 text-slate-400">
                ورود سریع بدون رمز عبور حذف شده است. تمام حساب‌ها از طریق سرور و با رمز عبور
                اختصاصی خودشان احراز هویت می‌شوند. اگر رمز عبور خود را در اختیار ندارید، از مدیریت
                ارشد درخواست بازنشانی کنید.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
