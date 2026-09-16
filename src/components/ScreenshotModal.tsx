import React from 'react';
import { X, Download, ShieldCheck, Calendar, Clock } from 'lucide-react';
import { ActivityReport } from '../types';

interface ScreenshotModalProps {
  report: ActivityReport | null;
  onClose: () => void;
}

export const ScreenshotModal: React.FC<ScreenshotModalProps> = ({ report, onClose }) => {
  if (!report) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = report.teamspeakScreenshot;
    link.download = `TS_Screenshot_${report.username}_${report.date}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-slate-900/90 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/80 border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                TeamSpeak Shift Screenshot
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-sky-400 font-mono">
                  {report.username}
                </span>
              </h3>
              <p className="text-xs text-slate-400 flex items-center gap-3 mt-0.5">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" /> {report.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" /> {report.loginTime} - {report.logoutTime} ({report.totalHours} hrs)
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 rounded-lg transition-all"
            >
              <Download className="w-4 h-4" /> Download Original
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Screenshot Viewport */}
        <div className="relative flex-1 bg-slate-950 p-4 overflow-auto flex items-center justify-center min-h-[350px]">
          <img
            src={report.teamspeakScreenshot}
            alt={`TS Screenshot for ${report.username}`}
            className="max-w-full max-h-[65vh] object-contain rounded-lg border border-slate-800 shadow-xl"
          />
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-900 border-t border-slate-800 text-xs text-slate-400 flex justify-between items-center">
          <div>
            <span className="text-slate-500">Report Status:</span>{' '}
            <span
              className={`font-semibold ${
                report.status === 'Approved'
                  ? 'text-emerald-400'
                  : report.status === 'Rejected'
                  ? 'text-rose-400'
                  : 'text-amber-400'
              }`}
            >
              {report.status}
            </span>
            {report.reviewerName && ` by ${report.reviewerName}`}
          </div>
          <div className="text-slate-500 font-mono">
            Role: {report.role}
          </div>
        </div>
      </div>
    </div>
  );
};
