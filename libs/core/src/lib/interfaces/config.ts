export type RedisOpts = {
  host: string;
  port: number;
  password?: string;
};

export type MongoOpts = {
  host: string;
  port: string;
  db: string;
  username?: string;
  password?: string;
};

export interface IConfigManager {
  get<T = unknown>(path: string): Promise<T> | T;
  getRedisOpts: () => Promise<RedisOpts> | RedisOpts;
  getMongoOpts: () => Promise<MongoOpts> | MongoOpts;
}
