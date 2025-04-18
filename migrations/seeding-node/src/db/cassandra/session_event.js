import { faker } from "@faker-js/faker";
import { types } from "cassandra-driver";
import { generateUuid } from "../../utils/cryptoUtils.js";

export async function seedUserSessionEvents(
  client,
  pgResults,
  sessionsPerUser,
) {
  if (sessionsPerUser <= 0) return;
  console.log(`\nSeeding user session events (${sessionsPerUser} per user)...`);
  const query = `
    INSERT INTO user_session_events (
      user_id, event_time, session_id, event_type
    ) VALUES (?, ?, ?, ?)
  `;
  let count = 0;
  for (const user of pgResults.users) {
    const userUuidStr = generateUuid(`user-${user.id}`);
    const userUuid = types.Uuid.fromString(userUuidStr);
    for (let i = 0; i < sessionsPerUser; i++) {
      const sessionId = types.Uuid.random();
      const loginTime = faker.date.recent({ days: 60 });
      await client.execute(query, [userUuid, loginTime, sessionId, "START"], {
        prepare: true,
      });
      count++;
      if (Math.random() < 0.8) {
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
