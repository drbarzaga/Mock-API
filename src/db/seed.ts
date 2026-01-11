import "dotenv/config";

import db from "./index.js";
import { itemsTable, usersTable } from "./schema.js";
import { faker } from "@faker-js/faker";

const seed = async () => {
  console.log("🌱 Deleting existing users...");
  await db.delete(usersTable);
  console.log("🌱 Seeding database...");

  const numberOfUsers = faker.number.int({ min: 100, max: 1000 });

  const users = Array.from({ length: numberOfUsers }, () => ({
    name: faker.person.fullName(),
    email: faker.internet.email(),
  }));

  const numberOfItems = faker.number.int({ min: 100, max: 1000 });

  const items = Array.from({ length: numberOfItems }, () => ({
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
  }));

  const result = await db.insert(usersTable).values(users).returning();
  console.log(`✅ ${result.length} users seeded successfully`);

  const result2 = await db.insert(itemsTable).values(items).returning();
  console.log(`✅ ${result2.length} items seeded successfully`);

  console.log("✅ Database seeded successfully");
};

seed().catch((error) => {
  console.error("❌ Error seeding database", error);
  process.exit(1);
});
