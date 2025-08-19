import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const createDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'mysql',
  host: configService.get('MYSQL_HOST'),
  port: configService.get('MYSQL_PORT'),
  username: configService.get('MYSQL_USER'),
  password: configService.get('MYSQL_PASSWORD'),
  database: configService.get('MYSQL_DATABASE'),
  autoLoadEntities: true,
  synchronize: false,
});
