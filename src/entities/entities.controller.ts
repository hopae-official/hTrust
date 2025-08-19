import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  ValidationPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { EntitiesService } from './entities.service';
import { CreateEntityDto } from './dto/create-entity.dto';
import { TrustEntityStatus, TrustEntityType } from './entity.entity';

@ApiTags('Entity Management')
@Controller('entities')
export class EntitiesController {
  constructor(private readonly entitiesService: EntitiesService) {}

  @Post()
  @ApiOperation({
    summary: 'Register new entity',
    description: 'Admin registers a new trust entity',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Entity registered successfully',
    schema: {
      type: 'object',
      properties: {
        entity_id: { type: 'string' },
        status: { type: 'string' },
        created_at: { type: 'string' },
        tl_version: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Duplicate entity',
  })
  async register(@Body(ValidationPipe) dto: CreateEntityDto) {
    const entity = await this.entitiesService.register(dto);

    return {
      entity_id: entity.id,
      status: entity.status,
      created_at: entity.createdAt,
      tl_version: entity.tlVersion,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List all entities' })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: TrustEntityType,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: TrustEntityStatus,
  })
  async findAll(
    @Query('type') type?: TrustEntityType,
    @Query('status') status?: TrustEntityStatus,
  ) {
    if (status) {
      return this.entitiesService.findByStatus(status);
    }

    if (type) {
      return this.entitiesService.findByType(type);
    }

    return this.entitiesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get entity by ID' })
  @ApiParam({ name: 'id', description: 'Entity UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Entity found',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Entity not found',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.entitiesService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Revoke entity',
    description: 'Mark entity as revoked (soft delete)',
  })
  @ApiParam({ name: 'id', description: 'Entity UUID' })
  async revoke(@Param('id', ParseUUIDPipe) id: string) {
    const entity = await this.entitiesService.revoke(id);
    return {
      entity_id: entity.id,
      status: entity.status,
      updated_at: entity.updatedAt,
      tl_version: entity.tlVersion,
    };
  }
}
