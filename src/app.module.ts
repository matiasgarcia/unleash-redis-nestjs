import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UnleashClientModule } from './unleash/unleash.module';
import { ConfigModule, ConfigObject } from '@nestjs/config';

function load(): ConfigObject {
  return {
    env: process.env.NODE_ENV,
    unleash: {
      url: process.env.UNLEASH_URL,
      appName: process.env.UNLEASH_APP_NAME,
      apiKey: process.env.UNLEASH_API_KEY,
    },
    redis: {
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
      tls: process.env.REDIS_TLS === 'true',
      db: process.env.REDIS_DB ? Number(process.env.REDIS_DB) : undefined,
      clusterMode: process.env.REDIS_CLUSTER_MODE === 'true',
    },
  };
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.development.env'],
      load: [load],
    }),
    UnleashClientModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
