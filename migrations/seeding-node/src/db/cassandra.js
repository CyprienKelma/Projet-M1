import { Client, types } from "cassandra-driver";
import { faker } from "@faker-js/faker";
import { generateUuid } from "../utils/cryptoUtils.js";
import { getDataCounts } from "../utils/dataVolume.js";
import { cassandraConfig, isDryRun, dataVolume } from "../config.js";
import {
  seedGroupMessages,
  seedUserNotifications,
  seedUserPurchases,
  seedUserSessionEvents,
} from "./cassandra/index.js";

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

export async function seedCassandra(pgResults) {
  let client;
  if (isDryRun) {
    client = new MockCassandraClient();
    console.log(
      `🧪 DRY RUN: Simulating Cassandra connection to ${cassandraConfig.hosts.join(",")}:${cassandraConfig.port}/${cassandraConfig.keyspace}`,
    );
  } else {
    console.log(
      `🔌 Connecting to Cassandra at ${cassandraConfig.hosts.join(",")}:${cassandraConfig.port}/${cassandraConfig.keyspace}...`,
    );
    client = new Client({
      contactPoints: cassandraConfig.hosts,
      localDataCenter: cassandraConfig.localDataCenter,
      credentials: {
        username: cassandraConfig.username,
        password: cassandraConfig.password,
      },
      keyspace: cassandraConfig.keyspace,
      protocolOptions: {
        port: cassandraConfig.port,
      },
    });
    await client.connect();
    console.log("✅ Cassandra connection established.");
  }

  try {
    const counts = getDataCounts(dataVolume);
    console.log(
      `📊 Cassandra Data volume: ${Object.entries(counts)
        .filter(
          ([k]) =>
            k.startsWith("cs") ||
            ["messages", "purchases", "sessions"].some((p) => k.startsWith(p)),
        )
        .map(([k, v]) => `${k}=${v}`)
        .join(", ")}`,
    );
    const messageCount = isDryRun
      ? Math.min(counts.messagesPerGroup, 3)
      : counts.messagesPerGroup;
    const notificationCount = isDryRun
      ? Math.min(counts.csNotificationsPerUser, 2)
      : counts.csNotificationsPerUser;
    const purchaseCount = isDryRun
      ? Math.min(counts.purchasesPerUser, 2)
      : counts.purchasesPerUser;
    const sessionCount = isDryRun
      ? Math.min(counts.sessionsPerUser, 2)
      : counts.sessionsPerUser;

    await seedGroupMessages(client, pgResults, messageCount);
    await seedUserNotifications(client, pgResults, notificationCount);
    await seedUserPurchases(client, pgResults, purchaseCount);
    await seedUserSessionEvents(client, pgResults, sessionCount);
  } catch (error) {
    console.error("❌ Error during Cassandra seeding:", error);
    throw error;
  } finally {
    if (client) {
      await client.shutdown();
      console.log("🔌 Cassandra connection closed.");
    }
  }
}
