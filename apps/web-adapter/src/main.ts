import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { SOCKET_ADAPTER_TOKEN, WEB_OUTPUT_QUEUE } from '@libs/core';
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    cors: {
      origin: '*',
    },
  });

  app.useLogger(app.get(Logger));

  const socketAdapter = app.get(SOCKET_ADAPTER_TOKEN);
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://localhost:5672'],
      queue: WEB_OUTPUT_QUEUE,
      queueOptions: {
        durable: true,
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(3000);

  socketAdapter.start(app.getHttpServer());
}
bootstrap();
