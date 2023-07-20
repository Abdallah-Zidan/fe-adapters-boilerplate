import { Logger, Module } from '@nestjs/common';
import { WSService } from './ws-adapter.service';
import { SOCKET_ADAPTER_TOKEN } from '@libs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN,
} from './module.definition';
import { LOGGER } from './constants';
import { ModuleOptions } from './types';

@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [
    WSService,
    {
      provide: SOCKET_ADAPTER_TOKEN,
      useClass: WSService,
    },
    {
      provide: LOGGER,
      useFactory(moduleOptions: ModuleOptions) {
        return moduleOptions.logger
          ? moduleOptions.logger
          : new Logger(WsAdapterModule.name);
      },
      inject: [MODULE_OPTIONS_TOKEN],
    },
  ],
  exports: [SOCKET_ADAPTER_TOKEN],
})
export class WsAdapterModule extends ConfigurableModuleClass {}
