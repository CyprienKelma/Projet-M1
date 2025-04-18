import postgres from "postgres";
import { faker } from "@faker-js/faker";

// Import shared utilities and config
import { getDataCounts } from "../utils/dataVolume.js";
import { pgConfig, isDryRun, dataVolume } from "../config.js";

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
        // transform: { undefined: null },
        // Enable debug logging for the actual connection
        // debug: (connection, query, parameters, paramTypes) => {
        //   console.log("🐘 DEBUG SQL:", query);
        //   // Avoid logging potentially huge parameter arrays in production logs
        //   // console.log('🐘 DEBUG PARAMS:', parameters);
        // },
      });
      client = sql;
      await sql`SELECT 1`;
      console.log("✅ PostgreSQL connection established successfully.");
    } catch (err) {
      console.error("❌ PostgreSQL connection failed:", err);
      // ... (error hints)
      throw new Error(`Failed to connect to PostgreSQL: ${err.message}`);
    }
  }

  try {
    const counts = getDataCounts(dataVolume);
    console.log(`📊 PostgreSQL Data volume: ...`); // Simplified log

    console.log("🧹 Clearing existing PostgreSQL data...");
    try {
      // TRUNCATE statements remain the same
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
    // Log the actual query from the error object if available
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

async function seedUsers(sql, count) {
  if (count <= 0) return [];
  console.log(`\nSeeding ${count} users...`);
  const users = [];
  const batchSize = 100;

  for (let i = 0; i < count; i += batchSize) {
    const batchData = [];
    const limit = Math.min(i + batchSize, count);
    for (let j = i; j < limit; j++) {
      batchData.push({
        // Ensure keys match DB columns (snake_case)
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        email: faker.internet.email(),
        password: faker.internet.password(),
      });
    }

    // *** CORRECTED INSERT SYNTAX ***
    // Omit the manual column list before the helper
    const result = await sql`
      INSERT INTO users ${sql(batchData)}
      RETURNING id, first_name, last_name, email
    `;

    users.push(...result);
    process.stdout.write(".");
  }
  console.log(` Done (${users.length} users)!`);
  return users;
}

async function seedGroups(sql, count) {
  if (count <= 0) return [];
  console.log(`\nSeeding ${count} groups...`);
  const groups = [];
  const batchSize = 50;

  for (let i = 0; i < count; i += batchSize) {
    const batchData = [];
    const limit = Math.min(i + batchSize, count);
    for (let j = i; j < limit; j++) {
      batchData.push({
        // Ensure keys match DB columns
        name: faker.company.name(),
        description: faker.lorem.paragraph(),
      });
    }

    // *** CORRECTED INSERT SYNTAX ***
    const result = await sql`
        INSERT INTO groups ${sql(batchData)}
        RETURNING id, name, description
      `;
    groups.push(...result);
    process.stdout.write(".");
  }
  console.log(` Done (${groups.length} groups)!`);
  return groups;
}

async function seedGroupUsers(sql, users, groups) {
  if (!users?.length || !groups?.length) return;
  console.log("\nAssigning users to groups...");
  let assignmentCount = 0;
  const batchSize = 200;
  let batchData = [];

  for (const group of groups) {
    const memberCount = Math.max(
      1,
      Math.floor(users.length * faker.number.float({ min: 0.1, max: 0.3 })),
    );
    const groupUsers = faker.helpers.shuffle([...users]).slice(0, memberCount);

    for (const user of groupUsers) {
      batchData.push({
        // Ensure keys match DB columns
        groups_id: group.id,
        users_id: user.id,
      });
      assignmentCount++;

      if (batchData.length >= batchSize) {
        // *** CORRECTED INSERT SYNTAX ***
        await sql`
                INSERT INTO groups_users_user ${sql(batchData)}
                ON CONFLICT DO NOTHING
            `;
        batchData = [];
        process.stdout.write(".");
      }
    }
  }

  if (batchData.length > 0) {
    // *** CORRECTED INSERT SYNTAX ***
    await sql`
          INSERT INTO groups_users_user ${sql(batchData)}
          ON CONFLICT DO NOTHING
      `;
    process.stdout.write(".");
  }

  console.log(` Done (${assignmentCount} assignments)!`);
}

async function seedActivities(sql, users, groups, activitiesPerGroup) {
  if (!users?.length || !groups?.length || activitiesPerGroup <= 0) return [];
  console.log(`\nSeeding activities (${activitiesPerGroup} per group)...`);

  const activityTypes = [
    "restaurant",
    "museum",
    "hiking",
    "movie",
    "gaming",
    "sports",
    "concert",
    "meetup",
    "workshop",
  ];
  const statuses = ["planned", "canceled", "completed", "ongoing"];
  const activities = [];
  let totalActivities = 0;
  const batchSize = 100;
  let batchData = [];

  for (const group of groups) {
    const membersResult =
      await sql`SELECT users_id FROM groups_users_user WHERE groups_id = ${group.id}`;
    const groupUserIds = membersResult.map((row) => row.users_id);
    if (groupUserIds.length === 0) continue;

    for (let i = 0; i < activitiesPerGroup; i++) {
      batchData.push({
        // Ensure keys match DB columns
        group_id: group.id,
        user_id: faker.helpers.arrayElement(groupUserIds),
        activity_type: faker.helpers.arrayElement(activityTypes),
        title: `${faker.word.adjective()} ${faker.helpers.arrayElement(activityTypes)} event`,
        description: faker.lorem.sentence(),
        location:
          faker.location.city() + ", " + faker.location.streetAddress(false),
        scheduled_at: faker.date.between({
          from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          to: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        }),
        status: faker.helpers.arrayElement(statuses),
      });
      totalActivities++;

      if (batchData.length >= batchSize) {
        // *** CORRECTED INSERT SYNTAX ***
        const result = await sql`
            INSERT INTO activities ${sql(batchData)}
            RETURNING id, group_id, user_id, title
          `;
        activities.push(...result);
        batchData = [];
        process.stdout.write(".");
      }
    }
  }

  if (batchData.length > 0) {
    // *** CORRECTED INSERT SYNTAX ***
    const result = await sql`
        INSERT INTO activities ${sql(batchData)}
        RETURNING id, group_id, user_id, title
      `;
    activities.push(...result);
    process.stdout.write(".");
  }

  console.log(` Done (${totalActivities} activities)!`);
  return activities;
}

async function seedNotificationStates(sql, users, notificationsPerUser) {
  if (!users?.length || notificationsPerUser <= 0) return;
  console.log(
    `\nSeeding notification states (${notificationsPerUser} per user)...`,
  );

  const statusOptions = ["UNSEEN", "SEEN", "CLICKED", "DELETED"];
  let totalStates = 0;
  const batchSize = 200;
  let batchData = [];

  for (const user of users) {
    const notificationIds = new Set();
    while (notificationIds.size < notificationsPerUser) {
      notificationIds.add(faker.number.int({ min: 1, max: 50000 }));
    }

    for (const notificationId of notificationIds) {
      batchData.push({
        // Ensure keys match DB columns
        user_id: user.id,
        notification_id: notificationId,
        status: faker.helpers.arrayElement(statusOptions),
        updated_at: faker.date.recent({ days: 30 }),
      });
      totalStates++;

      if (batchData.length >= batchSize) {
        // *** CORRECTED INSERT SYNTAX ***
        // Note: ON CONFLICT needs the target columns specified
        await sql`
            INSERT INTO notification_states ${sql(batchData)}
            ON CONFLICT (user_id, notification_id) DO UPDATE SET
              status = EXCLUDED.status,
              updated_at = EXCLUDED.updated_at
          `;
        batchData = [];
        process.stdout.write(".");
      }
    }
  }

  if (batchData.length > 0) {
    // *** CORRECTED INSERT SYNTAX ***
    await sql`
        INSERT INTO notification_states ${sql(batchData)}
        ON CONFLICT (user_id, notification_id) DO UPDATE SET
          status = EXCLUDED.status,
          updated_at = EXCLUDED.updated_at
      `;
    process.stdout.write(".");
  }

  console.log(` Done (${totalStates} notification states)!`);
}
