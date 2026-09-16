import React, { useState } from 'react';
import { AlertTriangle, X, ShieldAlert, Send } from 'lucide-react';
import { User, WarningSeverity } from '../types';

interface WarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: User | null;
  onIssueWarning: (
    userId: string,
    reason: string,
    description: string,
    severity: WarningSeverity
  ) => void;
}

export const WarningModal: React.FC<WarningModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  onIssueWarning,
}) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<WarningSeverity>('Medium');

  if (!isOpen || !targetUser) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || !description.trim()) return;
    onIssueWarning(targetUser.id, reason, description, severity);
    setReason('');
    setDescription('');
    setSeverity('Medium');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Issue Formal Warning</h3>
              <p className="text-xs text-amber-400 font-medium">
                Target Member: {targetUser.firstName} {targetUser.lastName} (@{targetUser.username})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Warning Reason <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Inactivity during online session / Policy breach"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500 transition-all placeholder:text-slate-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Severity Level
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['Low', 'Medium', 'High', 'Critical'] as WarningSeverity[]).map((level) => (
                <button
                  type="button"
                  key={level}
                  onClick={() => setSeverity(level)}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    severity === level
                      ? level === 'Low'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                        : level === 'Medium'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                        : level === 'High'
                        ? 'bg-orange-500/20 text-orange-300 border-orange-500'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Full Description & Directives <span className="text-amber-400">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="Provide exact details regarding why this warning is being issued and necessary corrective actions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500 transition-all placeholder:text-slate-600 resize-none"
            />
          </div>

          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-xs text-amber-300/80 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              The warning will immediately trigger an urgent notification banner on{' '}
              <strong>{targetUser.firstName}</strong>'s dashboard until acknowledged.
            </span>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-lg shadow-amber-400/20 transition-all"
            >
              <Send className="w-4 h-4" /> Dispatch Warning
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
