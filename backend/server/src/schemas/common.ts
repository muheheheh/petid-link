import { z } from "@hono/zod-openapi";

/** 统一成功响应 schema，data 为泛型 */
export function successResponse<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    code: z.literal(0),
    message: z.string(),
    data: dataSchema,
  });
}

/** 统一错误响应 schema */
export const errorResponse = z.object({
  code: z.number(),
  message: z.string(),
});

/** 分页请求 schema */
export const paginationQuery = z.object({
  page: z.number().int().min(1).default(1),
  page_size: z.number().int().min(1).max(100).default(20),
  keyword: z.string().optional(),
});

/** 分页响应 schema */
export function paginatedResponse<T extends z.ZodTypeAny>(itemSchema: T) {
  return successResponse(
    z.object({
      list: z.array(itemSchema),
      total: z.number(),
      page: z.number(),
      page_size: z.number(),
    }),
  );
}

