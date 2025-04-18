import { faker } from "@faker-js/faker";
import { types } from "cassandra-driver";
import { generateUuid } from "../../utils/cryptoUtils.js";

export async function seedGroupMessages(client, pgResults, messagesPerGroup) {
  if (messagesPerGroup <= 0) return;
  console.log(`\nSeeding group messages (${messagesPerGroup} per group)...`);
  const query = `
    INSERT INTO group_messages (
      group_id, created_at, message_id, user_id, content
    ) VALUES (?, ?, ?, ?, ?)
  `;
  let count = 0;
  for (const group of pgResults.groups) {
    const groupUuidStr = generateUuid(`group-${group.id}`);
    const groupUuid = types.Uuid.fromString(groupUuidStr);
    const groupUsers = pgResults.users.slice(0, 10);
    if (groupUsers.length === 0) continue;
    for (let i = 0; i < messagesPerGroup; i++) {
      const user = faker.helpers.arrayElement(groupUsers);
      const userUuidStr = generateUuid(`user-${user.id}`);
      const userUuid = types.Uuid.fromString(userUuidStr);
      const messageId = types.Uuid.random();
      const createdAt = faker.date.recent({ days: 60 });
      const content = faker.lorem.sentence();
      const params = [groupUuid, createdAt, messageId, userUuid, content];
      await client.execute(query, params, { prepare: true });
      count++;
      if (count % 100 === 0) process.stdout.write(".");
    }
  }
  console.log(` Done (${count} messages)!`);
}
