import { faker } from "@faker-js/faker";

export async function seedGroups(sql, count) {
  if (count <= 0) return [];
  console.log(`\nSeeding ${count} groups...`);
  const groups = [];
  const batchSize = 50;

  for (let i = 0; i < count; i += batchSize) {
    const batchData = [];
    const limit = Math.min(i + batchSize, count);
    for (let j = i; j < limit; j++) {
      batchData.push({
        name: faker.company.name(),
        description: faker.lorem.paragraph(),
      });
    }
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

export async function seedGroupUsers(sql, users, groups) {
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
        groups_id: group.id,
        users_id: user.id,
      });
      assignmentCount++;
      if (batchData.length >= batchSize) {
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
    await sql`
      INSERT INTO groups_users_user ${sql(batchData)}
      ON CONFLICT DO NOTHING
    `;
    process.stdout.write(".");
  }
  console.log(` Done (${assignmentCount} assignments)!`);
}
