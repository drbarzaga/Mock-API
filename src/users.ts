import { Hono } from "hono";
import db from "./db/index.js";
import { usersTable } from "./db/schema.js";
import { desc, eq, isNull, count } from "drizzle-orm";
import {
  isPositiveInteger,
  validateUserInput,
  parsePaginationParams,
  type PaginationResult,
} from "./lib/utils.js";

const usersApp = new Hono();

// GET /api/users - Get all users (excluding soft-deleted) with optional pagination
usersApp.get("/", async (c) => {
  try {
    const pageParam = c.req.query("page");
    const limitParam = c.req.query("limit");

    // If no pagination parameters are provided, return all users (original behavior)
    if (!pageParam && !limitParam) {
      const users = await db
        .select()
        .from(usersTable)
        .where(isNull(usersTable.deletedAt))
        .orderBy(desc(usersTable.createdAt));
      return c.json(users);
    }

    // Parse and validate pagination parameters
    const paginationValidation = parsePaginationParams(pageParam, limitParam);
    if (!paginationValidation.valid) {
      return c.json({ error: paginationValidation.error }, 400);
    }

    const { page, limit, offset } = paginationValidation.params!;

    // Get total count
    const [{ total }] = await db
      .select({ total: count() })
      .from(usersTable)
      .where(isNull(usersTable.deletedAt));

    // Get paginated users
    const users = await db
      .select()
      .from(usersTable)
      .where(isNull(usersTable.deletedAt))
      .orderBy(desc(usersTable.createdAt))
      .limit(limit)
      .offset(offset);

    const totalPages = Math.ceil(total / limit);

    const response: PaginationResult<(typeof users)[0]> = {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };

    return c.json(response);
  } catch (error) {
    console.error("Error getting users:", error);
    return c.json({ error: "Failed to get users" }, 500);
  }
});

// GET /api/users/:id - Get a user by id
usersApp.get("/:id", async (c) => {
  try {
    const userId = Number.parseInt(c.req.param("id"), 10);

    if (!isPositiveInteger(userId)) {
      return c.json({ error: "Invalid user id" }, 400);
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    if (user.deletedAt) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json(user);
  } catch (error) {
    console.error("Error getting user:", error);
    return c.json({ error: "Failed to get user" }, 500);
  }
});

// POST /api/users - Create a new user
usersApp.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const { name, email } = body;

    // Input validation
    const validation = validateUserInput(name, email);
    if (!validation.valid) {
      return c.json({ error: validation.error }, 400);
    }

    try {
      const [user] = await db
        .insert(usersTable)
        .values({
          name: name.trim(),
          email: email.trim().toLowerCase(),
        })
        .returning();

      if (!user) {
        return c.json({ error: "Failed to create user" }, 500);
      }
      return c.json(user, 201);
    } catch (error: any) {
      // Handle unique constraint violation
      if (error?.code === "23505" || error?.message?.includes("unique")) {
        return c.json({ error: "Email already exists" }, 409);
      }
      throw error;
    }
  } catch (error) {
    console.error("Error creating user:", error);
    return c.json({ error: "Failed to create user" }, 500);
  }
});

// PUT /api/users/:id - Update a user
usersApp.put("/:id", async (c) => {
  try {
    const userId = Number.parseInt(c.req.param("id"), 10);

    if (!isPositiveInteger(userId)) {
      return c.json({ error: "Invalid user id" }, 400);
    }

    // Check if user exists and is not deleted
    const [existingUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!existingUser || existingUser.deletedAt) {
      return c.json({ error: "User not found" }, 404);
    }

    const body = await c.req.json();
    const { name, email } = body;
    const updateData: Partial<typeof usersTable.$inferSelect> = {};

    // Type validation
    if (name !== undefined && typeof name !== "string") {
      return c.json({ error: "Name must be a string" }, 400);
    }
    if (email !== undefined && typeof email !== "string") {
      return c.json({ error: "Email must be a string" }, 400);
    }

    // Input validation
    if (name !== undefined || email !== undefined) {
      const validation = validateUserInput(name, email);
      if (!validation.valid) {
        return c.json({ error: validation.error }, 400);
      }
    }

    if (name) {
      updateData.name = name.trim();
    }
    if (email) {
      updateData.email = email.trim().toLowerCase();
    }

    if (Object.keys(updateData).length === 0) {
      return c.json({ error: "No fields to update" }, 400);
    }

    try {
      const result = await db
        .update(usersTable)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(usersTable.id, userId))
        .returning();

      if (!result || result.length === 0) {
        return c.json({ error: "User not found" }, 404);
      }
      return c.json(result[0]);
    } catch (error: any) {
      // Handle unique constraint violation
      if (error?.code === "23505" || error?.message?.includes("unique")) {
        return c.json({ error: "Email already exists" }, 409);
      }
      throw error;
    }
  } catch (error) {
    console.error("Error updating user:", error);
    return c.json({ error: "Failed to update user" }, 500);
  }
});

// DELETE /api/users/:id - Soft delete a user
usersApp.delete("/:id", async (c) => {
  try {
    const userId = Number.parseInt(c.req.param("id"), 10);

    if (!isPositiveInteger(userId)) {
      return c.json({ error: "Invalid user id" }, 400);
    }

    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!existingUser) {
      return c.json({ error: "User not found" }, 404);
    }

    if (existingUser.deletedAt) {
      return c.json({ error: "User already deleted" }, 410);
    }

    // Soft delete
    const result = await db
      .update(usersTable)
      .set({ deletedAt: new Date() })
      .where(eq(usersTable.id, userId))
      .returning();

    if (!result || result.length === 0) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({
      message: "User deleted successfully",
      user: result[0],
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return c.json({ error: "Failed to delete user" }, 500);
  }
});

export default usersApp;
