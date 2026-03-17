import { createOpenAPI } from "@/openapi";
import adminErrors from "@/errors/admin";
import { config } from "@/config";
import adminAuth from "@/routes/admin/auth";
import manager from "@/routes/admin/manager";
import user from "@/routes/admin/user";
import device from "@/routes/admin/device";
import pet from "@/routes/admin/pet";
import scanLog from "@/routes/admin/scan-log";
import stats from "@/routes/admin/stats";

export const adminRoutes = createOpenAPI(adminErrors);

// Bearer 认证方案
adminRoutes.openAPIRegistry.registerComponent("securitySchemes", "Bearer", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});

adminRoutes.route("/auth", adminAuth);
adminRoutes.route("/manager", manager);
adminRoutes.route("/user", user);
adminRoutes.route("/device", device);
adminRoutes.route("/pet", pet);
adminRoutes.route("/scan-log", scanLog);
adminRoutes.route("/stats", stats);

// 管理端 OpenAPI 文档
adminRoutes.doc("/doc", {
  openapi: "3.0.0",
  info: {
    title: "PetID Link 管理端 API",
    version: "1.0.0",
    description: "管理后台接口",
  },
  servers: [{ url: `${config.server.baseUrl}/api/admin` }],
});
