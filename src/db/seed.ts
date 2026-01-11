import "dotenv/config";

import db from "./index.js";
import { productsTable, usersTable } from "./schema.js";
import { faker } from "@faker-js/faker";

const seed = async () => {
  console.log("🌱 Deleting existing users...");
  await db.delete(usersTable);
  console.log("🌱 Seeding database...");

  const numberOfRowsToSeed = faker.number.int({ min: 100, max: 1000 });

  const users = Array.from({ length: numberOfRowsToSeed }, () => ({
    name: faker.person.fullName(),
    email: faker.internet.email(),
  }));

  const result = await db.insert(usersTable).values(users).returning();
  console.log(`✅ ${result.length} rows seeded successfully`);

  const products = Array.from({ length: numberOfRowsToSeed }, () => ({
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
  }));

  const result2 = await db.insert(productsTable).values(products).returning();
  console.log(`✅ ${result2.length} products seeded successfully`);

  console.log("✅ Database seeded successfully");
};

seed().catch((error) => {
  console.error("❌ Error seeding database", error);
  process.exit(1);
});
