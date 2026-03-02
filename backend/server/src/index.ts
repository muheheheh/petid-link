import { OpenAPIHono } from "@hono/zod-openapi";
import { apiReference } from "@scalar/hono-api-reference";
import { cors } from "hono/cors";
import { requestLogger } from "@/middleware/logger";
import { errorHandler } from "@/response";
import { clientRoutes } from "@/routes/client";
import { adminRoutes } from "@/routes/admin";

const app = new OpenAPIHono();

// 全局中间件
app.use("*", requestLogger);
app.use("*", cors());

// 全局错误处理
app.onError(errorHandler);

// 健康检查
app.get("/health", (c) => c.json({ status: "ok" }));

// 路由挂载
app.route("/api", clientRoutes);
app.route("/api/admin", adminRoutes);

// Scalar API 文档（多文档切换）
app.get(
  "/api/reference",
  apiReference({
    sources: [
      { title: "客户端 API", url: "/api/doc" },
      { title: "管理端 API", url: "/api/admin/doc" },
    ],
    theme: "kepler",
  }),
);

export default {
  port: Bun.env.PORT || 3000,
  fetch: app.fetch,
};

console.log(`🐾 PetID Link server running on port ${Bun.env.PORT || 3000}`);
