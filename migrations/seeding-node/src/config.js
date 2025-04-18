// Parse command line arguments
const args = process.argv.slice(2); // Exclude 'node' and script path
export const isDryRun = args.includes("--dry-run");

// Determine data volume from env var or arguments
let volume = process.env.DATA_VOLUME || "small";
if (args.includes("--medium")) volume = "medium";
if (args.includes("--large")) volume = "large";
if (args.includes("--prod")) volume = "prod"; // Added prod based on cassandra.js
export const dataVolume = volume;

// PostgreSQL Configuration
export const pgConfig = {
  host: process.env.PG_HOST || "localhost",
  port: parseInt(process.env.PG_PORT || "5432", 10),
  user: process.env.PG_USERNAME || "postgres",
  password: process.env.PG_PASSWORD || "postgres",
  database: process.env.PG_DATABASE || "demo",
};

// Cassandra Configuration
export const cassandraConfig = {
  // Split CASSANDRA_HOST if multiple hosts are provided, comma-separated
  hosts: (process.env.CASSANDRA_HOST || "localhost").split(","),
  port: parseInt(process.env.CASSANDRA_PORT || "9042", 10),
  username: process.env.CASSANDRA_USERNAME, // Will be undefined if not set
  password: process.env.CASSANDRA_PASSWORD, // Will be undefined if not set
  keyspace: process.env.CASSANDRA_KEYSPACE || "cassandra",
  localDataCenter: process.env.CASSANDRA_DC || "dc1", // Added common config
};

// Log configuration being used (optional, but helpful for debugging)
console.log(`🔧 Configuration loaded:`);
console.log(`  - Mode: ${isDryRun ? "DRY RUN" : "LIVE"}`);
console.log(`  - Data Volume: ${dataVolume}`);
console.log(
  `  - PostgreSQL: ${pgConfig.user}@${pgConfig.host}:${pgConfig.port}/${pgConfig.database}`,
);
console.log(
  `  - Cassandra: ${cassandraConfig.username || "N/A"}@${cassandraConfig.hosts.join(",")}:${cassandraConfig.port}/${cassandraConfig.keyspace} (DC: ${cassandraConfig.localDataCenter})`,
);
