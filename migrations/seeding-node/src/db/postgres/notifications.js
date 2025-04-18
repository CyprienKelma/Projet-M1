import { faker } from "@faker-js/faker";

export async function seedNotificationStates(sql, users, notificationsPerUser) {
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
        user_id: user.id,
        notification_id: notificationId,
        status: faker.helpers.arrayElement(statusOptions),
        updated_at: faker.date.recent({ days: 30 }),
      });
      totalStates++;
      if (batchData.length >= batchSize) {
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
