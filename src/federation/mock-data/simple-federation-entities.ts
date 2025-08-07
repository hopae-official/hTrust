import {
  FederationEntity,
  EntityStatementClaims,
  FederationEntityType,
  EntityStatus,
  TrustMarkClaims,
} from '../types/federation-entity.types';
import { FederationJwtUtils } from '../utils/jwt.utils';

/**
 * Simplified Federation Mock Data
 */
export class SimpleFederationMockData {
  private static entities: Map<string, FederationEntity> = new Map();
  private static initialized = false;

  static initialize(): void {
    if (this.initialized) return;

    this.createTrustAnchor();
    this.createOpenIDProvider();
    this.createRelyingParty();

    this.initialized = true;
  }

  static getAllEntities(): FederationEntity[] {
    this.initialize();
    return Array.from(this.entities.values());
  }

  static getEntity(entityId: string): FederationEntity | undefined {
    this.initialize();
    return this.entities.get(entityId);
  }

  static getEntitiesByType(
    entityType: FederationEntityType,
  ): FederationEntity[] {
    this.initialize();
    return Array.from(this.entities.values()).filter((entity) => {
      if (!entity.parsed_claims?.metadata) return false;
      return Object.keys(entity.parsed_claims.metadata).includes(entityType);
    });
  }

  private static createTrustAnchor(): void {
    const entityId = 'https://federation.example.org';
    const keyPair = FederationJwtUtils.generateMockKeyPair(`${entityId}-key-1`);

    const claims: EntityStatementClaims = {
      iss: entityId,
      sub: entityId,
      iat: FederationJwtUtils.getCurrentTimestamp(),
      exp: FederationJwtUtils.getFutureTimestamp(365),
      jwks: FederationJwtUtils.createJwks([keyPair.publicKey]),
      metadata: {
        federation_entity: {
          federation_fetch_endpoint: `${entityId}/fetch`,
          federation_list_endpoint: `${entityId}/list`,
          organization_name: 'Example Federation Trust Anchor',
          organization_uri: entityId,
          contacts: ['admin@federation.example.org'],
        },
      },
      trust_marks: [],
    };

    const entityStatement = FederationJwtUtils.createEntityStatement(
      claims,
      keyPair.privateKey,
    );

    const entity: FederationEntity = {
      entity_id: entityId,
      entity_statement: entityStatement,
      status: EntityStatus.ACTIVE,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      parsed_claims: claims,
    };

    this.entities.set(entityId, entity);
  }

  private static createOpenIDProvider(): void {
    const entityId = 'https://login.example.com';
    const trustAnchor = 'https://federation.example.org';
    const keyPair = FederationJwtUtils.generateMockKeyPair(`${entityId}-key-1`);

    const claims: EntityStatementClaims = {
      iss: entityId,
      sub: entityId,
      iat: FederationJwtUtils.getCurrentTimestamp(),
      exp: FederationJwtUtils.getFutureTimestamp(365),
      jwks: FederationJwtUtils.createJwks([keyPair.publicKey]),
      metadata: {
        federation_entity: {
          organization_name: 'Example Identity Provider',
          organization_uri: 'https://example.com',
          contacts: ['support@example.com'],
        },
        openid_provider: {
          issuer: entityId,
          authorization_endpoint: `${entityId}/auth`,
          token_endpoint: `${entityId}/token`,
          jwks_uri: `${entityId}/jwks`,
          scopes_supported: ['openid', 'profile', 'email'],
          response_types_supported: ['code'],
          subject_types_supported: ['public'],
          id_token_signing_alg_values_supported: ['RS256'],
          organization_name: 'Example Corp',
        },
      },
      authority_hints: [trustAnchor],
      trust_marks: [
        {
          id: 'https://federation.example.org/trust_marks/openid_provider',
          trust_mark: this.createTrustMark(
            'https://federation.example.org/trust_marks/openid_provider',
            trustAnchor,
            entityId,
          ),
        },
      ],
    };

    const entityStatement = FederationJwtUtils.createEntityStatement(
      claims,
      keyPair.privateKey,
    );

    const entity: FederationEntity = {
      entity_id: entityId,
      entity_statement: entityStatement,
      status: EntityStatus.ACTIVE,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      parsed_claims: claims,
    };

    this.entities.set(entityId, entity);
  }

  private static createRelyingParty(): void {
    const entityId = 'https://app.example.com';
    const trustAnchor = 'https://federation.example.org';
    const keyPair = FederationJwtUtils.generateMockKeyPair(`${entityId}-key-1`);

    const claims: EntityStatementClaims = {
      iss: entityId,
      sub: entityId,
      iat: FederationJwtUtils.getCurrentTimestamp(),
      exp: FederationJwtUtils.getFutureTimestamp(365),
      jwks: FederationJwtUtils.createJwks([keyPair.publicKey]),
      metadata: {
        federation_entity: {
          organization_name: 'Example Application',
          organization_uri: 'https://example.com',
          contacts: ['support@example.com'],
        },
        openid_relying_party: {
          redirect_uris: ['https://app.example.com/callback'],
          response_types: ['code'],
          grant_types: ['authorization_code'],
          application_type: 'web',
          client_name: 'Example App',
          client_uri: 'https://example.com',
          jwks_uri: 'https://app.example.com/jwks',
          token_endpoint_auth_method: 'private_key_jwt',
          client_registration_types: ['automatic'],
          organization_name: 'Example Corp',
        },
      },
      authority_hints: [trustAnchor],
      trust_marks: [
        {
          id: 'https://federation.example.org/trust_marks/relying_party',
          trust_mark: this.createTrustMark(
            'https://federation.example.org/trust_marks/relying_party',
            trustAnchor,
            entityId,
          ),
        },
      ],
    };

    const entityStatement = FederationJwtUtils.createEntityStatement(
      claims,
      keyPair.privateKey,
    );

    const entity: FederationEntity = {
      entity_id: entityId,
      entity_statement: entityStatement,
      status: EntityStatus.ACTIVE,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      parsed_claims: claims,
    };

    this.entities.set(entityId, entity);
  }

  private static createTrustMark(
    trustMarkId: string,
    issuer: string,
    subject: string,
  ): string {
    const claims: TrustMarkClaims = {
      iss: issuer,
      sub: subject,
      iat: FederationJwtUtils.getCurrentTimestamp(),
      exp: FederationJwtUtils.getFutureTimestamp(365),
      id: trustMarkId,
      mark: {
        compliance_framework: trustMarkId.split('/').pop(),
        verified_at: new Date().toISOString(),
      },
    };

    const keyPair = FederationJwtUtils.generateMockKeyPair(
      `${issuer}-trust-mark-key`,
    );
    return FederationJwtUtils.createTrustMark(claims, keyPair.privateKey);
  }

  static getFederationStats() {
    this.initialize();
    const entities = Array.from(this.entities.values());

    return {
      total_entities: entities.length,
      trust_anchors: entities.filter(
        (e) => !e.parsed_claims?.authority_hints?.length,
      ).length,
      openid_providers: entities.filter(
        (e) => e.parsed_claims?.metadata?.openid_provider,
      ).length,
      relying_parties: entities.filter(
        (e) => e.parsed_claims?.metadata?.openid_relying_party,
      ).length,
      active_entities: entities.filter((e) => e.status === EntityStatus.ACTIVE)
        .length,
    };
  }
}
