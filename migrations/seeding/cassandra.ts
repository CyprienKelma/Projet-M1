import { Client, types } from "cassandra-driver";
import { faker } from "@faker-js/faker";
import { CassandraConfig, DataVolume, SeedResults } from "./types.ts";
import { crypto, DigestAlgorithm } from "@std/crypto";

// Mock client for dry runs
class MockCassandraClient {
  async connect() {
    console.log("🔌 Would connect to Cassandra");
  }

  async execute(query: string, params: any[], options?: any) {
    const paramStr = params
      .map((p) =>
        p instanceof Date
          ? p.toISOString()
          : p?.toString
            ? p.toString()
            : JSON.stringify(p),
      )
      .join(", ");
    console.log(`🔍 Would execute: ${query} with params [${paramStr}]`);
    return { rows: [] };
  }

  async shutdown() {
    console.log("🔌 Would disconnect from Cassandra");
  }
}

export async function seedCassandra(
  config: CassandraConfig,
  pgResults: SeedResults,
  volume: DataVolume,
  dryRun = false,
): Promise<void> {
  let client;

  if (dryRun) {
    client = new MockCassandraClient();
    console.log(
      `🧪 DRY RUN: Would connect to Cassandra at ${config.hosts[0]}:${config.port}/${config.keyspace}`,
    );
    await client.connect();
  } else {
    client = new Client({
      contactPoints: config.hosts,
      localDataCenter: "dc1",
      credentials: {
        username: config.username,
        password: config.password,
      },
      keyspace: config.keyspace,
    });
    await client.connect();
  }

  try {
    // Determine scale based on volume
    const counts = getDataCounts(volume);
    console.log(
      `📊 Data volume: ${Object.entries(counts)
        .map(([k, v]) => `${k}=${v}`)
        .join(", ")}`,
    );

    // If dry run, use smaller sample sizes
    const messageCount = dryRun
      ? Math.min(counts.messagesPerGroup, 3)
      : counts.messagesPerGroup;
    const notificationCount = dryRun
      ? Math.min(counts.notificationsPerUser, 2)
      : counts.notificationsPerUser;
    const purchaseCount = dryRun
      ? Math.min(counts.purchasesPerUser, 2)
      : counts.purchasesPerUser;
    const sessionCount = dryRun
      ? Math.min(counts.sessionsPerUser, 2)
      : counts.sessionsPerUser;

    // Seed different tables
    await seedGroupMessages(client, pgResults, messageCount);
    await seedUserNotifications(client, pgResults, notificationCount);
    await seedUserPurchases(client, pgResults, purchaseCount);
    await seedUserSessionEvents(client, pgResults, sessionCount);
  } finally {
    await client.shutdown();
  }
}

function getDataCounts(volume: DataVolume) {
  switch (volume) {
    case "small":
      return {
        messagesPerGroup: 20,
        notificationsPerUser: 5,
        purchasesPerUser: 3,
        sessionsPerUser: 5,
      };
    case "medium":
      return {
        messagesPerGroup: 50,
        notificationsPerUser: 20,
        purchasesPerUser: 10,
        sessionsPerUser: 15,
      };
    case "large":
      return {
        messagesPerGroup: 200,
        notificationsPerUser: 50,
        purchasesPerUser: 30,
        sessionsPerUser: 50,
      };
    default:
      return {
        messagesPerGroup: 50,
        notificationsPerUser: 20,
        purchasesPerUser: 10,
        sessionsPerUser: 15,
      };
  }
}

async function digest(message: string, algo: DigestAlgorithm = "MD5") {
  return Array.from(
    new Uint8Array(
      await crypto.subtle.digest(algo, new TextEncoder().encode(message)),
    ),
    (byte) => byte.toString(16).padStart(2, "0"),
  ).join("");
}

// Generate deterministic UUID from string
async function generateUuid(input: string): Promise<string> {
  const hash = await digest(input, "MD5");

  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    "4" + hash.substring(13, 16),
    ((parseInt(hash.charAt(16), 16) & 0x3) | 0x8).toString(16) +
      hash.substring(17, 20),
    hash.substring(20, 32),
  ].join("-");
}

async function seedGroupMessages(
  client: Client,
  pgResults: SeedResults,
  messagesPerGroup: number,
) {
  console.log(`Seeding group messages (${messagesPerGroup} per group)...`);

  const query = `
    INSERT INTO group_messages (
      group_id, created_at, message_id, user_id, content
    ) VALUES (?, ?, ?, ?, ?)
  `;

  for (const group of pgResults.groups) {
    // Convert numeric ID to UUID for Cassandra
    const groupUuid = await generateUuid(`group-${group.id}`);

    // Find users that belong to this group
    const groupUsers = pgResults.users.slice(0, 10); // Simplified
    if (groupUsers.length === 0) continue;

    // Generate messages for this group
    for (let i = 0; i < messagesPerGroup; i++) {
      const user = faker.helpers.arrayElement(groupUsers);
      const userUuid = await generateUuid(`user-${user.id}`);
      const messageId = types.Uuid.random();
      const createdAt = faker.date.recent({ days: 60 });
      const content = faker.lorem.paragraph();

      const params = [
        types.Uuid.fromString(groupUuid),
        createdAt,
        messageId,
        types.Uuid.fromString(userUuid),
        content,
      ];

      await client.execute(query, params, { prepare: true });
    }
    Deno.stdout.writeSync(new TextEncoder().encode("."));
  }
  console.log(" Done!");
}

async function seedUserNotifications(
  client: Client,
  pgResults: SeedResults,
  notificationsPerUser: number,
) {
  console.log(
    `Seeding user notifications (${notificationsPerUser} per user)...`,
  );

  const query = `
    INSERT INTO user_notifications (
      user_id, notification_time, notification_id, content, state, modified_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `;

  const states = ["UNSEEN", "SEEN", "CLICKED", "DELETED"];

  for (const user of pgResults.users) {
    const userUuid = await generateUuid(`user-${user.id}`);

    for (let i = 0; i < notificationsPerUser; i++) {
      const notificationId = types.Uuid.random();
      const notificationTime = faker.date.recent({ days: 30 });
      const content = `${faker.word.adjective()} ${faker.word.noun()}: ${faker.lorem.sentence()}`;
      const state = faker.helpers.arrayElement(states);

      // Modified time is always after notification time
      const modificationDelay = faker.number.int({ min: 1, max: 1000000 }); // milliseconds
      const modifiedAt = new Date(
        notificationTime.getTime() + modificationDelay,
      );

      const params = [
        types.Uuid.fromString(userUuid),
        notificationTime,
        notificationId,
        content,
        state,
        modifiedAt,
      ];

      await client.execute(query, params, { prepare: true });
    }
    Deno.stdout.writeSync(new TextEncoder().encode("."));
  }
  console.log(" Done!");
}

async function seedUserPurchases(
  client: Client,
  pgResults: SeedResults,
  purchasesPerUser: number,
) {
  console.log(`Seeding user purchases (${purchasesPerUser} per user)...`);

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

  for (const user of pgResults.users) {
    const userUuid = await generateUuid(`user-${user.id}`);

    // Only 30% of users make purchases
    if (Math.random() > 0.3) continue;

    for (let i = 0; i < purchasesPerUser; i++) {
      const purchaseId = types.Uuid.random();
      const purchaseTime = faker.date.past({ years: 0.5 }); // Last 6 months
      const productType = faker.helpers.arrayElement(productTypes);
      const amount = parseFloat(
        faker.finance.amount({ min: 1, max: 50, dec: 2 }),
      );
      const currency = faker.helpers.arrayElement(currencies);

      const params = [
        types.Uuid.fromString(userUuid),
        purchaseTime,
        purchaseId,
        productType,
        amount,
        currency,
      ];

      await client.execute(query, params, { prepare: true });
    }
    Deno.stdout.writeSync(new TextEncoder().encode("."));
  }
  console.log(" Done!");
}

async function seedUserSessionEvents(
  client: Client,
  pgResults: SeedResults,
  sessionsPerUser: number,
) {
  console.log(`Seeding user session events (${sessionsPerUser} per user)...`);

  const query = `
    INSERT INTO user_session_events (
      user_id, event_time, session_id, event_type
    ) VALUES (?, ?, ?, ?)
  `;

  for (const user of pgResults.users) {
    const userUuid = await generateUuid(`user-${user.id}`);

    for (let i = 0; i < sessionsPerUser; i++) {
      const sessionId = types.Uuid.random();

      // Create LOGIN event
      const loginTime = faker.date.recent({ days: 60 });

      await client.execute(
        query,
        [types.Uuid.fromString(userUuid), loginTime, sessionId, "START"],
        { prepare: true },
      );

      // Create LOGOUT event (80% of sessions have logout events)
      if (Math.random() < 0.8) {
        // Session duration between 1 minute and 3 hours
        const sessionDuration = faker.number.int({ min: 60000, max: 10800000 }); // 1 min to 3 hrs
        const logoutTime = new Date(loginTime.getTime() + sessionDuration);

        await client.execute(
          query,
          [types.Uuid.fromString(userUuid), logoutTime, sessionId, "END"],
          { prepare: true },
        );
      }
    }
    Deno.stdout.writeSync(new TextEncoder().encode("."));
  }
  console.log(" Done!");
}
