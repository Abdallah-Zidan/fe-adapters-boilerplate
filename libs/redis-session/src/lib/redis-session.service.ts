import { Inject, Injectable } from '@nestjs/common';
import { MODULE_OPTIONS_TOKEN } from './module.definition';
import Redis from 'ioredis';
import { Options } from './types';
import {
  CreateSessionData,
  DEFAULT_SESSION_EXPIRY_SECONDS,
  DEFAULT_SESSION_PREFIX,
  ISessionManager,
  UpdateSessionData,
} from '@libs/core';
import { isEmpty } from 'lodash';
@Injectable()
export class RedisSessionService implements ISessionManager {
  private redis: Redis;
  private prefix = DEFAULT_SESSION_PREFIX;

  constructor(@Inject(MODULE_OPTIONS_TOKEN) readonly options: Options) {
    this.redis = new Redis(options);
  }

  async exists(sessionID: string) {
    const exists = await this.redis.hexists(this.prefix + sessionID, 'id');
    return exists === 1;
  }

  async findOne<T>(sessionID: string) {
    const data = await this.redis.hgetall(this.prefix + sessionID);
    if (isEmpty(data)) return null;
    const parsed = JSON.stringify(data);
    return parsed as T;
  }

  async create<T = object>(
    sessionID: string,
    data: CreateSessionData<T>,
    seconds?: number
  ) {
    await this.redis.hset(this.prefix + sessionID, {
      id: sessionID,
      ...data,
    });

    await this.expire(sessionID, seconds);
  }

  async update<T = object>(
    sessionID: string,
    data: UpdateSessionData<T>,
    seconds?: number | undefined
  ): Promise<void> {
    await this.redis.hset(this.prefix + sessionID, data);
    await this.expire(sessionID, seconds);
  }

  async refresh(sessionID: string, seconds?: number): Promise<void> {
    await this.expire(sessionID, seconds);
  }

  async delete(sessionID: string) {
    await this.redis.del(sessionID);
  }

  private expire(sessionID: string, seconds?: number) {
    return this.redis.expire(
      this.prefix + sessionID,
      seconds ?? DEFAULT_SESSION_EXPIRY_SECONDS
    );
  }
}
