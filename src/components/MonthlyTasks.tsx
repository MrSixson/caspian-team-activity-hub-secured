import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Filter,
  User,
  Calendar,
  Sparkles,
  ShieldAlert,
  Send,
  FileCheck,
  Search,
  ChevronRight,
  ExternalLink,
  Trash2,
  Lock,
} from 'lucide-react';
import {
  StaffTask,
  TaskPriority,
  TaskStatus,
  UserRole,
  User as UserType,
  ALL_ROLES,
} from '../types';
import { isTopFourRank } from '../lib/permissions';
import { RoleBadge } from './RoleBadge';
import { toJalaliDate } from '../lib/jalali';
import { playUiSound } from '../lib/audioFx';

interface MonthlyTasksProps {
  currentUser: UserType | null;
  tasks: StaffTask[];
  allUsers: UserType[];
  onAddTask: (task: Omit<StaffTask, 'id' | 'createdAt' | 'createdById' | 'createdByName' | 'createdByRole'>) => void;
  onUpdateTaskStatus: (taskId: string, status: TaskStatus, notes?: string, proofUrl?: string) => void;
  onDeleteTask: (taskId: string) => void;
  soundFx?: boolean;
}

export const MonthlyTasks: React.FC<MonthlyTasksProps> = ({
  currentUser,
  tasks,
  allUsers,
  onAddTask,
  onUpdateTaskStatus,
  onDeleteTask,
  soundFx = true,
}) => {
  const isTopFour = currentUser ? isTopFourRank(currentUser.role) : false;

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterTarget, setFilterTarget] = useState<'my' | 'all'>('my');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitTaskModal, setSubmitTaskModal] = useState<StaffTask | null>(null);

  // Form states for creating new task
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('Medium');
  const [newAssignedToType, setNewAssignedToType] = useState<'All' | 'Rank' | 'User'>('User');
  const [newTargetRole, setNewTargetRole] = useState<UserRole>('Admin');
  const [newTargetUserId, setNewTargetUserId] = useState<string>('');
  const [newDeadline, setNewDeadline] = useState(new Date().toISOString().split('T')[0]);
  const [newMonthYear, setNewMonthYear] = useState('مرداد ۱۴۰۵');

  // Form states for completing task
  const [completionNotes, setCompletionNotes] = useState('');
  const [completionProofUrl, setCompletionProofUrl] = useState('');

  // Filter tasks logic
  const filteredTasks = tasks.filter((t) => {
    // Privacy check: If not top 4, non-assigned tasks must not be visible unless explicitly assigned to all, rank, or user
    if (currentUser && !isTopFour) {
      const isAssignedToMe =
        t.assignedToType === 'All' ||
        (t.assignedToType === 'Rank' && t.targetRole === currentUser.role) ||
        (t.assignedToType === 'User' && t.targetUserId === currentUser.id);
      if (!isAssignedToMe) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description.toLowerCase().includes(q);
      const matchCreator = t.createdByName.toLowerCase().includes(q);
      const matchTargetUser = t.targetUserName?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCreator && !matchTargetUser) return false;
    }

    // Filter status
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;

    // Filter month
    if (filterMonth !== 'all' && t.monthYear !== filterMonth) return false;

    // Filter target: My Tasks vs All Tasks
    if (filterTarget === 'my' && currentUser) {
      const isAssignedToMe =
        t.assignedToType === 'All' ||
        (t.assignedToType === 'Rank' && t.targetRole === currentUser.role) ||
        (t.assignedToType === 'User' && t.targetUserId === currentUser.id);
      return isAssignedToMe;
    }

    return true;
  });

  const handleCreateTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    const selectedTargetUser = allUsers.find((u) => u.id === newTargetUserId);

    playUiSound('success', soundFx);
    onAddTask({
      title: newTitle.trim(),
      description: newDescription.trim(),
      priority: newPriority,
      assignedToType: newAssignedToType,
      targetRole: newAssignedToType === 'Rank' ? newTargetRole : undefined,
      targetUserId: newAssignedToType === 'User' ? newTargetUserId : undefined,
      targetUserName: newAssignedToType === 'User' && selectedTargetUser ? `${selectedTargetUser.firstName} ${selectedTargetUser.lastName}` : undefined,
      deadlineDate: newDeadline,
      monthYear: newMonthYear,
      status: 'Pending',
    });

    setIsAddModalOpen(false);
    setNewTitle('');
    setNewDescription('');
    setNewPriority('Medium');
  };

  const handleCompletionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitTaskModal) return;

    playUiSound('success', soundFx);
    onUpdateTaskStatus(
      submitTaskModal.id,
      'Completed',
      completionNotes.trim() || 'کار انجام شد و گزارش جهت تایید ارسال گردید.',
      completionProofUrl.trim() || undefined
    );

    setSubmitTaskModal(null);
    setCompletionNotes('');
    setCompletionProofUrl('');
  };

  // Helper styles for Priority
  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'Critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <ShieldAlert className="w-3 h-3 text-rose-400" /> بسیار مهم
          </span>
        );
      case 'High':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <AlertTriangle className="w-3 h-3 text-amber-400" /> اولویت بالا
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/40">
            <Clock className="w-3 h-3 text-sky-400" /> اولویت متوسط
          </span>
        );
      case 'Low':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
            اولویت عادی
          </span>
        );
    }
  };

  // Helper styles for Status
  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'Verified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> تایید نهایی
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
            <FileCheck className="w-3.5 h-3.5 text-blue-400" /> انجام شده (در انتظار بررسی)
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
            <Clock className="w-3.5 h-3.5 text-amber-400" /> در حال انجام
          </span>
        );
      case 'Pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            در انتظار شروع
          </span>
        );
    }
  };

  // Extract unique months for filtering
  const months = Array.from(new Set(tasks.map((t) => t.monthYear)));

  return (
    <div className="space-y-6 pb-12 animate-fadeIn dir-rtl text-right">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/60 border border-slate-800 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" /> Caspian Monthly Task Assignment System
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              لیست کارهای این ماه اعضای تیم
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              دستورالعمل‌ها و کارهای موظفی تعیین‌شده توسط ۴ رنک اصلی (Founder, Owner, Manager, Supervisor) جهت پیگیری و اجرا توسط اعضای کادر مدیریت و فکشن‌ها.
            </p>
          </div>

          {isTopFour && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white font-bold text-sm shadow-xl hover:shadow-sky-500/25 hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-5 h-5" /> تعریف کار جدید برای اعضا
            </button>
          )}
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 shadow-lg">
        {/* Toggle My Tasks vs All Tasks */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => setFilterTarget('my')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              filterTarget === 'my'
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            وظایف مرتبط با من
          </button>
          <button
            onClick={() => setFilterTarget('all')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              filterTarget === 'all'
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            همه وظایف کادر
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative min-w-[200px] flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در عنوان، شرح یا ثبت‌کننده..."
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">همه وضعیت‌ها</option>
              <option value="Pending" className="bg-slate-900">در انتظار شروع</option>
              <option value="In Progress" className="bg-slate-900">در حال انجام</option>
              <option value="Completed" className="bg-slate-900">انجام شده (ارسال گزارش)</option>
              <option value="Verified" className="bg-slate-900">تایید نهایی شده</option>
            </select>
          </div>

          {/* Month Filter */}
          {months.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900">همه ماه‌ها</option>
                {months.map((m) => (
                  <option key={m} value={m} className="bg-slate-900">
                    {m}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Tasks Grid / List */}
      {filteredTasks.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-12 text-center">
          <div className="w-16 h-16 bg-slate-800/80 rounded-2xl mx-auto flex items-center justify-center text-slate-500 mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-200">هیچ کاری در این بخش یافت نشد</h3>
          <p className="text-xs text-slate-400 mt-1">
            با فیلترهای انتخابی هیچ وظیفه‌ای پیدا نشد یا هنوز کاری تعریف نشده است.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTasks.map((task) => {
            const isAssignedToMe =
              currentUser &&
              (task.assignedToType === 'All' ||
                (task.assignedToType === 'Rank' && task.targetRole === currentUser.role) ||
                (task.assignedToType === 'User' && task.targetUserId === currentUser.id));

            return (
              <div
                key={task.id}
                className="group relative bg-slate-900/90 border border-slate-800 hover:border-sky-500/40 rounded-2xl p-5 shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Top Header info */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    {getPriorityBadge(task.priority)}
                    {getStatusBadge(task.status)}
                  </div>

                  {/* Task Title */}
                  <h3 className="text-base font-bold text-white group-hover:text-sky-300 transition-colors leading-snug mb-2">
                    {task.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-slate-300 leading-relaxed mb-4 whitespace-pre-wrap">
                    {task.description}
                  </p>

                  {/* Target assignment badge */}
                  <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800/80 space-y-2 mb-4 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>تخصیص به:</span>
                      <span className="font-bold text-slate-200">
                        {task.assignedToType === 'All' && 'تمامی اعضای استف'}
                        {task.assignedToType === 'Rank' && task.targetRole && (
                          <RoleBadge role={task.targetRole} size="xs" />
                        )}
                        {task.assignedToType === 'User' && (task.targetUserName || 'کاربر خاص')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400">
                      <span>تعریف توسط:</span>
                      <div className="flex items-center gap-1.5 font-bold text-slate-200">
                        <span>{task.createdByName}</span>
                        <RoleBadge role={task.createdByRole} size="xs" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-slate-400">
                      <span>مهلت انجام:</span>
                      <span className="font-bold text-sky-400">{toJalaliDate(task.deadlineDate)} ({task.monthYear})</span>
                    </div>
                  </div>

                  {/* Notes & proof submission if completed */}
                  {task.completionNotes && (
                    <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-3 mb-4 text-xs">
                      <div className="text-emerald-400 font-bold mb-1 flex items-center gap-1">
                        <FileCheck className="w-3.5 h-3.5" /> گزارش انجام کار:
                      </div>
                      <p className="text-slate-300 italic">{task.completionNotes}</p>
                      {task.proofUrl && (
                        <a
                          href={task.proofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-[11px] text-sky-400 hover:underline font-semibold"
                        >
                          <ExternalLink className="w-3 h-3" /> مشاهده مستندات / تصویر پیوست
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions bottom bar */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {/* Status change actions for assignee */}
                    {task.status === 'Pending' && isAssignedToMe && (
                      <button
                        onClick={() => onUpdateTaskStatus(task.id, 'In Progress')}
                        className="px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all cursor-pointer"
                      >
                        شروع کار (در حال انجام)
                      </button>
                    )}

                    {(task.status === 'In Progress' || (task.status === 'Pending' && isAssignedToMe)) && (
                      <button
                        onClick={() => setSubmitTaskModal(task)}
                        className="px-3 py-1.5 text-xs font-bold rounded-xl bg-sky-500 text-slate-950 hover:bg-sky-400 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Send className="w-3.5 h-3.5" /> ثبت و ارسال گزارش
                      </button>
                    )}

                    {/* High rank verification button */}
                    {isTopFour && task.status === 'Completed' && (
                      <button
                        onClick={() => onUpdateTaskStatus(task.id, 'Verified')}
                        className="px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> تایید نهایی
                      </button>
                    )}
                  </div>

                  {/* Delete button for Top 4 */}
                  {isTopFour && (
                    <button
                      onClick={() => onDeleteTask(task.id)}
                      title="حذف وظیفه"
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create New Task */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-sky-400" /> تعریف کار جدید برای اعضای کادر
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  ارسال دستور کار رسمی توسط ۴ رنک اصلی
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTaskSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">عنوان کار / دستورالعمل *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="مثلاً: بررسی و تایید قوانین جدید فکشن‌ها"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">توضیحات و جزئیات کار *</label>
                <textarea
                  required
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="شرح دقیق وظیفه و انتظارات مدیریت..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-sky-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">اولویت انجام</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="Low">کم (عادی)</option>
                    <option value="Medium">متوسط</option>
                    <option value="High">بالا</option>
                    <option value="Critical">بسیار مهم و ضروری</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">ماه / دوره زمانی</label>
                  <input
                    type="text"
                    value={newMonthYear}
                    onChange={(e) => setNewMonthYear(e.target.value)}
                    placeholder="مثلاً: مرداد ۱۴۰۵"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">تخصیص به چه کسانی؟</label>
                  <select
                    value={newAssignedToType}
                    onChange={(e) => setNewAssignedToType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="All">همه اعضای استف (General)</option>
                    <option value="Rank">بر اساس رنک خاص</option>
                    <option value="User">کاربر مشخص</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">مهلت انجام (تاریخ)</label>
                  <input
                    type="date"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {newAssignedToType === 'Rank' && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">انتخاب رنک هدف</label>
                  <select
                    value={newTargetRole}
                    onChange={(e) => setNewTargetRole(e.target.value as UserRole)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    {ALL_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {newAssignedToType === 'User' && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">انتخاب فرد مسئول</label>
                  <select
                    value={newTargetUserId}
                    onChange={(e) => setNewTargetUserId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="">انتخاب از میان اعضا...</option>
                    {allUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.firstName} {u.lastName} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold shadow-lg"
                >
                  ثبت و ابلاغ وظیفه
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Submit Task Completion */}
      {submitTaskModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Send className="w-5 h-5 text-sky-400" /> ثبت گزارش و انجام وظیفه
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{submitTaskModal.title}</p>
              </div>
              <button
                onClick={() => setSubmitTaskModal(null)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCompletionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">توضیحات انجام کار *</label>
                <textarea
                  required
                  rows={3}
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="توضیح دهید کار چگونه انجام شد و چه اقداماتی صورت گرفت..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-sky-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  لینک مستندات / اسکرین‌شات پیوست (اختیاری)
                </label>
                <input
                  type="url"
                  value={completionProofUrl}
                  onChange={(e) => setCompletionProofUrl(e.target.value)}
                  placeholder="https://imgur.com/..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSubmitTaskModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold shadow-lg"
                >
                  ارسال گزارش انجام کار
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
