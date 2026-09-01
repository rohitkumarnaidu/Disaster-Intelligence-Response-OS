import { useMemo, useState, useEffect, type ReactNode } from 'react';
import { useAuth, AuthProvider } from '@/lib/auth';
import { QueryClient, QueryClientProvider, useQueryClient, useQuery } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import Login from '@/pages/login';
import { IncidentMap } from '@/components/map/IncidentMap';
import { LiveFeedIndicator } from '@/components/LiveFeedIndicator';
import { AlertBanner } from '@/components/AlertBanner';
import { useLiveEvents } from '@/hooks/use-live-events';
import { getQueue, syncAllPending, queueRequest } from '@/lib/offline-sync';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Activity,
  AlertCircle,
  ArrowDownUp,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  LogOut,
  CircleDot,
  Clock3,
  CloudOff,
  Cpu,
  Crosshair,
  Database,
  ExternalLink,
  FileCheck2,
  Filter,
  Layers3,
  ListFilter,
  Map,
  Menu,
  MoreHorizontal,
  Navigation,
  PackageCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Pause,
  Play,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Satellite,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  TimerReset,
  TriangleAlert,
  UserRound,
  UsersRound,
  Wifi,
  WifiOff,
  X,
  Zap,
} from 'lucide-react';
import DataSourcesPage from '@/pages/data-sources';
import ImagerySearchPage from '@/pages/imagery-search';
import { LineageGraph } from '@/components/LineageGraph';
import { AIAssessmentPanel } from '@/components/ai/AIAssessmentPanel';
import { AIAnalyticsDashboard } from '@/components/ai/AIAnalyticsDashboard';
import { SystemArchitectureGuide } from '@/components/SystemArchitectureGuide';
import {
  getGetCaseQueryKey,
  getGetIncidentQueryKey,
  getListCasesQueryKey,
  getListIncidentsQueryKey,
  getListTasksQueryKey,
  getGetCommandSummaryQueryKey,
  type Case,
  type CommandSummary,
  type Incident,
  type Task,
  useGetCase,
  useGetCommandSummary,
  useGetIncident,
  useListCases,
  useListIncidents,
  useListTasks,
  useLoadDemo,
  useResetDemo,
  useReviewCase,
  useUpdateTask,
  customFetch,
} from '@workspace/api-client-react';
import {
  Route,
  Switch,
  Link,
  Redirect,
  useLocation,
  useParams,
  Router as WouterRouter,
} from 'wouter';
import MapGL, { Marker } from 'react-map-gl/maplibre';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const queryClient = new QueryClient();

const SATELLITE_STYLE: any = {
  version: 8,
  sources: {
    "satellite-tiles": {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution: "&copy; Esri, Maxar, Earthstar Geographics",
    },
  },
  layers: [
    {
      id: "satellite-tiles-layer",
      type: "raster",
      source: "satellite-tiles",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'teal' | 'amber' | 'red' | 'blue' }) {
  const tones = {
    neutral: 'bg-secondary text-muted-foreground',
    teal: 'bg-primary/10 text-primary',
    amber: 'bg-accent/20 text-foreground',
    red: 'bg-destructive/10 text-destructive',
    blue: 'bg-chart-3/10 text-chart-3'
  };
  return <span className={`inline-flex items-center gap-1 rounded-sm px-2 py-1 text-[10px] font-mono-ui font-medium uppercase tracking-[.08em] ${tones[tone]}`}>{children}</span>;
}

function Button({
  children,
  onClick,
  variant = 'default',
  className = '',
  disabled = false
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'ghost' | 'accent';
  className?: string;
  disabled?: boolean;
}) {
  const styles = {
    default: 'bg-primary text-primary-foreground hover:brightness-110',
    ghost: 'bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground',
    accent: 'bg-accent text-accent-foreground hover:brightness-105'
  };
  return (
    <button
      data-testid="button-action"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-sm px-3 py-2 text-xs font-semibold transition-all duration-200 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const { user, loading, logout } = useAuth();

  // Connect Server-Sent Events (SSE) for real-time live events
  useLiveEvents();

  // Fetch active weather alerts for the banner
  useEffect(() => {
    if (!user) return;
    fetch('/api/weather/alerts', { credentials: 'include' })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setActiveAlerts(data.map(a => ({
            id: a.id,
            headline: a.headline || a.alertType,
            severity: a.severity || 'Moderate',
            source: a.source || 'NWS'
          })));
        }
      })
      .catch(() => {});
  }, [user]);

  const nav = [
    { href: '/', label: 'Command center', icon: Crosshair },
    { href: '/incidents', label: 'Incidents', icon: TriangleAlert },
    { href: '/imagery/search', label: 'Satellite discovery', icon: Satellite },
    { href: '/assessment', label: 'Assessment', icon: Map },
    { href: '/cases', label: 'Priority queue', icon: ListFilter },
    { href: '/tasks', label: 'Response tasks', icon: CheckCircle2 },
    { href: '/field', label: 'Field verification', icon: Navigation },
    { href: '/data-sources', label: 'Data sources', icon: Database },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  ];
  const utility = [
    { href: '/demo', label: 'Demo replay', icon: Play },
    { href: '/settings', label: 'Settings', icon: Settings2 }
  ];

  const commandSummaryQuery = useGetCommandSummary({
    query: {
      queryKey: getGetCommandSummaryQueryKey(),
      refetchInterval: 30000,
      enabled: !!user
    }
  });

  const activeIncident = commandSummaryQuery.data?.incident;
  const backlogCount = commandSummaryQuery.data?.metrics?.backlog ?? 0;

  if (location === '/login') {
    return <>{children}</>;
  }

  if (loading) {
    return <div className="grid h-screen place-items-center"><LoadingBlock /></div>;
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return (
    <div className="noise flex min-h-[100dvh] bg-background">
      <aside className={`${collapsed ? 'w-[72px]' : 'w-[248px]'} ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} fixed inset-y-0 left-0 z-40 flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300 md:relative`}>
        <div className="flex h-[76px] items-center gap-3 border-b border-sidebar-border px-5">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-sm bg-sidebar-primary text-sidebar-primary-foreground">
            <Zap size={17} strokeWidth={2.5} />
          </div>
          {!collapsed && (
            <div>
              <div className="font-display text-[24px] leading-none tracking-[.08em] text-white">DRAXELYRA</div>
              <div className="mt-1 font-mono-ui text-[9px] uppercase tracking-[.18em] text-sidebar-foreground/50">Response OS · Live</div>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-5">
          <div className="mb-2 px-2 font-mono-ui text-[9px] uppercase tracking-[.18em] text-sidebar-foreground/40">
            {collapsed ? 'NAV' : 'Operations'}
          </div>
          <nav className="space-y-1">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = location === item.href || (item.href !== '/' && location.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-testid={`link-nav-${item.label}`}
                  onClick={() => setMobileOpen(false)}
                  className={`group flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors ${
                    active ? 'bg-sidebar-accent text-white' : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/70 hover:text-white'
                  }`}
                >
                  <Icon size={16} className={active ? 'text-sidebar-primary' : ''} />
                  {!collapsed && <span>{item.label}</span>}
                  {!collapsed && item.label === 'Priority queue' && backlogCount > 0 && (
                    <span className="ml-auto rounded-sm bg-accent px-1.5 py-0.5 font-mono-ui text-[9px] font-bold text-accent-foreground">
                      {backlogCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="my-6 border-t border-sidebar-border" />
          <div className="mb-2 px-2 font-mono-ui text-[9px] uppercase tracking-[.18em] text-sidebar-foreground/40">
            {collapsed ? 'SYS' : 'System'}
          </div>
          <nav className="space-y-1">
            {utility.map((item) => {
              const Icon = item.icon;
              const active = location === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-testid={`link-nav-${item.label}`}
                  onClick={() => setMobileOpen(false)}
                  className={`group flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors ${
                    active ? 'bg-sidebar-accent text-white' : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/70 hover:text-white'
                  }`}
                >
                  <Icon size={16} className={active ? 'text-sidebar-primary' : ''} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="border-t border-sidebar-border p-3">
          {!collapsed && (
            <div className="mb-3 flex items-center gap-2 rounded-sm bg-sidebar-accent/60 p-2.5">
              <div className="relative grid h-7 w-7 place-items-center rounded-full bg-primary/20 text-primary">
                <UserRound size={14} />
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary ring-2 ring-sidebar" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-xs font-semibold text-white">{user?.name || 'User'}</div>
                <div className="truncate font-mono-ui text-[9px] text-sidebar-foreground/50">
                  {user?.role ? user.role.replace('_', ' ') : 'Duty Officer'}
                </div>
              </div>
            </div>
          )}
          <button
            data-testid="button-collapse-sidebar"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden w-full items-center justify-center rounded-sm py-2 text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-white md:flex"
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <><PanelLeftClose size={16} /><span className="ml-2 text-xs">Collapse</span></>}
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <button
          aria-label="Close navigation"
          data-testid="button-close-mobile-nav"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-sidebar/40 md:hidden"
        />
      )}

      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button
              data-testid="button-open-mobile-nav"
              onClick={() => setMobileOpen(true)}
              className="rounded-sm p-2 text-muted-foreground hover:bg-secondary md:hidden"
            >
              <Menu size={19} />
            </button>
            <div className="hidden h-5 w-px bg-border md:block" />
            <div>
              <div className="font-mono-ui text-[10px] uppercase tracking-[.12em] text-muted-foreground">Active operation</div>
              <div className="mt-0.5 flex items-center gap-2 text-sm font-semibold">
                <span className={`h-2 w-2 rounded-full ${activeIncident?.status === 'Active' ? 'bg-destructive animate-pulse' : 'bg-primary'}`} />
                {activeIncident?.id || 'NO ACTIVE INCIDENT'}
                <span className="font-normal text-muted-foreground">{activeIncident?.name || 'Awaiting feeds'}</span>
                {(activeIncident as any)?.createdAt && (
                  <span className="ml-2 border-l border-border pl-2 text-xs font-normal text-muted-foreground">
                    {new Date((activeIncident as any).createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded text-[11px] font-mono-ui">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-semibold">REAL DATA MODE</span>
            </div>
            <LiveFeedIndicator />
            <div className="hidden h-5 w-px bg-border md:block" />
            <div className="hidden items-center gap-2 sm:flex">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 rounded-sm p-1 hover:bg-secondary outline-none">
                  <div className="grid h-7 w-7 place-items-center rounded-full bg-secondary text-xs font-semibold">
                    {user?.name ? user.name.substring(0, 2).toUpperCase() : 'US'}
                  </div>
                  <span className="text-xs font-semibold">{user?.name || 'User'}</span>
                  <ChevronDown size={14} className="text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5 text-[10px] text-muted-foreground font-mono-ui uppercase tracking-wider">
                    {user?.role ? user.role.replace('_', ' ') : 'Duty Officer'}
                  </div>
                  <DropdownMenuItem
                    onClick={() => logout()}
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                  >
                    <LogOut size={14} className="mr-2" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        <AlertBanner
          alerts={activeAlerts}
          onDismiss={(id) => setActiveAlerts((prev) => prev.filter((a) => a.id !== id))}
        />
        <div className="mx-auto max-w-[1600px] p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}

function PageHeader({
  eyebrow,
  title,
  detail,
  action
}: {
  eyebrow: string;
  title: string;
  detail?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="mb-2 flex items-center gap-2 font-mono-ui text-[10px] uppercase tracking-[.18em] text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          {eyebrow}
        </div>
        <h1 className="font-display text-4xl uppercase leading-none tracking-[.015em] text-foreground md:text-5xl">{title}</h1>
        {detail && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{detail}</p>}
      </div>
      {action}
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
  tone = 'default'
}: {
  label: string;
  value: string | number;
  sub: string;
  tone?: 'default' | 'amber' | 'red';
}) {
  return (
    <div className="border-l-2 border-border bg-card px-4 py-3 transition-colors hover:border-primary">
      <div className="font-mono-ui text-[10px] uppercase tracking-[.12em] text-muted-foreground">{label}</div>
      <div className={`mt-1 font-display text-4xl leading-none ${
        tone === 'amber' ? 'text-accent-foreground' : tone === 'red' ? 'text-destructive' : 'text-foreground'
      }`}>
        {value}
      </div>
      <div className="mt-2 text-[11px] text-muted-foreground">{sub}</div>
    </div>
  );
}

function LoadingBlock() {
  return (
    <div className="animate-pulse space-y-3 p-4">
      <div className="h-5 w-40 rounded bg-secondary" />
      <div className="h-24 rounded bg-secondary" />
      <div className="h-24 rounded bg-secondary" />
    </div>
  );
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="grid min-h-[220px] place-items-center border border-dashed border-border bg-card/50 p-6 text-center">
      <div>
        <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-secondary text-muted-foreground">
          <Database size={18} />
        </div>
        <div className="font-display text-2xl uppercase">{title}</div>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function CommandCenter() {
  const queryClient = useQueryClient();
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('');
  const [syncingFeeds, setSyncingFeeds] = useState(false);
  const [toast, setToast] = useState('');

  const incidentsQuery = useListIncidents({
    query: {
      queryKey: getListIncidentsQueryKey(),
      refetchInterval: 30000
    }
  });

  const query = useQuery({
    queryKey: ['command-summary', selectedIncidentId],
    queryFn: () => customFetch<any>(selectedIncidentId ? `/api/command/summary?incidentId=${selectedIncidentId}` : '/api/command/summary'),
    refetchInterval: 30000
  });

  const summary = query.data;

  const handleRefresh = () => {
    queryClient.invalidateQueries();
    setToast('Live feeds and incident state refreshed');
  };

  const handleSyncLiveFeeds = async () => {
    setSyncingFeeds(true);
    try {
      await customFetch('/api/demo/load-live', { method: 'POST' });
      await queryClient.invalidateQueries();
      setToast('Live 24h disasters & local infrastructure synchronized!');
    } catch (err) {
      setToast('Sync completed with partial network updates');
    } finally {
      setSyncingFeeds(false);
    }
  };

  if (query.isLoading && !summary && incidentsQuery.isLoading) {
    return <LoadingBlock />;
  }

  const metrics = summary?.metrics || {
    backlog: 0,
    highPriority: 0,
    openTasks: 0,
    overdueTasks: 0,
    confirmationRate: 0,
    slaCompliance: 100
  };

  const cases = summary?.cases || [];
  const tasks = summary?.tasks || [];
  const activity = summary?.activity || [];
  const incidentList = incidentsQuery.data || [];
  const incident = summary?.incident || incidentList[0];
  const incidentId = incident?.id || incidentList[0]?.id || 'inc-fl-chennai-2026';

  return (
    <>
      <PageHeader
        eyebrow={`Command center / ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}  ${new Date().toISOString().substring(11, 16)} UTC`}
        title="Situation overview"
        detail="Real-time multi-hazard operating picture. Infrastructure queues are populated from live USGS, GDACS, and NASA feeds with explainable 5-factor priority scoring."
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="accent"
              onClick={handleSyncLiveFeeds}
              disabled={syncingFeeds}
              className="bg-teal-600 hover:bg-teal-500 text-white"
            >
              <RefreshCw size={14} className={syncingFeeds ? 'animate-spin' : ''} />
              {syncingFeeds ? 'Syncing 24h Feeds...' : 'Sync Live 24h Feeds'}
            </Button>
            <Button variant="ghost" onClick={handleRefresh}>
              <Radio size={14} className="text-teal-400 animate-pulse" />Refresh
            </Button>
          </div>
        }
      />

      {/* Active Incident Switcher Bar */}
      <div className="mb-6 border border-teal-500/30 bg-card p-4 rounded shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start md:items-center gap-3">
            <div className="p-2.5 rounded bg-teal-500/10 text-teal-400 shrink-0">
              <Activity size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono-ui text-[10px] uppercase tracking-wider text-teal-400 font-bold">Active Crisis Target</span>
                <span className="px-1.5 py-0.5 rounded bg-destructive/10 border border-destructive/30 text-[10px] text-destructive uppercase font-bold">
                  {incident?.severity || 'Active'}
                </span>
                <span className="text-[10px] font-mono-ui text-muted-foreground">
                  Source: {incident?.sourceApi || incident?.source || 'USGS / GDACS'}
                </span>
              </div>
              <h2 className="text-lg font-bold text-foreground mt-0.5">{incident?.name || 'Monitoring Disaster Events'}</h2>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-muted-foreground font-mono-ui uppercase hidden sm:inline">Switch Incident:</span>
            <select
              value={selectedIncidentId || incidentId}
              onChange={(e) => setSelectedIncidentId(e.target.value)}
              className="bg-secondary text-foreground text-xs font-medium px-3 py-2 rounded border border-input outline-none focus:border-primary max-w-[280px] sm:max-w-[340px]"
            >
              {incidentList.map((inc) => (
                <option key={inc.id} value={inc.id}>
                  [{inc.disasterType || 'Hazard'}] {inc.name.length > 38 ? inc.name.substring(0, 38) + '...' : inc.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {toast && (
        <button
          data-testid="button-dismiss-toast"
          onClick={() => setToast('')}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-sm bg-foreground px-3 py-2 text-xs text-background shadow-lg"
        >
          {toast}<X size={13} />
        </button>
      )}
      <div className="mb-6">
        <SystemArchitectureGuide metrics={metrics} />
      </div>
      <div className="mb-6 grid grid-cols-2 gap-px border border-border bg-border md:grid-cols-3 lg:grid-cols-6">
        {[
          ['Backlog', metrics.backlog, 'cases to triage', 'default'],
          ['High priority', metrics.highPriority, 'score ≥ 75', 'red'],
          ['Open tasks', metrics.openTasks, 'owned actions', 'default'],
          ['Overdue', metrics.overdueTasks, 'needs escalation', metrics.overdueTasks > 0 ? 'amber' : 'default'],
          ['Confirmation', `${metrics.confirmationRate}%`, 'reviewed signals', 'default'],
          ['SLA on track', `${metrics.slaCompliance}%`, 'response health', 'default']
        ].map(([label, value, sub, tone]) => (
          <Metric key={String(label)} label={String(label)} value={value as string} sub={String(sub)} tone={tone as any} />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.45fr_.9fr]">
        <section className="border border-border bg-card p-3 md:p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="font-mono-ui text-[10px] uppercase tracking-[.13em] text-primary">Live geospatial workspace</div>
              <h2 className="mt-1 font-display text-2xl uppercase">Area of interest</h2>
            </div>
            <div className="flex gap-2">
              <Badge tone="teal">{cases.length} signals</Badge>
            </div>
          </div>
          <IncidentMap incidentId={incidentId} />
          <div className="mt-3 grid grid-cols-4 gap-2 text-[10px]">
            <div className="flex items-center gap-2 text-muted-foreground"><span className="h-2 w-2 rounded-full bg-destructive" />Critical signal</div>
            <div className="flex items-center gap-2 text-muted-foreground"><span className="h-2 w-2 rounded-full bg-accent" />Needs review</div>
            <div className="flex items-center gap-2 text-muted-foreground"><span className="h-2 w-2 rounded-full bg-primary" />Confirmed</div>
            <div className="flex items-center gap-2 text-muted-foreground"><span className="h-2 w-2 rounded-full bg-[#4a5568]" />Critical Asset</div>
          </div>
        </section>
        <section className="border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div>
              <div className="font-mono-ui text-[10px] uppercase tracking-[.13em] text-primary">Queue highlights</div>
              <h2 className="mt-1 font-display text-2xl uppercase">Act next</h2>
            </div>
            <Link href="/cases" data-testid="link-all-cases" className="text-xs font-semibold text-primary hover:underline">
              View queue <ArrowRight size={13} className="inline" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {cases.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">No active cases in queue. New signals will appear automatically.</div>
            ) : (
              cases.slice(0, 4).map((item: any, index: number) => (
                <Link href={`/cases/${item.id}`} key={item.id} data-testid={`link-case-${item.id}`} className="group block p-4 transition-colors hover:bg-secondary/50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3">
                      <span className={`mt-1 font-mono-ui text-xs ${index === 0 ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>0{index + 1}</span>
                      <div>
                        <div className="text-sm font-semibold group-hover:text-primary">{item.title}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{item.assetName}</div>
                      </div>
                    </div>
                    <span className="font-display text-2xl text-foreground">{item.priorityScore}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge tone={item.reviewState === 'CONFIRMED' ? 'teal' : item.severity === 'Severe' ? 'red' : 'amber'}>
                      {(item.reviewState || 'UNREVIEWED').replace('_', ' ')}
                    </Badge>
                    <span className="font-mono-ui text-[10px] text-muted-foreground">{Math.round((item.confidence || 0) * 100)}% confidence</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr]">
        <section className="border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border p-4">
            <h2 className="font-display text-2xl uppercase">Owned actions</h2>
            <Link href="/tasks" data-testid="link-all-tasks" className="text-xs font-semibold text-primary hover:underline">
              Open task list <ArrowRight size={13} className="inline" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {tasks.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">No response tasks currently created. Promote confirmed cases to generate tasks.</div>
            ) : (
              tasks.map((task: any) => (
                <div key={task.id} data-testid={`row-task-${task.id}`} className="flex items-center gap-3 p-4">
                  <div className={`h-2 w-2 rounded-full ${task.escalation ? 'bg-destructive' : 'bg-primary'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{task.title}</div>
                    <div className="mt-1 flex gap-2 text-xs text-muted-foreground">
                      <span>{task.assignedUser}</span>
                      <span>·</span>
                      <span>{task.slaLabel}</span>
                    </div>
                  </div>
                  <Badge tone={task.escalation ? 'red' : 'teal'}>{(task.status || 'ASSIGNED').replace('_', ' ')}</Badge>
                </div>
              ))
            )}
          </div>
        </section>
        <section className="border border-border bg-card">
          <div className="border-b border-border p-4">
            <h2 className="font-display text-2xl uppercase">Recent activity & audit trail</h2>
          </div>
          <div className="divide-y divide-border">
            {activity.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">No recent operational actions logged.</div>
            ) : (
              activity.map((act: any, index: number) => (
                <div key={`${act.title}-${index}`} data-testid={`activity-${index}`} className="flex gap-3 p-4">
                  <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${act.tone === 'warning' ? 'bg-accent' : act.tone === 'positive' ? 'bg-primary' : 'bg-muted-foreground'}`} />
                  <div className="flex-1 text-sm">
                    {act.title}
                    <div className="mt-1 font-mono-ui text-[10px] uppercase text-muted-foreground">{act.time}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </>
  );
}

function Incidents() {
  const query = useListIncidents({ query: { queryKey: getListIncidentsQueryKey() } });
  const [search, setSearch] = useState('');
  const incidents = (query.data ?? []).filter(item =>
    `${item.name} ${item.id} ${item.disasterType}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <PageHeader
        eyebrow="Operations / incident registry"
        title="Incidents"
        detail="Active disaster operating pictures populated from live GDACS, USGS, and NWS feeds."
        action={<Button variant="accent"><Plus size={14} />New incident</Button>}
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-2.5 text-muted-foreground" />
          <input
            data-testid="input-search-incidents"
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search by name, ID, or hazard type (Earthquake, Cyclone, Flood, Weather)..."
            className="h-10 w-full border border-input bg-card pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary"
          />
        </div>
      </div>
      {query.isLoading ? (
        <LoadingBlock />
      ) : incidents.length === 0 ? (
        <EmptyState title="No incidents found" detail="Live feeds are polling in background. You can also create an incident manually." />
      ) : (
        <div className="border border-border bg-card">
          {incidents.map(item => (
            <Link
              href={`/incidents/${item.id}`}
              key={item.id}
              data-testid={`row-incident-${item.id}`}
              className="group grid gap-3 border-b border-border p-4 last:border-0 transition-colors hover:bg-secondary/50 md:grid-cols-[1.6fr_1fr_1fr_auto] md:items-center"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono-ui text-[10px] text-primary">{item.id}</span>
                  <Badge tone={item.status === 'Active' || item.status === 'active' ? 'red' : 'neutral'}>{item.status}</Badge>
                </div>
                <div className="mt-2 text-base font-semibold group-hover:text-primary">{item.name}</div>
                <div className="mt-1 text-xs text-muted-foreground line-clamp-1">{item.description}</div>
              </div>
              <div>
                <div className="font-mono-ui text-[10px] uppercase text-muted-foreground">Hazard</div>
                <div className="mt-1 text-sm font-medium">{item.disasterType}</div>
              </div>
              <div>
                <div className="font-mono-ui text-[10px] uppercase text-muted-foreground">Created / Updated</div>
                <div className="mt-1 text-sm">
                  {(item as any).createdAt ? new Date((item as any).createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown'}
                </div>
              </div>
              <ArrowRight size={16} className="hidden text-muted-foreground transition-transform group-hover:translate-x-1 md:block" />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

function IncidentDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const query = useGetIncident(id, { query: { enabled: !!id, queryKey: getGetIncidentQueryKey(id) } });
  const incident = query.data;

  if (query.isLoading) return <LoadingBlock />;
  if (!incident) return <EmptyState title="Incident not found" detail="The specified incident ID does not exist in the database." />;

  return (
    <>
      <PageHeader
        eyebrow={`Incident / ${incident.id}`}
        title={incident.name}
        detail={incident.description}
        action={
          <div className="flex gap-2">
            <Badge tone="red"><CircleDot size={10} />{incident.status}</Badge>
            <Link href="/assessment"><Button variant="accent"><Target size={14} />Open assessment</Button></Link>
          </div>
        }
      />
      <div className="grid gap-5 lg:grid-cols-[.8fr_1.4fr]">
        <section className="space-y-5">
          <div className="grid grid-cols-2 gap-px border border-border bg-border">
            <Metric label="Severity" value={incident.severity || 'Normal'} sub="Operational rating" tone="red" />
            <Metric label="Source" value={incident.source || 'Live Feed'} sub="Intelligence Source" />
          </div>
          <div className="border border-border bg-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-2xl uppercase">Incident metadata</h2>
            </div>
            <dl className="space-y-3 text-sm">
              {[
                ['Incident ID', incident.id],
                ['Disaster type', incident.disasterType],
                ['Source', incident.source || 'Automated Feed'],
                ['Started', (incident as any).createdAt ? new Date((incident as any).createdAt).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Unknown'],
                ['Last update', (incident as any).updatedAt ? new Date((incident as any).updatedAt).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Unknown']
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-mono-ui text-xs font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
        <section>
          <IncidentMap incidentId={incident.id} />
          <div className="mt-3 flex items-center justify-between border border-border bg-card p-3 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Layers3 size={14} />Live AOI boundary with weather & critical infrastructure layers
            </div>
            <Link href="/assessment">
              <Button variant="ghost"><ExternalLink size={13} />Open workspace</Button>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}

function Assessment() {
  const [layer, setLayer] = useState('Change signal');
  const [filter, setFilter] = useState('All assets');
  const [runningJob, setRunningJob] = useState(false);
  const [jobNotice, setJobNotice] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const query = useListCases(undefined, { query: { queryKey: getListCasesQueryKey() } });
  const allCases = query.data ?? [];
  const summaryQuery = useGetCommandSummary();
  const activeId = summaryQuery.data?.incident?.id || allCases[0]?.incidentId || 'inc-fl-chennai-2026';

  const cases = allCases.filter((c) => {
    if (filter === 'All assets') return true;
    return (c.assetType || '').toLowerCase() === filter.toLowerCase();
  });

  const handleLaunchAssessment = async () => {
    setRunningJob(true);
    setJobNotice(null);
    try {
      // Find or default imagery pairs
      const imgRes = await fetch(`/api/imagery?incidentId=${activeId}`);
      const images = (await imgRes.json()) || [];
      const beforeId = images.find((i: any) => (i.title || '').includes('Pre') || (i.id || '').includes('pre'))?.id || images[1]?.id || 'img-demo-pre';
      const afterId = images.find((i: any) => (i.title || '').includes('Post') || (i.id || '').includes('post'))?.id || images[0]?.id || 'img-demo-post';

      const res = await fetch('/api/processing/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentId: activeId,
          jobType: 'CHANGE_DETECTION',
          provider: 'COPERNICUS',
          parameters: {
            incidentId: activeId,
            beforeImageryId: beforeId,
            afterImageryId: afterId,
          },
        }),
      });
      const data = await res.json();
      setJobNotice(`Processing job enqueued (ID: ${data.jobId}). Running Sentinel-1 SAR change detection and spatial asset joins...`);
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: getListCasesQueryKey() });
        queryClient.invalidateQueries({ queryKey: ['incident-map'] });
        setRunningJob(false);
      }, 2500);
    } catch (err: any) {
      setJobNotice(`Failed to launch job: ${err.message}`);
      setRunningJob(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Assessment / evidence workspace"
        title="Find what changed"
        detail="Geospatial triage for the active AOI. Compare satellite feeds, isolate critical infrastructure, and promote verified detections into response tasks."
        action={
          <div className="flex items-center gap-2">
            <Link href="/imagery/search" className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border bg-card text-xs font-semibold text-foreground hover:border-primary transition-colors rounded-sm">
              <Search size={13} className="text-primary" /> Search STAC Satellite
            </Link>
            <button
              onClick={handleLaunchAssessment}
              disabled={runningJob}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors rounded-sm disabled:opacity-50"
            >
              <Cpu size={13} className={runningJob ? "animate-spin" : ""} />
              {runningJob ? "Processing SAR..." : "Run Damage Assessment"}
            </button>
          </div>
        }
      />
      {jobNotice && (
        <div className="mb-4 p-3 bg-primary/10 border border-primary/30 text-primary text-xs font-mono-ui flex items-center justify-between">
          <span>{jobNotice}</span>
          <button onClick={() => setJobNotice(null)} className="text-primary hover:opacity-70">&times;</button>
        </div>
      )}
      <div className="mb-4 flex flex-wrap gap-2">
        {['Change signal', 'Critical assets', 'Flood extent'].map(item => (
          <button
            data-testid={`button-layer-${item}`}
            key={item}
            onClick={() => setLayer(item)}
            className={`rounded-sm border px-3 py-2 text-xs font-semibold transition-colors ${
              layer === item ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:border-primary'
            }`}
          >
            <Layers3 size={13} className="mr-1 inline" />{item}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <select
            data-testid="select-asset-filter"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="border border-input bg-card px-3 py-2 text-xs outline-none focus:border-primary"
          >
            <option>All assets</option>
            <option>Hospital</option>
            <option>School</option>
            <option>Bridge</option>
            <option>Utility</option>
            <option>Emergency</option>
          </select>
        </div>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.5fr_.8fr]">
        <IncidentMap incidentId={activeId} />
        <section className="border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div>
              <div className="font-mono-ui text-[10px] uppercase tracking-[.13em] text-primary">{layer}</div>
              <h2 className="mt-1 font-display text-2xl uppercase">Candidate signals</h2>
            </div>
            <span className="font-mono-ui text-xs text-muted-foreground">{cases.length} total</span>
          </div>
          <div className="divide-y divide-border max-h-[440px] overflow-y-auto">
            {cases.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">No candidate cases in AOI.</div>
            ) : (
              cases.map(item => (
                <Link href={`/review/${item.id}`} data-testid={`card-candidate-${item.id}`} key={item.id} className="block p-4 transition-colors hover:bg-secondary/50">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex gap-2">
                        <Badge tone={item.severity === 'Severe' || item.severity === 'critical' ? 'red' : 'amber'}>
                          {item.severity}
                        </Badge>
                        <span className="font-mono-ui text-[10px] text-muted-foreground">{item.id}</span>
                      </div>
                      <div className="mt-2 text-sm font-semibold">{item.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{item.assetName}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-2xl">{item.priorityScore}</div>
                      <div className="font-mono-ui text-[9px] uppercase text-muted-foreground">priority</div>
                    </div>
                  </div>
                  <div className="mt-3 h-1 bg-secondary">
                    <div className="h-1 bg-primary" style={{ width: `${(item.confidence || 0.5) * 100}%` }} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </>
  );
}

function Cases() {
  const query = useListCases(undefined, { query: { queryKey: getListCasesQueryKey() } });
  const [sort, setSort] = useState<'priorityScore' | 'confidence'>('priorityScore');
  const [search, setSearch] = useState('');
  const cases = [...(query.data ?? [])]
    .filter(item => `${item.title} ${item.assetName} ${item.id}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a: any, b: any) => (b[sort] || 0) - (a[sort] || 0));

  return (
    <>
      <PageHeader
        eyebrow="Operations / explainable queue"
        title="Priority queue"
        detail="A ranked, owned queue of evidence-backed cases. Scores are mathematically explainable via 5-factor weighting."
        action={
          <Button variant="ghost" onClick={() => setSort(sort === 'priorityScore' ? 'confidence' : 'priorityScore')}>
            <ArrowDownUp size={14} />Sort: {sort === 'priorityScore' ? 'Priority' : 'Confidence'}
          </Button>
        }
      />
      <div className="mb-4 flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-2.5 text-muted-foreground" />
          <input
            data-testid="input-search-cases"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search cases, assets, or IDs..."
            className="h-10 w-full border border-input bg-card pl-9 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>
      {query.isLoading ? (
        <LoadingBlock />
      ) : cases.length === 0 ? (
        <EmptyState title="No cases in queue" detail="External feeds will generate cases as new events and critical asset intersections are detected." />
      ) : (
        <div className="overflow-x-auto border border-border bg-card">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-[1.5fr_1fr_100px_100px_110px_130px] border-b border-border bg-secondary/50 px-4 py-3 font-mono-ui text-[10px] uppercase tracking-[.1em] text-muted-foreground">
              <span>Case / asset</span>
              <span>Evidence state</span>
              <span>Priority</span>
              <span>Confidence</span>
              <span>Owner</span>
              <span>Due / status</span>
            </div>
            {cases.map(item => (
              <Link
                href={`/cases/${item.id}`}
                key={item.id}
                data-testid={`row-case-${item.id}`}
                className="grid grid-cols-[1.5fr_1fr_100px_100px_110px_130px] items-center border-b border-border px-4 py-4 transition-colors last:border-0 hover:bg-secondary/50"
              >
                <div>
                  <div className="font-mono-ui text-[10px] text-primary">{item.id}</div>
                  <div className="mt-1 text-sm font-semibold">{item.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{item.assetName} · {item.assetType}</div>
                </div>
                <div>
                  <Badge tone={item.reviewState === 'CONFIRMED' || item.reviewState === 'confirmed' ? 'teal' : item.reviewState === 'UNCERTAIN' ? 'amber' : 'neutral'}>
                    {item.reviewState.replace('_', ' ')}
                  </Badge>
                  <div className="mt-2 text-[10px] text-muted-foreground">{item.inferenceBadge || 'Detection Signal'}</div>
                </div>
                <div className="font-display text-3xl">{item.priorityScore}</div>
                <div>
                  <div className="font-mono-ui text-sm">{Math.round((item.confidence || 0) * 100)}%</div>
                  <div className="mt-1 h-1 w-16 bg-secondary">
                    <div className="h-1 bg-primary" style={{ width: `${(item.confidence || 0) * 100}%` }} />
                  </div>
                </div>
                <div className="text-xs">{item.owner ?? <span className="text-muted-foreground">Unassigned</span>}</div>
                <div>
                  <div className="text-xs">{(item as any).dueAt ? new Date((item as any).dueAt).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'No due date'}</div>
                  <Badge tone={item.status === 'NEEDS_REVIEW' || item.status === 'candidate' ? 'amber' : 'teal'}>
                    {item.status.replace('_', ' ')}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function AuditTimeline({ caseId }: { caseId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["audit", caseId],
    queryFn: async () => {
      const r = await fetch(`/api/cases/${caseId}/audit`, { credentials: 'include' });
      return r.json();
    }
  });

  if (isLoading) return <div className="border border-border bg-card p-4"><div className="text-xs">Loading audit events...</div></div>;
  const events = data || [];

  return (
    <div className="border border-border bg-card p-4">
      <h2 className="font-display text-2xl uppercase">Audit context</h2>
      <div className="mt-4 space-y-4 border-l border-border pl-4 text-xs">
        {events.length === 0 ? (
          <div className="text-muted-foreground">No audit events logged yet.</div>
        ) : (
          events.map((ev: any) => (
            <div key={ev.id}>
              <div className="font-mono-ui text-[10px] text-primary">
                {new Date(ev.timestamp).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="mt-1 font-semibold">{ev.action.replace('_', ' ')}</div>
              {ev.actorName && <div className="mt-1 text-muted-foreground">By {ev.actorName} ({ev.actorRole})</div>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function CaseDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const query = useGetCase(id, { query: { enabled: !!id, queryKey: getGetCaseQueryKey(id) } });
  const item = query.data;
  const [expanded, setExpanded] = useState(false);

  if (query.isLoading) return <LoadingBlock />;
  if (!item) return <EmptyState title="Case not found" detail="The requested case does not exist." />;

  const coords = (item as any).detection?.geometry?.coordinates || (item as any).geometry?.coordinates || [80.27, 13.08];
  const lng = typeof coords[0] === 'number' ? coords[0] : 80.27;
  const lat = typeof coords[1] === 'number' ? coords[1] : 13.08;

  return (
    <>
      <PageHeader
        eyebrow={`Case / ${item.id}`}
        title={item.title}
        detail={`${item.assetName} · ${item.assetType}`}
        action={
          <div className="flex gap-2">
            <Badge tone="amber">{item.inferenceBadge || 'Signal'}</Badge>
            <Link
              href={`/review/${item.id}`}
              data-testid="link-review-case"
              className="inline-flex items-center gap-2 rounded-sm bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground hover:brightness-105"
            >
              <FileCheck2 size={14} />Review evidence
            </Link>
          </div>
        }
      />
      <div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
        <section className="space-y-5">
          <div className="grid grid-cols-3 gap-px border border-border bg-border">
            <Metric label="Priority" value={item.priorityScore} sub="5-factor weighted score" tone="red" />
            <Metric label="Confidence" value={`${Math.round((item.confidence || 0) * 100)}%`} sub="Detection confidence" />
            <Metric label="State" value={item.reviewState.replace('_', ' ')} sub="Analyst state" />
          </div>
          <AIAssessmentPanel
            caseId={item.id}
            factors={item.factors}
            confidence={item.confidence}
            onReassessed={() => query.refetch()}
          />
          <div className="border border-border bg-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="font-mono-ui text-[10px] uppercase tracking-[.13em] text-primary">Evidence comparison</div>
                <h2 className="mt-1 font-display text-2xl uppercase">What changed</h2>
              </div>
              <Badge tone="blue">Satellite / GIS</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative flex h-[300px] items-end overflow-hidden border border-border bg-zinc-800 rounded-lg">
                <MapGL
                  mapStyle={SATELLITE_STYLE}
                  mapLib={maplibregl}
                  initialViewState={{ longitude: lng, latitude: lat, zoom: 16 }}
                  interactive={false}
                  style={{ width: '100%', height: '100%' }}
                >
                  <Marker longitude={lng} latitude={lat} color="#ef4444" />
                </MapGL>
                <div className="absolute bottom-3 left-3 z-10">
                  <span className="bg-card/90 px-2 py-1 font-mono-ui text-[9px] uppercase shadow-md rounded-sm">
                    Baseline · {item.imagery?.before || 'Historical Archive'}
                  </span>
                </div>
              </div>
              <div className="relative flex h-[300px] items-end overflow-hidden border border-border bg-zinc-800 rounded-lg">
                <MapGL
                  mapStyle={SATELLITE_STYLE}
                  mapLib={maplibregl}
                  initialViewState={{ longitude: lng, latitude: lat, zoom: 16 }}
                  interactive={false}
                  style={{ width: '100%', height: '100%' }}
                >
                  <Marker longitude={lng} latitude={lat} color="#ef4444" />
                </MapGL>
                <div className="absolute bottom-3 left-3 z-10">
                  <span className="bg-card/90 px-2 py-1 font-mono-ui text-[9px] uppercase shadow-md rounded-sm">
                    Post-Event · {item.imagery?.after || 'Latest Ingestion'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="border border-border bg-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-2xl uppercase">Priority ledger</h2>
              <button
                data-testid="button-expand-ledger"
                onClick={() => setExpanded(!expanded)}
                className="text-xs font-semibold text-primary hover:underline"
              >
                {expanded ? 'Collapse' : 'Why this score?'}
              </button>
            </div>
            <div className="space-y-3">
              {(item.factors || []).map((factor: any) => (
                <div key={factor.label}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span>{factor.label}</span>
                    <span className="font-mono-ui">{Math.round(factor.value)} pts</span>
                  </div>
                  <div className="h-1.5 bg-secondary">
                    <div className="h-1.5 bg-primary" style={{ width: `${Math.min(100, factor.value * 3.3)}%` }} />
                  </div>
                </div>
              ))}
            </div>
            {expanded && (
              <div className="mt-4 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
                Priority is computed using deterministic formula: 30% Severity + 25% Criticality + 20% Exposure + 15% Urgency + 10% Confidence.
              </div>
            )}
          </div>
          <div className="border border-border bg-card p-5">
            <LineageGraph caseId={item.id} />
          </div>
        </section>
        <aside className="space-y-5">
          <div className="border border-border bg-sidebar p-5 text-sidebar-foreground">
            <div className="font-mono-ui text-[10px] uppercase tracking-[.13em] text-sidebar-primary">Owned response</div>
            <h2 className="mt-2 font-display text-3xl uppercase">Deploy field check</h2>
            <p className="mt-2 text-sm text-sidebar-foreground/60">Dispatch ground team to verify damage and record field observations.</p>
            <div className="mt-5 border-t border-sidebar-border pt-4">
              <div className="flex justify-between text-xs">
                <span className="text-sidebar-foreground/60">Owner</span>
                <span>{item.owner ?? 'Unassigned'}</span>
              </div>
            </div>
          </div>
          <AuditTimeline caseId={item.id} />
        </aside>
      </div>
    </>
  );
}

function Review() {
  const { id = '' } = useParams<{ id: string }>();
  const query = useGetCase(id, { query: { enabled: !!id, queryKey: getGetCaseQueryKey(id) } });
  const item = query.data;
  const review = useReviewCase();
  const [decision, setDecision] = useState('');
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();

  if (query.isLoading) return <LoadingBlock />;
  if (!item) return <EmptyState title="Case not found" detail="The case you want to review does not exist." />;

  const submit = (next: 'confirmed' | 'rejected' | 'uncertain') => {
    setDecision(next);
    review.mutate(
      { id: item.id, data: { decision: next, notes, version: item.version } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCaseQueryKey(id) });
          queryClient.invalidateQueries({ queryKey: getListCasesQueryKey() });
          queryClient.invalidateQueries({ queryKey: ["incident-map"] });
        }
      }
    );
  };

  const coords = (item as any).detection?.geometry?.coordinates || (item as any).geometry?.coordinates || [80.27, 13.08];
  const lng = typeof coords[0] === 'number' ? coords[0] : 80.27;
  const lat = typeof coords[1] === 'number' ? coords[1] : 13.08;

  return (
    <>
      <PageHeader
        eyebrow={`Evidence review / ${item.id}`}
        title="Review the signal"
        detail="Human-in-the-loop validation. Verify detection confidence and commit an auditable operational decision."
        action={<Badge tone="blue"><Sparkles size={11} />Live Evidence Pipeline</Badge>}
      />
      <div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        <section className="border border-border bg-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="font-mono-ui text-[10px] uppercase tracking-[.13em] text-primary">Evidence inspection</div>
              <h2 className="mt-1 font-display text-2xl uppercase">{item.title}</h2>
            </div>
            <Badge tone="amber">{Math.round((item.confidence || 0) * 100)}% confidence</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="relative h-[300px] overflow-hidden border border-border bg-zinc-800 rounded-lg">
              <MapGL
                mapStyle={SATELLITE_STYLE}
                mapLib={maplibregl}
                initialViewState={{ longitude: lng, latitude: lat, zoom: 16 }}
                interactive={false}
                style={{ width: '100%', height: '100%' }}
              >
                <Marker longitude={lng} latitude={lat} color="#ef4444" />
              </MapGL>
              <div className="absolute bottom-3 left-3 z-10">
                <span className="bg-card/90 px-2 py-1 font-mono-ui text-[10px] uppercase shadow-md rounded-sm">
                  Baseline Imagery
                </span>
              </div>
            </div>
            <div className="relative h-[300px] overflow-hidden border border-border bg-zinc-800 rounded-lg">
              <MapGL
                mapStyle={SATELLITE_STYLE}
                mapLib={maplibregl}
                initialViewState={{ longitude: lng, latitude: lat, zoom: 16 }}
                interactive={false}
                style={{ width: '100%', height: '100%' }}
              >
                <Marker longitude={lng} latitude={lat} color="#ef4444" />
              </MapGL>
              <div className="absolute left-[40%] top-[40%] h-16 w-20 border-2 border-destructive bg-destructive/10 z-10 pointer-events-none" />
              <div className="absolute bottom-3 left-3 z-10">
                <span className="bg-card/90 px-2 py-1 font-mono-ui text-[10px] uppercase shadow-md rounded-sm">
                  Post-Event Detection
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4 text-xs">
            <div>
              <div className="text-muted-foreground">Detection</div>
              <div className="mt-1 font-semibold">{item.severity} Damage</div>
            </div>
            <div>
              <div className="text-muted-foreground">Asset</div>
              <div className="mt-1 font-mono-ui">{item.assetType}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Captured</div>
              <div className="mt-1 font-mono-ui">
                {(item as any).createdAt ? new Date((item as any).createdAt).toISOString().substring(0, 16) + ' UTC' : 'Live'}
              </div>
            </div>
          </div>
        </section>
        <aside className="space-y-5">
          <div className="border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl uppercase">Decision</h2>
              {decision && (
                <Badge tone={decision === 'confirmed' ? 'teal' : decision === 'rejected' ? 'red' : 'amber'}>
                  <Check size={11} />Saved
                </Badge>
              )}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Confirm or reject this candidate signal to trigger automated tasking.
            </p>
            <textarea
              data-testid="input-review-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add rationale for the audit trail…"
              className="mt-4 h-24 w-full resize-none border border-input bg-background p-3 text-xs outline-none focus:border-primary"
            />
            <div className="mt-3 grid gap-2">
              <Button variant="accent" onClick={() => submit('confirmed')} disabled={review.isPending}>
                <CheckCircle2 size={14} />Confirm signal
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="ghost" onClick={() => submit('uncertain')} disabled={review.isPending}>
                  <AlertCircle size={14} />Uncertain
                </Button>
                <Button variant="ghost" onClick={() => submit('rejected')} disabled={review.isPending}>
                  <X size={14} />Reject
                </Button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

function Tasks() {
  const query = useListTasks({ query: { queryKey: getListTasksQueryKey() } });
  const update = useUpdateTask();
  const tasks = query.data ?? [];

  const cycle = (task: Task) => {
    const nextStatus = task.status === 'UNASSIGNED' ? 'IN_PROGRESS' : task.status === 'IN_PROGRESS' ? 'COMPLETED' : 'UNASSIGNED';
    update.mutate({ id: task.id, data: { status: nextStatus, version: task.version } });
  };

  return (
    <>
      <PageHeader
        eyebrow="Response / owned actions"
        title="Task board"
        detail="Accountable field tasks with SLA deadlines and optimistic concurrency control."
        action={<Button variant="accent"><Plus size={14} />Create task</Button>}
      />
      <div className="grid gap-4 md:grid-cols-3">
        {['UNASSIGNED', 'IN_PROGRESS', 'COMPLETED'].map(status => (
          <section key={status} className="min-h-[430px] border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border bg-secondary/40 p-4">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${
                  status === 'UNASSIGNED' ? 'bg-accent' : status === 'IN_PROGRESS' ? 'bg-primary' : 'bg-muted-foreground'
                }`} />
                <h2 className="font-display text-2xl uppercase">{status.replace('_', ' ')}</h2>
              </div>
              <span className="font-mono-ui text-xs text-muted-foreground">
                {tasks.filter(t => t.status === status).length}
              </span>
            </div>
            <div className="space-y-2 p-2">
              {tasks.filter(t => t.status === status).map(task => (
                <div key={task.id} data-testid={`card-task-${task.id}`} className="border border-border bg-background p-3 transition-all hover:-translate-y-0.5 hover:border-primary">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono-ui text-[10px] text-primary">{task.id}</span>
                    <Badge tone={task.escalation ? 'red' : task.priority > 75 ? 'amber' : 'neutral'}>
                      {task.escalation ? 'Escalated' : `P${task.priority}`}
                    </Badge>
                  </div>
                  <Link href={`/tasks/${task.id}`} data-testid={`link-task-${task.id}`} className="mt-2 block text-sm font-semibold hover:text-primary">
                    {task.title}
                  </Link>
                  <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><UserRound size={12} />{task.assignedUser || 'Unassigned'}</span>
                    <span className={task.escalation ? 'text-destructive font-semibold' : ''}>
                      <Clock3 size={12} className="mr-1 inline" />{task.slaLabel}
                    </span>
                  </div>
                  <button
                    data-testid={`button-advance-task-${task.id}`}
                    onClick={() => cycle(task)}
                    className="mt-3 w-full border border-border py-1.5 text-[10px] font-semibold uppercase tracking-[.08em] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    {status === 'UNASSIGNED' ? 'Start task' : status === 'IN_PROGRESS' ? 'Close task' : 'Reopen task'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

function TaskDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const tasksQuery = useListTasks();
  const item = (tasksQuery.data || []).find(t => t.id === id);
  const update = useUpdateTask();

  if (tasksQuery.isLoading) return <LoadingBlock />;
  if (!item) return <EmptyState title="Task not found" detail="The specified task does not exist." />;

  const isCompleted = item.status === 'COMPLETED' || item.status === 'CLOSED';
  const save = () => {
    update.mutate({
      id: item.id,
      data: { status: isCompleted ? 'IN_PROGRESS' : 'COMPLETED', version: item.version }
    });
  };

  return (
    <>
      <PageHeader
        eyebrow={`Task / ${item.id}`}
        title={item.title}
        detail={`Linked case ${item.caseId} · ${item.assignedTeam || 'Unassigned'}`}
        action={<Badge tone={isCompleted ? 'teal' : item.escalation ? 'red' : 'amber'}>{item.status.replace('_', ' ')}</Badge>}
      />
      <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <section className="space-y-5">
          <div className="border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl uppercase">Assignment</h2>
              <Badge tone="blue"><UsersRound size={11} />Owned</Badge>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <div className="font-mono-ui text-[10px] uppercase text-muted-foreground">Team</div>
                <div className="mt-1 text-sm font-semibold">{item.assignedTeam || 'Unassigned'}</div>
              </div>
              <div>
                <div className="font-mono-ui text-[10px] uppercase text-muted-foreground">Assigned officer</div>
                <div className="mt-1 text-sm font-semibold">{item.assignedUser || 'Unassigned'}</div>
              </div>
              <div>
                <div className="font-mono-ui text-[10px] uppercase text-muted-foreground">Priority</div>
                <div className="mt-1 font-display text-3xl">{item.priority}</div>
              </div>
              <div>
                <div className="font-mono-ui text-[10px] uppercase text-muted-foreground">SLA</div>
                <div className="mt-1 text-sm font-semibold text-accent-foreground">{item.slaLabel}</div>
              </div>
            </div>
          </div>
          <div className="border border-border bg-card p-5">
            <h2 className="font-display text-2xl uppercase">Verification evidence</h2>
            <div className="mt-4 flex h-48 items-center justify-center border border-dashed border-border bg-secondary/40 text-center">
              <div>
                <CheckCircle2 size={24} className="mx-auto mb-2 text-teal-400" />
                <div className="text-xs font-semibold">Evidence attachments enabled</div>
                <div className="mt-1 text-[11px] text-muted-foreground">Field responders can attach geo-tagged media via the Field Verification module.</div>
              </div>
            </div>
          </div>
        </section>
        <aside className="space-y-5">
          <div className="border border-border bg-sidebar p-5 text-sidebar-foreground">
            <div className="font-mono-ui text-[10px] uppercase tracking-[.13em] text-sidebar-primary">Task control</div>
            <h2 className="mt-2 font-display text-3xl uppercase text-white">Update status</h2>
            <p className="mt-2 text-sm text-sidebar-foreground/60">
              State transitions use Optimistic Concurrency Control to prevent lost updates.
            </p>
            <Button variant="accent" onClick={save} disabled={update.isPending} className="mt-5 w-full">
              {isCompleted ? <><RefreshCw size={14} />Reopen task</> : <><PackageCheck size={14} />Mark complete</>}
            </Button>
          </div>
        </aside>
      </div>
    </>
  );
}

function Field() {
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const casesQuery = useListCases();
  const cases = casesQuery.data || [];

  const refreshQueue = async () => {
    const q = await getQueue();
    setOfflineQueue(q);
  };

  useEffect(() => {
    refreshQueue();
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    const res = await syncAllPending();
    await refreshQueue();
    setConflicts(res.conflicts);
    setIsSyncing(false);
  };

  return (
    <>
      <PageHeader
        eyebrow="Field / mobile verification"
        title="Verification queue"
        detail="Offline-capable PWA client. Ground observations are queued in IndexedDB and synchronized with conflict detection when connectivity resumes."
        action={
          <Badge tone={offlineQueue.length === 0 ? 'teal' : 'amber'}>
            {offlineQueue.length === 0 ? <Wifi size={11} /> : <WifiOff size={11} />}
            {offlineQueue.length === 0 ? 'Fully Synced' : `${offlineQueue.length} pending offline`}
          </Badge>
        }
      />
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex items-center justify-between border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-accent/20 text-accent-foreground">
              <Navigation size={17} />
            </div>
            <div>
              <div className="text-sm font-semibold">IndexedDB Offline Sync Engine Active</div>
              <div className="mt-1 text-xs text-muted-foreground">{offlineQueue.length} pending local mutations in IndexedDB</div>
            </div>
          </div>
          <button
            data-testid="button-sync-field"
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-2 border border-primary px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10 disabled:opacity-50"
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Syncing...' : 'Sync now'}
          </button>
        </div>

        {conflicts.length > 0 && (
          <div className="mb-4 flex items-start gap-3 border-l-2 border-destructive bg-destructive/10 p-4 text-xs">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-destructive" />
            <div>
              <div className="font-semibold text-destructive">Version Conflict Detected (OCC 409)</div>
              <p className="mt-1 text-muted-foreground">The server copy was modified by another operator while you were offline.</p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {cases.length === 0 ? (
            <EmptyState title="No assigned field checks" detail="Active cases in your operating picture will appear here." />
          ) : (
            cases.slice(0, 5).map(item => (
              <div key={item.id} data-testid={`field-card-${item.id}`} className="border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex gap-2">
                      <span className="font-mono-ui text-[10px] text-primary">{item.id}</span>
                      <Badge tone={item.severity === 'Severe' || item.severity === 'critical' ? 'red' : 'amber'}>
                        {item.severity}
                      </Badge>
                    </div>
                    <h2 className="mt-2 text-base font-semibold">{item.title}</h2>
                    <div className="mt-1 text-xs text-muted-foreground">{item.assetName} · {item.assetType}</div>
                  </div>
                  <CircleDot size={17} className="text-primary" />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="border border-border p-2">
                    <div className="text-[10px] text-muted-foreground">Priority</div>
                    <div className="mt-1 font-mono-ui text-xs font-bold">{item.priorityScore}</div>
                  </div>
                  <div className="border border-border p-2">
                    <div className="text-[10px] text-muted-foreground">State</div>
                    <div className="mt-1 text-xs font-semibold">{item.reviewState}</div>
                  </div>
                  <div className="border border-border p-2">
                    <div className="text-[10px] text-muted-foreground">Confidence</div>
                    <div className="mt-1 text-xs font-semibold">{Math.round((item.confidence || 0) * 100)}%</div>
                  </div>
                  <Link href={`/cases/${item.id}`}>
                    <button className="h-full w-full border border-primary text-xs font-semibold text-primary hover:bg-primary/10">
                      Open check <ArrowRight size={12} className="inline ml-1" />
                    </button>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

function Analytics() {
  const casesQuery = useListCases();
  const tasksQuery = useListTasks();
  const cases = casesQuery.data || [];
  const tasks = tasksQuery.data || [];

  const backlog = cases.filter(c => c.status === 'NEEDS_REVIEW' || c.status === 'candidate').length;
  const reviewed = cases.filter(c => c.reviewState !== 'PENDING' && c.reviewState !== 'pending').length;
  const confirmed = cases.filter(c => c.reviewState === 'CONFIRMED' || c.reviewState === 'confirmed').length;
  const tasked = tasks.length;
  const verified = tasks.filter(t => t.status === 'COMPLETED' || t.status === 'VERIFIED').length;
  const total = cases.length || 1;

  const funnel = [
    ['Detected', 100, cases.length.toString()],
    ['Reviewed', Math.round((reviewed / total) * 100), reviewed.toString()],
    ['Confirmed', Math.round((confirmed / total) * 100), confirmed.toString()],
    ['Tasked', Math.round((tasked / Math.max(confirmed, 1)) * 100), tasked.toString()],
    ['Verified', Math.round((verified / Math.max(tasked, 1)) * 100), verified.toString()]
  ];

  const overdueTasks = tasks.filter(t => t.dueAt && new Date(t.dueAt) < new Date() && t.status !== 'COMPLETED').length;
  const slaCompliance = tasks.length ? Math.round(((tasks.length - overdueTasks) / tasks.length) * 100) : 100;

  const confidences = cases.map(c => (c.confidence || 0) * 100);
  const medianConfidence = confidences.length ? Math.round(confidences.sort((a, b) => a - b)[Math.floor(confidences.length / 2)]) : 0;

  return (
    <>
      <PageHeader
        eyebrow="Analytics / operation health"
        title="Measure the loop"
        detail="Continuous telemetry tracking the feedback loop from AI detection to human confirmation and verified response outcome."
        action={<Button variant="ghost"><ArrowDownUp size={14} />Live metrics</Button>}
      />
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Backlog" value={backlog.toString()} sub="Needs review" />
        <Metric label="Confirmation" value={`${Math.round((confirmed / Math.max(reviewed, 1)) * 100)}%`} sub="Of reviewed signals" />
        <Metric label="SLA compliance" value={`${slaCompliance}%`} sub={`${overdueTasks} overdue tasks`} tone={overdueTasks > 0 ? "amber" : "default"} />
        <Metric label="Median confidence" value={`${medianConfidence}%`} sub="Across live detections" />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <section className="border border-border bg-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-mono-ui text-[10px] uppercase tracking-[.13em] text-primary">Case funnel</div>
              <h2 className="mt-1 font-display text-2xl uppercase">Signal to outcome</h2>
            </div>
            <Badge tone="teal">Live Feeds</Badge>
          </div>
          <div className="mt-8 space-y-5">
            {funnel.map(([label, width, value]) => (
              <div key={String(label)}>
                <div className="mb-1 flex justify-between text-xs">
                  <span>{label}</span>
                  <span className="font-mono-ui font-semibold">{value}</span>
                </div>
                <div className="h-5 bg-secondary">
                  <div className="h-5 bg-primary transition-all" style={{ width: `${width}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="border border-border bg-card p-5">
          <div className="font-mono-ui text-[10px] uppercase tracking-[.13em] text-primary">Priority Distribution</div>
          <h2 className="mt-1 font-display text-2xl uppercase">Risk Matrix</h2>
          <div className="relative mt-7 h-64 border-b border-l border-border bg-[linear-gradient(135deg,transparent_49%,hsl(var(--border))_50%,transparent_51%)]">
            <div className="absolute bottom-[27%] left-[26%] h-3 w-3 rounded-full bg-destructive ring-4 ring-destructive/15" />
            <div className="absolute bottom-[49%] left-[58%] h-3 w-3 rounded-full bg-primary ring-4 ring-primary/15" />
            <div className="absolute bottom-[70%] left-[74%] h-3 w-3 rounded-full bg-accent ring-4 ring-accent/20" />
            <div className="absolute bottom-1 left-2 font-mono-ui text-[9px] uppercase text-muted-foreground">low priority</div>
            <div className="absolute bottom-1 right-2 font-mono-ui text-[9px] uppercase text-muted-foreground">high priority</div>
            <div className="absolute left-1 top-1 font-mono-ui text-[9px] uppercase text-muted-foreground">high confidence</div>
          </div>
        </section>
      </div>
      <div className="mt-5">
        <AIAnalyticsDashboard />
      </div>
    </>
  );
}

function Demo() {
  const load = useLoadDemo();
  const reset = useResetDemo();
  const [playing, setPlaying] = useState(false);
  const [step, setStep] = useState(3);
  const steps = ['Ingest real-time feeds', 'Generate candidate signals', 'Calculate 5-factor priority', 'Dispatch response tasks', 'Verify ground outcome'];

  return (
    <>
      <PageHeader
        eyebrow="System / operational simulation"
        title="Scenario Runner"
        detail="Demonstrate the complete evidence-to-action loop on live or deterministic datasets."
        action={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => reset.mutate()}><RefreshCw size={14} />Reset DB</Button>
            <Button variant="accent" onClick={() => { setPlaying(!playing); if (!playing) load.mutate(); }}>
              <Play size={14} />{playing ? 'Pause replay' : 'Load Demo Scenario'}
            </Button>
          </div>
        }
      />
      <div className="grid gap-5 lg:grid-cols-[1fr_.7fr]">
        <section className="border border-border bg-sidebar p-6 text-sidebar-foreground">
          <div className="flex items-center justify-between">
            <Badge tone="teal"><Radio size={11} />Automated Ingestion</Badge>
            <span className="font-mono-ui text-[10px] text-sidebar-foreground/50">ENGINE · ACTIVE</span>
          </div>
          <h2 className="mt-8 max-w-lg font-display text-5xl uppercase leading-[.9] text-white">
            From intelligence<br /><span className="text-sidebar-primary">to verified action.</span>
          </h2>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-sidebar-foreground/60">
            Real disaster feeds from USGS, GDACS, NWS, OpenWeatherMap, Open-Meteo, NASA EONET, and OpenStreetMap are normalized into explainable queues.
          </p>
          <div className="mt-10 space-y-4">
            {steps.map((item, index) => (
              <button
                data-testid={`button-demo-step-${index}`}
                key={item}
                onClick={() => setStep(index)}
                className="flex w-full items-center gap-3 text-left"
              >
                <div className={`grid h-7 w-7 place-items-center rounded-full border font-mono-ui text-xs ${
                  index <= step ? 'border-sidebar-primary bg-sidebar-primary text-sidebar-primary-foreground' : 'border-sidebar-border text-sidebar-foreground/50'
                }`}>
                  {index < step ? <Check size={13} /> : `0${index + 1}`}
                </div>
                <span className={`text-sm ${index === step ? 'font-semibold text-white' : 'text-sidebar-foreground/50'}`}>{item}</span>
                {index === step && <ArrowRight size={14} className="ml-auto text-sidebar-primary" />}
              </button>
            ))}
          </div>
        </section>
        <section className="border border-border bg-card p-5">
          <div className="font-mono-ui text-[10px] uppercase tracking-[.13em] text-primary">Integrated API Feeds</div>
          <h2 className="mt-1 font-display text-3xl uppercase">Data Sources</h2>
          <div className="mt-8 space-y-3">
            {[
              ['USGS Earthquakes', 'GeoJSON Feed', 'Active (Real-time)'],
              ['GDACS Global Alerts', 'Multi-hazard XML/GeoJSON', 'Active (Every 15m)'],
              ['NWS Weather Alerts', 'CAP/JSON-LD', 'Active (Every 10m)'],
              ['Open-Meteo Floods', 'GloFAS River Discharge', 'Active (Daily)'],
              ['OpenStreetMap Overpass', 'Critical Infrastructure', 'Active (On AOI set)'],
              ['OpenWeatherMap & WAQI', 'Conditions & AQI', 'Configured']
            ].map(([source, type, status]) => (
              <div key={source} className="flex items-center justify-between border border-border p-3 rounded-sm">
                <div>
                  <div className="text-sm font-semibold">{source}</div>
                  <div className="text-xs text-muted-foreground">{type}</div>
                </div>
                <Badge tone="teal"><Check size={10} />{status}</Badge>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function Settings() {
  const [editingKeyId, setEditingKeyId] = useState<string | null>(null);
  const [keyValue, setKeyValue] = useState<string>('');
  const [secretValue, setSecretValue] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const { data: keysData, refetch: refetchKeys } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const res = await fetch('/api/integrations/api-keys', { credentials: 'include' });
      return res.ok ? res.json() : { keys: [] };
    }
  });

  const { data: feeds = [] } = useQuery({
    queryKey: ['feeds'],
    queryFn: async () => {
      const res = await fetch('/api/feeds', { credentials: 'include' });
      return res.ok ? res.json() : [];
    }
  });

  const handleSaveKey = async (keyId: string) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/integrations/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ keyId, keyValue, secretValue })
      });
      if (res.ok) {
        setSaveSuccess(`Key ${keyId} successfully configured`);
        setEditingKeyId(null);
        setKeyValue('');
        setSecretValue('');
        refetchKeys();
        setTimeout(() => setSaveSuccess(null), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const keysList = keysData?.keys || [];

  return (
    <>
      <PageHeader
        eyebrow="System / workspace configuration"
        title="Settings & API Integrations"
        detail="Manage external API keys, multimodal AI models, background disaster feeds, and workspace security."
        action={<Badge tone="teal"><Check size={11} />Production Ready</Badge>}
      />

      {saveSuccess && (
        <div className="mb-5 flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/40 rounded text-xs text-emerald-400 font-medium">
          <Check size={14} />
          {saveSuccess}
        </div>
      )}

      <div className="space-y-6">
        {/* API Keys Management Section */}
        <section className="border border-border bg-card p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
            <div>
              <h2 className="font-display text-2xl uppercase">External API Keys & Credentials</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Configure optional third-party providers for Gemini Vision AI, NASA thermal satellites, and high-volume weather.
              </p>
            </div>
            <div className="text-[11px] font-mono-ui text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
              FREE PUBLIC FEEDS ACTIVE
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {keysList.map((keyItem: any) => {
              const isEditing = editingKeyId === keyItem.id;

              return (
                <div key={keyItem.id} className="border border-border/80 bg-background/50 p-4 rounded-sm transition-all hover:border-border">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 h-2.5 w-2.5 rounded-full shrink-0 ${keyItem.isConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-muted-foreground/40'}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{keyItem.name}</span>
                          <span className="font-mono-ui text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                            {keyItem.category}
                          </span>
                          <span className="text-[10px] font-mono-ui text-teal-400">
                            {keyItem.cost}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground max-w-2xl">
                          {keyItem.description}
                        </p>
                        {keyItem.isConfigured && keyItem.maskedValue && (
                          <div className="mt-1.5 font-mono-ui text-[11px] text-emerald-400">
                            Current: {keyItem.maskedValue}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={keyItem.registrationUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-[11px] font-mono-ui text-teal-400 hover:text-teal-300 hover:underline px-2.5 py-1 rounded border border-teal-500/30 bg-teal-500/10"
                      >
                        Get Free Key ↗
                      </a>
                      <button
                        onClick={() => {
                          if (isEditing) {
                            setEditingKeyId(null);
                          } else {
                            setEditingKeyId(keyItem.id);
                            setKeyValue('');
                            setSecretValue('');
                          }
                        }}
                        className="text-xs font-semibold px-3 py-1 bg-secondary hover:bg-secondary/80 border border-border rounded-sm"
                      >
                        {isEditing ? 'Cancel' : keyItem.isConfigured ? 'Update Key' : 'Configure Key'}
                      </button>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="mt-4 pt-4 border-t border-border/60 space-y-3 bg-secondary/30 p-3 rounded">
                      <div>
                        <label className="block text-[11px] font-mono-ui uppercase tracking-wider text-muted-foreground mb-1">
                          {keyItem.id === 'CDSE_CLIENT_ID' ? 'Client ID' : 'API Key / Token'}
                        </label>
                        <input
                          type="password"
                          value={keyValue}
                          onChange={(e) => setKeyValue(e.target.value)}
                          placeholder={`Paste your ${keyItem.name} key here...`}
                          className="w-full bg-background border border-border rounded px-3 py-1.5 text-xs font-mono-ui outline-none focus:border-teal-500"
                        />
                      </div>

                      {keyItem.id === 'CDSE_CLIENT_ID' && (
                        <div>
                          <label className="block text-[11px] font-mono-ui uppercase tracking-wider text-muted-foreground mb-1">
                            Client Secret
                          </label>
                          <input
                            type="password"
                            value={secretValue}
                            onChange={(e) => setSecretValue(e.target.value)}
                            placeholder="Paste your CDSE Client Secret..."
                            className="w-full bg-background border border-border rounded px-3 py-1.5 text-xs font-mono-ui outline-none focus:border-teal-500"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-2">
                        <button
                          disabled={isSaving}
                          onClick={() => handleSaveKey(keyItem.id)}
                          className="px-4 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded hover:bg-primary/90 disabled:opacity-50"
                        >
                          {isSaving ? 'Saving & Testing...' : 'Save & Activate'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Live Feeds & Security Matrix */}
        <div className="grid gap-5 lg:grid-cols-[1fr_.8fr]">
          <section className="border border-border bg-card p-5">
            <h2 className="font-display text-2xl uppercase">Live Data Feeds</h2>
            <p className="mt-1 text-xs text-muted-foreground">Background polling adapters registered with the Ingestion Engine.</p>
            <div className="mt-5 space-y-3">
              {feeds.length === 0 ? (
                <div className="p-4 text-xs text-muted-foreground border border-dashed border-border text-center">
                  Feeds are configured and polling automatically in the background (USGS, GDACS, EONET, Open-Meteo).
                </div>
              ) : (
                feeds.map((feed: any) => (
                  <div key={feed.id} className="flex items-center justify-between border border-border p-3 rounded-sm">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                      <div>
                        <div className="text-sm font-semibold">{feed.source}</div>
                        <div className="font-mono-ui text-[10px] text-muted-foreground">{feed.feedType}</div>
                      </div>
                    </div>
                    <Badge tone={feed.status === 'active' ? 'teal' : 'neutral'}>{feed.status}</Badge>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="border border-border bg-card p-5">
            <h2 className="font-display text-2xl uppercase">Security & Concurrency</h2>
            <div className="mt-5 space-y-4 text-xs text-muted-foreground">
              <div className="border border-border p-3">
                <div className="font-semibold text-foreground">Optimistic Concurrency Control (OCC)</div>
                <div className="mt-1">All cases and tasks feature version tagging to prevent concurrent write loss (HTTP 409 handling).</div>
              </div>
              <div className="border border-border p-3">
                <div className="font-semibold text-foreground">SHA-256 Checksum Verification</div>
                <div className="mt-1">Evidence media uploads are sanitized and validated with magic-byte inspection.</div>
              </div>
              <div className="border border-border p-3">
                <div className="font-semibold text-foreground">Role-Based Access Control</div>
                <div className="mt-1">Granular role enforcement: System Admin, Org Admin, Disaster Officer, Manager, Analyst, Commander, Field Responder.</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={CommandCenter} />
        <Route path="/login" component={Login} />
        <Route path="/incidents" component={Incidents} />
        <Route path="/incidents/:id" component={IncidentDetail} />
        <Route path="/assessment" component={Assessment} />
        <Route path="/cases" component={Cases} />
        <Route path="/cases/:id" component={CaseDetail} />
        <Route path="/review/:id" component={Review} />
        <Route path="/tasks" component={Tasks} />
        <Route path="/tasks/:id" component={TaskDetail} />
        <Route path="/field" component={Field} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/data-sources" component={DataSourcesPage} />
        <Route path="/imagery/search" component={ImagerySearchPage} />
        <Route path="/demo" component={Demo} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <AuthProvider>
            <Shell><Router /></Shell>
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
