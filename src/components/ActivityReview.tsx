import React, { useState } from 'react';
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  MessageSquare,
  Search,
  Download,
  Calendar,
  Clock,
  User as UserIcon,
  Sparkles,
  Loader2,
  FileSpreadsheet,
  Award,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { ActivityReport, User } from '../types';
import { RoleBadge } from './RoleBadge';
import { toJalaliDate } from '../lib/jalali';

interface ActivityReviewProps {
  currentUser: User;
  reports: ActivityReport[];
  onApprove: (reportId: string, comment?: string) => void;
  onReject: (reportId: string, comment?: string) => void;
  onComment: (reportId: string, comment: string) => void;
  onDelete: (reportId: string) => void;
  onOpenScreenshot: (report: ActivityReport) => void;
}

interface AiAuditResult {
  rating: string;
  recommendation: string;
  feedback: string;
  keyHighlights?: string[];
}

export const ActivityReview: React.FC<ActivityReviewProps> = ({
  reports,
  onApprove,
  onReject,
  onComment,
  onDelete,
  onOpenScreenshot,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<string>('');

  // AI Audit State per report ID
  const [aiAudits, setAiAudits] = useState<Record<string, AiAuditResult>>({});
  const [aiLoadingId, setAiLoadingId] = useState<string | null>(null);

  const filteredReports = reports.filter((r) => {
    const matchesStatus = filterStatus === 'All' || r.status === filterStatus;
    const matchesSearch =
      r.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${r.firstName} ${r.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleAuditWithAi = async (report: ActivityReport) => {
    setAiLoadingId(report.id);
    try {
      const response = await fetch('/api/ai/audit-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: `${report.firstName} ${report.lastName} (@${report.username})`,
          role: report.role,
          hours: report.totalHours,
          loginTime: report.loginTime,
          logoutTime: report.logoutTime,
          description: report.description,
        }),
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        setAiAudits((prev) => ({ ...prev, [report.id]: resData.data }));
      }
    } catch (err) {
      console.error('AI Audit Error:', err);
    } finally {
      setAiLoadingId(null);
    }
  };

  const handleDownload = (report: ActivityReport) => {
    const link = document.createElement('a');
    link.href = report.teamspeakScreenshot;
    link.download = `TS_Screenshot_${report.username}_${report.date}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToCSV = () => {
    const headers = ['نام و نام خانوادگی', 'نام کاربری', 'رنک', 'تاریخ', 'ورود', 'خروج', 'ساعات آنلاین', 'وضعیت', 'توضیحات'];
    const rows = filteredReports.map((r) => [
      `${r.firstName} ${r.lastName}`,
      r.username,
      r.role,
      r.date,
      r.loginTime,
      r.logoutTime,
      r.totalHours,
      r.status,
      `"${r.description.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Caspian_Shift_Reports_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const submitComment = (reportId: string) => {
    if (!commentText.trim()) return;
    onComment(reportId, commentText);
    setActiveCommentId(null);
    setCommentText('');
  };

  // Stats Calculations
  const totalHours = reports.reduce((acc, r) => acc + (Number(r.totalHours) || 0), 0);
  const pendingCount = reports.filter((r) => r.status === 'Pending').length;
  const approvedCount = reports.filter((r) => r.status === 'Approved').length;
  const rejectionCount = reports.filter((r) => r.status === 'Rejected').length;

  return (
    <div className="space-y-6 dir-rtl text-right">
      {/* Header Banner */}
      <div className="p-6 md:p-8 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 rounded-3xl backdrop-blur-xl shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl shadow-lg shadow-emerald-500/10">
              <CheckSquare className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-100 flex items-center gap-2">
                بررسی و تایید گزارشات فعالیت شیفت (Shift Verification)
                <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold">
                  مدیریت کادر
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                بررسی اسکرین‌شات‌های تیم‌اسپیک، ارزیابی ساعات آنلاین بودن اعضا و تایید یا رد گزارشات همراه با ممیزی هوش مصنوعی.
              </p>
            </div>
          </div>

          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs rounded-2xl border border-slate-700 transition-all cursor-pointer shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4" />
            خروجی اکسل / CSV گزارش‌ها
          </button>
        </div>

        {/* Analytics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800">
          <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-2xl">
            <div className="text-[11px] text-slate-400 font-medium">مجموع ساعات شیفت آنلاین</div>
            <div className="text-lg font-black text-sky-400">{totalHours} ساعت</div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-2xl">
            <div className="text-[11px] text-slate-400 font-medium">در انتظار بررسی</div>
            <div className="text-lg font-black text-amber-400">{pendingCount} گزارش</div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-2xl">
            <div className="text-[11px] text-slate-400 font-medium">گزارشات تایید شده</div>
            <div className="text-lg font-black text-emerald-400">{approvedCount} مورد</div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-2xl">
            <div className="text-[11px] text-slate-400 font-medium">گزارشات رد شده</div>
            <div className="text-lg font-black text-rose-400">{rejectionCount} مورد</div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="جستجو بر اساس اسم، نام کاربری، رنک یا توضیحات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs shrink-0">
            {['All', 'Pending', 'Approved', 'Rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 font-semibold rounded-lg transition-all cursor-pointer ${
                  filterStatus === status
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {status === 'All' ? 'همه' : status === 'Pending' ? 'در انتظار' : status === 'Approved' ? 'تایید شده' : 'رد شده'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl text-slate-500 text-sm">
            <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-30 text-emerald-400" />
            هیچ گزارش فعالیتی با فیلترهای انتخابی یافت نشد.
          </div>
        ) : (
          filteredReports.map((report) => {
            const aiAudit = aiAudits[report.id];
            const isAuditing = aiLoadingId === report.id;

            return (
              <div
                key={report.id}
                className={`p-6 bg-slate-900/90 border rounded-3xl backdrop-blur-xl shadow-xl transition-all ${
                  report.status === 'Approved'
                    ? 'border-emerald-500/30 shadow-emerald-500/5'
                    : report.status === 'Rejected'
                    ? 'border-rose-500/30 shadow-rose-500/5'
                    : 'border-amber-500/40 shadow-amber-500/5'
                }`}
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  {/* User Info & Shift Meta */}
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div
                      onClick={() => onOpenScreenshot(report)}
                      className="relative group w-24 h-24 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 cursor-pointer shadow-md"
                    >
                      <img
                        src={report.teamspeakScreenshot}
                        alt="TS Thumbnail"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      />
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Eye className="w-5 h-5 text-sky-400" />
                      </div>
                    </div>

                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-black text-slate-100 flex items-center gap-1.5">
                          <UserIcon className="w-4 h-4 text-sky-400" />
                          {report.firstName} {report.lastName}
                        </h3>
                        <span className="text-xs font-mono text-sky-400 font-semibold">
                          @{report.username}
                        </span>
                        <RoleBadge role={report.role} size="xs" />
                        <span
                          className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                            report.status === 'Approved'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : report.status === 'Rejected'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {report.status === 'Approved' ? 'تایید شده' : report.status === 'Rejected' ? 'رد شده' : 'در انتظار بررسی'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1 font-semibold text-slate-200">
                          <Calendar className="w-3.5 h-3.5 text-sky-400" /> {toJalaliDate(report.date)} ({report.month} {report.year})
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" /> {report.loginTime} - {report.logoutTime}
                        </span>
                        <span className="font-extrabold text-sky-400">
                          مجموع: {report.totalHours} ساعت شیفت آنلاین
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 leading-relaxed mt-2 whitespace-pre-line">
                        {report.description}
                      </p>

                      {/* AI Audit Box */}
                      {aiAudit && (
                        <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-sky-500/10 border border-amber-500/30 rounded-2xl p-3.5 space-y-1.5 mt-2 animate-fadeIn">
                          <div className="flex items-center justify-between text-xs font-black">
                            <span className="flex items-center gap-1.5 text-amber-300">
                              <Sparkles className="w-4 h-4 text-amber-400" /> ممیزی و تحلیل Gemini AI:
                            </span>
                            <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 text-amber-200 rounded-lg text-[10px]">
                              کیفیت: {aiAudit.rating} | {aiAudit.recommendation}
                            </span>
                          </div>
                          <p className="text-xs text-slate-200 font-medium leading-relaxed">
                            {aiAudit.feedback}
                          </p>
                          {aiAudit.keyHighlights && aiAudit.keyHighlights.length > 0 && (
                            <div className="text-[11px] text-slate-400 flex flex-wrap gap-2 pt-1">
                              {aiAudit.keyHighlights.map((kh, idx) => (
                                <span key={idx} className="bg-slate-950/80 border border-slate-800 px-2 py-0.5 rounded-md text-emerald-300">
                                  ✓ {kh}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {report.reviewerComment && (
                        <div className="text-xs text-indigo-300 bg-indigo-500/10 p-2.5 rounded-xl border border-indigo-500/20 mt-2">
                          <strong>نظر مدیر ({report.reviewerName}):</strong> {report.reviewerComment}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Review Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleAuditWithAi(report)}
                      disabled={isAuditing}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl transition-all cursor-pointer"
                    >
                      {isAuditing ? (
                        <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-amber-400" />
                      )}
                      ممیزی AI
                    </button>

                    <button
                      onClick={() => onOpenScreenshot(report)}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
                    >
                      <Eye className="w-4 h-4 text-sky-400" /> تصویر
                    </button>

                    <button
                      onClick={() => handleDownload(report)}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-slate-400" /> دانلود
                    </button>

                    <button
                      onClick={() => {
                        setActiveCommentId(activeCommentId === report.id ? null : report.id);
                        setCommentText(report.reviewerComment || '');
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-xl transition-all cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4" /> نظر
                    </button>

                    <button
                      onClick={() => onApprove(report.id)}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-lg shadow-emerald-400/20 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" /> تایید
                    </button>

                    <button
                      onClick={() => onReject(report.id)}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-rose-400 hover:bg-rose-300 rounded-xl shadow-lg shadow-rose-400/20 transition-all cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" /> رد
                    </button>

                    <button
                      onClick={() => onDelete(report.id)}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                      title="حذف گزارش"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Inline Comment Box */}
                {activeCommentId === report.id && (
                  <div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-2 animate-fadeIn">
                    <input
                      type="text"
                      placeholder="متن بازخورد یا یادداشت مدیر را وارد کنید..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-sky-500"
                    />
                    <button
                      onClick={() => submitComment(report.id)}
                      className="px-4 py-2 text-xs font-bold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-xl transition-all cursor-pointer"
                    >
                      ثبت نظر
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
