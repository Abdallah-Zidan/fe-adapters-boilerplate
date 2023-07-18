import {
  CLIENT_EVENT,
  IEvent,
  ORCHESTRATOR_QUEUE_CLIENT,
  ReplyTo,
  SocketAdapter,
  WEB_OUTPUT_EVENT,
  ISocketAdapter,
} from '@libs/core';
import { Controller, Inject, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ClientProxy, EventPattern } from '@nestjs/microservices';

@Controller()
export class ChatController {
  constructor(
    @SocketAdapter() private readonly socketAdapter: ISocketAdapter,
    @Inject(ORCHESTRATOR_QUEUE_CLIENT)
    private readonly orchestratorQueue: ClientProxy
  ) {}
  private readonly logger = new Logger(ChatController.name);

  @OnEvent('message')
  async handleOrderCreatedEvent(payload: IEvent) {
    this.logger.debug(`received event from client : %j`, payload);
    this.orchestratorQueue.emit(CLIENT_EVENT, {
      ...payload,
      replyTo: ReplyTo.WEB_OUTPUT_QUEUE,
    });
  }

  @EventPattern(WEB_OUTPUT_EVENT)
  onWebOutputEvent(payload: IEvent) {
    this.logger.debug(`received event from orchestrator : %j`, payload);
    this.socketAdapter.send(payload);
  }
}
