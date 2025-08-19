import { ApiProperty } from '@nestjs/swagger';
import { TrustEntityType } from '../types';

export class EntityResponseDto {
  @ApiProperty({ description: 'Entity ID' })
  entityId: string;

  @ApiProperty({ enum: TrustEntityType })
  entityType: TrustEntityType;

  @ApiProperty({ description: 'Entity name' })
  name: string;

  @ApiProperty({ description: 'Entity status' })
  status: string;

  @ApiProperty({ description: 'Trust List version' })
  tlVersion: number;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;
}
