import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject } from 'class-validator';

export class AuthorizationRequestDto {
  @ApiProperty({
    description: 'The entity being queried',
    example: 'https://rp.example.com',
  })
  @IsString()
  entity_id: string;

  @ApiProperty({
    description: 'The authority making the claim',
    example: 'https://trust-anchor.example.com',
  })
  @IsString()
  authority_id: string;

  @ApiProperty({
    description: 'The specific claim or right to evaluate',
    example: 'openid_relying_party',
  })
  @IsString()
  assertion_id: string;

  @ApiPropertyOptional({
    description: 'Optional parameters influencing evaluation',
    example: {
      time: '2025-06-19T11:30:00Z',
    },
  })
  @IsOptional()
  @IsObject()
  context?: {
    time?: string;
    [key: string]: string;
  };
}

export class AuthorizationResponseDto {
  @ApiProperty({
    description: 'Queried entity',
    example: 'https://rp.example.com',
  })
  entity_id: string;

  @ApiProperty({
    description: 'Queried authority',
    example: 'https://trust-anchor.example.com',
  })
  authority_id: string;

  @ApiProperty({
    description: 'Queried claim',
    example: 'openid_relying_party',
  })
  assertion_id: string;

  @ApiProperty({
    description: 'True if the claim holds',
    example: true,
  })
  assertion_verified: boolean;

  @ApiPropertyOptional({
    description: 'Client time, if supplied',
    example: '2025-06-19T11:30:00Z',
  })
  time?: string;

  @ApiPropertyOptional({
    description: 'Optional human-readable details',
    example: 'Entity is authorized as OpenID Relying Party',
  })
  message?: string;
}
