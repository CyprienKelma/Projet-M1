import { faker } from "@faker-js/faker";

export async function seedUsers(sql, count) {
  if (count <= 0) return [];
  console.log(`\nSeeding ${count} users...`);
  const users = [];
  const batchSize = 100;

  for (let i = 0; i < count; i += batchSize) {
    const batchData = [];
    const limit = Math.min(i + batchSize, count);
    for (let j = i; j < limit; j++) {
      batchData.push({
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        email: faker.internet.email(),
        password: faker.internet.password(),
      });
    }
    const result = await sql`
      INSERT INTO users ${sql(batchData)}
      RETURNING id, first_name, last_name, email
    `;
    users.push(...result);
    process.stdout.write(".");
  }
  console.log(` Done (${users.length} users)!`);
  return users;
}
