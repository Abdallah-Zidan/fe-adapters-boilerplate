import { Global, Logger, Module } from '@nestjs/common';
import { RedisSessionService } from './redis-session.service';
import {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN,
} from './module.definition';
import { LOGGER } from './constants';
import { Options } from './types';
import { SESSION_MANAGER_TOKEN } from '@libs/core';

@Global()
@Module({
  providers: [
    RedisSessionService,
    {
      provide: LOGGER,
      useFactory(moduleOptions: Options) {
        return moduleOptions.logger
          ? moduleOptions.logger
          : new Logger(RedisSessionModule.name);
      },
      inject: [MODULE_OPTIONS_TOKEN],
    },
    {
      provide: SESSION_MANAGER_TOKEN,
      useClass: RedisSessionService,
    },
  ],
  exports: [SESSION_MANAGER_TOKEN, LOGGER],
})
export class RedisSessionModule extends ConfigurableModuleClass {}
