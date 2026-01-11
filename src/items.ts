import { Hono } from "hono";
import db from "./db/index.js";
import { itemsTable } from "./db/schema.js";
import { desc, eq, isNull } from "drizzle-orm";
import { isPositiveInteger, validateItemInput } from "./lib/utils.js";

const itemsApp = new Hono();

// GET /api/items - Get all items (excluding soft-deleted)
itemsApp.get("/", async (c) => {
  try {
    const items = await db
      .select()
      .from(itemsTable)
      .where(isNull(itemsTable.deletedAt))
      .orderBy(desc(itemsTable.createdAt));
    return c.json(items);
  } catch (error) {
    console.error("Error getting items:", error);
    return c.json({ error: "Failed to get items" }, 500);
  }
});

// GET /api/items/:id - Get an item by id
itemsApp.get("/:id", async (c) => {
  try {
    const itemId = Number.parseInt(c.req.param("id"), 10);

    if (!isPositiveInteger(itemId)) {
      return c.json({ error: "Invalid item id" }, 400);
    }

    const [item] = await db
      .select()
      .from(itemsTable)
      .where(eq(itemsTable.id, itemId))
      .limit(1);

    if (!item) {
      return c.json({ error: "Item not found" }, 404);
    }

    if (item.deletedAt) {
      return c.json({ error: "Item not found" }, 404);
    }

    return c.json(item);
  } catch (error) {
    console.error("Error getting item:", error);
    return c.json({ error: "Failed to get item" }, 500);
  }
});

// POST /api/items - Create a new item
itemsApp.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const { name, description } = body;

    // Input validation
    const validation = validateItemInput(name, description);
    if (!validation.valid) {
      return c.json({ error: validation.error }, 400);
    }

    try {
      const [item] = await db
        .insert(itemsTable)
        .values({
          name: name.trim(),
          description: description.trim(),
        })
        .returning();

      if (!item) {
        return c.json({ error: "Failed to create item" }, 500);
      }
      return c.json(item, 201);
    } catch (error: any) {
      console.error("Error creating item:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error creating item:", error);
    return c.json({ error: "Failed to create item" }, 500);
  }
});

// PUT /api/items/:id - Update an item
itemsApp.put("/:id", async (c) => {
  try {
    const itemId = Number.parseInt(c.req.param("id"), 10);

    if (!isPositiveInteger(itemId)) {
      return c.json({ error: "Invalid item id" }, 400);
    }

    // Check if item exists and is not deleted
    const [existingItem] = await db
      .select()
      .from(itemsTable)
      .where(eq(itemsTable.id, itemId))
      .limit(1);

    if (!existingItem || existingItem.deletedAt) {
      return c.json({ error: "Item not found" }, 404);
    }

    const body = await c.req.json();
    const { name, description } = body;
    const updateData: Partial<typeof itemsTable.$inferSelect> = {};

    // Type validation
    if (name !== undefined && typeof name !== "string") {
      return c.json({ error: "Name must be a string" }, 400);
    }
    if (description !== undefined && typeof description !== "string") {
      return c.json({ error: "Description must be a string" }, 400);
    }

    // Input validation
    if (name !== undefined || description !== undefined) {
      const validation = validateItemInput(name, description);
      if (!validation.valid) {
        return c.json({ error: validation.error }, 400);
      }
    }

    if (name) {
      updateData.name = name.trim();
    }
    if (description) {
      updateData.description = description.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return c.json({ error: "No fields to update" }, 400);
    }

    try {
      const result = await db
        .update(itemsTable)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(itemsTable.id, itemId))
        .returning();

      if (!result || result.length === 0) {
        return c.json({ error: "Item not found" }, 404);
      }
      return c.json(result[0]);
    } catch (error: any) {
      console.error("Error updating item:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error updating item:", error);
    return c.json({ error: "Failed to update item" }, 500);
  }
});

// DELETE /api/items/:id - Soft delete an item
itemsApp.delete("/:id", async (c) => {
  try {
    const itemId = Number.parseInt(c.req.param("id"), 10);

    if (!isPositiveInteger(itemId)) {
      return c.json({ error: "Invalid item id" }, 400);
    }

    // Check if item exists
    const [existingItem] = await db
      .select()
      .from(itemsTable)
      .where(eq(itemsTable.id, itemId))
      .limit(1);

    if (!existingItem) {
      return c.json({ error: "Item not found" }, 404);
    }

    if (existingItem.deletedAt) {
      return c.json({ error: "Item already deleted" }, 410);
    }

    // Soft delete
    const result = await db
      .update(itemsTable)
      .set({ deletedAt: new Date() })
      .where(eq(itemsTable.id, itemId))
      .returning();

    if (!result || result.length === 0) {
      return c.json({ error: "Item not found" }, 404);
    }

    return c.json({
      message: "Item deleted successfully",
      item: result[0],
    });
  } catch (error) {
    console.error("Error deleting item:", error);
    return c.json({ error: "Failed to delete item" }, 500);
  }
});

export default itemsApp;
