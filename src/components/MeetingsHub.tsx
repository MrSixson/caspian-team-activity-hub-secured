import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  Search,
  CheckCircle2,
  FileText,
  Sparkles,
  FileCheck2,
  ExternalLink,
  Trash2,
  Crown,
  Share2,
  Copy,
  Printer,
  Loader2,
  Check,
  Radio,
  Edit3,
  Volume2,
  VolumeX,
  Play,
  Square,
  Lock,
  Megaphone,
} from 'lucide-react';
import {
  MeetingAnnouncement,
  MeetingReport,
  MeetingStatus,
  User as UserType,
} from '../types';
import { isTopFourRank } from '../lib/permissions';
import { RoleBadge } from './RoleBadge';
import { toJalaliDate } from '../lib/jalali';
import { playUiSound } from '../lib/audioFx';

interface MeetingsHubProps {
  currentUser: UserType | null;
  announcements: MeetingAnnouncement[];
  reports: MeetingReport[];
  allUsers: UserType[];
  onAddAnnouncement: (
    ann: Omit<MeetingAnnouncement, 'id' | 'createdAt' | 'createdById' | 'createdByName' | 'createdByRole' | 'status' | 'attendees'>
  ) => void;
  onUpdateAnnouncement?: (announcementId: string, updatedData: Partial<MeetingAnnouncement>) => void;
  onToggleRSVP: (announcementId: string) => void;
  onDeleteAnnouncement: (announcementId: string) => void;
  onAddReport: (
    rep: Omit<MeetingReport, 'id' | 'createdAt' | 'recordedById' | 'recordedByName' | 'recordedByRole'>
  ) => void;
  onUpdateReport?: (reportId: string, updatedData: Partial<MeetingReport>) => void;
  onDeleteReport: (reportId: string) => void;
  soundFx?: boolean;
}

export const MeetingsHub: React.FC<MeetingsHubProps> = ({
  currentUser,
  announcements,
  reports,
  allUsers,
  onAddAnnouncement,
  onUpdateAnnouncement,
  onToggleRSVP,
  onDeleteAnnouncement,
  onAddReport,
  onUpdateReport,
  onDeleteReport,
  soundFx = true,
}) => {
  const isTopFour = currentUser ? isTopFourRank(currentUser.role) : false;

  const [activeSubTab, setActiveSubTab] = useState<'announcements' | 'reports'>('announcements');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Upcoming' | 'Live' | 'Concluded'>('All');

  // Modals & Editing
  const [isAddAnnouncementOpen, setIsAddAnnouncementOpen] = useState(false);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);

  const [isAddReportOpen, setIsAddReportOpen] = useState(false);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);

  const [viewingReport, setViewingReport] = useState<MeetingReport | null>(null);

  // System Speech / Audio Reader State
  const [speechReport, setSpeechReport] = useState<MeetingReport | null>(null);
  const [isSpeechActive, setIsSpeechActive] = useState(false);

  // Copy Feedback State
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // AI Meeting Assistant States
  const [aiRawNotes, setAiRawNotes] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showAiInput, setShowAiInput] = useState(false);

  // Form state for Announcement
  const [annTitle, setAnnTitle] = useState('');
  const [annDescription, setAnnDescription] = useState('');
  const [annDate, setAnnDate] = useState(new Date().toISOString().split('T')[0]);
  const [annTime, setAnnTime] = useState('21:00');
  const [annLocation, setAnnLocation] = useState('TeamSpeak 3 - Caspian Server (Ch: Staff Main Meeting)');
  const [annAudience, setAnnAudience] = useState('تمامی اعضای استف (All Staff)');

  // Form state for Report
  const [repTitle, setRepTitle] = useState('');
  const [repDate, setRepDate] = useState(new Date().toISOString().split('T')[0]);
  const [repTime, setRepTime] = useState('21:00');
  const [repFounderStatements, setRepFounderStatements] = useState('');
  const [repDecisions, setRepDecisions] = useState('');
  const [repActionItems, setRepActionItems] = useState('');
  const [repSummary, setRepSummary] = useState('');
  const [repAttachmentUrl, setRepAttachmentUrl] = useState('');

  // AI Summarizer Handler
  const handleGenerateAiSummary = async () => {
    if (!aiRawNotes.trim()) {
      setAiError('لطفاً نکات یا متن خام جلسه را وارد کنید.');
      return;
    }

    setIsAiLoading(true);
    setAiError(null);

    try {
      const response = await fetch('/api/ai/generate-meeting-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawNotes: aiRawNotes,
          title: repTitle || 'جلسه عمومی کادر مدیریت',
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'خطا در تحلیل هوش مصنوعی');
      }

      const data = resData.data;
      if (data.founderStatements) setRepFounderStatements(data.founderStatements);
      if (Array.isArray(data.decisions)) setRepDecisions(data.decisions.join('\n'));
      if (Array.isArray(data.actionItems)) setRepActionItems(data.actionItems.join('\n'));
      if (data.summary) setRepSummary(data.summary);

      setShowAiInput(false);
      setAiRawNotes('');
      playUiSound('success', soundFx);
    } catch (err: any) {
      setAiError(err.message || 'ارتباط با سرور هوش مصنوعی برقرار نشد.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Open Announcement Create Modal
  const handleOpenCreateAnnouncement = () => {
    playUiSound('click', soundFx);
    setEditingAnnouncementId(null);
    setAnnTitle('');
    setAnnDescription('');
    setAnnDate(new Date().toISOString().split('T')[0]);
    setAnnTime('21:00');
    setAnnLocation('TeamSpeak 3 - Caspian Server (Ch: Staff Main Meeting)');
    setAnnAudience('تمامی اعضای استف (All Staff)');
    setIsAddAnnouncementOpen(true);
  };

  // Open Announcement Edit Modal
  const handleOpenEditAnnouncement = (ann: MeetingAnnouncement) => {
    playUiSound('click', soundFx);
    setEditingAnnouncementId(ann.id);
    setAnnTitle(ann.title);
    setAnnDescription(ann.description);
    setAnnDate(ann.meetingDate);
    setAnnTime(ann.meetingTime);
    setAnnLocation(ann.locationOrRoom);
    setAnnAudience(ann.targetAudience);
    setIsAddAnnouncementOpen(true);
  };

  // Save Announcement
  const handleSaveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annDescription.trim()) return;

    if (editingAnnouncementId && onUpdateAnnouncement) {
      onUpdateAnnouncement(editingAnnouncementId, {
        title: annTitle.trim(),
        description: annDescription.trim(),
        meetingDate: annDate,
        meetingTime: annTime,
        locationOrRoom: annLocation.trim(),
        targetAudience: annAudience.trim(),
      });
    } else {
      onAddAnnouncement({
        title: annTitle.trim(),
        description: annDescription.trim(),
        meetingDate: annDate,
        meetingTime: annTime,
        locationOrRoom: annLocation.trim(),
        targetAudience: annAudience.trim(),
      });
    }

    playUiSound('success', soundFx);
    setIsAddAnnouncementOpen(false);
    setEditingAnnouncementId(null);
    setAnnTitle('');
    setAnnDescription('');
  };

  // Open Report Create Modal
  const handleOpenCreateReport = () => {
    playUiSound('click', soundFx);
    setEditingReportId(null);
    setRepTitle('');
    setRepDate(new Date().toISOString().split('T')[0]);
    setRepTime('21:00');
    setRepFounderStatements('');
    setRepDecisions('');
    setRepActionItems('');
    setRepSummary('');
    setRepAttachmentUrl('');
    setIsAddReportOpen(true);
  };

  // Open Report Edit Modal
  const handleOpenEditReport = (rep: MeetingReport) => {
    playUiSound('click', soundFx);
    setEditingReportId(rep.id);
    setRepTitle(rep.meetingTitle);
    setRepDate(rep.meetingDate);
    setRepTime(rep.meetingTime);
    setRepFounderStatements(rep.founderStatements);
    setRepDecisions(rep.keyDecisions.join('\n'));
    setRepActionItems(rep.actionItems.join('\n'));
    setRepSummary(rep.fullSummary || '');
    setRepAttachmentUrl(rep.attachmentUrl || '');
    setIsAddReportOpen(true);
  };

  // Save Report
  const handleSaveReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repTitle.trim() || !repFounderStatements.trim()) return;

    const keyDecisions = repDecisions
      .split('\n')
      .map((d) => d.trim())
      .filter((d) => d.length > 0);

    const actionItems = repActionItems
      .split('\n')
      .map((a) => a.trim())
      .filter((a) => a.length > 0);

    if (editingReportId && onUpdateReport) {
      onUpdateReport(editingReportId, {
        meetingTitle: repTitle.trim(),
        meetingDate: repDate,
        meetingTime: repTime,
        founderStatements: repFounderStatements.trim(),
        keyDecisions,
        actionItems,
        fullSummary: repSummary.trim(),
        attachmentUrl: repAttachmentUrl.trim() || undefined,
      });
    } else {
      onAddReport({
        meetingTitle: repTitle.trim(),
        meetingDate: repDate,
        meetingTime: repTime,
        founderStatements: repFounderStatements.trim(),
        keyDecisions,
        actionItems,
        fullSummary: repSummary.trim(),
        attachmentUrl: repAttachmentUrl.trim() || undefined,
      });
    }

    playUiSound('success', soundFx);
    setIsAddReportOpen(false);
    setEditingReportId(null);
    setRepTitle('');
    setRepFounderStatements('');
    setRepDecisions('');
    setRepActionItems('');
    setRepSummary('');
    setRepAttachmentUrl('');
  };

  // Copy Broadcast Text for TeamSpeak / Discord
  const handleCopyAnnouncementBroadcast = (ann: MeetingAnnouncement) => {
    playUiSound('click', soundFx);
    const text = `📢 **اطلاعیه رسمی جلسه سرور Caspian**
━━━━━━━━━━━━━━━━━━━━━━
📌 **عنوان:** ${ann.title}
📅 **تاریخ:** ${toJalaliDate(ann.meetingDate)} | 🕘 **ساعت:** ${ann.meetingTime}
📍 **مکان:** ${ann.locationOrRoom}
👥 **مخاطبین:** ${ann.targetAudience}

📝 **توضیحات:**
${ann.description}

👤 **صادرکننده:** ${ann.createdByName} (${ann.createdByRole})
━━━━━━━━━━━━━━━━━━━━━━
حضور تمامی اعضای مربوطه الزامی می‌باشد.`;

    navigator.clipboard.writeText(text);
    setCopiedId(ann.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Copy Report Text
  const handleCopyReportText = (rep: MeetingReport) => {
    playUiSound('click', soundFx);
    const decisionsText = rep.keyDecisions.map((d, i) => `  ${i + 1}. ${d}`).join('\n');
    const actionText = rep.actionItems.map((a, i) => `  ${i + 1}. ${a}`).join('\n');

    const text = `📋 **صورت‌جلسه رسمی کادر مدیریت Caspian**
━━━━━━━━━━━━━━━━━━━━━━
📌 **عنوان:** ${rep.meetingTitle}
📅 **تاریخ برگزاری:** ${toJalaliDate(rep.meetingDate)} | 🕘 **ساعت:** ${rep.meetingTime}

👑 **سخنان و دستورات مستقیم فاندر (بهنام بهرامیان):**
${rep.founderStatements}

✅ **تصمیمات اتخاذ شده:**
${decisionsText || '  موردی ثبت نشده'}

🎯 **مصوبات و مأموریت‌های بعدی:**
${actionText || '  موردی ثبت نشده'}

📝 **خلاصه گزارش:**
${rep.fullSummary || 'نامشخص'}

👤 **ثبت‌کننده:** ${rep.recordedByName} (${rep.recordedByRole})
━━━━━━━━━━━━━━━━━━━━━━`;

    navigator.clipboard.writeText(text);
    setCopiedId(rep.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // System Speech Synthesis Reader
  const handleStartSystemSpeech = (rep: MeetingReport) => {
    playUiSound('click', soundFx);
    setSpeechReport(rep);
    setIsSpeechActive(true);

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const textToSpeak = `اعلام رسمی سیستم کادر مدیریت سرور کاسپین. صورت جلسه مورخ ${toJalaliDate(rep.meetingDate)}. عنوان جلسه: ${rep.meetingTitle}. سخنان و دستورات فاندر بهنام بهرامیان: ${rep.founderStatements}. تصمیمات اتخاذ شده: ${rep.keyDecisions.join('. ')}. مصوبات بعدی: ${rep.actionItems.join('. ')}.`;

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'fa-IR';
      utterance.rate = 0.95;
      utterance.onend = () => setIsSpeechActive(false);
      utterance.onerror = () => setIsSpeechActive(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleStopSystemSpeech = () => {
    playUiSound('toggle', soundFx);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeechActive(false);
  };

  // Filter announcements
  const filteredAnnouncements = announcements.filter((a) => {
    const matchesSearch =
      !searchQuery.trim() ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.locationOrRoom.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filter reports
  const filteredReports = reports.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.meetingTitle.toLowerCase().includes(q) ||
      r.founderStatements.toLowerCase().includes(q) ||
      (r.fullSummary && r.fullSummary.toLowerCase().includes(q))
    );
  });

  // Stats Calculations
  const totalDecisionsCount = reports.reduce((acc, r) => acc + r.keyDecisions.length, 0);
  const totalAttendeesCount = announcements.reduce((acc, a) => acc + a.attendees.length, 0);
  const avgAttendance = announcements.length > 0 ? Math.round(totalAttendeesCount / announcements.length) : 0;

  const getMeetingStatusBadge = (status: MeetingStatus) => {
    switch (status) {
      case 'Live':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" /> در حال برگزاری
          </span>
        );
      case 'Upcoming':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
            <Clock className="w-3.5 h-3.5 text-sky-400" /> پیش‌رو
          </span>
        );
      case 'Concluded':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
            برگزار شده
          </span>
        );
      case 'Cancelled':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-950 text-rose-400 border border-rose-900">
            لغو شده
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn dir-rtl text-right">
      {/* Main Header Banner */}
      <div className="relative p-6 md:p-8 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl rgb-halo-border">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl text-indigo-400 shrink-0 shadow-lg shadow-indigo-500/10">
              <Megaphone className="w-8 h-8 animate-pulse text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-black text-white">مرکز اطلاعیه‌ها و صورت‌جلسات رسمی Caspian</h2>
                {isTopFour ? (
                  <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold rounded-lg flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-400" /> مدیریت ۴ رنک اصلی
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold rounded-lg flex items-center gap-1">
                    <Lock className="w-3 h-3 text-sky-400" /> عضو کادر (مشاهده و قرائت)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {isTopFour
                  ? 'شما دسترسی کامل جهت ثبت دستی، ویرایش و انتشار اطلاعیه‌ها و صورت‌جلسات رسمی مدیریت را دارید.'
                  : 'مشاهده اطلاعیه‌های جلسات آینده و اعلام صوتی گزارشات و مصوبات مدیریت توسط سیستم.'}
              </p>
            </div>
          </div>

          {/* Management Action Buttons or Restricted Notice */}
          <div className="flex flex-wrap items-center gap-3 shrink-0 w-full md:w-auto justify-end">
            {isTopFour ? (
              <>
                <button
                  onClick={handleOpenCreateAnnouncement}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs shadow-lg shadow-sky-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> ثبت دستی اعلامیه جلسه
                </button>
                <button
                  onClick={handleOpenCreateReport}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <FileCheck2 className="w-4 h-4" /> ثبت دستی صورت‌جلسه
                </button>
              </>
            ) : (
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-[11px] text-slate-300 flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>ثبت و ویرایش مخصوص ۴ رنک اصلی مدیریت است. شما به تمام اعلامیه‌ها و صورت‌جلسات دسترسی کامل دارید.</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Analytics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-2xl">
            <div className="text-[11px] text-slate-400 font-semibold mb-0.5">کل اعلامیه‌های جلسه</div>
            <div className="text-lg font-black text-slate-100">{announcements.length} جلسه</div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-2xl">
            <div className="text-[11px] text-slate-400 font-semibold mb-0.5">کل صورت‌جلسات ثبت‌شده</div>
            <div className="text-lg font-black text-indigo-400">{reports.length} صورت‌جلسه</div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-2xl">
            <div className="text-[11px] text-slate-400 font-semibold mb-0.5">تعداد کل مصوبات</div>
            <div className="text-lg font-black text-emerald-400">{totalDecisionsCount} مصوبه</div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-2xl">
            <div className="text-[11px] text-slate-400 font-semibold mb-0.5">میانگین حاضرین جلسه</div>
            <div className="text-lg font-black text-sky-400">{avgAttendance} نفر</div>
          </div>
        </div>
      </div>

      {/* Sub-tabs & Search Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-lg">
        {/* Toggle Sub-tabs */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => {
              playUiSound('tab', soundFx);
              setActiveSubTab('announcements');
            }}
            className={`flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'announcements'
                ? 'bg-sky-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" /> اعلامیه‌های عمومی جلسات ({announcements.length})
          </button>
          <button
            onClick={() => {
              playUiSound('tab', soundFx);
              setActiveSubTab('reports');
            }}
            className={`flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'reports'
                ? 'bg-indigo-500 text-white shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" /> صورت‌جلسه‌ها و گزارشات سیستم ({reports.length})
          </button>
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-wrap items-center gap-3 flex-1 justify-end">
          {activeSubTab === 'announcements' && (
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              {(['All', 'Upcoming', 'Live', 'Concluded'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    playUiSound('click', soundFx);
                    setStatusFilter(st);
                  }}
                  className={`px-3 py-1 font-semibold rounded-lg transition-all cursor-pointer ${
                    statusFilter === st
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st === 'All' ? 'همه' : st === 'Upcoming' ? 'پیش‌رو' : st === 'Live' ? 'در حال برگزاری' : 'برگزار شده'}
                </button>
              ))}
            </div>
          )}

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="جستجو در جلسات، دستورات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>
      </div>

      {/* Content View 1: Announcements */}
      {activeSubTab === 'announcements' && (
        <div className="space-y-4">
          {filteredAnnouncements.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-12 text-center">
              <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-200">هیچ اعلامیه جلسه‌ای ثبت نشده است</h3>
              <p className="text-xs text-slate-400 mt-1">
                اطلاعیه‌های جلسات آینده توسط ۴ رنک مدیریت اصلی در این بخش قرار می‌گیرند و برای تمامی اعضا قابل مشاهده است.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredAnnouncements.map((ann) => {
                const hasRSVP = currentUser ? ann.attendees.includes(currentUser.id) : false;
                const attendeeUsers = allUsers.filter((u) => ann.attendees.includes(u.id));

                return (
                  <div
                    key={ann.id}
                    className="bg-slate-900/90 border border-slate-800 hover:border-sky-500/40 rounded-3xl p-6 shadow-xl transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top status & date bar */}
                      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-4">
                        {getMeetingStatusBadge(ann.status)}
                        <div className="text-xs font-mono font-extrabold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-3 py-1 rounded-xl">
                          {toJalaliDate(ann.meetingDate)} • {ann.meetingTime}
                        </div>
                      </div>

                      <h3 className="text-base font-black text-white mb-2 leading-snug">
                        {ann.title}
                      </h3>

                      <p className="text-xs text-slate-300 leading-relaxed mb-4 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 whitespace-pre-line">
                        {ann.description}
                      </p>

                      {/* Location & Target Info */}
                      <div className="bg-slate-950/80 rounded-2xl p-3.5 border border-slate-800/80 space-y-2 mb-4 text-xs">
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-sky-400" /> محل برگزاری:
                          </span>
                          <span className="font-bold text-sky-300 truncate max-w-[200px]">{ann.locationOrRoom}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-indigo-400" /> مخاطبین جلسه:
                          </span>
                          <span className="font-semibold text-slate-200">{ann.targetAudience}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-400">صادرکننده:</span>
                          <div className="flex items-center gap-1 font-bold text-slate-200">
                            <span>{ann.createdByName}</span>
                            <RoleBadge role={ann.createdByRole} size="xs" />
                          </div>
                        </div>
                      </div>

                      {/* Attendee avatars list */}
                      <div className="mb-4">
                        <div className="text-[11px] font-bold text-slate-400 mb-2 flex items-center justify-between">
                          <span>اعلام حضور کنندگان ({ann.attendees.length} نفر):</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
                          {attendeeUsers.map((u) => (
                            <span
                              key={u.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-200 font-medium"
                            >
                              <span className="w-2 h-2 rounded-full bg-emerald-400" />
                              {u.firstName} {u.lastName}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* RSVP Action Bar */}
                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          playUiSound('toggle', soundFx);
                          onToggleRSVP(ann.id);
                        }}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                          hasRSVP
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                            : 'bg-sky-500 text-slate-950 hover:bg-sky-400 font-black shadow-md'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {hasRSVP ? 'اعلام حضور شد (حاضرم)' : 'تایید و اعلام حضور در جلسه'}
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCopyAnnouncementBroadcast(ann)}
                          className="p-2 text-slate-400 hover:text-sky-300 hover:bg-sky-500/10 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-xs"
                          title="کپی متن اطلاع‌رسانی برای دیسکورد/تیم‌اسپیک"
                        >
                          {copiedId === ann.id ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Share2 className="w-4 h-4" />
                          )}
                        </button>

                        {/* Edit & Delete reserved ONLY for Top 4 Management */}
                        {isTopFour && (
                          <>
                            <button
                              onClick={() => handleOpenEditAnnouncement(ann)}
                              className="p-2 text-slate-400 hover:text-sky-300 hover:bg-sky-500/10 rounded-xl transition-colors cursor-pointer"
                              title="ویرایش اعلامیه دستی"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                playUiSound('click', soundFx);
                                onDeleteAnnouncement(ann.id);
                              }}
                              className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                              title="حذف اعلامیه"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Content View 2: Reports & Minutes */}
      {activeSubTab === 'reports' && (
        <div className="space-y-4">
          {filteredReports.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-12 text-center">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-200">هیچ صورت‌جلسه‌ای ثبت نشده است</h3>
              <p className="text-xs text-slate-400 mt-1">
                صورت‌جلسات شامل دستورات مستقیم فاندر و مصوبات در این بخش ذخیره شده و توسط سیستم اعلام صوتی قابل قرائت است.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5">
              {filteredReports.map((rep) => (
                <div
                  key={rep.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/30 rounded-3xl p-6 shadow-xl transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-sky-400 font-bold mb-1">
                        <Calendar className="w-3.5 h-3.5" /> صورت‌جلسه مورخ {toJalaliDate(rep.meetingDate)} • ساعت {rep.meetingTime}
                      </div>
                      <h3 className="text-lg font-black text-white">{rep.meetingTitle}</h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {/* System Audio Speech Announcer Button */}
                      <button
                        onClick={() => handleStartSystemSpeech(rep)}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-sky-500/20 text-amber-300 border border-amber-500/40 hover:border-amber-400 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                        title="قرائت و سیستم اعلام صوتی گزارش"
                      >
                        <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" />
                        سیستم اعلام صوتی
                      </button>

                      <button
                        onClick={() => handleCopyReportText(rep)}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                        title="کپی متنی صورت‌جلسه"
                      >
                        {copiedId === rep.id ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-400" />
                            کپی شد
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 text-slate-400" />
                            کپی متن
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          playUiSound('click', soundFx);
                          setViewingReport(rep);
                        }}
                        className="px-4 py-2 rounded-xl bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-600/30 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileText className="w-4 h-4" /> مطالعه کامل صورت‌جلسه
                      </button>

                      {/* Edit & Delete reserved ONLY for Top 4 Management */}
                      {isTopFour && (
                        <>
                          <button
                            onClick={() => handleOpenEditReport(rep)}
                            className="p-2 text-slate-400 hover:text-sky-300 hover:bg-sky-500/10 rounded-xl transition-colors cursor-pointer"
                            title="ویرایش صورت‌جلسه دستی"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              playUiSound('click', soundFx);
                              onDeleteReport(rep.id);
                            }}
                            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                            title="حذف صورت‌جلسه"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Highlight: Founder Directives */}
                  <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-4 mb-4 space-y-2">
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-black">
                      <Crown className="w-4 h-4 text-amber-300" /> سخنان و دستورات مستقیم فاندر (بهنام بهرامیان):
                    </div>
                    <p className="text-xs text-amber-100/90 leading-relaxed font-medium">
                      {rep.founderStatements}
                    </p>
                  </div>

                  {/* Key Decisions */}
                  {rep.keyDecisions.length > 0 && (
                    <div className="space-y-1.5 mb-4">
                      <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> تصمیمات اتخاذ شده در جلسه:
                      </div>
                      <ul className="list-disc list-inside space-y-1 pr-2 text-xs text-slate-300">
                        {rep.keyDecisions.map((dec, idx) => (
                          <li key={idx}>{dec}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="text-[11px] text-slate-400 flex items-center justify-between pt-3 border-t border-slate-800/80">
                    <span>ثبت‌کننده صورت‌جلسه: {rep.recordedByName} ({rep.recordedByRole})</span>
                    {rep.attachmentUrl && (
                      <a
                        href={rep.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-400 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <ExternalLink className="w-3 h-3" /> مشاهده فایل/پیوست صورت‌جلسه
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Add/Edit Announcement (Reserved for Top 4 Management) */}
      {isAddAnnouncementOpen && isTopFour && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-sky-400" />
                  {editingAnnouncementId ? 'ویرایش دستی اعلامیه جلسه' : 'ثبت دستی اعلامیه جلسه جدید'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">تنظیم و انتشار رسمی اطلاع‌رسانی جلسات سرور</p>
              </div>
              <button
                onClick={() => setIsAddAnnouncementOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAnnouncement} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">عنوان جلسه *</label>
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="مثلاً: جلسه عمومی ماهانه اعضای کادر مدیریت"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-sky-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">توضیحات و دستور جلسه *</label>
                <textarea
                  required
                  rows={3}
                  value={annDescription}
                  onChange={(e) => setAnnDescription(e.target.value)}
                  placeholder="شرح اهداف جلسه، محورهای گفتگو و نکات مهم..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-sky-500 resize-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">تاریخ برگزاری</label>
                  <input
                    type="date"
                    required
                    value={annDate}
                    onChange={(e) => setAnnDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">ساعت برگزاری</label>
                  <input
                    type="text"
                    required
                    value={annTime}
                    onChange={(e) => setAnnTime(e.target.value)}
                    placeholder="21:00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">محل یا کانال جلسه</label>
                <input
                  type="text"
                  required
                  value={annLocation}
                  onChange={(e) => setAnnLocation(e.target.value)}
                  placeholder="TeamSpeak 3 - Caspian Channel"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">مخاطبین جلسه</label>
                <input
                  type="text"
                  required
                  value={annAudience}
                  onChange={(e) => setAnnAudience(e.target.value)}
                  placeholder="تمامی اعضای استف / Faction Managers..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddAnnouncementOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold shadow-lg cursor-pointer"
                >
                  {editingAnnouncementId ? 'بروزرسانی اعلامیه' : 'انتشار اعلامیه'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Report (Reserved for Top 4 Management) */}
      {isAddReportOpen && isTopFour && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-indigo-400" />
                  {editingReportId ? 'ویرایش دستی صورت‌جلسه' : 'ثبت دستی صورت‌جلسه جدید'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">ثبت دستی گزارش، دستورات فاندر و مصوبات جلسه برگزارشده</p>
              </div>
              <button
                onClick={() => setIsAddReportOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* AI Generator Toggle Banner */}
            <div className="p-4 bg-gradient-to-r from-amber-500/20 via-indigo-600/20 to-sky-500/20 border border-amber-500/30 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-black text-amber-300">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  دستیار اختیاری استخراج هوشمند (Gemini AI)
                </div>
                <button
                  type="button"
                  onClick={() => setShowAiInput(!showAiInput)}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer transition-all"
                >
                  {showAiInput ? 'بستن دستیار AI' : '✨ استخراج هوشمند'}
                </button>
              </div>

              {showAiInput && (
                <div className="space-y-3 pt-2 animate-fadeIn">
                  <p className="text-[11px] text-slate-300">
                    نکات خام جلسه را وارد کنید تا هوش مصنوعی خودکار سخنان فاندر و تصمیمات را تفکیک و در فرم جایگذاری کند:
                  </p>
                  <textarea
                    rows={4}
                    value={aiRawNotes}
                    onChange={(e) => setAiRawNotes(e.target.value)}
                    placeholder="مثال: بهنام گفت که تمامی مدیران باید تا جمعه گزارش فرستاده باشند. مصوب شد سیستم اخطار تغییر کند..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 text-xs focus:outline-none focus:border-amber-400"
                  />

                  {aiError && <div className="text-xs text-rose-400 font-semibold">{aiError}</div>}

                  <button
                    type="button"
                    disabled={isAiLoading}
                    onClick={handleGenerateAiSummary}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:opacity-90 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    {isAiLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                        در حال تفکیک با Gemini AI...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        استخراج خودکار و پرکردن فرم
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleSaveReport} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">عنوان صورت‌جلسه *</label>
                <input
                  type="text"
                  required
                  value={repTitle}
                  onChange={(e) => setRepTitle(e.target.value)}
                  placeholder="مثلاً: صورت‌جلسه ماهانه بررسی فعالیت کادر مدیریت"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">تاریخ برگزارشده</label>
                  <input
                    type="date"
                    required
                    value={repDate}
                    onChange={(e) => setRepDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">ساعت جلسه</label>
                  <input
                    type="text"
                    required
                    value={repTime}
                    onChange={(e) => setRepTime(e.target.value)}
                    placeholder="21:00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-amber-400 font-bold mb-1 flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5 text-amber-300" /> سخنان و دستورات مستقیم فاندر (بهنام بهرامیان) *
                </label>
                <textarea
                  required
                  rows={3}
                  value={repFounderStatements}
                  onChange={(e) => setRepFounderStatements(e.target.value)}
                  placeholder="دستورات، رهنمودها و سخنان فاندر در جلسه..."
                  className="w-full bg-slate-950 border border-amber-500/30 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-amber-400 resize-none font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  تصمیمات اتخاذ شده (هر خط یک مورد)
                </label>
                <textarea
                  rows={3}
                  value={repDecisions}
                  onChange={(e) => setRepDecisions(e.target.value)}
                  placeholder="تصمیم ۱&#10;تصمیم ۲&#10;تصمیم ۳"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-sky-500 resize-none font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  مصوبات و وظایف بعدها (هر خط یک مورد)
                </label>
                <textarea
                  rows={2}
                  value={repActionItems}
                  onChange={(e) => setRepActionItems(e.target.value)}
                  placeholder="وظیفه ۱&#10;وظیفه ۲"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-sky-500 resize-none font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">شرح و خلاصه کامل صورت‌جلسه</label>
                <textarea
                  rows={3}
                  value={repSummary}
                  onChange={(e) => setRepSummary(e.target.value)}
                  placeholder="متن کامل یا خلاصه گزارش جلسه..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-sky-500 resize-none font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">لینک فایل / پیوست صورت‌جلسه (اختیاری)</label>
                <input
                  type="url"
                  value={repAttachmentUrl}
                  onChange={(e) => setRepAttachmentUrl(e.target.value)}
                  placeholder="https://caspian-community.ir/report.pdf"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddReportOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg cursor-pointer"
                >
                  {editingReportId ? 'بروزرسانی صورت‌جلسه' : 'ثبت صورت‌جلسه'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Full Report */}
      {viewingReport && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold text-sky-400">
                  صورت‌جلسه مورخ {toJalaliDate(viewingReport.meetingDate)} • ساعت {viewingReport.meetingTime}
                </span>
                <h3 className="text-xl font-black text-white mt-1">{viewingReport.meetingTitle}</h3>
              </div>
              <button
                onClick={() => setViewingReport(null)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Actions Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleStartSystemSpeech(viewingReport)}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-sky-500 hover:opacity-90 text-slate-950 text-xs font-black rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <Volume2 className="w-4 h-4 text-slate-950" />
                قرائت صوتی توسط سیستم
              </button>

              <button
                onClick={() => handleCopyReportText(viewingReport)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer"
              >
                {copiedId === viewingReport.id ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    کپی شد!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-sky-400" />
                    کپی متن جهت دیسکورد/تیم‌اسپیک
                  </>
                )}
              </button>

              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                پرینت / PDF
              </button>
            </div>

            {/* Founder Directives */}
            <div className="bg-amber-950/30 border border-amber-500/40 rounded-2xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-amber-300 text-sm font-black">
                <Crown className="w-5 h-5 text-amber-400" /> سخنان و دستورات مستقیم فاندر (بهنام بهرامیان):
              </div>
              <p className="text-xs text-amber-100 leading-relaxed font-medium whitespace-pre-wrap">
                {viewingReport.founderStatements}
              </p>
            </div>

            {/* Decisions */}
            {viewingReport.keyDecisions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> تصمیمات اتخاذ شده:
                </h4>
                <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800">
                  <ul className="list-disc list-inside space-y-2 text-xs text-slate-200">
                    {viewingReport.keyDecisions.map((dec, idx) => (
                      <li key={idx} className="leading-relaxed">{dec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Action Items */}
            {viewingReport.actionItems.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sky-400" /> مصوبات و وظایف بعدی:
                </h4>
                <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800">
                  <ul className="list-disc list-inside space-y-2 text-xs text-slate-200">
                    {viewingReport.actionItems.map((act, idx) => (
                      <li key={idx} className="leading-relaxed">{act}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Full Summary */}
            {viewingReport.fullSummary && (
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-200">متن و خلاصه گزارش جلسه:</h4>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 whitespace-pre-wrap">
                  {viewingReport.fullSummary}
                </p>
              </div>
            )}

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>ثبت توسط: {viewingReport.recordedByName} ({viewingReport.recordedByRole})</span>
              <button
                onClick={() => setViewingReport(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: System Audio Speech Announcer Reader */}
      {speechReport && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/40 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-5 text-center rgb-halo-border">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-indigo-600 p-0.5 mx-auto shadow-xl shadow-amber-500/20">
              <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center">
                <Volume2 className="w-8 h-8 text-amber-400 animate-bounce" />
              </div>
            </div>

            <div>
              <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-black rounded-xl">
                🎙️ سیستم اعلام و قرائت صوتی صورت‌جلسه
              </span>
              <h3 className="text-lg font-black text-white mt-3">{speechReport.meetingTitle}</h3>
              <p className="text-xs text-slate-400 mt-1">
                صورت‌جلسه مورخ {toJalaliDate(speechReport.meetingDate)} • ثبت‌شده توسط {speechReport.recordedByName}
              </p>
            </div>

            {/* Audio Wave Visualizer Animation */}
            <div className="flex items-center justify-center gap-1.5 h-10 py-2">
              <span className="w-1.5 bg-amber-400 rounded-full animate-pulse h-8" />
              <span className="w-1.5 bg-sky-400 rounded-full animate-bounce h-10" />
              <span className="w-1.5 bg-indigo-400 rounded-full animate-pulse h-6" />
              <span className="w-1.5 bg-emerald-400 rounded-full animate-bounce h-9" />
              <span className="w-1.5 bg-rose-400 rounded-full animate-pulse h-7" />
            </div>

            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-right text-xs space-y-3 max-h-48 overflow-y-auto">
              <div className="text-amber-300 font-bold flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-400" /> دستورات فاندر:
              </div>
              <p className="text-slate-300 leading-relaxed">{speechReport.founderStatements}</p>

              {speechReport.keyDecisions.length > 0 && (
                <>
                  <div className="text-emerald-400 font-bold pt-2 border-t border-slate-800">تصمیمات اتخاذ شده:</div>
                  <ul className="list-disc list-inside text-slate-300 space-y-1">
                    {speechReport.keyDecisions.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              {isSpeechActive ? (
                <button
                  onClick={handleStopSystemSpeech}
                  className="px-5 py-2.5 bg-rose-500 hover:bg-rose-400 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <Square className="w-4 h-4 fill-current" /> متوقف‌کردن اعلام صوتی
                </button>
              ) : (
                <button
                  onClick={() => handleStartSystemSpeech(speechReport)}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" /> شروع مجدد قرائت صوتی
                </button>
              )}

              <button
                onClick={() => {
                  handleStopSystemSpeech();
                  setSpeechReport(null);
                }}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
