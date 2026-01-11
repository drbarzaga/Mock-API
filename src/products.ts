import { Hono } from "hono";
import db from "./db/index.js";
import { productsTable } from "./db/schema.js";
import { desc, eq, isNull, count } from "drizzle-orm";
import {
  isPositiveInteger,
  validateProductInput,
  parsePaginationParams,
  type PaginationResult,
} from "./lib/utils.js";

const productsApp = new Hono();

// GET /api/products - Get all products (excluding soft-deleted) with optional pagination
productsApp.get("/", async (c) => {
  try {
    const pageParam = c.req.query("page");
    const limitParam = c.req.query("limit");

    // If no pagination parameters are provided, return all products (original behavior)
    if (!pageParam && !limitParam) {
      const products = await db
        .select()
        .from(productsTable)
        .where(isNull(productsTable.deletedAt))
        .orderBy(desc(productsTable.createdAt));
      return c.json(products);
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
      .from(productsTable)
      .where(isNull(productsTable.deletedAt));

    // Get paginated products
    const products = await db
      .select()
      .from(productsTable)
      .where(isNull(productsTable.deletedAt))
      .orderBy(desc(productsTable.createdAt))
      .limit(limit)
      .offset(offset);

    const totalPages = Math.ceil(total / limit);

    const response: PaginationResult<(typeof products)[0]> = {
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };

    return c.json(response);
  } catch (error) {
    console.error("Error getting products:", error);
    return c.json({ error: "Failed to get products" }, 500);
  }
});

// GET /api/products/:id - Get a product by id
productsApp.get("/:id", async (c) => {
  try {
    const productId = Number.parseInt(c.req.param("id"), 10);

    if (!isPositiveInteger(productId)) {
      return c.json({ error: "Invalid product id" }, 400);
    }

    const [product] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .limit(1);

    if (!product) {
      return c.json({ error: "Product not found" }, 404);
    }

    if (product.deletedAt) {
      return c.json({ error: "Product not found" }, 404);
    }

    return c.json(product);
  } catch (error) {
    console.error("Error getting product:", error);
    return c.json({ error: "Failed to get product" }, 500);
  }
});

// POST /api/products - Create a new product
productsApp.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const { name, description } = body;

    // Input validation
    const validation = validateProductInput(name, description);
    if (!validation.valid) {
      return c.json({ error: validation.error }, 400);
    }

    try {
      const [product] = await db
        .insert(productsTable)
        .values({
          name: name.trim(),
          description: description.trim(),
        })
        .returning();

      if (!product) {
        return c.json({ error: "Failed to create product" }, 500);
      }
      return c.json(product, 201);
    } catch (error: any) {
      console.error("Error creating product:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error creating product:", error);
    return c.json({ error: "Failed to create product" }, 500);
  }
});

// PUT /api/products/:id - Update a product
productsApp.put("/:id", async (c) => {
  try {
    const productId = Number.parseInt(c.req.param("id"), 10);

    if (!isPositiveInteger(productId)) {
      return c.json({ error: "Invalid product id" }, 400);
    }

    // Check if product exists and is not deleted
    const [existingProduct] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .limit(1);

    if (!existingProduct || existingProduct.deletedAt) {
      return c.json({ error: "Product not found" }, 404);
    }

    const body = await c.req.json();
    const { name, description } = body;
    const updateData: Partial<typeof productsTable.$inferSelect> = {};

    // Type validation
    if (name !== undefined && typeof name !== "string") {
      return c.json({ error: "Name must be a string" }, 400);
    }
    if (description !== undefined && typeof description !== "string") {
      return c.json({ error: "Description must be a string" }, 400);
    }

    // Input validation
    if (name !== undefined || description !== undefined) {
      const validation = validateProductInput(name, description);
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
        .update(productsTable)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(productsTable.id, productId))
        .returning();

      if (!result || result.length === 0) {
        return c.json({ error: "Product not found" }, 404);
      }
      return c.json(result[0]);
    } catch (error: any) {
      console.error("Error updating product:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error updating product:", error);
    return c.json({ error: "Failed to update product" }, 500);
  }
});

// DELETE /api/products/:id - Soft delete a product
productsApp.delete("/:id", async (c) => {
  try {
    const productId = Number.parseInt(c.req.param("id"), 10);

    if (!isPositiveInteger(productId)) {
      return c.json({ error: "Invalid product id" }, 400);
    }

    // Check if product exists
    const [existingProduct] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .limit(1);

    if (!existingProduct) {
      return c.json({ error: "Product not found" }, 404);
    }

    if (existingProduct.deletedAt) {
      return c.json({ error: "Product already deleted" }, 410);
    }

    // Soft delete
    const result = await db
      .update(productsTable)
      .set({ deletedAt: new Date() })
      .where(eq(productsTable.id, productId))
      .returning();

    if (!result || result.length === 0) {
      return c.json({ error: "Product not found" }, 404);
    }

    return c.json({
      message: "Product deleted successfully",
      product: result[0],
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return c.json({ error: "Failed to delete product" }, 500);
  }
});

export default productsApp;
