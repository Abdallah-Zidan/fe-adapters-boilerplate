import { RedisOptions } from 'ioredis';

export interface Options extends RedisOptions {
  prefix?: string;
  logger?: any;
}
