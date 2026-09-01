import React, { useState, useEffect } from 'react';
import { AlertCircle, AlertOctagon, AlertTriangle, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface Alert {
  id: string;
  headline: string;
  severity: string;
  source: string;
}

interface AlertBannerProps {
  alerts: Alert[];
  onDismiss: (id: string) => void;
}

export function AlertBanner({ alerts, onDismiss }: AlertBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex >= alerts.length) {
      setCurrentIndex(Math.max(0, alerts.length - 1));
    }
  }, [alerts.length, currentIndex]);

  if (alerts.length === 0) return null;

  const currentAlert = alerts[currentIndex] || alerts[0];

  const getSeverityStyles = (severity: string) => {
    const s = severity?.toLowerCase() || 'moderate';
    if (s === 'extreme') {
      return {
        bg: 'bg-rose-950/90 border-rose-800/80 text-rose-100',
        badge: 'bg-rose-600 text-white font-mono-ui font-bold',
        icon: <AlertOctagon className="w-4 h-4 text-rose-300 animate-pulse" />
      };
    }
    if (s === 'severe') {
      return {
        bg: 'bg-amber-950/90 border-amber-800/80 text-amber-100',
        badge: 'bg-amber-600 text-white font-mono-ui font-bold',
        icon: <AlertTriangle className="w-4 h-4 text-amber-300" />
      };
    }
    return {
      bg: 'bg-slate-900/95 border-teal-500/40 text-slate-100',
      badge: 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-mono-ui font-bold',
      icon: <AlertCircle className="w-4 h-4 text-teal-400" />
    };
  };

  const styles = getSeverityStyles(currentAlert.severity);

  return (
    <div 
      className="w-full border-b backdrop-blur-sm z-30 transition-all duration-300 ease-in-out px-4 py-2.5"
      style={{ borderColor: 'rgba(20, 184, 166, 0.2)' }}
      role="region"
      aria-label="Critical Emergency Alerts"
    >
      <div className={`mx-auto max-w-[1600px] flex items-center justify-between gap-3 px-3 py-2 rounded border shadow-md ${styles.bg}`}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0">{styles.icon}</div>
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider shadow-sm ${styles.badge}`}>
              {currentAlert.severity || 'ALERT'}
            </span>
            <span className="text-xs font-medium text-white truncate max-w-2xl drop-shadow-sm">
              {currentAlert.headline}
            </span>
            <span className="text-[10px] font-mono-ui text-slate-300/90 border-l border-white/20 pl-2 hidden sm:inline">
              Source: {currentAlert.source || 'GDACS / NWS'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {alerts.length > 1 && (
            <div className="flex items-center gap-1 bg-black/40 border border-white/20 rounded px-2 py-0.5 text-[11px] font-mono-ui text-slate-200">
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : alerts.length - 1))}
                className="hover:text-white p-0.5 transition-colors"
                title="Previous alert"
              >
                <ChevronLeft size={13} />
              </button>
              <span className="font-semibold">{currentIndex + 1} of {alerts.length}</span>
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => (prev < alerts.length - 1 ? prev + 1 : 0))}
                className="hover:text-white p-0.5 transition-colors"
                title="Next alert"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          )}

          <button 
            type="button"
            onClick={() => onDismiss(currentAlert.id)}
            className="p-1 rounded hover:bg-white/20 text-slate-300 hover:text-white transition-colors outline-none"
            aria-label="Dismiss alert"
            title="Dismiss this alert"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
