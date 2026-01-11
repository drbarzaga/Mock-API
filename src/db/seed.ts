import "dotenv/config";

import db from "./index.js";
import { usersTable } from "./schema.js";
import { faker } from "@faker-js/faker";

const seed = async () => {
  console.log("🌱 Seeding database...");

  const users = Array.from({ length: 100 }, () => ({
    name: faker.person.fullName(),
    email: faker.internet.email(),
  }));

  const result = await db.insert(usersTable).values(users).returning();
  console.log(`✅ ${result.length} users seeded successfully`);
  console.log("✅ Database seeded successfully");
};

seed().catch((error) => {
  console.error("❌ Error seeding database", error);
  process.exit(1);
});
