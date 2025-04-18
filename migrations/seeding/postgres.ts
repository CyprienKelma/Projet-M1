import postgres from "postgres";
import { faker } from "@faker-js/faker";
import { DataVolume, PgConfig, SeedResults } from "./types.ts";

// Mock client for dry runs
class MockPgClient {
  // Tagged template query function
  sql(strings: TemplateStringsArray, ...values: any[]) {
    const query = String.raw({ raw: strings }, ...values);
    console.log(`🔍 Would execute: ${query}`);

    // Return mock data based on the query
    if (query.includes("INSERT INTO users")) {
      const id = Math.floor(Math.random() * 1000);
      return [
        {
          id,
          first_name: values[0],
          last_name: values[1],
          email: values[2],
        },
      ];
    } else if (query.includes("INSERT INTO groups")) {
      const id = Math.floor(Math.random() * 1000);
      return [
        {
          id,
          name: values[0],
          description: values[1],
        },
      ];
    } else if (query.includes("INSERT INTO activities")) {
      const id = Math.floor(Math.random() * 1000);
      return [
        {
          id,
          group_id: values[0],
          user_id: values[1],
          title: values[3],
        },
      ];
    } else if (query.includes("SELECT users_id FROM groups_users_user")) {
      return Array(5)
        .fill(0)
        .map(() => ({ users_id: Math.floor(Math.random() * 1000) }));
    } else {
      return [];
    }
  }

  async end() {
    console.log("🔌 Would disconnect from PostgreSQL");
  }
}

export async function seedPostgres(
  config: PgConfig,
  volume: DataVolume,
  dryRun = false,
): Promise<SeedResults> {
  let sql;
  let client;

  if (dryRun) {
    client = new MockPgClient();
    sql = client.sql.bind(client);
    console.log(
      `🧪 DRY RUN: Would connect to PostgreSQL at ${config.host}:${config.port}/${config.database} as ${config.user}`,
    );
  } else {
    console.log(
      `🔌 Connecting to PostgreSQL at ${config.host}:${config.port}/${config.database} as ${config.user}`,
    );

    const usl = `postgres://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}?sslmode=require`;
    console.log(`🔌 PostgreSQL connection string: ${usl}`);
    sql = postgres(
      `postgres://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}?sslmode=require`,
      {
        debug: true,
      },
    );
    client = { end: sql.end };
  }

  try {
    // Test connection with a simple query
    await sql`SELECT 1 as connection_test`;
    console.log("✅ PostgreSQL connection established successfully");
  } catch (err) {
    console.error("❌ PostgreSQL connection failed:", err);
    throw new Error(`Failed to connect to PostgreSQL: ${err.message}`);
  }

  try {
    const counts = getDataCounts(volume);
    console.log(
      `📊 Data volume: ${Object.entries(counts)
        .map(([k, v]) => `${k}=${v}`)
        .join(", ")}`,
    );

    // Clear existing data if needed (skip in dry run)
    if (!dryRun) {
      try {
        console.log("🧹 Clearing existing data...");
        // Execute each truncate separately to isolate potential issues
        await sql`TRUNCATE notification_states RESTART IDENTITY CASCADE`;
        await sql`TRUNCATE activities RESTART IDENTITY CASCADE`;
        await sql`TRUNCATE groups_users_user RESTART IDENTITY CASCADE`;
        await sql`TRUNCATE groups RESTART IDENTITY CASCADE`;
        await sql`TRUNCATE users RESTART IDENTITY CASCADE`;
        console.log("✅ Tables truncated successfully");
      } catch (err) {
        console.warn(
          "⚠️ Table truncation failed, continuing without reset:",
          err.message,
        );
        // Continue execution instead of failing - tables might be empty anyway
      }
    } else {
      console.log("🧹 Would clear existing data from tables");
    }

    // Seed the tables in order (with smaller numbers for dry run)
    const userCount = dryRun ? Math.min(counts.users, 5) : counts.users;
    const groupCount = dryRun ? Math.min(counts.groups, 3) : counts.groups;
    const activityCount = dryRun
      ? Math.min(counts.activitiesPerGroup, 2)
      : counts.activitiesPerGroup;
    const notificationCount = dryRun
      ? Math.min(counts.notificationsPerUser, 2)
      : counts.notificationsPerUser;

    const users = await seedUsers(sql, userCount);
    const groups = await seedGroups(sql, groupCount);
    await seedGroupUsers(sql, users, groups);
    const activities = await seedActivities(sql, users, groups, activityCount);
    await seedNotificationStates(sql, users, notificationCount);

    return { users, groups, activities };
  } finally {
    await client.end();
  }
}

function getDataCounts(volume: DataVolume) {
  switch (volume) {
    case "small":
      return {
        users: 50,
        groups: 10,
        activitiesPerGroup: 5,
        notificationsPerUser: 3,
      };
    case "medium":
      return {
        users: 200,
        groups: 30,
        activitiesPerGroup: 10,
        notificationsPerUser: 10,
      };
    case "large":
      return {
        users: 1000,
        groups: 100,
        activitiesPerGroup: 20,
        notificationsPerUser: 30,
      };
    default:
      return {
        users: 200,
        groups: 30,
        activitiesPerGroup: 10,
        notificationsPerUser: 10,
      };
  }
}

async function seedUsers(sql, count: number) {
  console.log(`Seeding ${count} users...`);
  const users = [];

  for (let i = 0; i < count; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName });
    const password = faker.internet.password();

    const result = await sql`
      INSERT INTO users (first_name, last_name, email, password)
      VALUES (${firstName}, ${lastName}, ${email}, ${password})
      RETURNING id, first_name, last_name, email
    `;

    users.push(result[0]);

    if (i % 50 === 0) {
      Deno.stdout.writeSync(new TextEncoder().encode("."));
    }
  }
  console.log(" Done!");

  return users;
}

async function seedGroups(sql, count: number) {
  console.log(`Seeding ${count} groups...`);
  const groups = [];

  for (let i = 0; i < count; i++) {
    const name = faker.word.adjective() + " " + faker.word.noun();
    const description = faker.lorem.paragraph();

    const result = await sql`
      INSERT INTO groups (name, description)
      VALUES (${name}, ${description})
      RETURNING id, name, description
    `;

    groups.push(result[0]);

    if (i % 10 === 0) {
      Deno.stdout.writeSync(new TextEncoder().encode("."));
    }
  }
  console.log(" Done!");

  return groups;
}

async function seedGroupUsers(sql, users, groups) {
  console.log("Assigning users to groups...");

  for (const group of groups) {
    // Assign random 10-30% of users to each group
    const memberCount = Math.max(
      3,
      Math.floor(users.length * (Math.random() * 0.2 + 0.1)),
    );
    const groupUsers = [...users]
      .sort(() => Math.random() - 0.5)
      .slice(0, memberCount);

    for (const user of groupUsers) {
      await sql`
        INSERT INTO groups_users_user (groups_id, users_id)
        VALUES (${group.id}, ${user.id})
        ON CONFLICT DO NOTHING
      `;
    }
    Deno.stdout.writeSync(new TextEncoder().encode("."));
  }
  console.log(" Done!");
}

async function seedActivities(sql, users, groups, activitiesPerGroup) {
  console.log(`Seeding activities (${activitiesPerGroup} per group)...`);

  const activityTypes = [
    "restaurant",
    "museum",
    "hiking",
    "movie",
    "gaming",
    "sports",
    "concert",
  ];
  const statuses = ["planned", "canceled", "completed"];
  const activities = [];

  for (const group of groups) {
    // Find users in this group
    const result = await sql`
      SELECT users_id FROM groups_users_user WHERE groups_id = ${group.id}
    `;

    const groupUserIds = result.map((row) => row.users_id);
    if (groupUserIds.length === 0) continue;

    // Create activities for this group
    for (let i = 0; i < activitiesPerGroup; i++) {
      const creatorId = faker.helpers.arrayElement(groupUserIds);
      const activityType = faker.helpers.arrayElement(activityTypes);
      const title = faker.word.adjective() + " " + activityType;
      const description = faker.lorem.paragraph();
      const status = faker.helpers.arrayElement(statuses);
      const location = faker.location.streetAddress();
      const scheduledAt = faker.date.between({
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      });

      const activityResult = await sql`
        INSERT INTO activities (group_id, user_id, activity_type, title, description, location, scheduled_at, status)
        VALUES (${group.id}, ${creatorId}, ${activityType}, ${title}, ${description}, ${location}, ${scheduledAt}, ${status})
        RETURNING id, group_id, user_id, title
      `;

      activities.push(activityResult[0]);
    }
    Deno.stdout.writeSync(new TextEncoder().encode("."));
  }
  console.log(" Done!");
  return activities;
}

async function seedNotificationStates(sql, users, notificationsPerUser) {
  console.log(
    `Seeding notification states (${notificationsPerUser} per user)...`,
  );

  const statusOptions = ["UNSEEN", "SEEN", "CLICKED", "DELETED"];

  for (const user of users) {
    for (let i = 0; i < notificationsPerUser; i++) {
      const notificationId = 1000 + Math.floor(Math.random() * 9000);
      const status = faker.helpers.arrayElement(statusOptions);
      const updatedAt = faker.date.recent({ days: 30 });

      await sql`
        INSERT INTO notification_states (user_id, notification_id, status, updated_at)
        VALUES (${user.id}, ${notificationId}, ${status}::notification_status, ${updatedAt})
      `;
    }
    Deno.stdout.writeSync(new TextEncoder().encode("."));
  }
  console.log(" Done!");
}
