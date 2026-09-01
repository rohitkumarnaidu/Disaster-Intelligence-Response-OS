import { WebSocketServer, WebSocket } from "ws";
import type { IncomingMessage, Server as HttpServer } from "http";
import cookieParser from "cookie-parser";
import { pool, db, users } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  AuthenticatedUserSession,
  ClientMessage,
  DomainEvent,
  ServerMessage,
} from "./contracts";
import { logger } from "../lib/logger";

function parseCookies(raw: string | undefined): Record<string, string> {
  if (!raw) return {};
  const list: Record<string, string> = {};
  raw.split(";").forEach((cookieStr) => {
    const parts = cookieStr.split("=");
    const key = parts.shift()?.trim();
    if (key) {
      list[key] = decodeURIComponent(parts.join("=").trim());
    }
  });
  return list;
}

interface ClientConnection {
  id: string;
  ws: WebSocket;
  session: AuthenticatedUserSession;
  subscriptions: Set<string>;
  connectedAt: Date;
  lastPing: Date;
  isAlive: boolean;
}

export class RealtimeGateway {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, ClientConnection> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private totalPublished = 0;
  private totalDelivered = 0;

  public initialize(server: HttpServer, sessionSecret = process.env.SESSION_SECRET || "draxelyra_default_secret"): void {
    this.wss = new WebSocketServer({ noServer: true });

    // Handle HTTP upgrade for /ws
    server.on("upgrade", async (request, socket, head) => {
      try {
        const url = new URL(request.url || "", `http://${request.headers.host || "localhost"}`);
        if (url.pathname !== "/ws") {
          socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
          socket.destroy();
          return;
        }

        // Authenticate session via cookie, with fallback to default Duty Analyst session
        let session = await this.authenticateRequest(request, sessionSecret);
        if (!session) {
          session = {
            userId: "usr-analyst",
            role: "Analyst",
            name: "Alice Analyst",
            email: "analyst@draxelyra.local",
          };
        }

        const validSession: AuthenticatedUserSession = session;

        this.wss?.handleUpgrade(request, socket, head, (ws) => {
          this.handleConnection(ws, validSession);
        });
      } catch (err: any) {
        logger.error({ err }, "Error during WebSocket upgrade handshake");
        socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
        socket.destroy();
      }
    });

    // 30s Heartbeat
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((client, clientId) => {
        if (!client.isAlive) {
          logger.info({ clientId, userId: client.session.userId }, "Terminating unresponsive WebSocket connection");
          client.ws.terminate();
          this.clients.delete(clientId);
          return;
        }
        client.isAlive = false;
        client.ws.ping();
      });
    }, 30000);

    logger.info("Realtime Gateway (WebSocket) initialized on /ws");
  }

  private async authenticateRequest(
    req: IncomingMessage,
    sessionSecret: string
  ): Promise<AuthenticatedUserSession | null> {
    const rawCookies = req.headers.cookie;
    if (!rawCookies) return null;

    const parsedCookies = parseCookies(rawCookies);
    let rawSid = parsedCookies["connect.sid"];
    if (!rawSid) return null;

    // Unsign cookie (connect.sid starts with 's:')
    let sid: string | false = false;
    if (rawSid.startsWith("s:")) {
      sid = cookieParser.signedCookie(rawSid.slice(2), sessionSecret);
    } else {
      sid = rawSid;
    }

    if (!sid) return null;

    // Query session from db
    try {
      const res = await pool.query(
        "SELECT sess FROM session WHERE sid = $1 AND expire > now()",
        [sid]
      );
      if (res.rows.length === 0) return null;

      const sess = res.rows[0].sess;
      const userId = sess.userId;
      if (!userId) return null;

      // Query user for role & org
      const [u] = await db.select().from(users).where(eq(users.id, userId));
      if (!u) return null;

      return {
        userId: u.id,
        name: u.name,
        role: u.role,
        email: u.email,
        organizationId: u.organizationId,
      };
    } catch (err) {
      logger.error({ err }, "Session lookup failed in WebSocket handshake");
      return null;
    }
  }

  private handleConnection(ws: WebSocket, session: AuthenticatedUserSession): void {
    const clientId = `ws_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const client: ClientConnection = {
      id: clientId,
      ws,
      session,
      subscriptions: new Set(["global"]), // Global channel auto-subscribed for operational updates
      connectedAt: new Date(),
      lastPing: new Date(),
      isAlive: true,
    };

    client.subscriptions.add(`user:${session.userId}`);
    if (session.organizationId) {
      client.subscriptions.add(`org:${session.organizationId}`);
    }

    this.clients.set(clientId, client);
    logger.info({ clientId, userId: session.userId, role: session.role }, "WebSocket client connected");

    ws.on("pong", () => {
      client.isAlive = true;
      client.lastPing = new Date();
    });

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString()) as ClientMessage;
        this.handleClientMessage(client, msg);
      } catch (err: any) {
        this.sendToClient(client, {
          type: "ERROR",
          code: "MALFORMED_MESSAGE",
          message: "Invalid JSON message payload",
        });
      }
    });

    ws.on("close", () => {
      this.clients.delete(clientId);
      logger.info({ clientId, userId: session.userId }, "WebSocket client disconnected");
    });

    ws.on("error", (err) => {
      logger.warn({ clientId, err }, "WebSocket client error");
      this.clients.delete(clientId);
    });

    // Send initial connection ACK
    this.sendToClient(client, {
      type: "SUBSCRIBED",
      channels: Array.from(client.subscriptions),
    });
  }

  private handleClientMessage(client: ClientConnection, msg: ClientMessage): void {
    switch (msg.type) {
      case "PING":
        this.sendToClient(client, { type: "PONG" });
        break;

      case "SUBSCRIBE": {
        const authorizedChannels: string[] = [];
        for (const ch of msg.channels) {
          if (this.canSubscribe(client.session, ch)) {
            client.subscriptions.add(ch);
            authorizedChannels.push(ch);
          } else {
            this.sendToClient(client, {
              type: "ERROR",
              code: "FORBIDDEN",
              message: `Unauthorized subscription to channel: ${ch}`,
            });
          }
        }
        if (authorizedChannels.length > 0) {
          this.sendToClient(client, {
            type: "SUBSCRIBED",
            channels: authorizedChannels,
          });
        }
        break;
      }

      case "UNSUBSCRIBE": {
        for (const ch of msg.channels) {
          client.subscriptions.delete(ch);
        }
        this.sendToClient(client, {
          type: "UNSUBSCRIBED",
          channels: msg.channels,
        });
        break;
      }

      case "RECOVER": {
        this.handleRecovery(client, msg).catch((err) => {
          logger.error({ err, clientId: client.id }, "Error during client recovery");
        });
        break;
      }
    }
  }

  private canSubscribe(session: AuthenticatedUserSession, channel: string): boolean {
    if (channel === "global") return true;

    // Organization channel check
    if (channel.startsWith("org:")) {
      const orgId = channel.slice(4);
      return session.role === "System Admin" || session.organizationId === orgId;
    }

    // User channel check
    if (channel.startsWith("user:")) {
      const targetUserId = channel.slice(5);
      return session.role === "System Admin" || session.userId === targetUserId;
    }

    // Incident, Case, Task channels: allowed for authenticated operational roles
    if (
      channel.startsWith("incident:") ||
      channel.startsWith("case:") ||
      channel.startsWith("task:") ||
      channel.startsWith("dashboard:")
    ) {
      return true;
    }

    return false;
  }

  private async handleRecovery(
    client: ClientConnection,
    msg: { sinceTimestamp?: string; lastEventId?: string; lastVersions?: Record<string, number> }
  ): Promise<void> {
    const { outboxProcessor } = await import("./outbox");
    const sinceDate = msg.sinceTimestamp ? new Date(msg.sinceTimestamp) : new Date(Date.now() - 3600 * 1000);
    const missedEvents = await outboxProcessor.getEventsSince(sinceDate, { limit: 100 });

    let replayed = 0;
    for (const evt of missedEvents) {
      if (this.shouldClientReceive(client, evt)) {
        this.sendToClient(client, { type: "EVENT", event: evt });
        replayed++;
      }
    }

    this.sendToClient(client, { type: "REPLAY_COMPLETE", replayedCount: replayed });
  }

  public broadcastEvent(event: DomainEvent): void {
    this.totalPublished++;
    const payload: ServerMessage = { type: "EVENT", event };
    const serialized = JSON.stringify(payload);

    this.clients.forEach((client) => {
      if (this.shouldClientReceive(client, event)) {
        try {
          if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(serialized);
            this.totalDelivered++;
          }
        } catch (err) {
          logger.warn({ clientId: client.id, err }, "Failed to send event to client");
        }
      }
    });
  }

  private shouldClientReceive(client: ClientConnection, event: DomainEvent): boolean {
    const subs = client.subscriptions;

    // If subscribed to global channel
    if (subs.has("global")) return true;

    // Incident-scoped subscription
    if (event.incidentId && subs.has(`incident:${event.incidentId}`)) return true;

    // Entity-scoped subscription (case, task)
    if (subs.has(`case:${event.entityId}`) || subs.has(`task:${event.entityId}`)) return true;

    // User-targeted subscription
    if (event.actorId && subs.has(`user:${event.actorId}`)) return true;

    // Org-targeted subscription
    if (event.organizationId && subs.has(`org:${event.organizationId}`)) return true;

    return false;
  }

  private sendToClient(client: ClientConnection, message: ServerMessage): void {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  public getHealthSummary() {
    return {
      status: "HEALTHY",
      activeConnections: this.clients.size,
      totalEventsPublished: this.totalPublished,
      totalEventsDelivered: this.totalDelivered,
      connectedUsers: Array.from(this.clients.values()).map((c) => ({
        userId: c.session.userId,
        role: c.session.role,
        connectedAt: c.connectedAt,
        subscriptionsCount: c.subscriptions.size,
      })),
    };
  }

  public shutdown(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.clients.forEach((client) => {
      client.ws.close(1001, "Server shutting down");
    });
    this.clients.clear();
    this.wss?.close();
  }
}

export const realtimeGateway = new RealtimeGateway();
