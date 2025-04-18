import { seedPostgres } from "./db/postgres.js";
import { seedCassandra } from "./db/cassandra.js";
import { isDryRun, dataVolume } from "./config.js"; // Import flags for logging

// Removed old config parsing - now handled in config.js

async function main() {
  // Initial log messages are now mostly in config.js, just add a start message
  console.log(`\n🌱 Starting database seeding process...`);
  // Mode and volume are already logged by config.js when it's imported

  if (isDryRun) {
    console.log("⚠️ DRY RUN MODE - No database modifications will occur.");
  }

  try {
    console.log("\n🐘 Seeding PostgreSQL database...");
    // Call seedPostgres without arguments; it uses imported config
    const pgResults = await seedPostgres();
    // pgResults contains { users, groups, activities } needed by Cassandra

    console.log("\n🪄 Seeding Cassandra database...");
    // Call seedCassandra with only pgResults; it uses imported config
    await seedCassandra(pgResults);

    console.log("\n✅ Database seeding completed successfully!");
  } catch (error) {
    // Errors from seed functions should bubble up here
    console.error("\n❌ Seeding process failed:", error.message);
    // Optional: Log the full error stack for debugging
    // console.error(error.stack);
    process.exit(1); // Exit with error code
  }
}

// Check if this script is the main module being run
// Note: The path needs to match how Node resolves the entry point.
// If you run `node src/main.js`, process.argv[1] will be the absolute path to src/main.js.
const entryPointPath = process.argv[1];
const currentModuleUrl = import.meta.url;

// A more robust check for different OS path formats
const isMainModule =
  currentModuleUrl === `file://${entryPointPath}` ||
  currentModuleUrl === `file:///${entryPointPath}`; // Handle Windows paths

if (isMainModule) {
  main();
} else {
  // This allows functions to be potentially imported elsewhere without running main()
  console.log(
    `Script loaded as a module, not executing main(). Entry: ${entryPointPath}, Module: ${currentModuleUrl}`,
  );
}
