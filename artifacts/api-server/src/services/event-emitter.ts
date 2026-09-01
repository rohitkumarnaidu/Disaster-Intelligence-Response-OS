import { Response } from "express";
import crypto from "crypto";

export class EventBus {
  private clients: Map<string, Response> = new Map();
  private keepaliveInterval: NodeJS.Timeout;

  constructor() {
    this.keepaliveInterval = setInterval(() => {
      this.clients.forEach((client) => {
        client.write(": keepalive\n\n");
      });
    }, 30000);
  }

  public addClient(res: Response): string {
    const clientId = crypto.randomUUID();
    this.clients.set(clientId, res);

    res.on("close", () => {
      this.removeClient(clientId);
    });

    return clientId;
  }

  public removeClient(clientId: string): void {
    this.clients.delete(clientId);
  }

  public broadcast(event: string, data: any): void {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    this.clients.forEach((client) => {
      try {
        client.write(payload);
      } catch {
        // ignore write error on closed socket
      }
    });
  }

  public emit(event: string, data: any): void {
    this.broadcast(event, data);
  }

  public getClientCount(): number {
    return this.clients.size;
  }
}

export const eventBus = new EventBus();
