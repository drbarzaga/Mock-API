# Mock API

Mock REST API built with **Hono**, **Drizzle ORM**, and **Neon PostgreSQL**, designed for frontend development, testing, and prototyping.

---

## 🚀 Tech Stack

- **Hono** – Lightweight and fast web framework
- **Drizzle ORM** – Type-safe SQL ORM
- **Neon** – Serverless PostgreSQL
- **TypeScript**

---

## 📦 Features

- Simple REST endpoints
- Mock data persisted in PostgreSQL
- Fully typed database schema
- Seed scripts for initial data
- Ready for frontend consumption

---

## ⚙️ Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

Create a `.env` file in the root of the project and add the following variables:

```env
DATABASE_URL=postgresql://username:password@host:port/database
```

### 3. Run the server

```bash
pnpm dev
```

### 4. Seed the database

```bash
pnpm seed
```
