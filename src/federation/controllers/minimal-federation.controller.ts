import {
  Controller,
  Get,
  Query,
  HttpStatus,
  HttpCode,
  HttpException,
  Logger,
  Header,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

import { FederationJwtService } from '../services/federation-jwt.service';
import { EntityRegistryService } from '../services/entity-registry.service';

@ApiTags('OpenID Federation 1.0 - Minimal')
@Controller()
export class MinimalFederationController {
  private readonly logger = new Logger(MinimalFederationController.name);
  private readonly baseUrl = process.env.BASE_URL || 'https://trs.example.org';

  constructor(
    private readonly federationJwtService: FederationJwtService,
    private readonly entityRegistryService: EntityRegistryService,
  ) {}

  /**
   * Entity Configuration Endpoint
   * GET /.well-known/openid-federation
   */
  @Get('.well-known/openid-federation')
  @HttpCode(HttpStatus.OK)
  @Header('Content-Type', 'application/entity-statement+jwt')
  @ApiOperation({
    summary: 'Get Entity Configuration',
    description: 'Returns Entity Configuration (self-signed Entity Statement)',
  })
  @ApiQuery({
    name: 'iss',
    required: false,
    description: 'Entity identifier',
  })
  @ApiResponse({
    status: 200,
    description: 'Entity Configuration JWT',
  })
  async getEntityConfiguration(
    @Query('iss') entityId?: string,
  ): Promise<string> {
    const targetEntityId = entityId || this.baseUrl;
    this.logger.log(`Entity configuration requested for: ${targetEntityId}`);

    try {
      // Create real JWT entity configuration
      const entityConfig = await this.federationJwtService.createEntityConfiguration(
        targetEntityId,
        ['https://trust-anchor.example.org'], // Authority hints
      );
      return entityConfig;
    } catch (error) {
      this.logger.error('Failed to create entity configuration:', error);
      throw new HttpException(
        'Failed to create entity configuration',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Fetch Entity Statement
   * GET /federation/fetch
   */
  @Get('federation/fetch')
  @HttpCode(HttpStatus.OK)
  @Header('Content-Type', 'application/entity-statement+jwt')
  @ApiOperation({
    summary: 'Fetch Entity Statement',
    description: 'Fetch entity statement about a subject from this authority',
  })
  @ApiQuery({
    name: 'iss',
    required: false,
    description: 'Issuer (this authority)',
  })
  @ApiQuery({
    name: 'sub',
    required: true,
    description: 'Subject entity identifier',
  })
  @ApiResponse({
    status: 200,
    description: 'Entity Statement JWT',
  })
  async fetchEntityStatement(
    @Query('iss') issuer: string,
    @Query('sub') subject: string,
  ): Promise<string> {
    const iss = issuer || this.baseUrl;
    this.logger.log(`Entity statement requested: ${iss} about ${subject}`);

    try {
      // Check if we have registered this subject
      const registeredEntity = this.entityRegistryService.getRegisteredEntity(subject);
      
      if (!registeredEntity || registeredEntity.status !== 'active') {
        throw new HttpException('Subject entity not found', HttpStatus.NOT_FOUND);
      }

      // Create entity statement about the subject
      const entityStatement = await this.federationJwtService.createEntityStatement(
        iss,
        subject,
        [], // Trust marks
        registeredEntity.metadata,
      );
      
      return entityStatement;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Failed to create entity statement:', error);
      throw new HttpException(
        'Failed to create entity statement',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * List Subordinate Entities
   * GET /federation/list
   */
  @Get('federation/list')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List Subordinate Entities',
    description: 'List all entities subordinate to this authority',
  })
  @ApiResponse({
    status: 200,
    description: 'List of subordinate entities',
  })
  async listSubordinates(): Promise<any> {
    this.logger.log('Subordinate entities list requested');
    
    const entities = this.entityRegistryService.getAllRegisteredEntities();
    return {
      entities: entities
        .filter((e) => e.status === 'active')
        .map((e) => ({
          entity_id: e.entityId,
          entity_type: e.metadata.entity_type || 'unknown',
          organization_name: e.metadata.organization_name,
          status: e.status,
          registered_at: e.registeredAt.toISOString(),
        })),
      total: entities.length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Health Check
   */
  @Get('federation/health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Health Check',
    description: 'Check service health',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
  })
  async healthCheck(): Promise<any> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      federation_standard: 'OpenID Federation 1.0',
      role: 'Registry/Issuer',
      registered_entities: this.entityRegistryService.getAllRegisteredEntities().length,
    };
  }
}
