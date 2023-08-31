import { Global, Module } from '@nestjs/common';
import { DevConfigService } from './config.service';
import { ConfigurableModuleClass } from './config.module.definition';
import { CONFIG_MANAGER_TOKEN } from '@libs/core';

@Global()
@Module({
  providers: [
    DevConfigService,
    {
      provide: CONFIG_MANAGER_TOKEN,
      useClass: DevConfigService,
    },
  ],
  exports: [CONFIG_MANAGER_TOKEN, DevConfigService],
})
export class DevConfigModule extends ConfigurableModuleClass {}
