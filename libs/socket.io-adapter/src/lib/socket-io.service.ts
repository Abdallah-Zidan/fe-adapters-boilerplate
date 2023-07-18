import {
  EventStore,
  IEvent,
  IEventStore,
  ISessionManager,
  Sender,
  SessionManager,
} from '@libs/core';
import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as socketIo from 'socket.io';
import { ExtendedSocket } from './types';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ISocketAdapter } from '@libs/core/interfaces/socket-adapter';

@Injectable()
export class SocketIoService implements ISocketAdapter {
  private io: socketIo.Server;

  private readonly logger = new Logger(SocketIoService.name);

  constructor(
    @SessionManager() private readonly sessionManager: ISessionManager,
    @EventStore() private readonly eventStore: IEventStore,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.io = new socketIo.Server({
      cors: {
        origin: '*',
      },
    });
  }

  start(server: any): void {
    this.io.attach(server);

    this.io.use(async (socket: ExtendedSocket, next: any) => {
      await this.ensureSession(socket);
      await this.relayEvents(socket);
      next();
    });

    this.io.on('connection', (socket: ExtendedSocket) => {
      socket.on(
        'message',
        async ({ data, type }: { data: any; type: string }) => {
          const event: Omit<IEvent, 'id'> = {
            createdAt: new Date(),
            data,
            type,
            sender: Sender.CLIENT,
            sessionID: socket.sessionID as string,
          };

          const saved = await this.eventStore.save(event);
          this.eventEmitter.emit('message', saved);
        },
      );

      socket.on('disconnect', () => {
        this.logger.debug('Client disconnected [%s]', socket.sessionID);
      });
    });
  }

  public async send(event: IEvent) {
    await this.eventStore.save(event);
    this.io
      .timeout(8000)
      .to(event.sessionID)
      .emit('message', event, (err: any) => {
        if (err) {
          this.logger.warn("client didn't  acknowledge event : ", event.id);
          return;
        }
        this.eventStore.acknowledge(event.id).catch(() => {
          this.logger.error('failed to acknowledge event : ', event.id);
        });
      });
  }

  private async ensureSession(socket: ExtendedSocket) {
    const sessionID =
      socket.handshake.auth.sessionID || socket.handshake.query.sessionID;
    if (sessionID && (await this.sessionManager.findOne(sessionID))) {
      socket.sessionID = sessionID;
      this.logger.debug('existing sessionID [%s]', sessionID);
      socket.join(sessionID);
    } else {
      const newSessionID = randomUUID();
      this.logger.debug('new sessionID [%s]', newSessionID);
      await this.sessionManager.create(newSessionID);
      socket.sessionID = newSessionID;
      socket.join(newSessionID);
    }
    socket.emit('session', socket.sessionID);
  }

  private async relayEvents(socket: ExtendedSocket) {
    const { lastTimestamps, limit: rawLimit } = socket.handshake.query;
    let since = undefined;
    let limit = undefined;

    if (lastTimestamps && typeof lastTimestamps === 'string') {
      since = new Date(lastTimestamps);
    }

    if (rawLimit && typeof rawLimit === 'string') {
      const parsed = Number(rawLimit);
      if (isFinite(parsed)) {
        limit = parsed;
      }
    }

    const events = await this.eventStore.find({
      sessionID: socket.sessionID ?? '',
      limit: limit || 50,
      since,
    });

    for (const event of events) {
      socket.emit('message', event);
    }
  }
}
