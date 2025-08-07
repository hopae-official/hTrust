import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpCode,
  Get,
  Header,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import {
  RecognitionRequestDto,
  RecognitionResponseDto,
} from '../dto/recognition.dto';
import {
  AuthorizationRequestDto,
  AuthorizationResponseDto,
} from '../dto/authorization.dto';
import { TrustRegistryService } from '../services/trust-registry.service';

@ApiTags('TRQP Trust Registry')
@Controller('v1')
export class TrustRegistryController {
  constructor(private readonly trustRegistryService: TrustRegistryService) {}

  @Post('recognition')
  @HttpCode(HttpStatus.OK)
  @Header('Content-Type', 'application/json')
  @ApiOperation({
    summary: 'Recognition Query',
    description:
      'Check if a specific entity is recognized by an authority for a given assertion',
  })
  @ApiBody({ type: RecognitionRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Recognition query completed successfully',
    type: RecognitionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request parameters',
  })
  async recognition(
    @Body() requestDto: RecognitionRequestDto,
  ): Promise<RecognitionResponseDto> {
    return this.trustRegistryService.queryRecognition(requestDto);
  }

  @Post('authorization')
  @HttpCode(HttpStatus.OK)
  @Header('Content-Type', 'application/json')
  @ApiOperation({
    summary: 'Authorization Query',
    description:
      'Check if a specific entity holds a given assertion according to an authority',
  })
  @ApiBody({ type: AuthorizationRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Authorization query completed successfully',
    type: AuthorizationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request parameters',
  })
  async authorization(
    @Body() requestDto: AuthorizationRequestDto,
  ): Promise<AuthorizationResponseDto> {
    return this.trustRegistryService.queryAuthorization(requestDto);
  }

  @Get('entity/:entity_id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get Entity Information',
    description: 'Get detailed information about a specific federation entity',
  })
  @ApiParam({
    name: 'entity_id',
    description: 'Federation entity identifier (URL encoded)',
    example: 'https%3A//op.example.com',
  })
  @ApiResponse({
    status: 200,
    description: 'Entity information retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Entity not found',
  })
  async getEntityInfo(@Param('entity_id') entity_id: string) {
    const decodedEntityId = decodeURIComponent(entity_id);
    return this.trustRegistryService.getEntityInfo(decodedEntityId);
  }
}
