import React, { useState } from 'react';
import {
  FolderArchive,
  Folder,
  FolderOpen,
  Clock,
  FileText,
  AlertTriangle,
  Eye,
  Calendar,
  ChevronRight,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import { ActivityReport, User, Warning } from '../types';
import { RoleBadge } from './RoleBadge';

interface MonthlyArchiveViewProps {
  currentUser: User;
  allUsers: User[];
  reports: ActivityReport[];
  warnings: Warning[];
  onOpenScreenshot: (report: ActivityReport) => void;
}

export const MonthlyArchiveView: React.FC<MonthlyArchiveViewProps> = ({
  currentUser,
  allUsers,
  reports,
  warnings,
  onOpenScreenshot,
}) => {
  const canViewAll =
    currentUser.permissionLevel === 'Owner' || currentUser.permissionLevel === 'Founder';

  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser.id);
  const [openFolderKey, setOpenFolderKey] = useState<string | null>('2026 August');

  // Member being viewed
  const member = allUsers.find((u) => u.id === selectedUserId) || currentUser;

  // Filter member's reports and warnings
  const memberReports = reports.filter((r) => r.userId === member.id);
  const memberWarnings = warnings.filter((w) => w.userId === member.id);

  // Group reports by Year + Month folder (e.g. "2026 August", "2026 July", "2026 June")
  const archiveFolders: Record<
    string,
    {
      year: number;
      month: string;
      reports: ActivityReport[];
      totalHours: number;
      warningsCount: number;
    }
  > = {};

  // Pre-populate standard months if empty so folder layout is clear
  const defaultPeriods = ['2026 August', '2026 July', '2026 June'];
  defaultPeriods.forEach((period) => {
    const [yearStr, monthStr] = period.split(' ');
    archiveFolders[period] = {
      year: parseInt(yearStr, 10),
      month: monthStr,
      reports: [],
      totalHours: 0,
      warningsCount: 0,
    };
  });

  memberReports.forEach((r) => {
    const key = `${r.year} ${r.month}`;
    if (!archiveFolders[key]) {
      archiveFolders[key] = {
        year: r.year,
        month: r.month,
        reports: [],
        totalHours: 0,
        warningsCount: 0,
      };
    }
    archiveFolders[key].reports.push(r);
    archiveFolders[key].totalHours += r.totalHours;
  });

  // Calculate warnings per month
  memberWarnings.forEach((w) => {
    const wDate = new Date(w.date);
    const monthName = wDate.toLocaleString('en-US', { month: 'long' });
    const key = `${wDate.getFullYear()} ${monthName}`;
    if (archiveFolders[key]) {
      archiveFolders[key].warningsCount += 1;
    }
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl backdrop-blur-xl shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-2xl shadow-lg shadow-sky-500/10">
            <FolderArchive className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
              Monthly Shift Archive
              <span className="text-xs px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-sky-400 font-semibold">
                Permanent Vault
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Historical activity archives categorized into monthly folder structures. Records are preserved permanently.
            </p>
          </div>
        </div>

        {/* Member selector for Admins */}
        {canViewAll && (
          <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-2xl border border-slate-800">
            <UserIcon className="w-4 h-4 text-sky-400 shrink-0" />
            <select
              value={selectedUserId}
              onChange={(e) => {
                setSelectedUserId(e.target.value);
                setOpenFolderKey('2026 August');
              }}
              className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              {allUsers.map((u) => (
                <option key={u.id} value={u.id} className="bg-slate-900 text-slate-200">
                  Archive for {u.firstName} {u.lastName} (@{u.username})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Member Profile Summary Strip */}
      <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sky-400">
            {member.firstName.charAt(0)}
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-100">
              {member.firstName} {member.lastName}
            </h3>
            <p className="text-xs text-slate-400 font-mono">@{member.username} • TS: {member.teamspeakName}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-2">
            <span>Role at Period:</span> <RoleBadge role={member.role} size="xs" />
          </div>
          <div className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
            Total Warnings: <strong className="text-amber-400">{memberWarnings.length}</strong>
          </div>
        </div>
      </div>

      {/* Archive Folders Grid */}
      <div className="space-y-4">
        {Object.entries(archiveFolders).map(([folderKey, data]) => {
          const isOpen = openFolderKey === folderKey;

          return (
            <div
              key={folderKey}
              className={`bg-slate-900/80 border rounded-3xl backdrop-blur-xl shadow-xl overflow-hidden transition-all ${
                isOpen ? 'border-sky-500/50 shadow-sky-500/10' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Folder Header Row */}
              <button
                onClick={() => setOpenFolderKey(isOpen ? null : folderKey)}
                className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl border transition-all ${
                    isOpen
                      ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                      : 'bg-slate-800/80 text-slate-400 border-slate-700'
                  }`}>
                    {isOpen ? <FolderOpen className="w-6 h-6" /> : <Folder className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                      Folder: {folderKey}
                      <span className="text-xs font-mono font-normal text-slate-400">
                        ({data.reports.length} Reports Logged)
                      </span>
                    </h3>
                    <div className="flex items-center gap-4 text-xs text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1 font-semibold text-sky-400">
                        <Clock className="w-3.5 h-3.5" /> Total Duty: {data.totalHours.toFixed(1)} hrs
                      </span>
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Warnings: {data.warningsCount}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400 hidden sm:inline">
                    {isOpen ? 'Collapse' : 'Expand Folder'}
                  </span>
                  <ChevronRight
                    className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                      isOpen ? 'rotate-90 text-sky-400' : ''
                    }`}
                  />
                </div>
              </button>

              {/* Folder Contents */}
              {isOpen && (
                <div className="p-6 bg-slate-950/60 border-t border-slate-800/80 space-y-4 animate-fadeIn">
                  {data.reports.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs font-medium">
                      No shift reports archived for {folderKey}.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {data.reports.map((report) => (
                        <div
                          key={report.id}
                          className="p-4 bg-slate-900 border border-slate-800 hover:border-sky-500/30 rounded-2xl space-y-3 transition-all"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="text-xs font-mono text-sky-400 font-bold flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                {report.date}
                              </div>
                              <div className="text-xs text-slate-300 font-medium mt-0.5">
                                Shift: {report.loginTime} - {report.logoutTime} ({report.totalHours} hrs)
                              </div>
                            </div>
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                                report.status === 'Approved'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : report.status === 'Rejected'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {report.status}
                            </span>
                          </div>

                          <p className="text-xs text-slate-400 bg-slate-950 p-2.5 rounded-xl line-clamp-2">
                            {report.description}
                          </p>

                          <div className="flex items-center justify-between pt-1">
                            <RoleBadge role={report.role} size="xs" />
                            <button
                              onClick={() => onOpenScreenshot(report)}
                              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 rounded-lg transition-all"
                            >
                              <Eye className="w-3.5 h-3.5" /> View Screenshot
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
