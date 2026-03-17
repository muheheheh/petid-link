import { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import { cors } from "hono/cors";
import { requestLogger } from "@/middleware/logger";
import { createErrorHandler } from "@/response";
import adminErrors from "@/errors/admin";
import { adminRoutes } from "@/routes/admin";

const app = new OpenAPIHono();

app.use("*", requestLogger);
app.use("*", cors());
app.onError(createErrorHandler(adminErrors));

app.get("/health", (c) => c.json({ status: "ok" }));

app.route("/api/admin", adminRoutes);

app.get(
  "/api/reference",
  Scalar({ url: "/api/admin/doc", pageTitle: "管理端 API" }),
);

export default {
  port: Bun.env.ADMIN_PORT || 3001,
  fetch: app.fetch,
};

console.log(`🐾 PetID Link [admin] running on port ${Bun.env.ADMIN_PORT || 3001}`);
