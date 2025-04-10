import cassandra from 'cassandra-driver';
import { ConfigService } from '@nestjs/config';

export const CassandraProvider = [
  {
    provide: 'CASSANDRA_CLIENT',
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => {
      const client = new cassandra.Client({
        contactPoints: configService.get<string[]>(
          'cassandra.contactPoints',
        ) || ['localhost'],
        localDataCenter:
          configService.get('cassandra.localDataCenter') || 'datacenter1',
        protocolOptions: {
          port: configService.get<number>('cassandra.port') || 9042,
        },
        authProvider: new cassandra.auth.PlainTextAuthProvider(
          configService.get<string>('cassandra.username') || '',
          configService.get<string>('cassandra.password') || '',
        ),
      });

      await client.connect();
      return client;
    },
  },
];
