import { z } from "@hono/zod-openapi";
import { successResponse, errorResponse } from "@/schemas/common";

/** 微信小程序登录 */
export const wechatMiniprogramSchema = {
  body: z.object({
    login_code: z.string().min(1, "login_code is required"),
    phone_code: z.string().min(1, "phone_code is required"),
  }),
  response: successResponse(z.object({ token: z.string() })),
  error: errorResponse,
};

/** 微信 OAuth 登录（App / 扫码 / 公众号） */
export const wechatOAuthSchema = {
  body: z.object({
    code: z.string().min(1, "code is required"),
  }),
  response: successResponse(z.object({ token: z.string() })),
  error: errorResponse,
};

/** Google 登录 */
export const googleAuthSchema = {
  body: z.object({
    id_token: z.string().min(1, "id_token is required"),
  }),
  response: successResponse(z.object({ token: z.string() })),
  error: errorResponse,
};

/** 退出登录 */
export const logoutSchema = {
  response: successResponse(z.null()),
  error: errorResponse,
};

/** 账号登录 */
export const adminLoginSchema = {
  body: z.object({
    username: z.string().min(1, "username is required"),
    password: z.string().min(1, "password is required"),
  }),
  response: successResponse(z.object({
    token: z.string(),
    session_id: z.string(),
    admin: z.object({
      id: z.string(),
      username: z.string(),
      nickname: z.string().nullable(),
      role: z.string(),
    }),
  })),
  error: errorResponse,
};

/** 获取当前账号信息 */
export const adminMeSchema = {
  response: successResponse(z.object({
    id: z.string(),
    username: z.string(),
    nickname: z.string().nullable(),
    role: z.string(),
  })),
};

/** 心跳上报 */
export const heartbeatSchema = {
  response: successResponse(z.null()),
};

/** 修改密码 */
export const changePasswordSchema = {
  body: z.object({
    old_password: z.string().min(1, "old_password is required"),
    new_password: z.string().min(6, "new_password must be at least 6 characters"),
  }),
  response: successResponse(z.null()),
};
