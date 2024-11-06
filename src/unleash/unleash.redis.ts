import { BeforeApplicationShutdown, Logger } from '@nestjs/common';
import { Cluster, Redis } from 'ioredis';

export class UnleashRedisStorage implements BeforeApplicationShutdown {
  private readonly logger = new Logger(UnleashRedisStorage.name);

  constructor(public readonly redis: Cluster | Redis) {}

  async set(key: string, data: any) {
    this.logger.log({ method: 'set', data });
    const serializedData = JSON.stringify(data);
    const redisKey = this.buildKey(key);
    await this.redis.set(redisKey, serializedData);
  }

  async get(key: string) {
    this.logger.log({ method: 'get', key });
    const data = await this.redis.get(this.buildKey(key));
    return data ? JSON.parse(data) : data;
  }

  beforeApplicationShutdown() {
    if (!process.env.CLOSE_UNLEASH_AND_REDIS) return;
    this.logger.log('redis.disconnect called');
    this.redis.disconnect();
    this.logger.log('redis.disconnect finished');
  }

  private buildKey(key: string) {
    return `unleash:${key}`;
  }
}
