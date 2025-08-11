import { Injectable, Logger } from '@nestjs/common';
import {
  createEntityConfiguration,
  fetchEntityConfiguration,
  SignCallback,
  VerifyCallback,
  createEntityStatement,
} from '@openid-federation/core';
import { createPrivateKey, createPublicKey, createSign, createVerify } from 'node:crypto';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class FederationJwtService {
  private readonly logger = new Logger(FederationJwtService.name);
  
  // Test keys for development - In production, these should come from secure storage
  private readonly testKeys = {
    privateJwk: {
      kty: 'EC',
      d: 'gGmHzCADdAVYWfGKzm1mT8zNmt1fwMJ733iykCyPUK0',
      use: 'sig',
      crv: 'P-256',
      kid: 'trs-test-key-1',
      x: '68aOQ08Lq8Hxl559hlAFVkGV_4TNCbxNqQoN9EIC4yw',
      y: 'HUWghA91oVeMO7DTsNb_DXQlZwO27KnbjvFlLQZJFMI',
      alg: 'ES256',
    },
    publicJwk: {
      kty: 'EC',
      use: 'sig',
      crv: 'P-256',
      kid: 'trs-test-key-1',
      x: '68aOQ08Lq8Hxl559hlAFVkGV_4TNCbxNqQoN9EIC4yw',
      y: 'HUWghA91oVeMO7DTsNb_DXQlZwO27KnbjvFlLQZJFMI',
      alg: 'ES256',
    },
  };

  /**
   * Sign callback for OpenID Federation library
   */
  private signJwtCallback: SignCallback = async ({ toBeSigned }) => {
    try {
      // Always use our test private key for signing
      const privateKey = createPrivateKey({
        key: this.testKeys.privateJwk,
        format: 'jwk',
      });

      // ES256 signature generation
      const sign = createSign('SHA256');
      sign.update(toBeSigned);
      sign.end();

      const signature = sign.sign({
        key: privateKey,
        dsaEncoding: 'ieee-p1363',
      });

      return signature;
    } catch (error) {
      this.logger.error('Error signing JWT:', error);
      throw error;
    }
  };

  /**
   * Verify callback for OpenID Federation library
   */
  private verifyJwtCallback: VerifyCallback = async ({ signature, data, jwk }) => {
    try {
      const publicKey = createPublicKey({
        key: jwk,
        format: 'jwk',
      });

      const verify = createVerify('SHA256');
      verify.update(data);
      verify.end();

      return verify.verify(
        {
          key: publicKey,
          dsaEncoding: 'ieee-p1363',
        },
        signature,
      );
    } catch (error) {
      this.logger.error('Error verifying JWT:', error);
      return false;
    }
  };

  /**
   * Create Entity Configuration for this TRS
   */
  async createEntityConfiguration(entityId: string, authorityHints?: string[]): Promise<string> {
    this.logger.log(`Creating entity configuration for: ${entityId}`);

    const now = Math.floor(Date.now() / 1000);
    const exp = now + 24 * 60 * 60; // 24 hours

    try {
      const entityConfig = await createEntityConfiguration({
        signJwtCallback: this.signJwtCallback,
        claims: {
          iss: entityId,
          sub: entityId, // Must equal iss for entity configs
          exp,
          iat: now,
          jwks: {
            keys: [this.testKeys.publicJwk],
          },
          authority_hints: authorityHints || [],
          metadata: {
            federation_entity: {
              organization_name: 'Test Trust Registry Service',
              contacts: ['admin@trs.example.org'],
              homepage_uri: entityId,
            },
            // Custom metadata for TRS can be added here
            // The library doesn't have trust_registry in its types yet
          },
        },
        header: {
          kid: this.testKeys.privateJwk.kid,
          typ: 'entity-statement+jwt',
          alg: 'ES256',
        },
      });

      this.logger.log('Entity configuration created successfully');
      return entityConfig;
    } catch (error) {
      this.logger.error('Failed to create entity configuration:', error);
      throw error;
    }
  }

  /**
   * Create Entity Statement about another entity
   */
  async createEntityStatement(
    issuer: string,
    subject: string,
    trustMarks?: any[],
    metadata?: any,
  ): Promise<string> {
    this.logger.log(`Creating entity statement: ${issuer} about ${subject}`);

    const now = Math.floor(Date.now() / 1000);
    const exp = now + 7 * 24 * 60 * 60; // 7 days

    try {
      const entityStatement = await createEntityStatement({
        signJwtCallback: this.signJwtCallback,
        jwk: this.testKeys.privateJwk,
        claims: {
          iss: issuer,
          sub: subject,
          exp,
          iat: now,
          jwks: subject === issuer ? { keys: [this.testKeys.publicJwk] } : undefined,
          trust_marks: trustMarks,
          metadata: metadata || {},
          source_endpoint: `${issuer}/.well-known/openid-federation`,
        },
        header: {
          kid: this.testKeys.privateJwk.kid,
          typ: 'entity-statement+jwt',
          alg: 'ES256',
        },
      });

      this.logger.log('Entity statement created successfully');
      return entityStatement;
    } catch (error) {
      this.logger.error('Failed to create entity statement:', error);
      throw error;
    }
  }

  /**
   * Verify an Entity Configuration or Statement
   */
  async verifyEntityJwt(jwtString: string): Promise<any> {
    try {
      // First decode to get the public key
      const decoded = jwt.decode(jwtString, { complete: true }) as any;
      
      if (!decoded || !decoded.payload) {
        throw new Error('Invalid JWT format');
      }

      // For entity configurations (iss === sub), get key from jwks
      let verificationKey;
      if (decoded.payload.iss === decoded.payload.sub && decoded.payload.jwks) {
        const kid = decoded.header.kid;
        verificationKey = decoded.payload.jwks.keys.find((k: any) => k.kid === kid);
      } else {
        // For other statements, would need to fetch issuer's keys
        verificationKey = this.testKeys.publicJwk;
      }

      if (!verificationKey) {
        throw new Error('Verification key not found');
      }

      const publicKey = createPublicKey({
        key: verificationKey,
        format: 'jwk',
      });

      const verified = jwt.verify(jwtString, publicKey, {
        algorithms: ['ES256', 'RS256'],
      });

      this.logger.log('JWT verified successfully');
      return verified;
    } catch (error) {
      this.logger.error('JWT verification failed:', error);
      throw error;
    }
  }

  /**
   * Fetch and verify remote entity configuration
   */
  async fetchRemoteEntityConfiguration(entityId: string): Promise<any> {
    try {
      const config = await fetchEntityConfiguration({
        entityId,
        verifyJwtCallback: this.verifyJwtCallback,
      });

      this.logger.log(`Fetched entity configuration for: ${entityId}`);
      return config;
    } catch (error) {
      this.logger.error(`Failed to fetch entity configuration for ${entityId}:`, error);
      throw error;
    }
  }

  /**
   * Get test public keys for this TRS
   */
  getPublicKeys(): any[] {
    return [this.testKeys.publicJwk];
  }
}