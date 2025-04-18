import { Client, types } from "cassandra-driver";
import { faker } from "@faker-js/faker";
// Removed: import { DataVolume } from "../types.js"; // No longer needed here
// Removed: import crypto from "crypto"; // No longer needed here

// Import shared utilities and config
import { generateUuid } from "../utils/cryptoUtils.js";
import { getDataCounts } from "../utils/dataVolume.js";
import { cassandraConfig, isDryRun, dataVolume } from "../config.js"; // Import config directly

// Mock client for dry runs
class MockCassandraClient {
  async connect() {
    console.log("🔌 [Mock] Would connect to Cassandra");
  }

  async execute(query, params, options) {
    const paramStr = params
      ?.map((p) =>
        p instanceof Date
          ? p.toISOString()
          : p?.toString
            ? p.toString()
            : JSON.stringify(p),
      )
      .join(", ");
    // Add [Mock] prefix for clarity
    console.log(
      `🔍 [Mock] Would execute: ${query.trim()} with params [${paramStr || ""}]`,
    );
    return { rows: [] }; // Return structure expected by the driver
  }

  async shutdown() {
    console.log("🔌 [Mock] Would disconnect from Cassandra");
  }
}

// Removed digest and old generateUuid functions - now in cryptoUtils.js

// Updated function signature: removed config, volume, dryRun parameters
export async function seedCassandra(pgResults) {
  let client;

  // Use imported config and isDryRun
  if (isDryRun) {
    client = new MockCassandraClient();
    console.log(
      `🧪 DRY RUN: Simulating Cassandra connection to ${cassandraConfig.hosts.join(",")}:${cassandraConfig.port}/${cassandraConfig.keyspace}`,
    );
    // No actual connect call needed for mock
  } else {
    console.log(
      `🔌 Connecting to Cassandra at ${cassandraConfig.hosts.join(",")}:${cassandraConfig.port}/${cassandraConfig.keyspace}...`,
    );
    client = new Client({
      contactPoints: cassandraConfig.hosts,
      localDataCenter: cassandraConfig.localDataCenter, // Use from config
      credentials: {
        username: cassandraConfig.username,
        password: cassandraConfig.password,
      },
      keyspace: cassandraConfig.keyspace,
      protocolOptions: {
        port: cassandraConfig.port, // Ensure port is passed if non-default
      },
    });
    await client.connect();
    console.log("✅ Cassandra connection established.");
  }

  try {
    // Determine scale based on imported volume
    // Use imported getDataCounts and dataVolume
    const counts = getDataCounts(dataVolume);
    console.log(
      `📊 Cassandra Data volume: ${Object.entries(counts) // Log only relevant counts if needed
        .filter(
          ([k]) =>
            k.startsWith("cs") ||
            ["messages", "purchases", "sessions"].some((p) => k.startsWith(p)),
        )
        .map(([k, v]) => `${k}=${v}`)
        .join(", ")}`,
    );

    // Adjust counts for dry run using imported isDryRun
    const messageCount = isDryRun
      ? Math.min(counts.messagesPerGroup, 3)
      : counts.messagesPerGroup;
    const notificationCount = isDryRun
      ? Math.min(counts.csNotificationsPerUser, 2) // Use renamed count
      : counts.csNotificationsPerUser;
    const purchaseCount = isDryRun
      ? Math.min(counts.purchasesPerUser, 2)
      : counts.purchasesPerUser;
    const sessionCount = isDryRun
      ? Math.min(counts.sessionsPerUser, 2)
      : counts.sessionsPerUser;

    // Seed different tables
    await seedGroupMessages(client, pgResults, messageCount);
    await seedUserNotifications(client, pgResults, notificationCount);
    await seedUserPurchases(client, pgResults, purchaseCount);
    await seedUserSessionEvents(client, pgResults, sessionCount);
  } catch (error) {
    console.error("❌ Error during Cassandra seeding:", error);
    // Re-throw the error so main can catch it
    throw error;
  } finally {
    if (client) {
      // Check if client was initialized
      await client.shutdown();
      console.log("🔌 Cassandra connection closed.");
    }
  }
}

// Removed getDataCounts function - now in dataVolume.js

async function seedGroupMessages(client, pgResults, messagesPerGroup) {
  if (messagesPerGroup <= 0) return; // Skip if count is zero
  console.log(`\nSeeding group messages (${messagesPerGroup} per group)...`);

  const query = `
    INSERT INTO group_messages (
      group_id, created_at, message_id, user_id, content
    ) VALUES (?, ?, ?, ?, ?)
  `;

  let count = 0;
  for (const group of pgResults.groups) {
    // Use imported generateUuid
    const groupUuidStr = generateUuid(`group-${group.id}`);
    const groupUuid = types.Uuid.fromString(groupUuidStr); // Keep conversion for driver

    // Find users that belong to this group (simplified logic from original)
    // TODO: Improve user selection logic if needed - currently uses first 10 users
    const groupUsers = pgResults.users.slice(0, 10);
    if (groupUsers.length === 0) continue;

    // Generate messages for this group
    for (let i = 0; i < messagesPerGroup; i++) {
      const user = faker.helpers.arrayElement(groupUsers);
      // Use imported generateUuid
      const userUuidStr = generateUuid(`user-${user.id}`);
      const userUuid = types.Uuid.fromString(userUuidStr); // Keep conversion for driver

      const messageId = types.Uuid.random(); // Keep random for message ID
      const createdAt = faker.date.recent({ days: 60 });
      const content = faker.lorem.sentence(); // Shorter content

      const params = [groupUuid, createdAt, messageId, userUuid, content];

      await client.execute(query, params, { prepare: true });
      count++;
      if (count % 100 === 0) process.stdout.write("."); // Progress indicator
    }
  }
  console.log(` Done (${count} messages)!`);
}

async function seedUserNotifications(client, pgResults, notificationsPerUser) {
  if (notificationsPerUser <= 0) return;
  console.log(
    `\nSeeding user notifications (${notificationsPerUser} per user)...`,
  );

  const query = `
    INSERT INTO user_notifications (
      user_id, notification_time, notification_id, content, state, modified_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `;

  const states = ["UNSEEN", "SEEN", "CLICKED", "DELETED"];
  let count = 0;

  for (const user of pgResults.users) {
    // Use imported generateUuid
    const userUuidStr = generateUuid(`user-${user.id}`);
    const userUuid = types.Uuid.fromString(userUuidStr); // Keep conversion

    for (let i = 0; i < notificationsPerUser; i++) {
      const notificationId = types.Uuid.random();
      const notificationTime = faker.date.recent({ days: 30 });
      const content = `${faker.word.adjective()} ${faker.word.noun()}: ${faker.lorem.sentence()}`;
      const state = faker.helpers.arrayElement(states);
      const modificationDelay = faker.number.int({ min: 1, max: 1000000 });
      const modifiedAt = new Date(
        notificationTime.getTime() + modificationDelay,
      );

      const params = [
        userUuid,
        notificationTime,
        notificationId,
        content,
        state,
        modifiedAt,
      ];

      await client.execute(query, params, { prepare: true });
      count++;
      if (count % 100 === 0) process.stdout.write(".");
    }
  }
  console.log(` Done (${count} notifications)!`);
}

async function seedUserPurchases(client, pgResults, purchasesPerUser) {
  if (purchasesPerUser <= 0) return;
  console.log(`\nSeeding user purchases (${purchasesPerUser} per user)...`);

  const query = `
    INSERT INTO user_purchases (
      user_id, purchase_time, purchase_id, product_type, amount, currency
    ) VALUES (?, ?, ?, ?, ?, ?)
  `;

  const productTypes = [
    "premium_subscription",
    "coins_pack",
    "vip_access",
    "feature_unlock",
  ];
  const currencies = ["USD", "EUR", "GBP"];
  let count = 0;

  for (const user of pgResults.users) {
    // Use imported generateUuid
    const userUuidStr = generateUuid(`user-${user.id}`);
    const userUuid = types.Uuid.fromString(userUuidStr); // Keep conversion

    // Only 30% of users make purchases
    if (Math.random() > 0.3) continue;

    for (let i = 0; i < purchasesPerUser; i++) {
      const purchaseId = types.Uuid.random();
      const purchaseTime = faker.date.past({ years: 0.5 });
      const productType = faker.helpers.arrayElement(productTypes);
      const amount = parseFloat(
        faker.finance.amount({ min: 1, max: 50, dec: 2 }),
      );
      const currency = faker.helpers.arrayElement(currencies);

      const params = [
        userUuid,
        purchaseTime,
        purchaseId,
        productType,
        amount,
        currency,
      ];

      await client.execute(query, params, { prepare: true });
      count++;
      if (count % 100 === 0) process.stdout.write(".");
    }
  }
  console.log(` Done (${count} purchases)!`);
}

async function seedUserSessionEvents(client, pgResults, sessionsPerUser) {
  if (sessionsPerUser <= 0) return;
  console.log(`\nSeeding user session events (${sessionsPerUser} per user)...`);

  const query = `
    INSERT INTO user_session_events (
      user_id, event_time, session_id, event_type
    ) VALUES (?, ?, ?, ?)
  `;
  let count = 0;

  for (const user of pgResults.users) {
    // Use imported generateUuid
    const userUuidStr = generateUuid(`user-${user.id}`);
    const userUuid = types.Uuid.fromString(userUuidStr); // Keep conversion

    for (let i = 0; i < sessionsPerUser; i++) {
      const sessionId = types.Uuid.random();
      const loginTime = faker.date.recent({ days: 60 });

      await client.execute(query, [userUuid, loginTime, sessionId, "START"], {
        prepare: true,
      });
      count++;

      if (Math.random() < 0.8) {
        // 80% have logout
        const sessionDuration = faker.number.int({ min: 60000, max: 10800000 });
        const logoutTime = new Date(loginTime.getTime() + sessionDuration);

        await client.execute(query, [userUuid, logoutTime, sessionId, "END"], {
          prepare: true,
        });
        count++;
      }
      if (count % 100 === 0) process.stdout.write(".");
    }
  }
  console.log(` Done (${count} session events)!`);
}
