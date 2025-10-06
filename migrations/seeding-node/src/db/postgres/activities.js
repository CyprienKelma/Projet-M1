import { faker } from "@faker-js/faker";

export async function seedActivities(sql, users, groups, activitiesPerGroup) {
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
  const defectiveStatuses = ["PENDING", "ARCHIVED", null];
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
        group_id: group.id,
        user_id: faker.helpers.arrayElement(groupUserIds),
        activity_type: faker.helpers.arrayElement(activityTypes),
        title: `${faker.word.adjective()} ${faker.helpers.arrayElement(activityTypes)} event`,
        description: faker.lorem.sentence(),
        location:
          faker.location.city() + ", " + faker.location.streetAddress(false),
        scheduled_at: faker.date.between({
          from: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          to: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        }),
        status:
          faker.helpers.maybe(() => faker.helpers.arrayElement(statuses), {
            probability: 0.92,
          }) ?? faker.helpers.arrayElement(defectiveStatuses),
      });

      totalActivities++;
      if (batchData.length >= batchSize) {
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
