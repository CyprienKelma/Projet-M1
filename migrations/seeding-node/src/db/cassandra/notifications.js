import { faker } from "@faker-js/faker";
import { types } from "cassandra-driver";
import { generateUuid } from "../../utils/cryptoUtils.js";

export async function seedUserNotifications(
  client,
  pgResults,
  notificationsPerUser,
) {
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
    const userUuidStr = generateUuid(`user-${user.id}`);
    const userUuid = types.Uuid.fromString(userUuidStr);
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
