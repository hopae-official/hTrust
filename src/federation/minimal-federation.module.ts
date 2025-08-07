import { Module } from '@nestjs/common';
import { MinimalFederationController } from './controllers/minimal-federation.controller';

@Module({
  controllers: [MinimalFederationController],
  providers: [],
  exports: [],
})
export class MinimalFederationModule {}
