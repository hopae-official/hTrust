import { Module } from '@nestjs/common';
import { MinimalFederationController } from './controllers/minimal-federation.controller';
import { FederationJwtService } from './services/federation-jwt.service';
import { TrustChainService } from './services/trust-chain.service';

@Module({
  controllers: [MinimalFederationController],
  providers: [FederationJwtService, TrustChainService],
  exports: [FederationJwtService, TrustChainService],
})
export class MinimalFederationModule {}
