import { createRoute } from "@hono/zod-openapi";
import { createOpenAPI } from "@/openapi";
import clientErrors from "@/errors/client";
import type { AppEnv } from "@/types";
import { ok } from "@/response";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ERR, BizError } from "@/errors/client";
import { clientAuth } from "@/middleware/auth";
import { userProfileSchema, updateProfileSchema } from "@/schemas/user";

const user = createOpenAPI<AppEnv>(clientErrors);

user.openapi(
  createRoute({
    method: "post",
    path: "/profile",
    tags: ["用户"],
    summary: "获取个人资料",
    middleware: [clientAuth],
    security: [{ Bearer: [] }],
    responses: {
      200: {
        content: { "application/json": { schema: userProfileSchema.response } },
        description: "查询成功",
      },
    },
  }),
  async (c) => {
    const userId = c.get("userId");
    const [row] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!row) throw new BizError(ERR.COMMON_NOT_FOUND);
    return ok(c, {
      id: row.id,
      nickname: row.nickname,
      avatar: row.avatar,
      phone: row.phone,
      email: row.email,
      created_at: row.createdAt?.getTime() ?? null,
    });
  },
);

user.openapi(
  createRoute({
    method: "post",
    path: "/update",
    tags: ["用户"],
    summary: "编辑个人资料",
    middleware: [clientAuth],
    security: [{ Bearer: [] }],
    request: {
      body: { content: { "application/json": { schema: updateProfileSchema.body } } },
    },
    responses: {
      200: {
        content: { "application/json": { schema: updateProfileSchema.response } },
        description: "更新成功",
      },
    },
  }),
  async (c) => {
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const updates: Record<string, unknown> = {};
    if (body.nickname !== undefined) updates.nickname = body.nickname;
    if (body.avatar !== undefined) updates.avatar = body.avatar;
    if (Object.keys(updates).length > 0) {
      await db.update(users).set(updates).where(eq(users.id, userId));
    }
    return ok(c, null);
  },
);

export default user;
