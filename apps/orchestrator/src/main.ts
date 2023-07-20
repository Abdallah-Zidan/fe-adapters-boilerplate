import { NestFactory } from '@nestjs/core';
import { OrchestratorModule } from './app/orchestrator.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ORCHESTRATOR_INPUT_QUEUE } from '@libs/core';
import { Logger } from 'nestjs-pino';
async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    OrchestratorModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: ['amqp://localhost:5672'],
        queue: ORCHESTRATOR_INPUT_QUEUE,
        queueOptions: {
          durable: true,
        },
      },
      bufferLogs: true,
    }
  );

  app.useLogger(app.get(Logger));

  await app.listen();
}
bootstrap();
