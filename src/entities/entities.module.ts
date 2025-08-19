import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntitiesController } from './entities.controller';
import { EntitiesService } from './entities.service';
import { TrustEntity } from './entity.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TrustEntity])],
  controllers: [EntitiesController],
  providers: [EntitiesService],
  exports: [EntitiesService, TypeOrmModule],
})
export class EntitiesModule {}
