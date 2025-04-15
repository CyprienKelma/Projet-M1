import * as dotenv from 'dotenv';
dotenv.config();

export default () => ({
  cassandra: {
    contactPoints: [process.env.CASSANDRA_HOST],
    keyspace: process.env.CASSANDRA_KEYSPACE || 'cassandra', // Default to 'cassandra' if undefined
    localDataCenter: process.env.CASSANDRA_LOCAL_DATACENTER,
    port: parseInt(process.env.CASSANDRA_PORT || '9042', 10), // Default to 9042 if undefined
    username: process.env.CASSANDRA_USERNAME,
    password: process.env.CASSANDRA_PASSWORD,
  },
});
