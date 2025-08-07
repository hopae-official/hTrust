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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SimpleFederationMockData } from '../mock-data/simple-federation-entities';
import {
  RecognitionRequestDto,
  RecognitionResponseDto,
} from '../../trust-registry/dto/recognition.dto';

@ApiTags('OpenID Federation 1.0 - Minimal')
@Controller('federation')
export class MinimalFederationController {
  private readonly logger = new Logger(MinimalFederationController.name);

  constructor() {
    // Initialize mock data
    SimpleFederationMockData.initialize();
  }

  /**
   * Entity Configuration Endpoint
   * GET /.well-known/openid_federation
   */
  @Get('.well-known/openid_federation')
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
    const targetEntityId = entityId || 'https://federation.example.org';
    this.logger.log(`Entity configuration requested for: ${targetEntityId}`);

    const entity = SimpleFederationMockData.getEntity(targetEntityId);
    if (!entity) {
      throw new HttpException('Entity not found', HttpStatus.NOT_FOUND);
    }

    return entity.entity_statement;
  }

  /**
   * Federation Statistics
   */
  @Get('stats')
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
    return SimpleFederationMockData.getFederationStats();
  }

  /**
   * List All Entities
   */
  @Get('entities')
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
    return SimpleFederationMockData.getAllEntities();
  }

  /**
   * TRQP Recognition (for backward compatibility)
   */
  @Post('recognition')
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

    // Simple recognition logic
    const entity = SimpleFederationMockData.getEntity(request.entity_id);
    const recognized = entity !== undefined;

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
  @Get('health')
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
      entities_loaded: SimpleFederationMockData.getAllEntities().length,
    };
  }
}
