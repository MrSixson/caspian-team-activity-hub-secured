import React from 'react';
import { AlertTriangle, Info, Bell, X, ShieldAlert } from 'lucide-react';
import { SystemAlert } from '../types';

interface SystemAlertBannerProps {
  alerts: SystemAlert[];
  onDismiss: (id: string) => void;
}

export const SystemAlertBanner: React.FC<SystemAlertBannerProps> = ({ alerts, onDismiss }) => {
  const activeAlerts = alerts.filter((a) => a.active);

  if (activeAlerts.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 space-y-2">
      {activeAlerts.map((alert) => {
        let bgStyle = 'bg-rose-950/90 border-rose-600/80 text-rose-200 shadow-rose-950/50';
        let IconComponent = ShieldAlert;
        let badgeText = 'اعلامیه قرمز و فوری مدیریت';

        if (alert.severity === 'warning') {
          bgStyle = 'bg-amber-950/90 border-amber-500/80 text-amber-200 shadow-amber-950/50';
          IconComponent = AlertTriangle;
          badgeText = 'هشدار مهم کادر';
        } else if (alert.severity === 'info') {
          bgStyle = 'bg-sky-950/90 border-sky-500/80 text-sky-200 shadow-sky-950/50';
          IconComponent = Info;
          badgeText = 'اطلاعیه عمومی سرور';
        }

        return (
          <div
            key={alert.id}
            className={`p-4 border rounded-2xl shadow-xl backdrop-blur-xl flex items-start justify-between gap-4 animate-fadeIn dir-rtl text-right ${bgStyle}`}
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-slate-950/50 border border-white/10 shrink-0">
                <IconComponent className="w-5 h-5 animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-lg bg-black/40 text-[10px] font-black uppercase tracking-wider border border-white/10">
                    {badgeText}
                  </span>
                  <span className="text-xs text-white/70 font-semibold">
                    ارسال توسط: {alert.createdByName} ({alert.createdByRole})
                  </span>
                </div>
                <h4 className="text-sm font-black text-white mt-1">{alert.title}</h4>
                <p className="text-xs font-medium text-white/90 mt-1 leading-relaxed whitespace-pre-wrap">
                  {alert.message}
                </p>
              </div>
            </div>

            <button
              onClick={() => onDismiss(alert.id)}
              className="p-1.5 hover:bg-black/30 rounded-xl transition-all text-white/70 hover:text-white shrink-0 cursor-pointer"
              title="بستن این اعلامیه"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
