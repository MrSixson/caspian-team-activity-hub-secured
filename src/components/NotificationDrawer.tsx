import React from 'react';
import { Bell, CheckCheck, Trash2, X, AlertTriangle, CheckCircle, ShieldAlert, Key, UserCheck } from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onSelectNotification?: (notif: AppNotification) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onClearAll,
  onSelectNotification,
}) => {
  if (!isOpen) return null;

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'activity_approved':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'activity_rejected':
        return <ShieldAlert className="w-5 h-5 text-rose-400" />;
      case 'role_changed':
        return <UserCheck className="w-5 h-5 text-sky-400" />;
      case 'password_changed':
        return <Key className="w-5 h-5 text-indigo-400" />;
      case 'account_approved':
        return <CheckCircle className="w-5 h-5 text-teal-400" />;
      default:
        return <Bell className="w-5 h-5 text-sky-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full shadow-2xl flex flex-col animate-slideLeft">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-slate-100 text-base">Notification Center</h3>
            {notifications.filter((n) => !n.read).length > 0 && (
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30">
                {notifications.filter((n) => !n.read).length} new
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Actions bar */}
        {notifications.length > 0 && (
          <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
            <button
              onClick={onMarkAllRead}
              className="flex items-center gap-1 hover:text-sky-400 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </button>
            <button
              onClick={onClearAll}
              className="flex items-center gap-1 hover:text-rose-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear history
            </button>
          </div>
        )}

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-sm">
              <Bell className="w-10 h-10 mx-auto mb-3 opacity-30 text-sky-400" />
              No notifications yet.
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => onSelectNotification?.(notif)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  notif.read
                    ? 'bg-slate-900/40 border-slate-800/80 text-slate-300 opacity-80'
                    : 'bg-slate-800/80 border-sky-500/30 shadow-lg shadow-sky-500/5 text-slate-100'
                } hover:border-sky-500/50`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-100">{notif.title}</h4>
                      <span className="text-[10px] text-slate-500">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{notif.message}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
