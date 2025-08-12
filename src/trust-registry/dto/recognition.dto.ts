import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject } from 'class-validator';

export class RecognitionRequestDto {
  @ApiProperty({
    description: 'The entity being recognized',
    example: 'https://op.example.com',
  })
  @IsString()
  entity_id: string;

  @ApiProperty({
    description: 'The authority asserting recognition',
    example: 'https://trust-anchor.example.com',
  })
  @IsString()
  authority_id: string;

  @ApiPropertyOptional({
    description: 'The specific recognition relationship or claim',
    example: 'openid_provider',
  })
  @IsOptional()
  @IsString()
  assertion_id?: string;

  @ApiPropertyOptional({
    description: 'Optional parameters influencing evaluation',
    example: {
      time: '2025-06-19T10:00:00Z',
    },
  })
  @IsOptional()
  @IsObject()
  context?: {
    time?: string;
    [key: string]: string;
  };
}

export class RecognitionResponseDto {
  @ApiProperty({
    description: 'Queried entity',
    example: 'https://op.example.com',
  })
  entity_id: string;

  @ApiProperty({
    description: 'Queried authority',
    example: 'https://trust-anchor.example.com',
  })
  authority_id: string;

  @ApiPropertyOptional({
    description: 'Scope of the recognition',
    example: 'openid_provider',
  })
  assertion_id?: string;

  @ApiProperty({
    description: 'True if recognized',
    example: true,
  })
  recognized: boolean;

  @ApiPropertyOptional({
    description: 'Optional human-readable details',
    example: 'Entity is recognized as OpenID Provider',
  })
  message?: string;
}
