import { Logger } from '@nestjs/common';
import { RedisOptions } from 'ioredis';

export type ModuleOptions = {
  logger?: Logger;
  redis: RedisOptions;
};
