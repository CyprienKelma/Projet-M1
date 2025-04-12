import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../../models/postgres/user.entity';
import { Group } from '../../models/postgres/group.entity';

export const DatabaseProvider = [
  {
    provide: 'POSTGRES_DATA_SOURCE',
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => {
      console.log(
        `Postgres config : ${JSON.stringify(configService.get('postgres'))}`,
      );
      const dataSource = new DataSource({
        type: 'postgres',
        host:
          configService.get<string>('postgres.host') ||
          (() => {
            throw new Error('postgres.host is not defined');
          })(),
        port: configService.get<number>('postgres.port') || 5432,
        username:
          configService.get<string>('postgres.username') ||
          (() => {
            throw new Error('postgres.username is not defined');
          })(),
        password:
          configService.get<string>('postgres.password') ||
          (() => {
            throw new Error('postgres.password is not defined');
          })(),
        database:
          configService.get<string>('postgres.database') ||
          (() => {
            throw new Error('postgres.database is not defined');
          })(),
        ssl: {
          rejectUnauthorized: false, // for self-signed certs or operator-managed ones
        },
        entities: [User, Group],
        synchronize: false, // à mettre à false en production
      });
      try {
        await dataSource.initialize();
        console.log('✅ Postgres connected');
      } catch (err) {
        console.error('⚠️ Postgres connection failed:', err);
      }
      return dataSource;
    },
  },
];
