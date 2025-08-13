import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MinimalFederationModule } from './federation/minimal-federation.module';

@Module({
  imports: [MinimalFederationModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
