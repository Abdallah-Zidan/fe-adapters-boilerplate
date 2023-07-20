import { Module } from '@nestjs/common';
import { OrchestratorController } from './orchestrator.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { WEB_OUTPUT_QUEUE, WEB_QUEUE_CLIENT, loggerConfig } from '@libs/core';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    LoggerModule.forRoot(loggerConfig),

    ClientsModule.register([
      {
        name: WEB_QUEUE_CLIENT,
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: WEB_OUTPUT_QUEUE,
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [OrchestratorController],
})
export class OrchestratorModule {}
