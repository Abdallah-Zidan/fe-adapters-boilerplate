import { Logger, Module } from '@nestjs/common';
import { RedisSessionModule } from '@libs/redis-session';
import { MongoEventStoreModule } from '@libs/mongo-event-store';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { ChatController } from './chat.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  CONFIG_MANAGER_TOKEN,
  IConfigManager,
  ORCHESTRATOR_INPUT_QUEUE,
  ORCHESTRATOR_QUEUE_CLIENT,
  loggerConfig,
} from '@libs/core';
import { SocketIoModule } from '@libs/socket.io-adapter';
import { DevConfigModule } from '@libs/dev-config';
import { WsAdapterModule } from '@libs/ws-adapter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule.forRoot(loggerConfig),
    DevConfigModule.registerAsync({
      useFactory() {
        return {
          env: process.env,
        };
      },
    }),
    RedisSessionModule.registerAsync({
      inject: [CONFIG_MANAGER_TOKEN],
      async useFactory(configManager: IConfigManager) {
        const redisData = await configManager.getRedisOpts();
        return {
          host: redisData.host,
          port: redisData.port,
          password: redisData.password ?? undefined,
        };
      },
    }),

    MongoEventStoreModule.registerAsync(
      {
        inject: [CONFIG_MANAGER_TOKEN],
        useFactory: async (configManager: IConfigManager) => {
          const mongoData = await configManager.getMongoOpts();
          return {
            uri: `mongodb://${mongoData.host}:${mongoData.port}/${mongoData.db}`,
          };
        },
      },
      new Logger(MongoEventStoreModule.name)
    ),
    // SocketIoModule.registerAsync({
    //   inject: [CONFIG_MANAGER_TOKEN],
    //   async useFactory(configManager: IConfigManager) {
    //     const redisData = await configManager.getRedisOpts();
    //     return {
    //       logger: new Logger(SocketIoModule.name),
    //       redisUrl: `redis://${redisData.host}:${redisData.port}`,
    //     };
    //   },
    // }),
    WsAdapterModule.registerAsync({
      inject: [CONFIG_MANAGER_TOKEN],
      async useFactory(configManager: IConfigManager) {
        const redisData = await configManager.getRedisOpts();
        return {
          logger: new Logger(SocketIoModule.name),
          redis: {
            host: redisData.host,
            port: redisData.port,
            password: redisData.password,
          },
        };
      },
    }),
    ClientsModule.register([
      {
        name: ORCHESTRATOR_QUEUE_CLIENT,
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: ORCHESTRATOR_INPUT_QUEUE,
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [ChatController],
})
export class AppModule {}
