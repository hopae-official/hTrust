import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsUrl,
  IsObject,
  IsString,
  IsNotEmpty,
  ValidateIf,
} from 'class-validator';
import { TrustEntityType } from '../entity.entity';

export class CreateEntityDto {
  @ApiProperty({
    enum: TrustEntityType,
    description: 'Type of trust entity',
    example: TrustEntityType.WALLET_PROVIDER,
  })
  @IsEnum(TrustEntityType)
  entityType: TrustEntityType;

  @ApiProperty({
    description: 'Entity name',
    example: 'Test Wallet Provider',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'JWKS URI endpoint',
    example: 'https://wallet.example.com/.well-known/jwks.json',
  })
  @IsOptional()
  @ValidateIf((o) => !o.jwks)
  @IsUrl({ protocols: ['https'] })
  jwksUri?: string;

  @ApiPropertyOptional({
    description: 'JWKS JSON directly',
    example: { 
      keys: [{
        kty: 'RSA',
        kid: 'test-key-1',
        use: 'sig',
        alg: 'RS256'
      }]
    },
  })
  @IsOptional()
  @ValidateIf((o) => !o.jwksUri)
  @IsObject()
  jwks?: object;

  @ApiPropertyOptional({
    description: 'API endpoints',
    example: {
      'openid-configuration': 'https://example.com/.well-known/openid-configuration',
    },
  })
  @IsOptional()
  @IsObject()
  endpoints?: object;

  @ApiPropertyOptional({
    description: 'Trust policy',
    example: { 
      trust_framework: 'openid-federation',
      sandbox_mode: true 
    },
  })
  @IsOptional()
  @IsObject()
  policy?: object;
}
