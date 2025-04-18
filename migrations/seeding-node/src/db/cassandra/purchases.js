import { faker } from "@faker-js/faker";
import { types } from "cassandra-driver";
import { generateUuid } from "../../utils/cryptoUtils.js";

export async function seedUserPurchases(client, pgResults, purchasesPerUser) {
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
    const userUuidStr = generateUuid(`user-${user.id}`);
    const userUuid = types.Uuid.fromString(userUuidStr);
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
