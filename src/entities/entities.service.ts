import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  TrustEntity,
  TrustEntityStatus,
  TrustEntityType,
} from './entity.entity';
import { CreateEntityDto } from './dto/create-entity.dto';
import { UpdateEntityDto } from './dto/update-entity.dto';

// JWKS interface for proper typing
interface JWKS {
  keys: Array<{
    kty: string;
    use?: string;
    key_ops?: string[];
    alg?: string;
    kid?: string;
    x5u?: string;
    x5c?: string[];
    x5t?: string;
    'x5t#S256'?: string;
    [key: string]: any;
  }>;
}

@Injectable()
export class EntitiesService {
  constructor(
    @InjectRepository(TrustEntity)
    private entityRepository: Repository<TrustEntity>,
  ) {}

  async register(createEntityDto: CreateEntityDto): Promise<TrustEntity> {
    const { entityType, name, jwksUri, jwks, endpoints, policy } =
      createEntityDto;

    this.validateRequiredFields(jwksUri, jwks);
    await this.checkDuplicates(jwksUri, name);

    const entity = this.entityRepository.create({
      entityType,
      name,
      jwksUri,
      jwks,
      endpoints: endpoints || {},
      policy,
      status: TrustEntityStatus.ACTIVE,
      tlVersion: await this.generateTlVersion(),
    });

    return this.entityRepository.save(entity);
  }

  async update(
    id: string,
    updateEntityDto: UpdateEntityDto,
  ): Promise<TrustEntity> {
    const entity = await this.findEntityById(id);
    Object.assign(entity, updateEntityDto);
    entity.tlVersion = await this.generateTlVersion();
    return this.entityRepository.save(entity);
  }

  async revoke(id: string): Promise<TrustEntity> {
    const entity = await this.findEntityById(id);
    entity.status = TrustEntityStatus.REVOKED;
    entity.tlVersion = await this.generateTlVersion();
    return this.entityRepository.save(entity);
  }

  async findAll(): Promise<TrustEntity[]> {
    return this.entityRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<TrustEntity> {
    return this.findEntityById(id);
  }

  async findByStatus(status: TrustEntityStatus): Promise<TrustEntity[]> {
    return this.entityRepository.find({
      where: { status },
      order: { createdAt: 'DESC' },
    });
  }

  async findByType(entityType: TrustEntityType): Promise<TrustEntity[]> {
    return this.entityRepository.find({
      where: { entityType },
      order: { createdAt: 'DESC' },
    });
  }

  private async findEntityById(id: string): Promise<TrustEntity> {
    const entity = await this.entityRepository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`Entity with ID ${id} not found`);
    }
    return entity;
  }

  private validateRequiredFields(jwksUri?: string, jwks?: object): void {
    if (!jwksUri && !jwks) {
      throw new BadRequestException('Either jwksUri or jwks must be provided');
    }

    if (jwks) {
      const jwksTyped = jwks as JWKS;
      if (!jwksTyped.keys || !Array.isArray(jwksTyped.keys)) {
        throw new BadRequestException('JWKS must contain a valid keys array');
      }
    }
  }

  private async generateTlVersion(): Promise<string> {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:.]/g, '').slice(0, 15);
    return `v${timestamp}`;
  }

  private async checkDuplicates(
    jwksUri?: string,
    name?: string,
  ): Promise<void> {
    if (jwksUri) {
      const existingByUri = await this.entityRepository.findOne({
        where: { jwksUri },
      });
      if (existingByUri) {
        throw new ConflictException(
          `Entity with JWKS URI ${jwksUri} already exists`,
        );
      }
    }

    if (name) {
      const existingByName = await this.entityRepository.findOne({
        where: { name },
      });
      if (existingByName) {
        throw new ConflictException(`Entity with name ${name} already exists`);
      }
    }
  }
}
