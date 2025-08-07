// JWT Utilities for OpenID Federation 1.0
// Handles Entity Statement and Trust Mark JWT creation/validation

import * as crypto from 'crypto';
import {
  EntityStatementHeader,
  EntityStatementClaims,
  TrustMarkClaims,
  JsonWebKey,
  JsonWebKeySet,
} from '../types/federation-entity.types';

/**
 * JWT Utility class for OpenID Federation
 */
export class FederationJwtUtils {
  /**
   * Create an Entity Statement JWT
   * Section 3 - Entity Statement
   */
  static createEntityStatement(
    claims: EntityStatementClaims,
    privateKey: JsonWebKey,
  ): string {
    const header: EntityStatementHeader = {
      typ: 'entity-statement+jwt',
      alg: 'RS256',
      kid: privateKey.kid,
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(claims));

    // In a real implementation, you would sign with the actual private key
    // For mock purposes, we'll create a deterministic signature
    const signature = this.createMockSignature(
      encodedHeader,
      encodedPayload,
      privateKey.kid,
    );

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Create a Trust Mark JWT
   * Section 7 - Trust Marks
   */
  static createTrustMark(
    claims: TrustMarkClaims,
    privateKey: JsonWebKey,
  ): string {
    const header = {
      typ: 'trust-mark+jwt',
      alg: 'RS256',
      kid: privateKey.kid,
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(claims));

    const signature = this.createMockSignature(
      encodedHeader,
      encodedPayload,
      privateKey.kid,
    );

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Parse JWT without verification (for mock purposes)
   */
  static parseJwt(jwt: string): {
    header: any;
    payload: any;
    signature: string;
  } {
    const parts = jwt.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    return {
      header: JSON.parse(this.base64UrlDecode(parts[0])),
      payload: JSON.parse(this.base64UrlDecode(parts[1])),
      signature: parts[2],
    };
  }

  /**
   * Validate Entity Statement JWT structure
   */
  static validateEntityStatement(jwt: string): boolean {
    try {
      const { header, payload } = this.parseJwt(jwt);

      // Check required header fields
      if (header.typ !== 'entity-statement+jwt') {
        return false;
      }

      if (!header.alg || !header.kid) {
        return false;
      }

      // Check required payload fields
      if (
        !payload.iss ||
        !payload.sub ||
        !payload.iat ||
        !payload.exp ||
        !payload.jwks
      ) {
        return false;
      }

      // Check expiration
      if (payload.exp < Math.floor(Date.now() / 1000)) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate Trust Mark JWT structure
   */
  static validateTrustMark(jwt: string): boolean {
    try {
      const { header, payload } = this.parseJwt(jwt);

      // Check required header fields
      if (header.typ !== 'trust-mark+jwt') {
        return false;
      }

      if (!header.alg || !header.kid) {
        return false;
      }

      // Check required payload fields
      if (!payload.iss || !payload.sub || !payload.iat || !payload.id) {
        return false;
      }

      // Check expiration if present
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate a mock RSA key pair for testing
   */
  static generateMockKeyPair(kid: string): {
    publicKey: JsonWebKey;
    privateKey: JsonWebKey;
  } {
    // In a real implementation, you would use crypto.generateKeyPairSync
    // For mock purposes, we'll create deterministic keys based on kid
    const hash = crypto.createHash('sha256').update(kid).digest('hex');

    const publicKey: JsonWebKey = {
      kty: 'RSA',
      use: 'sig',
      alg: 'RS256',
      kid: kid,
      n: this.base64UrlEncode(hash.substring(0, 32)),
      e: 'AQAB',
    };

    const privateKey: JsonWebKey = {
      ...publicKey,
      d: this.base64UrlEncode(hash.substring(32, 64)),
      p: this.base64UrlEncode(hash.substring(0, 16)),
      q: this.base64UrlEncode(hash.substring(16, 32)),
      dp: this.base64UrlEncode(hash.substring(32, 48)),
      dq: this.base64UrlEncode(hash.substring(48, 64)),
      qi: this.base64UrlEncode(hash.substring(0, 16)),
    };

    return { publicKey, privateKey };
  }

  /**
   * Create JWKS from public keys
   */
  static createJwks(publicKeys: JsonWebKey[]): JsonWebKeySet {
    return {
      keys: publicKeys,
    };
  }

  /**
   * Base64URL encode
   */
  private static base64UrlEncode(data: string): string {
    return Buffer.from(data)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Base64URL decode
   */
  private static base64UrlDecode(data: string): string {
    const padded = data + '='.repeat((4 - (data.length % 4)) % 4);
    const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(base64, 'base64').toString();
  }

  /**
   * Create a mock signature for testing
   */
  private static createMockSignature(
    header: string,
    payload: string,
    kid: string,
  ): string {
    const data = `${header}.${payload}`;
    const hash = crypto
      .createHash('sha256')
      .update(data + kid)
      .digest('hex');
    return this.base64UrlEncode(hash);
  }

  /**
   * Get current timestamp in seconds
   */
  static getCurrentTimestamp(): number {
    return Math.floor(Date.now() / 1000);
  }

  /**
   * Get timestamp for future date
   */
  static getFutureTimestamp(daysFromNow: number): number {
    return Math.floor((Date.now() + daysFromNow * 24 * 60 * 60 * 1000) / 1000);
  }

  /**
   * Check if timestamp is expired
   */
  static isExpired(exp: number): boolean {
    return exp < this.getCurrentTimestamp();
  }
}
