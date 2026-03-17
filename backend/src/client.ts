import { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import { cors } from "hono/cors";
import { requestLogger } from "@/middleware/logger";
import { createErrorHandler } from "@/response";
import clientErrors from "@/errors/client";
import { clientRoutes } from "@/routes/client";

const app = new OpenAPIHono();

app.use("*", requestLogger);
app.use("*", cors());
app.onError(createErrorHandler(clientErrors));

app.get("/health", (c) => c.json({ status: "ok" }));

app.route("/api", clientRoutes);

app.get(
  "/api/reference",
  Scalar({ url: "/api/doc", pageTitle: "客户端 API" }),
);

export default {
  port: Bun.env.CLIENT_PORT || 3000,
  fetch: app.fetch,
};

console.log(`🐾 PetID Link [client] running on port ${Bun.env.CLIENT_PORT || 3000}`);
