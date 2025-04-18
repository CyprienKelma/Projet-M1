import { seedPostgres } from "./postgres.ts";
import { seedCassandra } from "./cassandra.ts";
import { DataVolume } from "./types.ts";

// Check if dry run mode is enabled
const isDryRun = Deno.args.includes("--dry-run");

// Parse environment variables
const pgConfig = {
  host: Deno.env.get("PG_HOST") || "localhost",
  port: parseInt(Deno.env.get("PG_PORT") || "5432"),
  user: Deno.env.get("PG_USERNAME") || "postgres",
  password: Deno.env.get("PG_PASSWORD") || "postgres",
  database: Deno.env.get("PG_DATABASE") || "demo",
};

const cassandraConfig = {
  hosts: [Deno.env.get("CASSANDRA_HOST") || "localhost"],
  port: parseInt(Deno.env.get("CASSANDRA_PORT") || "9042"),
  username: Deno.env.get("CASSANDRA_USERNAME"),
  password: Deno.env.get("CASSANDRA_PASSWORD"),
  keyspace: Deno.env.get("CASSANDRA_KEYSPACE") || "cassandra",
};

// Data volume can be controlled via env var or argument
let dataVolume: DataVolume = (Deno.env.get("DATA_VOLUME") ||
  "small") as DataVolume;
if (Deno.args.includes("--medium")) dataVolume = "medium";
if (Deno.args.includes("--large")) dataVolume = "large";

async function main() {
  console.log(
    `🌱 Starting database seeding process in ${isDryRun ? "DRY RUN" : "LIVE"} mode...`,
  );
  console.log(`📊 Using ${dataVolume} data volume`);

  if (isDryRun) {
    console.log("⚠️  DRY RUN MODE - No database will be modified");
  }

  try {
    console.log("🐘 Seeding PostgreSQL database...");
    const pgResults = await seedPostgres(pgConfig, dataVolume, isDryRun);

    console.log("🪄 Seeding Cassandra database...");
    await seedCassandra(cassandraConfig, pgResults, dataVolume, isDryRun);

    console.log("✅ Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}
