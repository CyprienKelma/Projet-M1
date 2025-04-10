import { createClient } from 'redis';
import { ConfigService } from '@nestjs/config';

export const RedisProvider = [
  {
    provide: 'REDIS_CLIENT',
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => {
      const client = createClient({
        url: `redis://${configService.get<string>('redis.host')}:${configService.get<number>('redis.port')}`,
        socket: {
          reconnectStrategy: () => {
            // Stop trying to reconnect after the first failure
            return new Error('❌ Redis reconnect disabled after initial failure');
          },
        },
      });

      client.on('error', (err) => {
        console.warn('⚠️ Redis error (non-blocking):', err.message);
      });

      try {
        await client.connect();
        console.log('✅ Redis connected');
        return client;
      } catch (err) {
        console.error('⚠️ Redis connection failed:', (err as Error).message);

        // retourne un client mock pour éviter que Nest plante
        return {
          get: () => null,
          set: () => null,
          on: () => {},
          connect: () => {},
          quit: () => {},
        } as any;
      }
    },
  },
];
