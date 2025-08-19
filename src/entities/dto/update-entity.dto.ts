import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsObject, IsString, IsUrl, ValidateIf } from 'class-validator';

export class UpdateEntityDto {
  @ApiPropertyOptional({
    description: 'Entity name',
    example: 'Updated Wallet Provider',
  })
  @IsOptional()
  @IsString()
  name?: string;

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
        kid: 'updated-key-1',
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
      'authorization_endpoint': 'https://example.com/auth',
    },
  })
  @IsOptional()
  @IsObject()
  endpoints?: object;

  @ApiPropertyOptional({
    description: 'Trust policy',
    example: { 
      trust_framework: 'openid-federation',
      sandbox_mode: false,
      compliance_level: 'high'
    },
  })
  @IsOptional()
  @IsObject()
  policy?: object;
}
