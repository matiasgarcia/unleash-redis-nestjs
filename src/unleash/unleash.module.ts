import { Logger, Module, OnModuleDestroy } from '@nestjs/common';
import { UnleashRedisStorage } from './unleash.redis';
import { ConfigService } from '@nestjs/config';
import { initialize } from 'unleash-client';
import { RedisFactory } from './redis-factory';
import { UnleashClient } from './unleash-client';

@Module({
  providers: [
    {
      provide: UnleashClient,
      useFactory: async (
        configService: ConfigService,
        storageProvider: UnleashRedisStorage,
      ) => {
        const logger = new Logger('Unleash');
        const unleash = initialize({
          url: configService.getOrThrow('unleash.url'),
          appName: configService.getOrThrow('unleash.appName'),
          customHeaders: {
            Authorization: configService.getOrThrow('unleash.apiKey'),
          },
          environment: configService.getOrThrow('env'),
          storageProvider,
        })
          .on('ready', () => logger.log('ready'))
          .on('synchronized', () => logger.log('synchronized'))
          .on('warn', (msg) => logger.warn(msg))
          .on('error', (error) => logger.error(error));

        return new UnleashClient(unleash);
      },
      inject: [ConfigService, UnleashRedisStorage],
    },
    {
      provide: UnleashRedisStorage,
      useFactory: async (configService: ConfigService) => {
        const redisClient = await RedisFactory.create({
          host: configService.getOrThrow('redis.host'),
          port: configService.getOrThrow('redis.port'),
          tls: configService.get<boolean>('redis.tls', false),
          db: configService.get<number>('redis.db', 0),
          clusterMode: configService.get('redis.clusterMode', false),
          timeout: 1000,
        });

        return new UnleashRedisStorage(redisClient);
      },
      inject: [ConfigService],
    },
  ],
  exports: [UnleashClient],
})
export class UnleashClientModule {}
