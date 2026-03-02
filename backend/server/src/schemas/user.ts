import { z } from "@hono/zod-openapi";
import { successResponse, errorResponse } from "@/schemas/common";

/** 获取个人资料 */
export const userProfileSchema = {
  response: successResponse(
    z.object({
      id: z.string(),
      nickname: z.string().nullable(),
      avatar: z.string().nullable(),
      phone: z.string().nullable(),
      email: z.string().nullable(),
      created_at: z.number().nullable(),
    }),
  ),
  error: errorResponse,
};

/** 编辑个人资料 */
export const updateProfileSchema = {
  body: z.object({
    nickname: z.string().optional(),
    avatar: z.string().optional(),
  }),
  response: successResponse(z.null()),
  error: errorResponse,
};
