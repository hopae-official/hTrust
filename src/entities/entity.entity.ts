import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { TrustEntityType, TrustEntityStatus } from './types';

@Entity('trust_entities')
export class TrustEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'Entity ID' })
  id: string;

  @Column({ type: 'varchar', length: 50 })
  @ApiProperty({ enum: TrustEntityType, description: 'Entity type' })
  entityType: TrustEntityType;

  @Column()
  @ApiProperty({ description: 'Entity name' })
  name: string;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: 'JWKS URI', required: false })
  jwksUri?: string;

  @Column({ type: 'json', nullable: true })
  @ApiProperty({ description: 'JWKS JSON', required: false })
  jwks?: object;

  @Column({ type: 'json' })
  @ApiProperty({ description: 'Entity endpoints' })
  endpoints: object;

  @Column({ type: 'json', nullable: true })
  @ApiProperty({ description: 'Entity policy', required: false })
  policy?: object;

  @Column({
    type: 'enum',
    enum: TrustEntityStatus,
    default: TrustEntityStatus.ACTIVE,
  })
  @ApiProperty({ enum: TrustEntityStatus, description: 'Entity status' })
  status: TrustEntityStatus;

  @Column({ type: 'varchar', length: 50 })
  @ApiProperty({ description: 'Trust List version' })
  tlVersion: string;

  @CreateDateColumn()
  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;
}
