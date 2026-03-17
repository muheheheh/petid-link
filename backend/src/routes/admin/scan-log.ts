import { createRoute } from "@hono/zod-openapi";
import { createOpenAPI } from "@/openapi";
import adminErrors from "@/errors/admin";
import type { AppEnv } from "@/types";
import { ok } from "@/response";
import { adminAuth } from "@/middleware/auth";
import { getScanLogList } from "@/services/admin";
import { adminScanLogListSchema } from "@/schemas/admin";

const scanLog = createOpenAPI<AppEnv>(adminErrors);

scanLog.openapi(
  createRoute({
    method: "post",
    path: "/list",
    tags: ["扫码记录"],
    summary: "扫码记录列表",
    middleware: [adminAuth],
    security: [{ Bearer: [] }],
    request: {
      body: { content: { "application/json": { schema: adminScanLogListSchema.body } } },
    },
    responses: {
      200: {
        content: { "application/json": { schema: adminScanLogListSchema.response } },
        description: "查询成功",
      },
    },
  }),
  async (c) => {
    const { page, page_size, device_id, pet_id } = c.req.valid("json");
    const result = getScanLogList({ page, pageSize: page_size, deviceId: device_id, petId: pet_id });
    return ok(c, result);
  },
);

export default scanLog;
