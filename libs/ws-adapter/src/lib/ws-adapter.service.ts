import { Injectable, Logger } from '@nestjs/common';
import { Server, IncomingMessage } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  EventStore,
  IEvent,
  IEventStore,
  ISessionManager,
  Sender,
  SessionManager,
  WithSession,
  ISocketAdapter,
} from '@libs/core';
import * as internal from 'stream';
import { randomUUID } from 'crypto';

@Injectable()
export class WSService implements ISocketAdapter {
  private wss!: WebSocketServer;
  private readonly sockets: Map<string, WebSocket> = new Map();

  private readonly logger = new Logger(WSService.name);

  constructor(
    @SessionManager() private readonly sessionManager: ISessionManager,
    @EventStore() private readonly eventStore: IEventStore,
    private readonly eventEmitter: EventEmitter2
  ) {}

  start(server: Server): void {
    this.wss = new WebSocketServer({ noServer: true });
    server.on('upgrade', this.handleSession.bind(this));

    this.wss.on('connection', (socket: WithSession<WebSocket>) => {
      socket.on('message', async (rawPayload, isBinary) => {
        if (!isBinary) {
          const parsed = this.parseNonBinaryMessage(rawPayload);
          if (!parsed) return;
          const { data, type } = parsed;
          const event: Omit<IEvent, 'id'> = {
            createdAt: new Date(),
            data,
            type,
            sender: Sender.CLIENT,
            sessionID: socket.sessionID as string,
          };
          const saved = await this.eventStore.save(event);
          this.eventEmitter.emit('message', saved);
        }
      });
    });
  }

  public async send(event: IEvent) {
    await this.eventStore.save(event);
    const targetSocket = this.sockets.get(event.sessionID);
    if (targetSocket) {
      targetSocket.send(JSON.stringify(event));
    }
  }

  private async handleSession(
    req: IncomingMessage,
    socket: internal.Duplex,
    head: Buffer
  ) {
    const headerSessionID = req.headers['sessionid'];
    let sessionID!: string;

    if (
      typeof headerSessionID === 'string' &&
      (await this.sessionManager.findOne(headerSessionID as string))
    ) {
      this.logger.debug('existing session');
      sessionID = headerSessionID as string;
    } else {
      this.logger.debug('non existing or expired session');
      sessionID = randomUUID();
    }

    await this.sessionManager.create(sessionID);

    this.wss.handleUpgrade(
      req,
      socket,
      head,
      async (ws: WithSession<WebSocket>) => {
        this.sockets.set(sessionID, ws);
        ws.on('close', () => this.sockets.delete(sessionID));
        ws.sessionID = sessionID;
        ws.send(JSON.stringify({ type: 'SESSION', data: sessionID }));
        await this.relayEvents(ws);
        this.wss.emit('connection', ws, req);
      }
    );
  }

  private async relayEvents(socket: WithSession<WebSocket>) {
    const events = await this.eventStore.find({
      sessionID: socket.sessionID ?? '',
      limit: 10,
    });

    for (const event of events) {
      socket.send(JSON.stringify(event));
    }
  }

  private parseNonBinaryMessage(message: Buffer | ArrayBuffer | Buffer[]): {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    type: string;
  } | null {
    try {
      const str = message.toString();
      return JSON.parse(str);
    } catch (error) {
      return null;
    }
  }
}
