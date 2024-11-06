import * as Nest from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { Unleash } from 'unleash-client';
import { FeatureInterface } from 'unleash-client/lib/feature';

@Injectable()
export class UnleashClient implements Nest.OnModuleDestroy {
  private readonly logger = new Nest.Logger(UnleashClient.name);
  public readonly unleash: Unleash;

  constructor(unleash: Unleash) {
    this.unleash = unleash;
  }

  async onModuleDestroy() {
    if (!process.env.CLOSE_UNLEASH_AND_REDIS) return;
    this.logger.log('unleash.destroyWithFlush called');
    await this.unleash.destroyWithFlush();
    this.logger.log('unleash.destroyWithFlush finished');
  }

  public getFeatures(): FeatureInterface[] {
    return this.unleash.getFeatureToggleDefinitions();
  }
}
