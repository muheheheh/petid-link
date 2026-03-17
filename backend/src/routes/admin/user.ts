import { createRoute } from "@hono/zod-openapi";
import { createOpenAPI } from "@/openapi";
import adminErrors from "@/errors/admin";
import type { AppEnv } from "@/types";
import { ok } from "@/response";
import { adminAuth, requireRole } from "@/middleware/auth";
import {
  getUserList, getUserDetail, getUserSessionList,
  kickUserSessionById,
} from "@/services/admin";
import {
  adminUserListSchema, adminUserDetailSchema,
  adminUserSessionListSchema, adminUserKickSessionSchema,
} from "@/schemas/admin";

const user = createOpenAPI<AppEnv>(adminErrors);

user.openapi(
  createRoute({
    method: "post",
    path: "/list",
    tags: ["用户管理"],
    summary: "用户列表",
    middleware: [adminAuth],
    security: [{ Bearer: [] }],
    request: {
      body: { content: { "application/json": { schema: adminUserListSchema.body } } },
    },
    responses: {
      200: {
        content: { "application/json": { schema: adminUserListSchema.response } },
        description: "查询成功",
      },
    },
  }),
  async (c) => {
    const { page, page_size, keyword, user_id } = c.req.valid("json");
    const result = await getUserList({ page, pageSize: page_size, keyword, userId: user_id });
    return ok(c, result);
  },
);

user.openapi(
  createRoute({
    method: "post",
    path: "/detail",
    tags: ["用户管理"],
    summary: "用户详情",
    middleware: [adminAuth],
    security: [{ Bearer: [] }],
    request: {
      body: { content: { "application/json": { schema: adminUserDetailSchema.body } } },
    },
    responses: {
      200: {
        content: { "application/json": { schema: adminUserDetailSchema.response } },
        description: "查询成功",
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("json");
    const detail = await getUserDetail(id);
    return ok(c, detail);
  },
);

user.openapi(
  createRoute({
    method: "post",
    path: "/session-list",
    tags: ["用户管理"],
    summary: "用户会话列表",
    middleware: [adminAuth],
    security: [{ Bearer: [] }],
    request: {
      body: { content: { "application/json": { schema: adminUserSessionListSchema.body } } },
    },
    responses: {
      200: {
        content: { "application/json": { schema: adminUserSessionListSchema.response } },
        description: "查询成功",
      },
    },
  }),
  async (c) => {
    const { user_id, page, page_size } = c.req.valid("json");
    const result = await getUserSessionList(user_id, { page, pageSize: page_size });
    return ok(c, result);
  },
);

user.openapi(
  createRoute({
    method: "post",
    path: "/kick-session",
    tags: ["用户管理"],
    summary: "踢出用户会话",
    middleware: [adminAuth, requireRole("super_admin", "admin", "operator")],
    security: [{ Bearer: [] }],
    request: {
      body: { content: { "application/json": { schema: adminUserKickSessionSchema.body } } },
    },
    responses: {
      200: {
        content: { "application/json": { schema: adminUserKickSessionSchema.response } },
        description: "踢出成功",
      },
    },
  }),
  async (c) => {
    const { session_id } = c.req.valid("json");
    await kickUserSessionById(session_id);
    return ok(c, null);
  },
);

export default user;
