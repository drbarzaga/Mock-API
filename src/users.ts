import { Hono } from "hono";
import db from "./db/index.js";
import { usersTable } from "./db/schema.js";
import { eq } from "drizzle-orm";

const usersApp = new Hono();

// GET /api/users - Get all users
usersApp.get("/", async (c) => {
  try {
    const users = await db.select().from(usersTable);
    return c.json(users);
  } catch (error) {
    return c.json({ error: "Failed to get users" }, 500);
  }
});

// GET /api/users/:id - Get a user by id
usersApp.get("/:id", async (c) => {
  try {
    const userId = Number.parseInt(c.req.param("id"), 10);
    if (isNaN(userId)) {
      return c.json({ error: "Invalid user id" }, 400);
    }
    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId));
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }
    return c.json(user);
  } catch (error) {
    return c.json({ error: "Failed to get user" }, 500);
  }
});

// POST /api/users - Create a new user
usersApp.post("/", async (c) => {
  try {
    const { name, email } = await c.req.json();
    const [user] = await db
      .insert(usersTable)
      .values({ name, email })
      .returning();
    if (!user) {
      return c.json({ error: "Failed to create user" }, 500);
    }
    return c.json(user, 201);
  } catch (error) {
    return c.json({ error: "Failed to create user" }, 500);
  }
});

// PUT /api/users/:id - Update a user
usersApp.put("/:id", async (c) => {
  try {
    const userId = Number.parseInt(c.req.param("id"), 10);
    if (isNaN(userId)) {
      return c.json({ error: "Invalid user id" }, 400);
    }
    const { name, email } = await c.req.json();
    const updateData: Partial<typeof usersTable.$inferSelect> = {};

    if (name) {
      updateData.name = name;
    }
    if (email) {
      updateData.email = email;
    }

    if (Object.keys(updateData).length === 0) {
      return c.json({ error: "No fields to update" }, 400);
    }

    const result = await db
      .update(usersTable)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(usersTable.id, userId))
      .returning();

    if (!result) {
      return c.json({ error: "User not found" }, 404);
    }
    return c.json(result[0]);
  } catch (error) {
    return c.json({ error: "Failed to update user" }, 500);
  }
});

// DELETE /api/users/:id - Delete a user
usersApp.delete("/:id", async (c) => {
  try {
    const userId = Number.parseInt(c.req.param("id"), 10);
    if (isNaN(userId)) {
      return c.json({ error: "Invalid user id" }, 400);
    }

    const result = await db
      .delete(usersTable)
      .where(eq(usersTable.id, userId))
      .returning();

    if (!result) {
      return c.json({ error: "User not found" }, 404);
    }
    return c.json({
      message: "User deleted successfully",
      user: result[0],
    });
  } catch (error) {
    return c.json({ error: "Failed to delete user" }, 500);
  }
});

export default usersApp;
