import neo4j, { Driver } from 'neo4j-driver';
import { ConfigService } from '@nestjs/config';

export const Neo4jProvider = [
  {
    provide: 'NEO4J_DRIVER',
    inject: [ConfigService],
    useFactory: async (configService: ConfigService): Promise<Driver> => {
      console.log(
        `Neo4j config : ${JSON.stringify(configService.get('neo4j'))}`,
      );
      const driver = neo4j.driver(
        `bolt://${
          configService.get('neo4j.host') ||
          (() => {
            throw new Error('neo4j.host is not defined');
          })()
        }:${configService.get('neo4j.port') || 7687}`,
        neo4j.auth.basic(
          configService.get('neo4j.username') ||
            (() => {
              throw new Error('neo4j.username is not defined');
            })(),
          configService.get('neo4j.password') ||
            (() => {
              throw new Error('neo4j.password is not defined');
            })(),
        ),
        { disableLosslessIntegers: true },
      );

      // Test connection
      try {
        await driver.verifyConnectivity();
        console.log('✅ Neo4j connected');
      } catch (err) {
        console.error('⚠️ Neo4j connection failed:', err);
      }
      return driver;
    },
  },
];
