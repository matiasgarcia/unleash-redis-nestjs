import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { sleep } from './utils';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.init();
  console.log('Simulate some work');
  await sleep(1000);
  console.log('Start shutdown');
  if (!process.env.CLOSE_UNLEASH_AND_REDIS) {
    console.log('wont close unleash nor redis, therefore process will hang');
  }
  await app.close();
}

bootstrap();
