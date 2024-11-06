import { Logger } from '@nestjs/common';
import Redis, { Cluster } from 'ioredis';

export class RedisFactory {
  static async create(options: {
    clusterMode: boolean;
    host: string;
    port: number;
    namespace?: string;
    tls: boolean;
    timeout?: number;
    db?: number;
  }): Promise<Redis | Cluster> {
    const logger = new Logger('Redis');
    const configuredTimeout = options.timeout ?? 10000;
    let client: Redis | Cluster;
    const tls = options.tls ? {} : undefined;
    if (options.clusterMode) {
      client = new Redis.Cluster([{ host: options.host, port: options.port }], {
        keyPrefix: options.namespace && `${options.namespace}:`,
        enableOfflineQueue: false,
        enableReadyCheck: true,
        dnsLookup: (address, callback) => callback(null, address),
        redisOptions: {
          tls,
        },
        clusterRetryStrategy: (times) => (times <= 10 ? 300 : undefined),
      });
    } else {
      client = new Redis(options.port, options.host, {
        db: options.db ?? 0,
        keyPrefix: options.namespace && `${options.namespace}:`,
        offlineQueue: false,
        tls,
        retryStrategy: (times) => (times <= 10 ? 300 : undefined),
      });
    }

    client.on('error', (error) =>
      logger.error(
        { error: error.message },
        error.stack,
        'Error on redis client',
      ),
    );

    return await new Promise((resolve, reject) => {
      const t = setTimeout(() => {
        logger.error(
          `Redis connection is taking more than ${configuredTimeout}ms to be ready`,
        );
        reject(new Error('redis not available'));
      }, configuredTimeout);

      client.once('ready', () => {
        logger.log('Redis connection is ready');
        clearTimeout(t);
        resolve(client);
      });
    });
  }
}
