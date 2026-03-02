import { createRoute } from "@hono/zod-openapi";
import { createOpenAPI } from "@/openapi";
import type { AppEnv } from "@/types";
import { ok } from "@/response";
import { adminAuth, requireRole } from "@/middleware/auth";
import { getDeviceList, batchCreateDevices, getDeviceDetail } from "@/services/admin";
import { adminDeviceListSchema, adminDeviceCreateSchema, adminDeviceDetailSchema } from "@/schemas/admin";

const device = createOpenAPI<AppEnv>();

device.openapi(
  createRoute({
    method: "post",
    path: "/list",
    tags: ["设备管理"],
    summary: "设备列表",
    middleware: [adminAuth],
    security: [{ Bearer: [] }],
    request: {
      body: { content: { "application/json": { schema: adminDeviceListSchema.body } } },
    },
    responses: {
      200: {
        content: { "application/json": { schema: adminDeviceListSchema.response } },
        description: "查询成功",
      },
    },
  }),
  async (c) => {
    const { page, page_size, keyword, user_id, status, batch } = c.req.valid("json");
    const result = getDeviceList({ page, pageSize: page_size, keyword, userId: user_id, status, batch });
    return ok(c, result);
  },
);

device.openapi(
  createRoute({
    method: "post",
    path: "/create",
    tags: ["设备管理"],
    summary: "批量生成设备",
    description: "批量生成设备记录和激活码，用于出厂录入",
    middleware: [adminAuth, requireRole("super_admin", "admin", "operator")],
    security: [{ Bearer: [] }],
    request: {
      body: { content: { "application/json": { schema: adminDeviceCreateSchema.body } } },
    },
    responses: {
      200: {
        content: { "application/json": { schema: adminDeviceCreateSchema.response } },
        description: "生成成功",
      },
    },
  }),
  async (c) => {
    const { count, batch } = c.req.valid("json");
    const result = batchCreateDevices(count, batch);
    return ok(c, result);
  },
);

device.openapi(
  createRoute({
    method: "post",
    path: "/detail",
    tags: ["设备管理"],
    summary: "设备详情",
    description: "查看设备详情，包含绑定的用户和宠物信息",
    middleware: [adminAuth],
    security: [{ Bearer: [] }],
    request: {
      body: { content: { "application/json": { schema: adminDeviceDetailSchema.body } } },
    },
    responses: {
      200: {
        content: { "application/json": { schema: adminDeviceDetailSchema.response } },
        description: "查询成功",
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("json");
    const detail = getDeviceDetail(id);
    return ok(c, detail);
  },
);

export default device;
