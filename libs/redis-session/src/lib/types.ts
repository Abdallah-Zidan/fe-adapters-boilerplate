import { Logger } from '@nestjs/common';
import { RedisOptions } from 'ioredis';

export interface Options extends RedisOptions {
  logger?: Logger;
}
