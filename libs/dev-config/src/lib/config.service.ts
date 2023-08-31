import { Inject, Injectable } from '@nestjs/common';

import { ConfigModuleOptions } from './types';
import { MODULE_OPTIONS_TOKEN } from './config.module.definition';
import { IConfigManager } from '@libs/core';

@Injectable()
export class DevConfigService implements IConfigManager {
  private env: NodeJS.ProcessEnv;

  constructor(
    @Inject(MODULE_OPTIONS_TOKEN)
    readonly moduleOptions: ConfigModuleOptions
  ) {
    this.env = moduleOptions.env;
  }

  getRedisOpts() {
    return {
      host: (this.env['REDIS_HOST'] as string) ?? 'localhost',
      port: +(this.env['REDIS_PORT'] as string),
      password: this.env['REDIS_PASSWORD'],
    };
  }

  getMongoOpts() {
    return {
      host: this.env['MONGO_HOST'] as string,
      port: this.env['MONGO_PORT'] as string,
      db: this.env['MONGO_DB'] as string,
    };
  }

  public async get<T = unknown>() {
    return {} as T;
  }
}
