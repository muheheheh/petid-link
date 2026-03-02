import { createOpenAPI } from "@/openapi";
import type { AppEnv } from "@/types";
import auth from "./auth";
import pet from "./pet";
import device from "./device";
import user from "./user";

import { config } from "@/config";

export const clientRoutes = createOpenAPI<AppEnv>();

// Bearer 认证方案
clientRoutes.openAPIRegistry.registerComponent("securitySchemes", "Bearer", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});

clientRoutes.route("/auth", auth);
clientRoutes.route("/pet", pet);
clientRoutes.route("/device", device);
clientRoutes.route("/user", user);

// 客户端 OpenAPI 文档
clientRoutes.doc("/doc", {
  openapi: "3.0.0",
  info: {
    title: "PetID Link 客户端 API",
    version: "1.0.0",
    description: "客户端接口",
  },
  servers: [{ url: `${config.server.baseUrl}/api` }],
});
