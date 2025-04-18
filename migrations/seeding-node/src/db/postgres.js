import { faker } from "@faker-js/faker";
import postgres from "postgres";
import { getDataCounts } from "../utils/dataVolume.js";
import { pgConfig, isDryRun, dataVolume } from "../config.js";
import {
  seedUsers,
  seedGroups,
  seedGroupUsers,
  seedActivities,
  seedNotificationStates,
} from "./postgres/index.js";

// --- Mock SQL (simplified for brevity, same logic as before) ---
const mockSql = async (strings, ...values) => {
  let query = strings[0];
  for (let i = 0; i < values.length; i++) {
    let valueStr = values[i];
    if (valueStr === null) valueStr = "NULL";
    else if (typeof valueStr === "string")
      valueStr = `'${valueStr.replace(/'/g, "''")}'`;
    else if (valueStr instanceof Date) valueStr = `'${valueStr.toISOString()}'`;
    else if (valueStr?.[Symbol.toStringTag] === "PostgresHelper") {
      if (valueStr.options?.type === "inserthelper")
        valueStr = "(...) VALUES (...)";
      else valueStr = "(...)";
    } else if (Array.isArray(valueStr))
      valueStr = `(${valueStr.map((v) => (typeof v === "string" ? `'${v.replace(/'/g, "''")}'` : v)).join(", ")})`;
    query +=
      (valueStr !== undefined ? valueStr : "UNDEFINED") +
      (strings[i + 1] || "");
  }
  query = query.replace(/\s+/g, " ").trim();
  console.log(`🔍 [Mock] Would execute SQL: ${query}`);
  if (query.toLowerCase().startsWith("insert"))
    return [{ id: faker.number.int({ min: 1000, max: 9999 }) }];
  if (query.toLowerCase().startsWith("select")) {
    if (query.includes("groups_users_user"))
      return Array(3)
        .fill(0)
        .map(() => ({ users_id: faker.number.int({ min: 1000, max: 9999 }) }));
    if (query.toLowerCase() === "select 1") return [{ "?column?": 1 }];
    return [];
  }
  return [];
};
mockSql.end = async () =>
  console.log("🔌 [Mock] Would disconnect from PostgreSQL");
// --- End Mock SQL ---

export async function seedPostgres() {
  let sql;
  let client;

  if (isDryRun) {
    sql = mockSql;
    client = { end: mockSql.end };
    console.log(`🧪 DRY RUN: Simulating PostgreSQL connection...`);
    try {
      await sql`SELECT 1`;
      console.log("✅ [Mock] PostgreSQL connection test simulated.");
    } catch (e) {}
  } else {
    const connectionString = `postgres://${pgConfig.user}:${encodeURIComponent(pgConfig.password)}@${pgConfig.host}:${pgConfig.port}/${pgConfig.database}?sslmode=allow`;
    console.log(`🔌 Connecting to PostgreSQL...`);
    try {
      sql = postgres(connectionString, {
        connect_timeout: 10,
        idle_timeout: 20,
        max: 10,
      });
      client = sql;
      await sql`SELECT 1`;
      console.log("✅ PostgreSQL connection established successfully.");
    } catch (err) {
      console.error("❌ PostgreSQL connection failed:", err);
      throw new Error(`Failed to connect to PostgreSQL: ${err.message}`);
    }
  }

  try {
    const counts = getDataCounts(dataVolume);
    console.log(`📊 PostgreSQL Data volume: ...`);

    console.log("🧹 Clearing existing PostgreSQL data...");
    try {
      await sql`TRUNCATE notification_states RESTART IDENTITY CASCADE`;
      await sql`TRUNCATE activities RESTART IDENTITY CASCADE`;
      await sql`TRUNCATE groups_users_user RESTART IDENTITY CASCADE`;
      await sql`TRUNCATE groups RESTART IDENTITY CASCADE`;
      await sql`TRUNCATE users RESTART IDENTITY CASCADE`;
      if (!isDryRun)
        console.log("✅ PostgreSQL tables truncated successfully.");
    } catch (err) {
      if (!isDryRun)
        console.warn("⚠️ PostgreSQL table truncation failed:", err.message);
    }

    const userCount = isDryRun ? Math.min(counts.users, 5) : counts.users;
    const groupCount = isDryRun ? Math.min(counts.groups, 3) : counts.groups;
    const activityCount = isDryRun
      ? Math.min(counts.activitiesPerGroup, 2)
      : counts.activitiesPerGroup;
    const notificationCount = isDryRun
      ? Math.min(counts.pgNotificationsPerUser, 2)
      : counts.pgNotificationsPerUser;

    const users = await seedUsers(sql, userCount);
    const groups = await seedGroups(sql, groupCount);
    await seedGroupUsers(sql, users, groups);
    const activities = await seedActivities(sql, users, groups, activityCount);
    await seedNotificationStates(sql, users, notificationCount);

    console.log("✅ PostgreSQL seeding completed.");
    return { users, groups, activities };
  } catch (error) {
    if (error.query) {
      console.error("❌ Failed SQL Query:", error.query);
    }
    console.error("❌ Error during PostgreSQL seeding:", error);
    throw error;
  } finally {
    if (client) {
      await client.end({ timeout: 5 });
      console.log("🔌 PostgreSQL connection closed.");
    }
  }
}
