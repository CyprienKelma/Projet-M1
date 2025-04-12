import cassandra from 'cassandra-driver';
import { ConfigService } from '@nestjs/config';

export const CassandraProvider = [
  {
    provide: 'CASSANDRA_CLIENT',
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => {
      console.log(
        `Cassandra config : ${JSON.stringify(configService.get('cassandra'))}`,
      );
      const client = new cassandra.Client({
        contactPoints:
          configService.get<string[]>('cassandra.contactPoints') ||
          (() => {
            throw new Error('cassandra.contactPoints is not defined');
          })(),
        localDataCenter:
          configService.get('cassandra.localDataCenter') ||
          (() => {
            throw new Error('cassandra.localDataCenter is not defined');
          })(),
        protocolOptions: {
          port: configService.get<number>('cassandra.port') || 9042,
        },
        authProvider: new cassandra.auth.PlainTextAuthProvider(
          configService.get<string>('cassandra.username') ||
            (() => {
              throw new Error('cassandra.username is not defined');
            })(),
          configService.get<string>('cassandra.password') ||
            (() => {
              throw new Error('cassandra.password is not defined');
            })(),
        ),
      });

      try {
        await client.connect();
        console.log('✅ Cassandra connected');
      } catch (err) {
        console.error('⚠️ Cassandra connection error:', err);
      }

      return client;
    },
  },
];
