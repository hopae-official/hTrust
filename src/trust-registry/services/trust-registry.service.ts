import { Injectable, Logger } from '@nestjs/common';
import {
  RecognitionRequestDto,
  RecognitionResponseDto,
} from '../dto/recognition.dto';
import {
  AuthorizationRequestDto,
  AuthorizationResponseDto,
} from '../dto/authorization.dto';
import { TrustChainService } from '../../federation/services/trust-chain.service';
import { FederationJwtService } from '../../federation/services/federation-jwt.service';

@Injectable()
export class TrustRegistryService {
  private readonly logger = new Logger(TrustRegistryService.name);
  private readonly baseUrl = process.env.BASE_URL || 'https://trs.example.org';

  constructor(
    private readonly trustChainService: TrustChainService,
    private readonly federationJwtService: FederationJwtService,
  ) {}

  /**
   * Recognition API - "Is entity_id recognized by authority_id for assertion_id under context?"
   */
  async queryRecognition(
    request: RecognitionRequestDto,
  ): Promise<RecognitionResponseDto> {
    this.logger.log(`Recognition query: ${JSON.stringify(request)}`);

    const { entity_id, authority_id, assertion_id, context } = request;

    // Use trust chain service to verify entity trust
    const trustStatus = await this.trustChainService.verifyEntityTrust(entity_id);
    
    // Check if authority is valid
    const authorityValid = authority_id === this.baseUrl || 
                          (await this.trustChainService.verifyEntityTrust(authority_id)).isTrusted;

    let recognized = trustStatus.isTrusted && authorityValid;

    // If assertion_id provided, check specific authorization
    if (recognized && assertion_id) {
      recognized = await this.trustChainService.checkEntityAuthorization(
        entity_id,
        assertion_id,
        authority_id,
      );
    }

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

    // Use trust chain service to check authorization
    const assertion_verified = await this.trustChainService.checkEntityAuthorization(
      entity_id,
      assertion_id,
      authority_id,
    );

    // Get entity trust status for additional validation
    const trustStatus = await this.trustChainService.verifyEntityTrust(entity_id);

    const response: AuthorizationResponseDto = {
      entity_id,
      authority_id,
      assertion_id,
      assertion_verified: assertion_verified && trustStatus.isTrusted,
      time: context?.time,
      message: assertion_verified && trustStatus.isTrusted
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

    // Get trust status from trust chain service
    const trustStatus = await this.trustChainService.verifyEntityTrust(entity_id);
    
    if (!trustStatus.isTrusted) {
      return {
        found: false,
        entity_id,
        message: `Entity ${entity_id} not found or not trusted in federation`,
      };
    }

    // Create entity statement for this entity
    const entityStatement = await this.federationJwtService.createEntityStatement(
      this.baseUrl,
      entity_id,
      trustStatus.trustMarks,
      trustStatus.metadata,
    );

    // Parse to get structured data
    const parsed = await this.federationJwtService.verifyEntityJwt(entityStatement);

    return {
      found: true,
      entity_id,
      is_trusted: trustStatus.isTrusted,
      trust_chains: trustStatus.trustChains,
      metadata: trustStatus.metadata || {},
      trust_marks: trustStatus.trustMarks || [],
      created_at: new Date(parsed.iat * 1000).toISOString(),
      expires_at: new Date(parsed.exp * 1000).toISOString(),
      entity_statement: entityStatement,
    };
  }
}
