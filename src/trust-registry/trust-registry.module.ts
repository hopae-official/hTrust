import { Module } from '@nestjs/common';
import { TrustRegistryController } from './controllers/trust-registry.controller';
import { TrustRegistryService } from './services/trust-registry.service';
import { MinimalFederationModule } from '../federation/minimal-federation.module';

@Module({
  imports: [MinimalFederationModule],
  controllers: [TrustRegistryController],
  providers: [TrustRegistryService],
  exports: [TrustRegistryService, MinimalFederationModule],
})
export class TrustRegistryModule {}
