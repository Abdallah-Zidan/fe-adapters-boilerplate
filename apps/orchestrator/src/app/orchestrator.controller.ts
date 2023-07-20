import { Controller, Inject, Logger } from '@nestjs/common';
import { ClientProxy, EventPattern, Payload } from '@nestjs/microservices';
import {
  CLIENT_EVENT,
  IEvent,
  ReplyTo,
  Sender,
  WEB_OUTPUT_EVENT,
  WEB_QUEUE_CLIENT,
} from '@libs/core';
import { promisify } from 'util';

@Controller()
export class OrchestratorController {
  private readonly logger = new Logger(OrchestratorController.name);
  constructor(
    @Inject(WEB_QUEUE_CLIENT) private readonly webQueue: ClientProxy
  ) {}

  @EventPattern(CLIENT_EVENT)
  async clientMessage(@Payload() data: IEvent & { replyTo: ReplyTo }) {
    this.logger.debug(`consuming client message %j`, data);
    await promisify(setTimeout)(1000);
    if (data.replyTo === ReplyTo.WEB_OUTPUT_QUEUE) {
      this.logger.debug(`sending message to web output queue`);
      data.sender = Sender.SERVER;
      data.createdAt = new Date();
      this.webQueue.emit(WEB_OUTPUT_EVENT, data);
    }
  }
}
