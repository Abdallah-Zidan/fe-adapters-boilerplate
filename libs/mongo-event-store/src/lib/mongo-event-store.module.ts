import { MongoEventStoreService } from './mongo-event-store.service';
import { EVENT_STORE_TOKEN } from '@libs/core';
import { DynamicModule, Global, Logger, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Event, EventSchema } from './schemas/event.schema';
import { ModuleOptions } from './types';
import { LOGGER } from './constants';
@Global()
@Module({})
export class MongoEventStoreModule {
  static registerAsync(
    options: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      inject: any[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      useFactory: (...args: any[]) => Promise<ModuleOptions> | ModuleOptions;
    },
    logger?: Logger
  ): DynamicModule {
    return {
      module: MongoEventStoreModule,
      imports: [
        MongooseModule.forRootAsync({
          inject: options.inject,
          useFactory: options.useFactory,
        }),
        MongooseModule.forFeature([
          {
            name: Event.name,
            schema: EventSchema,
          },
        ]),
      ],
      providers: [
        {
          provide: EVENT_STORE_TOKEN,
          useClass: MongoEventStoreService,
        },
        {
          provide: LOGGER,
          useValue: logger ? logger : new Logger(MongoEventStoreModule.name),
        },
      ],
      exports: [EVENT_STORE_TOKEN],
    };
  }
}
