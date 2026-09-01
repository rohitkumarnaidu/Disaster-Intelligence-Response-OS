import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

interface FeedStatus {
  id: string;
  source: string;
  feedType: string;
  status: string;
  lastSyncAt: string | null;
}

export function LiveFeedIndicator() {
  const [feeds, setFeeds] = useState<FeedStatus[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const fetchFeeds = async () => {
    try {
      const response = await fetch('/api/feeds', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setFeeds(data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch feeds:', error);
    }
  };

  useEffect(() => {
    fetchFeeds();
    const intervalId = setInterval(fetchFeeds, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const triggerSync = async (feedId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSyncingId(feedId);
    try {
      await fetch(`/api/feeds/${feedId}/sync`, { method: 'POST', credentials: 'include' });
      await fetchFeeds();
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncingId(null);
    }
  };

  const getRelativeTime = (date: Date | null) => {
    if (!date) return 'Unknown';
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Updated ${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `Updated ${hours}h ago`;
  };

  const allActive = feeds.length > 0 && feeds.every((f) => f.status === 'active');
  const activeCount = feeds.filter((f) => f.status === 'active').length;

  return (
    <div className="relative z-50">
      <button 
        type="button"
        className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 rounded-full px-4 py-2 cursor-pointer shadow-lg backdrop-blur-md hover:bg-slate-800/90 transition-colors focus-visible:ring-2 focus-visible:ring-teal-500 outline-none"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Toggle Live Feeds Drawer"
      >
        <div className="flex items-center gap-2">
          <div className="relative flex h-2.5 w-2.5">
            {allActive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${allActive ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          </div>
          <span className="text-xs font-mono-ui font-bold uppercase tracking-wider text-slate-100">Live</span>
        </div>
        <div className="h-3.5 w-px bg-slate-700" />
        <span className="text-xs font-medium text-slate-300">
          {feeds.length > 0 ? `${activeCount}/${feeds.length} feeds` : 'Live feeds active'}
        </span>
        <div className="h-3.5 w-px bg-slate-700 hidden sm:block" />
        <span className="text-[11px] font-mono-ui text-slate-400 hidden sm:inline">{getRelativeTime(lastUpdated)}</span>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-72 max-w-[calc(100vw-2rem)] bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden backdrop-blur-2xl animate-in fade-in slide-in-from-top-2">
          <div className="p-3 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
            <h4 className="text-[11px] font-mono-ui font-bold text-slate-300 uppercase tracking-wider">Feed Status & Poller</h4>
            <button
              onClick={fetchFeeds}
              className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
              title="Refresh status"
              aria-label="Refresh feed status"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
          <div className="max-h-72 overflow-y-auto p-2 divide-y divide-slate-800/60">
            {feeds.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                Feeds are polling in background automatically.
              </div>
            ) : (
              feeds.map((feed) => (
                <div key={feed.id} className="flex items-center justify-between p-2 hover:bg-slate-800/40 rounded-lg transition-colors">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-200">{feed.source}</span>
                    <span className="text-[10px] font-mono-ui text-slate-400">{feed.feedType}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => triggerSync(feed.id, e)}
                      disabled={syncingId === feed.id}
                      className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
                      title="Sync Now"
                      aria-label={`Sync ${feed.source}`}
                    >
                      <RefreshCw className={`w-3 h-3 ${syncingId === feed.id ? 'animate-spin text-teal-400' : ''}`} />
                    </button>
                    {feed.status === 'active' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
