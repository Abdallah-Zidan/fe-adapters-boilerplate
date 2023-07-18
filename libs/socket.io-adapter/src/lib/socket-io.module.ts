import { Logger, Module } from '@nestjs/common';
import { SocketIoService } from './socket-io.service';
import { LOGGER } from './constants';
import { ModuleOptions } from './types';
import {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN,
} from './module.definition';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { SOCKET_ADAPTER_TOKEN } from '@libs/core';

@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [
    SocketIoService,
    {
      provide: SOCKET_ADAPTER_TOKEN,
      useClass: SocketIoService,
    },
    {
      provide: LOGGER,
      useFactory(moduleOptions: ModuleOptions) {
        return moduleOptions.logger
          ? moduleOptions.logger
          : new Logger(SocketIoModule.name);
      },
      inject: [MODULE_OPTIONS_TOKEN],
    },
  ],
  exports: [SOCKET_ADAPTER_TOKEN],
})
export class SocketIoModule extends ConfigurableModuleClass {}
