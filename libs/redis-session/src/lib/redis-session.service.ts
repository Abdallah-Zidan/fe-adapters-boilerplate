import { Inject, Injectable } from '@nestjs/common';
import { MODULE_OPTIONS_TOKEN } from './module.definition';
import Redis from 'ioredis';
import { Options } from './types';
import { ISessionManager } from '@libs/core';
import { isEmpty } from 'lodash';
@Injectable()
export class RedisSessionService implements ISessionManager {
  private redis: Redis;
  private prefix = '';
  constructor(@Inject(MODULE_OPTIONS_TOKEN) readonly options: Options) {
    this.redis = new Redis(options);
    this.prefix = options.prefix ? options.prefix + '::' : '';
  }
  async findOne(sessionID: string) {
    const data = await this.redis.hgetall(this.prefix + sessionID);
    if (isEmpty(data)) return null;
    return {
      id: sessionID,
      isActive: data.isActive === 'true',
      lastActivity: new Date(data.lastActivity),
    };
  }

  async create(sessionID: string) {
    return this.redis.hmset(this.prefix + sessionID, {
      isActive: 'true',
      lastActivity: new Date().toISOString(),
      id: sessionID,
    });
  }

  async delete(sessionID: string) {
    await this.redis.hdel(sessionID);
  }
}
