import { createRoute } from "@hono/zod-openapi";
import { createOpenAPI } from "@/openapi";
import adminErrors from "@/errors/admin";
import type { AppEnv } from "@/types";
import { ok } from "@/response";
import { adminAuth } from "@/middleware/auth";
import { getPetList, getPetDetail } from "@/services/admin";
import { adminPetListSchema, adminPetDetailSchema } from "@/schemas/admin";

const pet = createOpenAPI<AppEnv>(adminErrors);

pet.openapi(
  createRoute({
    method: "post",
    path: "/list",
    tags: ["宠物管理"],
    summary: "宠物列表",
    middleware: [adminAuth],
    security: [{ Bearer: [] }],
    request: {
      body: { content: { "application/json": { schema: adminPetListSchema.body } } },
    },
    responses: {
      200: {
        content: { "application/json": { schema: adminPetListSchema.response } },
        description: "查询成功",
      },
    },
  }),
  async (c) => {
    const { page, page_size, keyword, user_id, status } = c.req.valid("json");
    const result = getPetList({ page, pageSize: page_size, keyword, userId: user_id, status });
    return ok(c, result);
  },
);

pet.openapi(
  createRoute({
    method: "post",
    path: "/detail",
    tags: ["宠物管理"],
    summary: "宠物详情",
    description: "查看宠物详情，包含主人和绑定设备信息",
    middleware: [adminAuth],
    security: [{ Bearer: [] }],
    request: {
      body: { content: { "application/json": { schema: adminPetDetailSchema.body } } },
    },
    responses: {
      200: {
        content: { "application/json": { schema: adminPetDetailSchema.response } },
        description: "查询成功",
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("json");
    const detail = getPetDetail(id);
    return ok(c, detail);
  },
);

export default pet;
