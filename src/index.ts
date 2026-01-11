import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import usersApp from "./users.js";
import itemsApp from "./items.js";

const app = new Hono();

app.get("/", (c) => c.redirect("/api"));

// Root route
app.get("/api", (c) =>
  c.json({
    message: "Dayan mock API",
    endpoints: {
      users: "/api/users",
      items: "/api/items",
    },
  })
);

app.route("/api/users", usersApp);
app.route("/api/items", itemsApp);

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
