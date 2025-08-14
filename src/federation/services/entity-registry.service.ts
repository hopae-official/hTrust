import { Injectable, Logger } from '@nestjs/common';

export interface RegisteredEntity {
  entityId: string;
  metadata: any;
  status: 'active' | 'suspended' | 'revoked';
  registeredAt: Date;
  updatedAt: Date;
  trustMarks?: string[];
  authorityHints?: string[];
}

@Injectable()
export class EntityRegistryService {
  private readonly logger = new Logger(EntityRegistryService.name);

  // Registry database - entities we have issued statements for
  private readonly registeredEntities = new Map<string, RegisteredEntity>([
    [
      'https://rp.example.org',
      {
        entityId: 'https://rp.example.org',
        metadata: {
          organization_name: 'Example Relying Party',
          entity_type: 'openid_relying_party',
        },
        status: 'active',
        registeredAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        trustMarks: ['verified_rp'],
        authorityHints: ['http://localhost:3000'], // hTrust as Trust Anchor
      },
    ],
    [
      'https://op.example.org',
      {
        entityId: 'https://op.example.org',
        metadata: {
          organization_name: 'Example OpenID Provider',
          entity_type: 'openid_provider',
        },
        status: 'active',
        registeredAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        trustMarks: ['verified_issuer', 'kyc_provider'],
        authorityHints: ['http://localhost:3000'], // hTrust as Trust Anchor
      },
    ],
    [
      'https://intermediate.example.org',
      {
        entityId: 'https://intermediate.example.org',
        metadata: {
          organization_name: 'Intermediate Authority',
          entity_type: 'federation_entity',
        },
        status: 'active',
        registeredAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ],
  ]);

  /**
   * Get registered entity by ID
   */
  getRegisteredEntity(entityId: string): RegisteredEntity | null {
    this.logger.log(`Getting registered entity: ${entityId}`);
    return this.registeredEntities.get(entityId) || null;
  }

  /**
   * Get all registered entities
   */
  getAllRegisteredEntities(): RegisteredEntity[] {
    return Array.from(this.registeredEntities.values());
  }

  /**
   * Register a new entity
   */
  registerEntity(entityId: string, metadata: any): RegisteredEntity {
    this.logger.log(`Registering new entity: ${entityId}`);

    const entity: RegisteredEntity = {
      entityId,
      metadata,
      status: 'active',
      registeredAt: new Date(),
      updatedAt: new Date(),
    };

    this.registeredEntities.set(entityId, entity);
    return entity;
  }

  /**
   * Update entity metadata
   */
  updateEntityMetadata(
    entityId: string,
    metadata: any,
  ): RegisteredEntity | null {
    this.logger.log(`Updating entity metadata: ${entityId}`);

    const entity = this.registeredEntities.get(entityId);
    if (!entity) {
      return null;
    }

    entity.metadata = { ...entity.metadata, ...metadata };
    entity.updatedAt = new Date();

    this.registeredEntities.set(entityId, entity);
    return entity;
  }

  /**
   * Update entity status
   */
  updateEntityStatus(
    entityId: string,
    status: 'active' | 'suspended' | 'revoked',
  ): RegisteredEntity | null {
    this.logger.log(`Updating entity status: ${entityId} -> ${status}`);

    const entity = this.registeredEntities.get(entityId);
    if (!entity) {
      return null;
    }

    entity.status = status;
    entity.updatedAt = new Date();

    this.registeredEntities.set(entityId, entity);
    return entity;
  }

  /**
   * Remove entity from registry
   */
  removeEntity(entityId: string): boolean {
    this.logger.log(`Removing entity: ${entityId}`);
    return this.registeredEntities.delete(entityId);
  }
}
