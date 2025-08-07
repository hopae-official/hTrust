import { Injectable, Logger } from '@nestjs/common';
import {
  RecognitionRequestDto,
  RecognitionResponseDto,
} from '../dto/recognition.dto';
import {
  AuthorizationRequestDto,
  AuthorizationResponseDto,
} from '../dto/authorization.dto';
import { SimpleFederationMockData } from '../../federation/mock-data/simple-federation-entities';

@Injectable()
export class TrustRegistryService {
  private readonly logger = new Logger(TrustRegistryService.name);

  /**
   * Recognition API - "Is entity_id recognized by authority_id for assertion_id under context?"
   */
  async queryRecognition(
    request: RecognitionRequestDto,
  ): Promise<RecognitionResponseDto> {
    this.logger.log(`Recognition query: ${JSON.stringify(request)}`);

    const { entity_id, authority_id, assertion_id, context } = request;

    // Federation 데이터를 사용하여 인식 여부 확인
    const entity = SimpleFederationMockData.getEntity(entity_id);
    const recognized = entity !== undefined;

    const response: RecognitionResponseDto = {
      entity_id,
      authority_id,
      assertion_id,
      recognized,
      message: recognized
        ? `Entity ${entity_id} is recognized by ${authority_id}${assertion_id ? ` for ${assertion_id}` : ''}`
        : `Entity ${entity_id} is not recognized by ${authority_id}${assertion_id ? ` for ${assertion_id}` : ''}`,
    };

    this.logger.log(`Recognition response: ${JSON.stringify(response)}`);
    return response;
  }

  /**
   * Authorization API - "Does entity_id hold assertion_id according to authority_id under context?"
   */
  async queryAuthorization(
    request: AuthorizationRequestDto,
  ): Promise<AuthorizationResponseDto> {
    this.logger.log(`Authorization query: ${JSON.stringify(request)}`);

    const { entity_id, authority_id, assertion_id, context } = request;

    // Federation 데이터를 사용하여 권한 확인
    const entity = SimpleFederationMockData.getEntity(entity_id);
    const assertion_verified =
      entity !== undefined &&
      entity.parsed_claims?.metadata &&
      Object.keys(entity.parsed_claims.metadata).includes(assertion_id);

    const response: AuthorizationResponseDto = {
      entity_id,
      authority_id,
      assertion_id,
      assertion_verified,
      time: context?.time,
      message: assertion_verified
        ? `Entity ${entity_id} holds ${assertion_id} according to ${authority_id}`
        : `Entity ${entity_id} does not hold ${assertion_id} according to ${authority_id}`,
    };

    this.logger.log(`Authorization response: ${JSON.stringify(response)}`);
    return response;
  }

  /**
   * Get entity information by ID
   */
  async getEntityInfo(entity_id: string) {
    this.logger.log(`Entity info request for: ${entity_id}`);

    const entity = SimpleFederationMockData.getEntity(entity_id);
    if (!entity) {
      return {
        found: false,
        entity_id,
        message: `Entity ${entity_id} not found in federation`,
      };
    }

    return {
      found: true,
      entity_id: entity.entity_id,
      status: entity.status,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
      metadata: entity.parsed_claims?.metadata,
      trust_marks:
        entity.parsed_claims?.trust_marks?.map((tm) => ({
          id: tm.id,
          trust_mark: tm.trust_mark,
        })) || [],
    };
  }
}
