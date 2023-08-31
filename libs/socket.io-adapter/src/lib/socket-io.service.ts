import {
  EventStore,
  IEvent,
  IEventStore,
  ISessionManager,
  Sender,
  SessionManager,
  ISocketAdapter,
  Channel,
} from '@libs/core';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as socketIo from 'socket.io';
import { ExtendedSocket, ModuleOptions } from './types';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Server } from 'http';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import { LOGGER } from './constants';
import { MODULE_OPTIONS_TOKEN } from './module.definition';

@Injectable()
export class SocketIoService implements ISocketAdapter {
  private io: socketIo.Server;

  constructor(
    @SessionManager() private readonly sessionManager: ISessionManager,
    @EventStore() private readonly eventStore: IEventStore,
    private readonly eventEmitter: EventEmitter2,
    @Inject(LOGGER) private readonly logger: Logger,
    @Inject(MODULE_OPTIONS_TOKEN)
    private readonly options: ModuleOptions
  ) {
    this.io = new socketIo.Server({
      cors: {
        origin: '*',
      },
    });
  }

  async start(server: Server) {
    const pubClient = createClient({ url: this.options.redisUrl });
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    this.io.adapter(createAdapter(pubClient, subClient));

    this.io.attach(server);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.io.use(async (socket: ExtendedSocket, next: any) => {
      await this.ensureSession(socket);
      await this.relayEvents(socket);
      next();
    });

    this.io.on('connection', (socket: ExtendedSocket) => {
      socket.on(
        'message',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        }
      );

      socket.on('disconnect', () => {
        this.logger.debug('Client disconnected [%s]', socket.sessionID);
      });
    });
  }

  public async send(event: IEvent) {
    this.logger.debug('sending event : %j', event);
    await this.eventStore.save(event);
    this.io
      .timeout(8000)
      .to(event.sessionID)
      .emit('message', event, (err: unknown) => {
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
      socket.handshake.auth['sessionID'] || socket.handshake.query['sessionID'];
    if (sessionID && (await this.sessionManager.exists(sessionID))) {
      socket.sessionID = sessionID;
      this.logger.debug('existing sessionID [%s]', sessionID);
      socket.join(sessionID);
    } else {
      const newSessionID = randomUUID();
      this.logger.debug('new sessionID [%s]', newSessionID);
      await this.sessionManager.create(newSessionID, {
        channel: Channel.WEB,
        sessionStartTime: new Date(),
      });
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
