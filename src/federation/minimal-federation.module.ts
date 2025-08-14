import { Module } from '@nestjs/common';
import { MinimalFederationController } from './controllers/minimal-federation.controller';
import { FederationJwtService } from './services/federation-jwt.service';
import { EntityRegistryService } from './services/entity-registry.service';

@Module({
  controllers: [MinimalFederationController],
  providers: [FederationJwtService, EntityRegistryService],
  exports: [FederationJwtService, EntityRegistryService],
})
export class MinimalFederationModule {}
