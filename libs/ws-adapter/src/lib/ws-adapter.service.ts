import { Inject, Injectable, Logger } from '@nestjs/common';
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
  Channel,
} from '@libs/core';
import * as internal from 'stream';
import { randomUUID } from 'crypto';
import { Redis } from 'ioredis';
import { MODULE_OPTIONS_TOKEN } from './module.definition';
import { ModuleOptions } from './types';
import { LOGGER } from './constants';
@Injectable()
export class WSService implements ISocketAdapter {
  private wss!: WebSocketServer;
  private readonly sockets: Map<string, WebSocket> = new Map();
  private readonly publisher: Redis;
  private readonly subscriber: Redis;

  constructor(
    @SessionManager() private readonly sessionManager: ISessionManager,
    @EventStore() private readonly eventStore: IEventStore,
    private readonly eventEmitter: EventEmitter2,
    @Inject(LOGGER) private readonly logger: Logger,
    @Inject(MODULE_OPTIONS_TOKEN) readonly options: ModuleOptions
  ) {
    this.publisher = new Redis(options.redis);
    this.subscriber = this.publisher.duplicate();
  }

  async start(server: Server) {
    this.handleSubscription();
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
    await this.publisher.publish('socket_events', JSON.stringify(event));
  }

  private handleSubscription() {
    this.subscriber.subscribe('socket_events');
    this.subscriber.on('message', async (_, message) => {
      const event = JSON.parse(message) as IEvent;
      const targetSocket = this.sockets.get(event.sessionID);
      if (targetSocket) {
        targetSocket.send(message);
      }
    });
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
      (await this.sessionManager.exists(headerSessionID as string))
    ) {
      this.logger.debug('existing session');
      sessionID = headerSessionID as string;
    } else {
      this.logger.debug('non existing or expired session');
      sessionID = randomUUID();
    }

    await this.sessionManager.create(sessionID, {
      channel: Channel.WEB,
      sessionStartTime: new Date(),
    });

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
