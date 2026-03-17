import { createRoute } from "@hono/zod-openapi";
import { createOpenAPI } from "@/openapi";
import adminErrors from "@/errors/admin";
import type { AppEnv } from "@/types";
import { ok } from "@/response";
import { adminAuth, requireRole } from "@/middleware/auth";
import {
  getAdminList, createAdmin, updateAdmin, deleteAdmin,
  getAdminSessionList, kickAdminSessionById,
  getAdminInfo, canManageRole, getAdminSessionOwnerId,
} from "@/services/admin";
import { ERR, BizError } from "@/errors/admin";
import {
  adminManagerListSchema, adminManagerCreateSchema,
  adminManagerUpdateSchema, adminManagerDeleteSchema,
  adminSessionListSchema, adminKickSessionSchema,
  adminResetPasswordSchema,
} from "@/schemas/admin";

const manager = createOpenAPI<AppEnv>(adminErrors);

manager.openapi(
  createRoute({
    method: "post",
    path: "/list",
    tags: ["账号管理"],
    summary: "账号列表",
    middleware: [adminAuth, requireRole("super_admin", "admin")],
    security: [{ Bearer: [] }],
    request: {
      body: { content: { "application/json": { schema: adminManagerListSchema.body } } },
    },
    responses: {
      200: {
        content: { "application/json": { schema: adminManagerListSchema.response } },
        description: "查询成功",
      },
    },
  }),
  async (c) => {
    const { page, page_size, keyword } = c.req.valid("json");
    const result = getAdminList({ page, pageSize: page_size, keyword });
    return ok(c, result);
  },
);

manager.openapi(
  createRoute({
    method: "post",
    path: "/create",
    tags: ["账号管理"],
    summary: "创建账号",
    middleware: [adminAuth, requireRole("super_admin", "admin")],
    security: [{ Bearer: [] }],
    request: {
      body: { content: { "application/json": { schema: adminManagerCreateSchema.body } } },
    },
    responses: {
      200: {
        content: { "application/json": { schema: adminManagerCreateSchema.response } },
        description: "创建成功",
      },
    },
  }),
  async (c) => {
    const { username, password, nickname, email, role } = c.req.valid("json");
    const currentRole = c.get("adminRole");
    const targetRole = role ?? "admin";
    if (!canManageRole(currentRole, targetRole)) throw new BizError(ERR.COMMON_FORBIDDEN);
    const id = await createAdmin(username, password, nickname, email, role);
    return ok(c, { id });
  },
);

manager.openapi(
  createRoute({
    method: "post",
    path: "/update",
    tags: ["账号管理"],
    summary: "编辑账号",
    middleware: [adminAuth],
    security: [{ Bearer: [] }],
    request: {
      body: { content: { "application/json": { schema: adminManagerUpdateSchema.body } } },
    },
    responses: {
      200: {
        content: { "application/json": { schema: adminManagerUpdateSchema.response } },
        description: "更新成功",
      },
    },
  }),
  async (c) => {
    const { id, username, nickname, email, password, role } = c.req.valid("json");
    const currentId = c.get("adminId");
    const currentRole = c.get("adminRole");
    const isSelf = id === currentId;

    if (!isSelf) {
      const target = getAdminInfo(id);
      if (!canManageRole(currentRole, target.role)) throw new BizError(ERR.COMMON_FORBIDDEN);
      if (role && !canManageRole(currentRole, role)) throw new BizError(ERR.COMMON_FORBIDDEN);
      await updateAdmin(id, nickname, email, password, role, username);
    } else {
      await updateAdmin(id, nickname, email, password);
    }
    return ok(c, null);
  },
);

manager.openapi(
  createRoute({
    method: "post",
    path: "/delete",
    tags: ["账号管理"],
    summary: "删除账号",
    middleware: [adminAuth, requireRole("super_admin", "admin")],
    security: [{ Bearer: [] }],
    request: {
      body: { content: { "application/json": { schema: adminManagerDeleteSchema.body } } },
    },
    responses: {
      200: {
        content: { "application/json": { schema: adminManagerDeleteSchema.response } },
        description: "删除成功",
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("json");
    const currentId = c.get("adminId");
    const currentRole = c.get("adminRole");
    if (id === currentId) throw new BizError(ERR.COMMON_FORBIDDEN);
    const target = getAdminInfo(id);
    if (!canManageRole(currentRole, target.role)) throw new BizError(ERR.COMMON_FORBIDDEN);
    deleteAdmin(id);
    return ok(c, null);
  },
);

manager.openapi(
  createRoute({
    method: "post",
    path: "/reset-password",
    tags: ["账号管理"],
    summary: "重置密码",
    middleware: [adminAuth, requireRole("super_admin", "admin")],
    security: [{ Bearer: [] }],
    request: {
      body: { content: { "application/json": { schema: adminResetPasswordSchema.body } } },
    },
    responses: {
      200: {
        content: { "application/json": { schema: adminResetPasswordSchema.response } },
        description: "重置成功",
      },
    },
  }),
  async (c) => {
    const { id, new_password } = c.req.valid("json");
    const currentId = c.get("adminId");
    const currentRole = c.get("adminRole");
    if (id === currentId) throw new BizError(ERR.COMMON_FORBIDDEN);
    const target = getAdminInfo(id);
    if (!canManageRole(currentRole, target.role)) throw new BizError(ERR.COMMON_FORBIDDEN);
    await updateAdmin(id, undefined, undefined, new_password);
    return ok(c, null);
  },
);

manager.openapi(
  createRoute({
    method: "post",
    path: "/session-list",
    tags: ["登录日志"],
    summary: "会话列表",
    middleware: [adminAuth, requireRole("super_admin", "admin")],
    security: [{ Bearer: [] }],
    request: {
      body: { content: { "application/json": { schema: adminSessionListSchema.body } } },
    },
    responses: {
      200: {
        content: { "application/json": { schema: adminSessionListSchema.response } },
        description: "查询成功",
      },
    },
  }),
  async (c) => {
    const { admin_id, page, page_size } = c.req.valid("json");
    const currentId = c.get("adminId");
    const currentRole = c.get("adminRole");

    if (currentRole === "super_admin") {
      const result = getAdminSessionList({ page, pageSize: page_size, adminId: admin_id });
      return ok(c, result);
    }

    if (admin_id && admin_id !== currentId) {
      const target = getAdminInfo(admin_id);
      if (!canManageRole(currentRole, target.role)) throw new BizError(ERR.COMMON_FORBIDDEN);
    }
    const result = getAdminSessionList({ page, pageSize: page_size, adminId: admin_id || currentId, currentRole, currentId });
    return ok(c, result);
  },
);

manager.openapi(
  createRoute({
    method: "post",
    path: "/kick-session",
    tags: ["登录日志"],
    summary: "踢出会话",
    middleware: [adminAuth, requireRole("super_admin", "admin")],
    security: [{ Bearer: [] }],
    request: {
      body: { content: { "application/json": { schema: adminKickSessionSchema.body } } },
    },
    responses: {
      200: {
        content: { "application/json": { schema: adminKickSessionSchema.response } },
        description: "踢出成功",
      },
    },
  }),
  async (c) => {
    const { session_id } = c.req.valid("json");
    const currentRole = c.get("adminRole");
    const currentId = c.get("adminId");

    if (currentRole !== "super_admin") {
      const ownerId = getAdminSessionOwnerId(session_id);
      if (ownerId && ownerId !== currentId) {
        const target = getAdminInfo(ownerId);
        if (!canManageRole(currentRole, target.role)) throw new BizError(ERR.COMMON_FORBIDDEN);
      }
    }

    kickAdminSessionById(session_id);
    return ok(c, null);
  },
);

export default manager;
