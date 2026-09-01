import { useEffect, useCallback, useRef, useState, createContext, useContext } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';

export type RealtimeStatus = 'CONNECTING' | 'LIVE' | 'RECONNECTING' | 'OFFLINE';

export interface DomainEvent<T = any> {
  id: string;
  type: string;
  entityType: string;
  entityId: string;
  incidentId?: string | null;
  organizationId?: string | null;
  version: number;
  occurredAt: string;
  actorId?: string | null;
  correlationId?: string | null;
  data: T;
}

interface RealtimeContextValue {
  status: RealtimeStatus;
  isConnected: boolean;
  lastEvent: DomainEvent | null;
  lastEventTime: Date | null;
  reconnectCount: number;
  subscribeChannels: (channels: string[]) => void;
}

const RealtimeContext = createContext<RealtimeContextValue>({
  status: 'OFFLINE',
  isConnected: false,
  lastEvent: null,
  lastEventTime: null,
  reconnectCount: 0,
  subscribeChannels: () => {},
});

export const useRealtimeStatus = () => useContext(RealtimeContext);

// Global version tracking across component re-renders
const entityVersionMap = new Map<string, number>();

export function useLiveEvents(activeIncidentId?: string | null) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [status, setStatus] = useState<RealtimeStatus>('CONNECTING');
  const [lastEvent, setLastEvent] = useState<DomainEvent | null>(null);
  const [lastEventTime, setLastEventTime] = useState<Date | null>(null);
  const [reconnectCount, setReconnectCount] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const pingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastDisconnectTimeRef = useRef<Date | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const subscriptionsRef = useRef<Set<string>>(new Set(['global']));

  // Process incoming domain event (from WebSocket or Multi-Tab BroadcastChannel)
  const processDomainEvent = useCallback(
    (event: DomainEvent) => {
      setLastEvent(event);
      const eventDate = new Date(event.occurredAt);
      setLastEventTime(eventDate);

      // Monotonic version & gap detection
      const entityKey = `${event.entityType}:${event.entityId}`;
      const previousVersion = entityVersionMap.get(entityKey) || 0;

      if (event.version > 0 && event.version <= previousVersion) {
        // Stale or duplicate event replay; skip duplicate UI toasts but refresh if needed
        return;
      }

      const isGap = event.version > previousVersion + 1 && previousVersion > 0;
      if (isGap) {
        console.warn(
          `[DRAXELYRA Realtime] Version gap detected for ${entityKey}: expected ${
            previousVersion + 1
          }, received ${event.version}. Performing authoritative refetch.`
        );
      }

      entityVersionMap.set(entityKey, event.version);

      // Coordinated TanStack Query Invalidation & Real-Time Cache Refresh
      switch (event.entityType) {
        case 'CASE': {
          queryClient.invalidateQueries({ queryKey: ['cases'] });
          queryClient.invalidateQueries({ queryKey: ['/api/cases'] });
          queryClient.invalidateQueries({ queryKey: ['incident-map'] });
          queryClient.invalidateQueries({ queryKey: ['command-summary'] });
          queryClient.invalidateQueries({ queryKey: ['analytics'] });
          queryClient.invalidateQueries({ queryKey: ['audit-timeline'] });
          queryClient.invalidateQueries({ queryKey: ['audit', event.entityId] });
          if (event.entityId) {
            queryClient.invalidateQueries({ queryKey: ['case', event.entityId] });
            queryClient.invalidateQueries({ queryKey: ['/api/cases', event.entityId] });
          }

          if (event.type === 'CASE_CONFIRMED') {
            toast({
              title: 'Case Confirmed',
              description: `Case ${event.entityId} confirmed. Priority: ${event.data?.priorityScore ?? 'High'}`,
            });
          } else if (event.type === 'CASE_CREATED') {
            toast({
              title: 'New Case Detected',
              description: event.data?.title || `New incident case ${event.entityId} created`,
            });
          }
          break;
        }

        case 'TASK': {
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
          queryClient.invalidateQueries({ queryKey: ['command-summary'] });
          queryClient.invalidateQueries({ queryKey: ['audit-timeline'] });
          if (event.entityId) {
            queryClient.invalidateQueries({ queryKey: ['task', event.entityId] });
          }
          if (event.data?.caseId) {
            queryClient.invalidateQueries({ queryKey: ['case', event.data.caseId] });
            queryClient.invalidateQueries({ queryKey: ['cases'] });
          }

          if (event.type === 'TASK_ASSIGNED' || event.type === 'TASK_CREATED') {
            toast({
              title: 'Task Updated',
              description: event.data?.title || `Task ${event.entityId} assigned`,
            });
          } else if (event.type === 'TASK_VERIFIED' || event.type === 'TASK_COMPLETED') {
            toast({
              title: 'Task Verified',
              description: `Task ${event.entityId} marked verified in field`,
            });
          }
          break;
        }

        case 'INCIDENT': {
          queryClient.invalidateQueries({ queryKey: ['incidents'] });
          queryClient.invalidateQueries({ queryKey: ['/api/incidents'] });
          queryClient.invalidateQueries({ queryKey: ['incident-map'] });
          queryClient.invalidateQueries({ queryKey: ['command-summary'] });
          if (event.entityId) {
            queryClient.invalidateQueries({ queryKey: ['incident', event.entityId] });
          }
          break;
        }

        case 'EVIDENCE': {
          queryClient.invalidateQueries({ queryKey: ['evidence'] });
          if (event.data?.caseId) {
            queryClient.invalidateQueries({ queryKey: ['case', event.data.caseId] });
            queryClient.invalidateQueries({ queryKey: ['cases'] });
          }
          break;
        }

        case 'PROCESSING_JOB':
        case 'AI_JOB': {
          queryClient.invalidateQueries({ queryKey: ['processing-jobs'] });
          queryClient.invalidateQueries({ queryKey: ['jobs'] });
          queryClient.invalidateQueries({ queryKey: ['cases'] });
          queryClient.invalidateQueries({ queryKey: ['incident-map'] });
          queryClient.invalidateQueries({ queryKey: ['analytics'] });

          if (event.type === 'AI_JOB_COMPLETED') {
            toast({
              title: 'AI Analysis Completed',
              description: `Satellite change detection pipeline completed for ${event.incidentId || 'incident'}`,
            });
          }
          break;
        }

        case 'AUDIT': {
          queryClient.invalidateQueries({ queryKey: ['audit-timeline'] });
          queryClient.invalidateQueries({ queryKey: ['audit'] });
          queryClient.invalidateQueries({ queryKey: ['command-summary'] });
          break;
        }

        default: {
          queryClient.invalidateQueries();
          break;
        }
      }
    },
    [queryClient, toast]
  );

  // Setup Multi-Tab Synchronization via BroadcastChannel
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel('draxelyra_realtime_sync');
        broadcastChannelRef.current = channel;

        channel.onmessage = (msgEvent) => {
          if (msgEvent.data?.type === 'EVENT' && msgEvent.data?.event) {
            processDomainEvent(msgEvent.data.event);
          }
        };
      }
    } catch (err) {
      console.warn('[DRAXELYRA Realtime] BroadcastChannel unavailable:', err);
    }

    return () => {
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
      }
    };
  }, [processDomainEvent]);

  // Connect WebSocket
  const connect = useCallback(() => {
    if (typeof window === 'undefined') return;

    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.onmessage = null;
      wsRef.current.close();
    }

    setStatus((prev) => (prev === 'OFFLINE' ? 'RECONNECTING' : 'CONNECTING'));

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('LIVE');
        setReconnectCount(0);

        // Subscribe to current channels
        const channels = Array.from(subscriptionsRef.current);
        if (activeIncidentId) {
          channels.push(`incident:${activeIncidentId}`);
        }
        ws.send(JSON.stringify({ type: 'SUBSCRIBE', channels }));

        // If reconnecting, ask server for missed events since disconnect
        if (lastDisconnectTimeRef.current) {
          const versionsObj: Record<string, number> = {};
          entityVersionMap.forEach((v, k) => {
            versionsObj[k] = v;
          });
          ws.send(
            JSON.stringify({
              type: 'RECOVER',
              sinceTimestamp: lastDisconnectTimeRef.current.toISOString(),
              lastVersions: versionsObj,
            })
          );
        }

        // Setup ping heartbeat every 25s
        if (pingTimerRef.current) clearInterval(pingTimerRef.current);
        pingTimerRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'PING' }));
          }
        }, 25000);
      };

      ws.onmessage = (msgEvent) => {
        try {
          const payload = JSON.parse(msgEvent.data);
          if (payload.type === 'EVENT' && payload.event) {
            processDomainEvent(payload.event);

            // Broadcast to other tabs
            if (broadcastChannelRef.current) {
              broadcastChannelRef.current.postMessage({
                type: 'EVENT',
                event: payload.event,
              });
            }
          } else if (payload.type === 'PONG') {
            // Heartbeat ACK
          }
        } catch (err) {
          console.error('[DRAXELYRA Realtime] Error parsing WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        setStatus('OFFLINE');
        lastDisconnectTimeRef.current = new Date();
        if (pingTimerRef.current) {
          clearInterval(pingTimerRef.current);
          pingTimerRef.current = null;
        }

        // Exponential backoff with jitter (1s - 30s)
        setReconnectCount((count) => {
          const nextCount = count + 1;
          const delay = Math.min(1000 * Math.pow(1.5, Math.min(nextCount, 6)) + Math.random() * 500, 30000);
          if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = setTimeout(connect, delay);
          return nextCount;
        });
      };

      ws.onerror = (err) => {
        console.warn('[DRAXELYRA Realtime] WebSocket connection issue:', err);
        setStatus('OFFLINE');
      };
    } catch (err) {
      console.error('[DRAXELYRA Realtime] Failed to initialize WebSocket:', err);
      setStatus('OFFLINE');
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = setTimeout(connect, 5000);
    }
  }, [activeIncidentId, processDomainEvent]);

  useEffect(() => {
    connect();

    // Listen to browser online/offline events
    const handleOnline = () => connect();
    const handleOffline = () => setStatus('OFFLINE');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (pingTimerRef.current) clearInterval(pingTimerRef.current);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [connect]);

  const subscribeChannels = useCallback((channels: string[]) => {
    channels.forEach((ch) => subscriptionsRef.current.add(ch));
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'SUBSCRIBE', channels }));
    }
  }, []);

  return {
    status,
    isConnected: status === 'LIVE',
    lastEvent,
    lastEventTime,
    reconnectCount,
    subscribeChannels,
  };
}

