import { Logger, Module } from '@nestjs/common';
import { RedisSessionModule } from '@libs/redis-session';
import { MongoEventStoreModule } from '@libs/mongo-event-store';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { VaultModule, VaultService } from '@libs/vault';
import { MONGO_VAULT_PATH, REDIS_VAULT_PATH } from './constants';
import { LoggerModule } from 'nestjs-pino';
import { ChatController } from './chat.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  ORCHESTRATOR_INPUT_QUEUE,
  ORCHESTRATOR_QUEUE_CLIENT,
  loggerConfig,
} from '@libs/core';
import { SocketIoModule } from '@libs/socket.io-adapter';
import { WsAdapterModule } from '@libs/ws-adapter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule.forRoot(loggerConfig),
    VaultModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        roleId: configService.getOrThrow('VAULT_ROLE_ID'),
        secretId: configService.getOrThrow('VAULT_SECRET_ID'),
        vaultUrl: configService.getOrThrow('VAULT_URL'),
      }),
    }),
    RedisSessionModule.registerAsync({
      inject: [VaultService],
      async useFactory(vaultService: VaultService) {
        const redisData = await vaultService.get<{
          host: string;
          port: number;
          password: string;
        }>(REDIS_VAULT_PATH);
        return {
          host: redisData.host,
          port: redisData.port,
          password: redisData.password || undefined,
        };
      },
    }),

    MongoEventStoreModule.registerAsync(
      {
        inject: [VaultService],
        useFactory: async (vaultService: VaultService) => {
          const mongoData = await vaultService.get<{
            host: string;
            port: number;
            db: string;
          }>(MONGO_VAULT_PATH);
          return {
            uri: `mongodb://${mongoData.host}:${mongoData.port}/${mongoData.db}`,
          };
        },
      },
      new Logger(MongoEventStoreModule.name)
    ),
    // SocketIoModule.registerAsync({
    //   inject: [VaultService],
    //   async useFactory(vaultService: VaultService) {
    //     const redisData = await vaultService.get<{
    //       host: string;
    //       port: number;
    //       password: string;
    //     }>(REDIS_VAULT_PATH);
    //     return {
    //       logger: new Logger(SocketIoModule.name),
    //       redisUrl: `redis://${redisData.host}:${redisData.port}`,
    //     };
    //   },
    // }),
    WsAdapterModule.registerAsync({
      inject: [VaultService],
      async useFactory(vaultService: VaultService) {
        const redisData = await vaultService.get<{
          host: string;
          port: number;
          password: string;
        }>(REDIS_VAULT_PATH);
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
