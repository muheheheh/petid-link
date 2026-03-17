import { createRoute } from "@hono/zod-openapi";
import { createOpenAPI } from "@/openapi";
import adminErrors from "@/errors/admin";
import type { AppEnv } from "@/types";
import { ok } from "@/response";
import { createAdminSession, logoutAdminSession, touchAdminSession } from "@/services/session";
import { verifyAdminCredentials, changeAdminPassword } from "@/services/admin";
import { getAdminInfo } from "@/services/admin";
import { extractDeviceInfo } from "@/services/client";
import { adminAuth } from "@/middleware/auth";
import { adminLoginSchema, logoutSchema, adminMeSchema, heartbeatSchema, changePasswordSchema } from "@/schemas/auth";

const auth = createOpenAPI<AppEnv>(adminErrors);

auth.openapi(
  createRoute({
    method: "post",
    path: "/login",
    tags: ["认证"],
    summary: "账号登录",
    request: {
      body: { content: { "application/json": { schema: adminLoginSchema.body } } },
    },
    responses: {
      200: {
        content: { "application/json": { schema: adminLoginSchema.response } },
        description: "登录成功",
      },
    },
  }),
  async (c) => {
    const { username, password } = c.req.valid("json");
    const admin = await verifyAdminCredentials(username, password);
    const deviceInfo = extractDeviceInfo(c);
    deviceInfo.app = "admin";
    const { token, sessionId } = await createAdminSession({ accountId: admin.id, deviceInfo });
    return ok(c, { token, session_id: sessionId, account: { id: admin.id, username: admin.username, nickname: admin.nickname, role: admin.role } });
  },
);

auth.openapi(
  createRoute({
    method: "post",
    path: "/logout",
    tags: ["认证"],
    summary: "退出登录",
    middleware: [adminAuth],
    security: [{ Bearer: [] }],
    responses: {
      200: {
        content: { "application/json": { schema: logoutSchema.response } },
        description: "退出成功",
      },
    },
  }),
  async (c) => {
    const sessionId = c.get("sessionId");
    logoutAdminSession(sessionId);
    return ok(c, null);
  },
);

auth.openapi(
  createRoute({
    method: "post",
    path: "/me",
    tags: ["认证"],
    summary: "获取当前账号信息",
    middleware: [adminAuth],
    security: [{ Bearer: [] }],
    responses: {
      200: {
        content: { "application/json": { schema: adminMeSchema.response } },
        description: "查询成功",
      },
    },
  }),
  async (c) => {
    const adminId = c.get("adminId");
    const admin = getAdminInfo(adminId);
    return ok(c, admin);
  },
);

auth.openapi(
  createRoute({
    method: "post",
    path: "/heartbeat",
    tags: ["认证"],
    summary: "心跳上报",
    middleware: [adminAuth],
    security: [{ Bearer: [] }],
    responses: {
      200: {
        content: { "application/json": { schema: heartbeatSchema.response } },
        description: "上报成功",
      },
    },
  }),
  async (c) => {
    const sessionId = c.get("sessionId");
    touchAdminSession(sessionId);
    return ok(c, null);
  },
);

auth.openapi(
  createRoute({
    method: "post",
    path: "/change-password",
    tags: ["认证"],
    summary: "修改密码",
    middleware: [adminAuth],
    security: [{ Bearer: [] }],
    request: {
      body: { content: { "application/json": { schema: changePasswordSchema.body } } },
    },
    responses: {
      200: {
        content: { "application/json": { schema: changePasswordSchema.response } },
        description: "修改成功",
      },
    },
  }),
  async (c) => {
    const adminId = c.get("adminId");
    const { old_password, new_password } = c.req.valid("json");
    await changeAdminPassword(adminId, old_password, new_password);
    return ok(c, null);
  },
);

export default auth;
