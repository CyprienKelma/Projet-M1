import * as dotenv from 'dotenv';
dotenv.config();

export default () => ({
  redis: {
    host: process.env.KEYDB_HOST,
    port: parseInt(process.env.KEYDB_PORT || '6379', 10),
  },
});
