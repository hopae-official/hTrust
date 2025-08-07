import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TrustRegistryModule } from './trust-registry/trust-registry.module';
import { MinimalFederationModule } from './federation/minimal-federation.module';

@Module({
  imports: [TrustRegistryModule, MinimalFederationModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
