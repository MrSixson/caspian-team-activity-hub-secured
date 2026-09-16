import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  Calendar,
  Send,
  Lock,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Plus,
  User as UserIcon,
  Filter,
  Sparkles,
  FileText,
  ShieldCheck,
  ChevronRight,
  PhoneCall,
  Shield,
  Crown,
  Award,
  UserCheck,
  RefreshCw,
  Search,
  AlertTriangle,
  Flame,
  Copy,
  Paperclip,
  Tag,
  Share2,
  Info,
  Check,
  Trash2,
} from 'lucide-react';
import {
  Ticket,
  TicketType,
  TicketStatus,
  TicketPriority,
  TicketMessage,
  User,
  UserRole,
  ALL_ROLES,
} from '../types';
import { isTopFourRank, isManagementRank, canManageTickets } from '../lib/permissions';
import { RoleBadge } from './RoleBadge';
import { playUiSound } from '../lib/audioFx';

interface TicketSystemProps {
  currentUser: User;
  tickets?: Ticket[];
  allUsers?: User[];
  onSaveTickets?: (updatedTickets: Ticket[]) => void;
  onCreateTicket?: (
    ticketData: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'userName' | 'userRole' | 'messages'>,
    initialMessage: string
  ) => Ticket | void;
  onReplyTicket?: (ticketId: string, message: string) => void;
  onUpdateTicketStatus?: (ticketId: string, status: TicketStatus) => void;
  onAssignUserRole?: (targetUserId: string, newRole: UserRole, ticketId?: string) => void;
  onDeleteTicket?: (ticketId: string) => void;
  soundFx?: any;
}

export const TicketSystem: React.FC<TicketSystemProps> = ({
  currentUser,
  tickets = [],
  allUsers = [],
  onSaveTickets,
  onCreateTicket,
  onReplyTicket,
  onUpdateTicketStatus,
  onAssignUserRole,
  onDeleteTicket,
  soundFx,
}) => {
  // Check if current user belongs to the 4 Top Admin Ranks (Founder, Owner, Supervisor, Moderator, Manager)
  const isHighRank =
    canManageTickets(currentUser) ||
    isTopFourRank(currentUser.role) ||
    isManagementRank(currentUser.role) ||
    currentUser.permissionLevel === 'Founder' ||
    currentUser.permissionLevel === 'Owner' ||
    currentUser.permissionLevel === 'HighRank' ||
    currentUser.role === 'Moderator' ||
    currentUser.role === 'Supervisor';

  const safeTickets = tickets || [];
  const myTickets = safeTickets.filter((t) => t.userId === currentUser.id);

  // Filter & Search states
  const [activeFilter, setActiveFilter] = useState<'my' | 'all' | 'RoleRequest' | 'HighRankTalk' | 'LeaveRequest' | 'TechnicalSupport'>(
    () => (isHighRank ? 'all' : 'my')
  );
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(() => {
    if (isHighRank && safeTickets.length > 0) return safeTickets[0].id;
    if (myTickets.length > 0) return myTickets[0].id;
    return null;
  });

  // Default pre-fills for rank request
  const defaultRankTitle = `درخواست تعیین رنک سازمانی: ${currentUser.firstName} ${currentUser.lastName}`;
  const defaultRankMessage = `سلام و احترام خدمت ۴ رنک اصلی کادر سرور کاسپین (Founder, Owner, Supervisor, Moderator).\nمن در سیستم ثبت‌نام کرده‌ام و آماده فعالیت هستم.\n• نام و نام خانوادگی: ${currentUser.firstName} ${currentUser.lastName}\n• نام کاربری / تیم‌اسپیک: ${currentUser.teamspeakName || currentUser.username}\nلطفاً رنک سازمانی بنده را تعیین و دسترسی‌های کادر را فعال فرمایید.`;

  // New Ticket Form state
  const [isCreating, setIsCreating] = useState<boolean>(() => {
    return currentUser.isRankAssigned === false && myTickets.length === 0;
  });
  const [ticketType, setTicketType] = useState<TicketType>('RoleRequest');
  const [ticketPriority, setTicketPriority] = useState<TicketPriority>('Normal');
  const [title, setTitle] = useState(currentUser.isRankAssigned === false ? defaultRankTitle : '');
  const [subject, setSubject] = useState('');
  const [initialMessage, setInitialMessage] = useState(currentUser.isRankAssigned === false ? defaultRankMessage : '');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  // Role Assignment inside Ticket
  const [selectedRoleToAssign, setSelectedRoleToAssign] = useState<UserRole>('Helper');
  const [assignSuccessMessage, setAssignSuccessMessage] = useState<string | null>(null);

  // Leave request extra fields
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  // Reply message & Internal Staff Note state
  const [replyText, setReplyText] = useState('');
  const [replyAttachment, setReplyAttachment] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null);

  // Quick Preset Replies for Top 4 Admins
  const quickReplies = [
    {
      label: '👑 تایید رنک سازمانی',
      text: 'درخواست رنک سازمانی شما توسط کادر مدیریت ارشد (۴ رنک اصلی) بررسی و تایید شد. دسترسی‌های اختصاصی شما فعال گردید.',
    },
    {
      label: '🎧 مراجعه به تیم‌اسپیک جهت تست',
      text: 'سلام و احترام؛ لطفاً جهت انجام تست اولیه و مصاحبه هماهنگی، در کانال Waiting For Test تیم‌اسپیک سرور حضور به هم رسانید.',
    },
    {
      label: '🏖️ تایید درخواست مرخصی',
      text: 'با درخواست مرخصی شما در تاریخ مشخص‌شده موافقت به عمل آمد. لطفاً در تاریخ مقرر به شیفت خود بازگردید.',
    },
    {
      label: '❌ عدم موافقت با مرخصی',
      text: 'به دلیل کمبود کادر در این بازه زمانی و نیاز مبرم به حضور شما در سرور، متاسفانه در این تاریخ با مرخصی موافقت نمی‌شود.',
    },
    {
      label: '⏳ نیاز به توضیحات بیشتر',
      text: 'تیکت شما بررسی شد؛ لطفاً توضیحات تکمیلی یا مدارک پیوست را در همین تیکت ارسال فرمایید تا اقدام نهایی صورت پذیرد.',
    },
    {
      label: '🔒 مختومه و بستن تیکت',
      text: 'موضوع مطرح‌شده بررسی و حل گردید. تیکت مختومه اعلام می‌شود. در صورت بروز سوال جدید می‌توانید تیکت جدید ارسال نمایید.',
    },
  ];

  // Quick 1-click submit for unranked users
  const handleQuickSubmitRankRequest = () => {
    const finalTitle = title.trim() || defaultRankTitle;
    const finalMsg = initialMessage.trim() || defaultRankMessage;

    if (onCreateTicket) {
      const created = onCreateTicket(
        {
          type: 'RoleRequest',
          title: finalTitle,
          subject: finalTitle,
          status: 'Open',
          priority: 'High',
        },
        finalMsg
      );
      if (created && created.id) {
        setSelectedTicketId(created.id);
      }
    } else if (onSaveTickets) {
      const newTicket: Ticket = {
        id: `ticket-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId: currentUser.id,
        userName: `${currentUser.firstName} ${currentUser.lastName}`,
        userRole: currentUser.role,
        userAvatar: currentUser.avatarUrl,
        userTeamspeak: currentUser.teamspeakName,
        type: 'RoleRequest',
        title: finalTitle,
        subject: finalTitle,
        status: 'Open',
        priority: 'High',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [
          {
            id: `msg-${Date.now()}`,
            senderId: currentUser.id,
            senderName: `${currentUser.firstName} ${currentUser.lastName}`,
            senderRole: currentUser.role,
            message: finalMsg,
            createdAt: new Date().toISOString(),
          },
        ],
      };
      onSaveTickets([newTicket, ...safeTickets]);
      setSelectedTicketId(newTicket.id);
    }

    setIsCreating(false);
    setActiveFilter('my');
    playUiSound('success', soundFx);
  };

  // Filtered tickets calculation
  const visibleTickets = useMemo(() => {
    return safeTickets.filter((t) => {
      // Role scope filter
      if (activeFilter === 'my') {
        if (t.userId !== currentUser.id) return false;
      } else if (
        activeFilter === 'RoleRequest' ||
        activeFilter === 'HighRankTalk' ||
        activeFilter === 'LeaveRequest' ||
        activeFilter === 'TechnicalSupport'
      ) {
        if (t.type !== activeFilter) return false;
        if (!isHighRank && t.userId !== currentUser.id) return false;
      } else if (activeFilter === 'all') {
        if (!isHighRank && t.userId !== currentUser.id) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;

      // Priority filter
      if (priorityFilter !== 'all' && (t.priority || 'Normal') !== priorityFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const authorMatch = t.userName?.toLowerCase().includes(q);
        const titleMatch = t.title?.toLowerCase().includes(q);
        const subjectMatch = t.subject?.toLowerCase().includes(q);
        const teamspeakMatch = t.userTeamspeak?.toLowerCase().includes(q);
        const idMatch = t.id?.toLowerCase().includes(q);
        const messageMatch = t.messages?.some((m) => m.message?.toLowerCase().includes(q));

        if (!authorMatch && !titleMatch && !subjectMatch && !teamspeakMatch && !idMatch && !messageMatch) {
          return false;
        }
      }

      return true;
    });
  }, [safeTickets, activeFilter, statusFilter, priorityFilter, searchQuery, currentUser.id, isHighRank]);

  const selectedTicket = safeTickets.find((t) => t.id === selectedTicketId) || null;
  const ticketTargetUser = selectedTicket ? allUsers.find((u) => u.id === selectedTicket.userId) : null;

  // Handler to Create Ticket
  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = title.trim() || (ticketType === 'RoleRequest' ? defaultRankTitle : 'تیکت جدید کادر');
    const finalMsg = initialMessage.trim() || (ticketType === 'RoleRequest' ? defaultRankMessage : '');
    if (!finalTitle || !finalMsg) return;

    if (onCreateTicket) {
      const created = onCreateTicket(
        {
          type: ticketType,
          title: finalTitle,
          subject: subject.trim() || finalTitle,
          status: 'Open',
          priority: ticketPriority,
          startDate: ticketType === 'LeaveRequest' ? startDate : undefined,
          endDate: ticketType === 'LeaveRequest' ? endDate : undefined,
          leaveReason: ticketType === 'LeaveRequest' ? leaveReason : undefined,
          emergencyContact: ticketType === 'LeaveRequest' ? emergencyContact : undefined,
        },
        finalMsg
      );
      if (created && created.id) {
        setSelectedTicketId(created.id);
      }
    } else if (onSaveTickets) {
      const newTicket: Ticket = {
        id: `ticket-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId: currentUser.id,
        userName: `${currentUser.firstName} ${currentUser.lastName}`,
        userRole: currentUser.role,
        userAvatar: currentUser.avatarUrl,
        userTeamspeak: currentUser.teamspeakName,
        type: ticketType,
        title: finalTitle,
        subject: subject.trim() || finalTitle,
        status: 'Open',
        priority: ticketPriority,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        startDate: ticketType === 'LeaveRequest' ? startDate : undefined,
        endDate: ticketType === 'LeaveRequest' ? endDate : undefined,
        leaveReason: ticketType === 'LeaveRequest' ? leaveReason : undefined,
        emergencyContact: ticketType === 'LeaveRequest' ? emergencyContact : undefined,
        messages: [
          {
            id: `msg-${Date.now()}`,
            senderId: currentUser.id,
            senderName: `${currentUser.firstName} ${currentUser.lastName}`,
            senderRole: currentUser.role,
            message: finalMsg,
            createdAt: new Date().toISOString(),
            attachmentUrl: attachmentUrl.trim() || undefined,
          },
        ],
      };
      onSaveTickets([newTicket, ...safeTickets]);
      setSelectedTicketId(newTicket.id);
    }

    setIsCreating(false);
    setActiveFilter(isHighRank ? 'all' : 'my');
    setTitle('');
    setSubject('');
    setInitialMessage('');
    setStartDate('');
    setEndDate('');
    setLeaveReason('');
    setEmergencyContact('');
    setAttachmentUrl('');
    playUiSound('success', soundFx);
  };

  // Handler to Send Reply
  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    if (onReplyTicket && !isInternalNote) {
      onReplyTicket(selectedTicket.id, replyText.trim());
    } else if (onSaveTickets) {
      const updatedTickets = safeTickets.map((t) => {
        if (t.id === selectedTicket.id) {
          const isStaff = isHighRank && t.userId !== currentUser.id;
          const newStatus: TicketStatus = isInternalNote ? t.status : isStaff ? 'Answered' : 'InReview';
          return {
            ...t,
            status: newStatus,
            updatedAt: new Date().toISOString(),
            messages: [
              ...(t.messages || []),
              {
                id: `msg-${Date.now()}`,
                senderId: currentUser.id,
                senderName: `${currentUser.firstName} ${currentUser.lastName}`,
                senderRole: currentUser.role,
                message: replyText.trim(),
                createdAt: new Date().toISOString(),
                isStaffReply: isStaff,
                isInternalNote: isInternalNote,
                attachmentUrl: replyAttachment.trim() || undefined,
              },
            ],
          };
        }
        return t;
      });
      onSaveTickets(updatedTickets);
    }

    setReplyText('');
    setReplyAttachment('');
    setIsInternalNote(false);
    playUiSound('success', soundFx);
  };

  // Handler to update ticket status
  const handleUpdateStatus = (ticketId: string, newStatus: TicketStatus) => {
    if (!isHighRank) return;
    if (onUpdateTicketStatus) {
      onUpdateTicketStatus(ticketId, newStatus);
    } else if (onSaveTickets) {
      const updatedTickets = safeTickets.map((t) => {
        if (t.id === ticketId) {
          return {
            ...t,
            status: newStatus,
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      });
      onSaveTickets(updatedTickets);
    }
    playUiSound('click', soundFx);
  };

  // Handler to update ticket priority
  const handleUpdatePriority = (ticketId: string, newPriority: TicketPriority) => {
    if (!isHighRank) return;
    if (onSaveTickets) {
      const updated = safeTickets.map((t) => (t.id === ticketId ? { ...t, priority: newPriority, updatedAt: new Date().toISOString() } : t));
      onSaveTickets(updated);
    }
    playUiSound('click', soundFx);
  };

  // Handler to assign admin to ticket
  const handleAssignAdminToTicket = (ticketId: string, adminUser: User | null) => {
    if (!isHighRank) return;
    if (onSaveTickets) {
      const updated = safeTickets.map((t) => {
        if (t.id === ticketId) {
          return {
            ...t,
            assignedAdminId: adminUser?.id,
            assignedAdminName: adminUser ? `${adminUser.firstName} ${adminUser.lastName}` : undefined,
            assignedAdminRole: adminUser?.role,
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      });
      onSaveTickets(updated);
    }
    playUiSound('success', soundFx);
  };

  // Handler to assign role directly from ticket
  const handleAssignRoleFromTicket = () => {
    if (!selectedTicket || !isHighRank) return;
    const targetId = selectedTicket.userId;
    if (onAssignUserRole) {
      onAssignUserRole(targetId, selectedRoleToAssign, selectedTicket.id);
    }
    setAssignSuccessMessage(`رنک سازمانی با موفقیت به «${selectedRoleToAssign}» تعیین و دسترسی‌های این کاربر فعال شد.`);
    playUiSound('success', soundFx);
    setTimeout(() => setAssignSuccessMessage(null), 6000);
  };

  // Copy Ticket Transcript to Clipboard
  const handleCopyTranscript = () => {
    if (!selectedTicket) return;
    const transcriptLines = [
      `=== 📄 صورت‌جلسه و گزارش تیکت سرور کاسپین ===`,
      `شناسه تیکت: ${selectedTicket.id}`,
      `عنوان: ${selectedTicket.title}`,
      `نوع تیکت: ${selectedTicket.type}`,
      `وضعیت: ${selectedTicket.status}`,
      `اولویت: ${selectedTicket.priority || 'Normal'}`,
      `ایجادکننده: ${selectedTicket.userName} (${selectedTicket.userRole})`,
      `مسئول پیگیری: ${selectedTicket.assignedAdminName || 'مدیریت ارشد'}`,
      `تاریخ ایجاد: ${new Date(selectedTicket.createdAt).toLocaleString('fa-IR')}`,
      `------------------------------------------`,
      `متن پیام‌ها:`,
      ...selectedTicket.messages.map(
        (m, idx) =>
          `[${idx + 1}] ${m.senderName} (${m.senderRole}) [${new Date(m.createdAt).toLocaleTimeString('fa-IR')}]:\n${m.message}${
            m.isInternalNote ? ' (یادداشت محرمانه)' : ''
          }\n`
      ),
      `==========================================`,
    ];

    navigator.clipboard.writeText(transcriptLines.join('\n'));
    setCopiedTranscript(true);
    playUiSound('success', soundFx);
    setTimeout(() => setCopiedTranscript(false), 3000);
  };

  // Handler to permanently delete a ticket
  const handleConfirmDeleteTicket = (ticketId: string) => {
    if (!isHighRank) return;
    if (onDeleteTicket) {
      onDeleteTicket(ticketId);
    } else if (onSaveTickets) {
      const updated = safeTickets.filter((t) => t.id !== ticketId);
      onSaveTickets(updated);
    }
    if (selectedTicketId === ticketId) {
      setSelectedTicketId(null);
    }
    setTicketToDelete(null);
    playUiSound('warning', soundFx);
  };

  // Status Badge Helper
  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'Open':
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <Clock className="w-3 h-3" /> در انتظار پاسخ
          </span>
        );
      case 'InReview':
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> در حال بررسی مدیریت
          </span>
        );
      case 'Answered':
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> پاسخ داده شده
          </span>
        );
      case 'OnHold':
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center gap-1">
            <Lock className="w-3 h-3" /> معلق / در نوبت اقدام
          </span>
        );
      case 'Closed':
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
            <XCircle className="w-3 h-3" /> مختومه / بسته شده
          </span>
        );
    }
  };

  // Priority Badge Helper
  const getPriorityBadge = (priority?: TicketPriority) => {
    const p = priority || 'Normal';
    switch (p) {
      case 'Urgent':
        return (
          <span className="px-2 py-0.5 text-[10px] font-black rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 animate-pulse">
            <Flame className="w-3 h-3 text-rose-400" /> فوری و اضطراری
          </span>
        );
      case 'High':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-400" /> اولویت بالا
          </span>
        );
      case 'Low':
        return (
          <span className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
            اولویت پایین
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/80 flex items-center gap-1">
            عادی
          </span>
        );
    }
  };

  // Stats Counters
  const openTicketsCount = safeTickets.filter((t) => t.status === 'Open').length;
  const roleRequestsCount = safeTickets.filter((t) => t.type === 'RoleRequest').length;
  const leaveRequestsCount = safeTickets.filter((t) => t.type === 'LeaveRequest').length;
  const answeredTicketsCount = safeTickets.filter((t) => t.status === 'Answered' || t.status === 'Closed').length;

  return (
    <div className="space-y-6 dir-rtl text-right font-sans">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 border border-indigo-900/50 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-600/20 border border-indigo-500/40 rounded-2xl text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                <MessageSquare className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    مرکز پشتیبانی و تیکتینگ کادر سرور کاسپین
                  </h2>
                  {isHighRank && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow">
                      پنل ۴ رنک اصلی
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 max-w-2xl leading-relaxed mt-1">
                  {isHighRank
                    ? 'سامانه هماهنگ بررسی تیکت‌ها، درخواست‌های تعیین رنک رسمی، مرخصی و مکاتبات اداری توسط ۴ رنک اصلی (Founder, Owner, Supervisor, Moderator).'
                    : 'ثبت و پیگیری مستقیم درخواست‌های تعیین رنک، ثبت مرخصی، پشتیبانی فنی و مکاتبه مستقیم با ۴ رنک اصلی سرور.'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setIsCreating(true);
                setSelectedTicketId(null);
                setTicketType(currentUser.isRankAssigned === false ? 'RoleRequest' : 'HighRankTalk');
                setTitle(currentUser.isRankAssigned === false ? defaultRankTitle : '');
                setInitialMessage(currentUser.isRankAssigned === false ? defaultRankMessage : '');
              }}
              className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white text-xs font-black rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>ثبت تیکت جدید</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 text-center">
            <div className="text-xl font-black text-white font-mono">{safeTickets.length}</div>
            <div className="text-[11px] text-slate-400 font-bold mt-0.5">کل تیکت‌های سامانه</div>
          </div>

          <div className="bg-slate-900/80 border border-amber-500/30 rounded-2xl p-3 text-center">
            <div className="text-xl font-black text-amber-400 font-mono">{openTicketsCount}</div>
            <div className="text-[11px] text-amber-300 font-bold mt-0.5">در انتظار پاسخ مدیریت</div>
          </div>

          <div className="bg-slate-900/80 border border-indigo-500/30 rounded-2xl p-3 text-center">
            <div className="text-xl font-black text-indigo-400 font-mono">{roleRequestsCount}</div>
            <div className="text-[11px] text-indigo-300 font-bold mt-0.5">درخواست‌های تعیین رنک</div>
          </div>

          <div className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-3 text-center">
            <div className="text-xl font-black text-emerald-400 font-mono">{answeredTicketsCount}</div>
            <div className="text-[11px] text-emerald-300 font-bold mt-0.5">پاسخ‌داده‌شده و مختومه</div>
          </div>
        </div>
      </div>

      {/* Unranked Alert Banner with 1-Click Fast Submit */}
      {currentUser.isRankAssigned === false && (
        <div className="bg-gradient-to-r from-amber-950/80 via-amber-900/40 to-slate-950 border-2 border-amber-500/60 rounded-3xl p-5 sm:p-6 shadow-[0_0_30px_rgba(245,158,11,0.2)] relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="p-3.5 bg-amber-500/20 rounded-2xl text-amber-400 shrink-0 border border-amber-500/40 shadow-md">
                <Crown className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 shadow">
                    مرحله الزامی ثبت‌نام
                  </span>
                  <h3 className="text-sm font-black text-amber-200">
                    ارسال تیکت تعیین رنک به ۴ رنک اصلی سرور کاسپین
                  </h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                  سلام <span className="text-white font-bold">{currentUser.firstName}</span> عزیز! حساب کاربری شما ایجاد شده است. برای ست شدن رنک رسمی و باز شدن تمامی دسترسی‌های کادر، لطفاً با کلیک روی دکمه زیر تیکت تعیین رنک خود را به ۴ رنک اصلی (Founder, Owner, Supervisor, Moderator) ارسال فرمایید.
                </p>
              </div>
            </div>

            {myTickets.filter((t) => t.type === 'RoleRequest').length === 0 ? (
              <button
                type="button"
                onClick={handleQuickSubmitRankRequest}
                className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-black rounded-2xl shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
                <span>🚀 ارسال فوری تیکت تعیین رنک</span>
              </button>
            ) : (
              <div className="flex items-center gap-2.5 bg-amber-500/10 border border-amber-500/30 px-4 py-2.5 rounded-2xl text-xs font-bold text-amber-300">
                <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>تیکت شما ثبت شده و در نوبت بررسی ۴ رنک اصلی است</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Ticket Console Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tickets Navigation, Search, and Filters */}
        <div className="lg:col-span-5 space-y-4">
          {/* Main Filter Tabs */}
          <div className="bg-slate-950/90 border border-slate-800 p-2 rounded-2xl flex flex-wrap gap-1.5 shadow-md">
            <button
              onClick={() => setActiveFilter('my')}
              className={`flex-1 min-w-[100px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeFilter === 'my'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>تیکت‌های من</span>
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-slate-800 text-slate-300 font-mono">
                {myTickets.length}
              </span>
            </button>

            {isHighRank && (
              <button
                onClick={() => setActiveFilter('all')}
                className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeFilter === 'all'
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>همه (۴ رنک اصلی)</span>
                <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-indigo-900/60 text-indigo-200 font-mono">
                  {safeTickets.length}
                </span>
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <button
              onClick={() => setActiveFilter('RoleRequest')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                activeFilter === 'RoleRequest'
                  ? 'bg-amber-500 text-slate-950 font-black shadow'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>تعیین رنک</span>
            </button>

            <button
              onClick={() => setActiveFilter('HighRankTalk')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                activeFilter === 'HighRankTalk'
                  ? 'bg-indigo-600 text-white font-bold shadow'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
              <span>صحبت با های‌رنک</span>
            </button>

            <button
              onClick={() => setActiveFilter('LeaveRequest')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                activeFilter === 'LeaveRequest'
                  ? 'bg-sky-600 text-white font-bold shadow'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-sky-400" />
              <span>مرخصی</span>
            </button>

            <button
              onClick={() => setActiveFilter('TechnicalSupport')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                activeFilter === 'TechnicalSupport'
                  ? 'bg-purple-600 text-white font-bold shadow'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>پشتیبانی فنی</span>
            </button>
          </div>

          {/* Search & Secondary Filters Bar */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3 space-y-2.5 shadow-sm">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در تیکت‌ها، نام عضو یا پیام..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-3 pl-8 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-slate-300 outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="Open">در انتظار پاسخ</option>
                <option value="InReview">در حال بررسی</option>
                <option value="Answered">پاسخ داده شده</option>
                <option value="OnHold">معلق</option>
                <option value="Closed">بسته شده</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-slate-300 outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">همه اولویت‌ها</option>
                <option value="Urgent">فوری و اضطراری</option>
                <option value="High">اولویت بالا</option>
                <option value="Normal">اولویت عادی</option>
                <option value="Low">اولویت پایین</option>
              </select>
            </div>
          </div>

          {/* Tickets List */}
          <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1 no-scrollbar">
            {visibleTickets.length === 0 ? (
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-8 text-center text-slate-500">
                <MessageSquare className="w-10 h-10 mx-auto mb-2.5 opacity-30 text-indigo-400" />
                <p className="text-xs font-bold text-slate-400">هیچ تیکتی مطابق با فیلتر یافت نشد.</p>
                <p className="text-[11px] text-slate-500 mt-1">می‌توانید با دکمه «ثبت تیکت جدید» درخواست خود را ارسال فرمایید.</p>
              </div>
            ) : (
              visibleTickets.map((t) => {
                const isSelected = selectedTicketId === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      setSelectedTicketId(t.id);
                      setIsCreating(false);
                      setAssignSuccessMessage(null);
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'bg-slate-900 border-indigo-500 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/50'
                        : 'bg-slate-950/70 border-slate-800/80 hover:bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                            t.type === 'RoleRequest'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : t.type === 'LeaveRequest'
                              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                              : t.type === 'TechnicalSupport'
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                              : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          }`}
                        >
                          {t.type === 'RoleRequest'
                            ? '👑 تعیین رنک'
                            : t.type === 'LeaveRequest'
                            ? '🏖️ مرخصی'
                            : t.type === 'TechnicalSupport'
                            ? '🔧 فنی'
                            : '💬 صحبت'}
                        </span>
                        <RoleBadge role={t.userRole} size="xs" />
                      </div>

                      <div className="flex items-center gap-1.5">
                        {getPriorityBadge(t.priority)}
                        {getStatusBadge(t.status)}
                      </div>
                    </div>

                    <h4 className="text-xs font-black text-slate-100 truncate mb-1">{t.title}</h4>

                    {t.assignedAdminName && (
                      <div className="text-[10px] text-indigo-300 font-bold flex items-center gap-1 mb-2 bg-indigo-950/50 border border-indigo-900/40 px-2 py-0.5 rounded-lg w-fit">
                        <Shield className="w-3 h-3 text-indigo-400" />
                        <span>مسئول پیگیری: {t.assignedAdminName}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800/80">
                      <span className="font-medium">عضو: {t.userName}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">
                          {new Date(t.updatedAt).toLocaleDateString('fa-IR', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {isHighRank && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTicketToDelete(t);
                            }}
                            title="حذف تیکت"
                            className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Ticket Detail View or Create Form */}
        <div className="lg:col-span-7">
          {isCreating ? (
            /* Create Ticket Form */
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-600/20 rounded-xl text-indigo-400 border border-indigo-500/30">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">ثبت و ارسال تیکت جدید</h3>
                    <p className="text-[11px] text-slate-400">تیکت شما به صورت آنی برای ۴ رنک اصلی ارسال می‌گردد.</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreating(false)}
                  className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer"
                >
                  انصراف
                </button>
              </div>

              <form onSubmit={handleCreateTicket} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">نوع تیکت</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTicketType('RoleRequest');
                        setTitle(defaultRankTitle);
                        setInitialMessage(defaultRankMessage);
                      }}
                      className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        ticketType === 'RoleRequest'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Crown className="w-5 h-5 text-amber-400" />
                      <span>👑 تعیین رنک</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTicketType('HighRankTalk');
                        setTitle('');
                        setInitialMessage('');
                      }}
                      className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        ticketType === 'HighRankTalk'
                          ? 'bg-indigo-600/25 border-indigo-500 text-indigo-300 shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <MessageSquare className="w-5 h-5 text-indigo-400" />
                      <span>💬 صحبت با های‌رنک</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTicketType('LeaveRequest');
                        setTitle(`درخواست مرخصی: ${currentUser.firstName} ${currentUser.lastName}`);
                        setInitialMessage('');
                      }}
                      className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        ticketType === 'LeaveRequest'
                          ? 'bg-sky-600/25 border-sky-500 text-sky-300 shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Calendar className="w-5 h-5 text-sky-400" />
                      <span>🏖️ ثبت مرخصی</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTicketType('TechnicalSupport');
                        setTitle('');
                        setInitialMessage('');
                      }}
                      className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        ticketType === 'TechnicalSupport'
                          ? 'bg-purple-600/25 border-purple-500 text-purple-300 shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Sparkles className="w-5 h-5 text-purple-400" />
                      <span>🔧 پشتیبانی فنی</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-300 mb-1">عنوان تیکت</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={
                        ticketType === 'RoleRequest'
                          ? 'درخواست بررسی و تایید رنک سازمانی'
                          : ticketType === 'LeaveRequest'
                          ? 'درخواست مرخصی ۳ روزه'
                          : 'عنوان پیام یا موضوع خود را بنویسید...'
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">اولویت تیکت</label>
                    <select
                      value={ticketPriority}
                      onChange={(e) => setTicketPriority(e.target.value as TicketPriority)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-100 outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="Normal">عادی</option>
                      <option value="High">بالا</option>
                      <option value="Urgent">فوری و اضطراری</option>
                      <option value="Low">پایین</option>
                    </select>
                  </div>
                </div>

                {ticketType === 'LeaveRequest' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
                    <div>
                      <label className="block text-[11px] font-bold text-amber-400 mb-1">تاریخ شروع مرخصی</label>
                      <input
                        type="text"
                        required
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        placeholder="۱۴۰۵/۰۶/۰۱"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-100 outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-amber-400 mb-1">تاریخ پایان مرخصی</label>
                      <input
                        type="text"
                        required
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        placeholder="۱۴۰۵/۰۶/۰۵"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-100 outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">شماره تماس اضطراری</label>
                      <input
                        type="text"
                        value={emergencyContact}
                        onChange={(e) => setEmergencyContact(e.target.value)}
                        placeholder="0912..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-100 outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">متن تیکت یا درخواست</label>
                  <textarea
                    required
                    rows={5}
                    value={initialMessage}
                    onChange={(e) => setInitialMessage(e.target.value)}
                    placeholder="توضیحات دقیق خود را جهت بررسی و اقدام ۴ رنک اصلی بنویسید..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3.5 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500 resize-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 flex items-center gap-1">
                    <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                    <span>لینک فایل / عکس پیوست (اختیاری)</span>
                  </label>
                  <input
                    type="url"
                    value={attachmentUrl}
                    onChange={(e) => setAttachmentUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500 font-mono text-left dir-ltr"
                  />
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <span className="text-[11px] text-slate-400">
                    🔒 پیام شما مستقیماً به پنل ۴ رنک اصلی ارسال می‌شود.
                  </span>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>ارسال تیکت به مدیریت ۴ رنک اصلی</span>
                  </button>
                </div>
              </form>
            </div>
          ) : selectedTicket ? (
            /* Selected Ticket View & Administrative Console */
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl relative flex flex-col h-full min-h-[600px]">
              {/* Ticket Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black ${
                        selectedTicket.type === 'RoleRequest'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : selectedTicket.type === 'LeaveRequest'
                          ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                          : selectedTicket.type === 'TechnicalSupport'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      }`}
                    >
                      {selectedTicket.type === 'RoleRequest'
                        ? '👑 تعیین رنک'
                        : selectedTicket.type === 'LeaveRequest'
                        ? '🏖️ درخواست مرخصی'
                        : selectedTicket.type === 'TechnicalSupport'
                        ? '🔧 پشتیبانی فنی'
                        : '💬 صحبت با های‌رنک'}
                    </span>

                    <h3 className="text-sm font-black text-white">{selectedTicket.title}</h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-0.5">
                    <span className="flex items-center gap-1">
                      <span>ارسال‌کننده:</span>
                      <strong className="text-white">{selectedTicket.userName}</strong>
                    </span>
                    <RoleBadge role={ticketTargetUser?.role || selectedTicket.userRole} size="xs" />
                    {selectedTicket.userTeamspeak && (
                      <span className="text-slate-500 font-mono text-[11px]">
                        [تیم‌اسپیک: {selectedTicket.userTeamspeak}]
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {getPriorityBadge(selectedTicket.priority)}
                  {getStatusBadge(selectedTicket.status)}

                  <button
                    onClick={handleCopyTranscript}
                    title="کپی متن کامل تیکت جهت بایگانی"
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
                  >
                    {copiedTranscript ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>

                  {isHighRank && (
                    <button
                      onClick={() => setTicketToDelete(selectedTicket)}
                      title="حذف کامل این تیکت"
                      className="p-2 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-400 hover:bg-rose-900/60 hover:text-rose-200 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">حذف تیکت</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 4 Top Admin Control Suite (Only visible to Top 4 Ranks) */}
              {isHighRank && (
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-900/60 rounded-2xl p-4 space-y-3.5 shadow-inner">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-indigo-900/40 pb-2.5">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-black text-white">
                        جعبه ابزار مدیریت تیکت (۴ رنک اصلی سرور)
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Priority selector */}
                      <select
                        value={selectedTicket.priority || 'Normal'}
                        onChange={(e) => handleUpdatePriority(selectedTicket.id, e.target.value as TicketPriority)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] font-bold text-amber-300 outline-none cursor-pointer"
                      >
                        <option value="Urgent">🔥 اولویت فوری</option>
                        <option value="High">⚠️ اولویت بالا</option>
                        <option value="Normal">🔹 اولویت عادی</option>
                        <option value="Low">▫️ اولویت پایین</option>
                      </select>

                      {/* Status changer buttons */}
                      <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-[11px]">
                        <button
                          onClick={() => handleUpdateStatus(selectedTicket.id, 'InReview')}
                          className={`px-2 py-1 rounded cursor-pointer font-bold ${
                            selectedTicket.status === 'InReview'
                              ? 'bg-sky-600 text-white'
                              : 'text-sky-400 hover:bg-slate-900'
                          }`}
                        >
                          بررسی
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(selectedTicket.id, 'Answered')}
                          className={`px-2 py-1 rounded cursor-pointer font-bold ${
                            selectedTicket.status === 'Answered'
                              ? 'bg-emerald-600 text-white'
                              : 'text-emerald-400 hover:bg-slate-900'
                          }`}
                        >
                          پاسخ‌داده
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(selectedTicket.id, 'Closed')}
                          className={`px-2 py-1 rounded cursor-pointer font-bold ${
                            selectedTicket.status === 'Closed'
                              ? 'bg-rose-600 text-white'
                              : 'text-rose-400 hover:bg-slate-900'
                          }`}
                        >
                          بستن
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 1-Click Role Setter Panel */}
                  <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3 space-y-2.5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="text-xs font-black text-amber-200">
                          تعیین فوری رنک رسمی و اعطای دسترسی کادر سرور
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <span>رنک فعلی کاربر:</span>
                        <RoleBadge role={ticketTargetUser?.role || selectedTicket.userRole} size="xs" />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <select
                        value={selectedRoleToAssign}
                        onChange={(e) => setSelectedRoleToAssign(e.target.value as UserRole)}
                        className="flex-1 w-full bg-slate-950 border border-amber-500/40 rounded-xl px-3 py-2 text-xs font-bold text-slate-100 focus:outline-none focus:border-amber-400 cursor-pointer"
                      >
                        {ALL_ROLES.map((role) => (
                          <option key={role} value={role} className="bg-slate-900 text-slate-100">
                            {role} {role === 'Founder' ? '(فاندر اصلی)' : role === 'Helper' ? '(عضو عادی/هلپر)' : ''}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={handleAssignRoleFromTicket}
                        className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>تایید و ارتقاء به رنک «{selectedRoleToAssign}»</span>
                      </button>
                    </div>

                    {assignSuccessMessage && (
                      <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>{assignSuccessMessage}</span>
                      </div>
                    )}
                  </div>

                  {/* Quick Reply Presets */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400 block">
                      ⚡ قالب‌های پاسخ اداری و سریع ۴ رنک اصلی:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {quickReplies.map((q, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setReplyText(q.text)}
                          className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
                        >
                          {q.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Leave Request Info Box if Applicable */}
              {selectedTicket.type === 'LeaveRequest' && (
                <div className="bg-gradient-to-r from-sky-950/40 via-indigo-950/40 to-slate-900 border border-sky-500/30 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-sky-200">
                  <div>
                    <span className="text-[10px] text-sky-400/80 block font-bold">تاریخ شروع مرخصی:</span>
                    <span className="font-black font-mono text-sm">{selectedTicket.startDate || 'نامشخص'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-sky-400/80 block font-bold">تاریخ پایان مرخصی:</span>
                    <span className="font-black font-mono text-sm">{selectedTicket.endDate || 'نامشخص'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-sky-400/80 block font-bold">شماره تماس اضطراری:</span>
                    <span className="font-bold font-mono">{selectedTicket.emergencyContact || 'ثبت نشده'}</span>
                  </div>
                </div>
              )}

              {/* Messages Chat Stream */}
              <div className="flex-1 space-y-3.5 overflow-y-auto pr-1 no-scrollbar max-h-[380px]">
                {selectedTicket.messages.map((msg) => {
                  // Internal note is only visible to the 4 Top Admin Ranks
                  if (msg.isInternalNote && !isHighRank) return null;

                  return (
                    <div
                      key={msg.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        msg.isInternalNote
                          ? 'bg-amber-950/40 border-amber-500/40 mr-4 shadow-sm'
                          : msg.isStaffReply
                          ? 'bg-indigo-950/40 border-indigo-500/40 mr-4 shadow-sm'
                          : 'bg-slate-900/80 border-slate-800 ml-4'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white">{msg.senderName}</span>
                          <RoleBadge role={msg.senderRole} size="xs" />
                          {msg.isInternalNote ? (
                            <span className="px-2 py-0.5 text-[9px] font-black bg-amber-500 text-slate-950 rounded-full flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" /> یادداشت محرمانه ۴ رنک اصلی
                            </span>
                          ) : msg.isStaffReply ? (
                            <span className="px-2 py-0.5 text-[9px] font-black bg-indigo-600 text-white rounded-full flex items-center gap-1 shadow">
                              <ShieldCheck className="w-2.5 h-2.5 text-amber-300" /> پاسخ رسمی ۴ رنک اصلی
                            </span>
                          ) : null}
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(msg.createdAt).toLocaleTimeString('fa-IR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {msg.message}
                      </p>

                      {msg.attachmentUrl && (
                        <div className="mt-2.5 pt-2 border-t border-slate-800/80">
                          <a
                            href={msg.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 underline font-mono"
                          >
                            <Paperclip className="w-3.5 h-3.5" />
                            <span>مشاهده پیوست تیکت</span>
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Reply Form Box */}
              {selectedTicket.status !== 'Closed' ? (
                <form onSubmit={handleSendReply} className="pt-3 border-t border-slate-800 space-y-2.5">
                  {isHighRank && (
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 font-bold">
                          <input
                            type="radio"
                            name="replyMode"
                            checked={!isInternalNote}
                            onChange={() => setIsInternalNote(false)}
                            className="accent-indigo-600"
                          />
                          <span>پاسخ رسمی به کاربر</span>
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer text-amber-300 font-bold">
                          <input
                            type="radio"
                            name="replyMode"
                            checked={isInternalNote}
                            onChange={() => setIsInternalNote(true)}
                            className="accent-amber-500"
                          />
                          <span>🔒 یادداشت محرمانه (فقط بین ۴ رنک اصلی)</span>
                        </label>
                      </div>
                    </div>
                  )}

                  <textarea
                    rows={3}
                    required
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={
                      isInternalNote
                        ? 'یادداشت محرمانه جهت تبادل نظر بین ۴ رنک اصلی را بنویسید (کاربر این یادداشت را نخواهد دید)...'
                        : isHighRank
                        ? 'پاسخ رسمی مدیریت ۴ رنک اصلی به کاربر را وارد نمایید...'
                        : 'پیام تکمیلی خود را برای ۴ رنک اصلی بنویسید...'
                    }
                    className={`w-full rounded-2xl p-3 text-xs text-slate-100 placeholder-slate-500 outline-none resize-none leading-relaxed transition-all ${
                      isInternalNote
                        ? 'bg-amber-950/20 border border-amber-500/40 focus:border-amber-400'
                        : 'bg-slate-900 border border-slate-800 focus:border-indigo-500'
                    }`}
                  />

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                    <input
                      type="url"
                      value={replyAttachment}
                      onChange={(e) => setReplyAttachment(e.target.value)}
                      placeholder="لینک پیوست اختیاری (https://...)"
                      className="w-full sm:w-64 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-[11px] text-slate-200 outline-none focus:border-indigo-500 font-mono text-left dir-ltr"
                    />

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        type="submit"
                        className={`px-5 py-2.5 text-xs font-black rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer ${
                          isInternalNote
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:from-amber-400 hover:to-amber-500'
                            : 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white hover:from-indigo-500 hover:to-sky-500'
                        }`}
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isInternalNote ? 'ثبت یادداشت محرمانه' : 'ارسال پاسخ تیکت'}</span>
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <XCircle className="w-4 h-4 text-slate-500" />
                  <span>این تیکت مختومه و بسته شده است. در صورت لزوم می‌توانید تیکت جدید ارسال نمایید.</span>
                  {isHighRank && (
                    <button
                      onClick={() => handleUpdateStatus(selectedTicket.id, 'Open')}
                      className="mr-3 px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded-lg cursor-pointer"
                    >
                      بازگشایی مجدد تیکت
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-12 text-center text-slate-500 h-full flex flex-col items-center justify-center min-h-[500px]">
              <div className="p-4 bg-indigo-600/10 border border-indigo-500/20 rounded-full mb-4 text-indigo-400">
                <MessageSquare className="w-12 h-12" />
              </div>
              <h4 className="text-base font-black text-white mb-1.5">یک تیکت را برای مشاهده و پاسخ انتخاب کنید</h4>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                از فهرست سمت راست روی هر تیکت کلیک فرمایید تا جزییات مکالمات، اطلاعات مرخصی، یادداشت‌های محرمانه و پنل ست کردن رنک کادر نمایش داده شود.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Ticket Confirmation Modal */}
      {ticketToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-rose-800/80 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl">
                <Trash2 className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h4 className="text-base font-black text-white">تایید حذف تیکت</h4>
                <p className="text-[11px] text-slate-400">این عملیات غیرقابل بازگشت است.</p>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 space-y-1.5 text-xs">
              <div className="text-slate-300 font-bold flex items-center justify-between">
                <span>عنوان:</span>
                <span className="text-white truncate max-w-[200px]">{ticketToDelete.title}</span>
              </div>
              <div className="text-slate-400 text-[11px] flex items-center justify-between">
                <span>ارسال‌کننده:</span>
                <span className="text-slate-200 font-medium">{ticketToDelete.userName} ({ticketToDelete.userRole})</span>
              </div>
              <div className="text-slate-400 text-[11px] flex items-center justify-between">
                <span>شناسه:</span>
                <span className="text-slate-400 font-mono text-[10px]">{ticketToDelete.id}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              آیا از حذف کامل این تیکت و تمامی مکالمات مربوطه از سامانه اطمینان دارید؟
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setTicketToDelete(null)}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDeleteTicket(ticketToDelete.id)}
                className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-black rounded-xl shadow-lg shadow-rose-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>بله، حذف شود</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
