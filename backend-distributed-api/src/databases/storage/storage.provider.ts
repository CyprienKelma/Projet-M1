import { Client } from 'minio';
import { ConfigService } from '@nestjs/config';

export const StorageProvider = [
  {
    provide: 'STORAGE_CLIENT',
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => {
      try {
        const minioClient = new Client({
          endPoint: configService.get<string>('storage.endpoint') || 'default-endpoint',
          port: configService.get<number>('storage.port'),
          useSSL: false,
          accessKey: configService.get<string>('storage.accessKey'),
          secretKey: configService.get<string>('storage.secretKey'),
        });
        console.log('✅ Storage client initialized');
        return minioClient;
      } catch (err) {
        console.error('⚠️ Storage client initialization failed:', (err as Error).message);
        return null;
      }
    },
  },
];
