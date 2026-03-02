import { createRoute } from "@hono/zod-openapi";
import { z } from "@hono/zod-openapi";
import { createOpenAPI } from "@/openapi";
import type { AppEnv } from "@/types";
import { ok } from "@/response";
import { adminAuth } from "@/middleware/auth";
import { successResponse } from "@/schemas/common";
import { getDashboardStats } from "@/services/admin";

const stats = createOpenAPI<AppEnv>();

stats.openapi(
  createRoute({
    method: "post",
    path: "/",
    tags: ["统计"],
    summary: "首页统计数据",
    middleware: [adminAuth],
    security: [{ Bearer: [] }],
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              start_time: z.number().optional(),
              end_time: z.number().optional(),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: successResponse(z.object({
              user_count: z.number(),
              new_user_count: z.number(),
              pet_count: z.number(),
              new_pet_count: z.number(),
              device_count: z.number(),
              new_device_count: z.number(),
              device_activated_count: z.number(),
              device_bound_count: z.number(),
              lost_pet_count: z.number(),
              scan_count: z.number(),
              recent_scans: z.array(z.object({
                id: z.string(),
                device_id: z.string().nullable(),
                pet_name: z.string().nullable(),
                scanned_at: z.number().nullable(),
              })),
            })),
          },
        },
        description: "查询成功",
      },
    },
  }),
  async (c) => {
    const { start_time, end_time } = c.req.valid("json");
    const result = getDashboardStats(start_time, end_time);
    return ok(c, result);
  },
);

export default stats;
