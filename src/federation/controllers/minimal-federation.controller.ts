import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpStatus,
  HttpCode,
  HttpException,
  Logger,
  Header,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import {
  RecognitionRequestDto,
  RecognitionResponseDto,
} from '../../trust-registry/dto/recognition.dto';
import { FederationJwtService } from '../services/federation-jwt.service';
import { TrustChainService } from '../services/trust-chain.service';

@ApiTags('OpenID Federation 1.0 - Minimal')
@Controller()
export class MinimalFederationController {
  private readonly logger = new Logger(MinimalFederationController.name);
  private readonly baseUrl = process.env.BASE_URL || 'https://trs.example.org';

  constructor(
    private readonly federationJwtService: FederationJwtService,
    private readonly trustChainService: TrustChainService,
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
      // Check if we know about this subject
      const trustStatus = await this.trustChainService.verifyEntityTrust(subject);
      
      if (!trustStatus.isTrusted) {
        throw new HttpException('Subject entity not found', HttpStatus.NOT_FOUND);
      }

      // Create entity statement about the subject
      const entityStatement = await this.federationJwtService.createEntityStatement(
        iss,
        subject,
        [], // Trust marks
        trustStatus.metadata,
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
    
    const entities = this.trustChainService.getAllTrustedEntities();
    return {
      entities: entities.map(e => ({
        entity_id: e.entityId,
        entity_type: e.metadata.entity_type || 'unknown',
        organization_name: e.metadata.organization_name,
      })),
      total: entities.length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Trust Chain Status
   * GET /federation/trust-chain/:entity_id
   */
  @Get('federation/trust-chain/:entity_id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get Trust Chain Status',
    description: 'Get trust chain resolution status for an entity',
  })
  @ApiParam({
    name: 'entity_id',
    description: 'Entity identifier (URL encoded)',
  })
  @ApiResponse({
    status: 200,
    description: 'Trust chain status',
  })
  async getTrustChainStatus(
    @Param('entity_id') entityId: string,
  ): Promise<any> {
    const decodedEntityId = decodeURIComponent(entityId);
    this.logger.log(`Trust chain status requested for: ${decodedEntityId}`);
    
    const trustStatus = await this.trustChainService.verifyEntityTrust(decodedEntityId);
    return {
      entity_id: decodedEntityId,
      is_trusted: trustStatus.isTrusted,
      trust_chains: trustStatus.trustChains,
      metadata: trustStatus.metadata,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Federation Statistics
   */
  @Get('federation/stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Federation Statistics',
    description: 'Get federation statistics',
  })
  @ApiResponse({
    status: 200,
    description: 'Federation statistics',
  })
  async getFederationStats(): Promise<any> {
    this.logger.log('Federation statistics requested');
    const entities = this.trustChainService.getAllTrustedEntities();
    return {
      total_entities: entities.length,
      trust_anchors: this.trustChainService.getTrustAnchors().length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * List All Entities
   */
  @Get('federation/entities')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List All Entities',
    description: 'List all federation entities',
  })
  @ApiResponse({
    status: 200,
    description: 'List of entities',
  })
  async getAllEntities(): Promise<any> {
    this.logger.log('All entities requested');
    return this.trustChainService.getAllTrustedEntities();
  }

  /**
   * TRQP Recognition (for backward compatibility)
   */
  @Post('federation/recognition')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Entity Recognition (TRQP)',
    description: 'Check if entity is recognized by authority',
  })
  @ApiResponse({
    status: 200,
    description: 'Recognition result',
    type: RecognitionResponseDto,
  })
  async recognition(
    @Body() request: RecognitionRequestDto,
  ): Promise<RecognitionResponseDto> {
    this.logger.log(`Recognition requested: ${JSON.stringify(request)}`);

    // Use trust chain service for recognition
    const trustStatus = await this.trustChainService.verifyEntityTrust(request.entity_id);
    const recognized = trustStatus.isTrusted;

    return {
      entity_id: request.entity_id,
      authority_id: request.authority_id,
      assertion_id: request.assertion_id,
      recognized,
      message: recognized ? 'Entity is recognized' : 'Entity not found',
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
      entities_loaded: this.trustChainService.getAllTrustedEntities().length,
    };
  }
}
