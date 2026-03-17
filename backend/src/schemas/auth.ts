import { z } from "@hono/zod-openapi";
import { successResponse, errorResponse } from "@/schemas/common";

// ============ 手机验证码登录 ============

/** 发送手机验证码 */
export const phoneSendCodeSchema = {
  body: z.object({
    phone: z.string().regex(/^1[3-9]\d{9}$/, "手机号格式不正确"),
  }),
  response: successResponse(z.null()),
  error: errorResponse,
};

/** 手机验证码登录 */
export const phoneLoginSchema = {
  body: z.object({
    phone: z.string().regex(/^1[3-9]\d{9}$/, "手机号格式不正确"),
    code: z.string().length(6, "验证码为6位数字"),
  }),
  response: successResponse(z.object({ token: z.string() })),
  error: errorResponse,
};

// ============ 邮箱验证码登录 ============

/** 发送邮箱验证码 */
export const emailSendCodeSchema = {
  body: z.object({
    email: z.string().email("邮箱格式不正确"),
  }),
  response: successResponse(z.null()),
  error: errorResponse,
};

/** 邮箱验证码登录 */
export const emailLoginSchema = {
  body: z.object({
    email: z.string().email("邮箱格式不正确"),
    code: z.string().length(6, "验证码为6位数字"),
  }),
  response: successResponse(z.object({ token: z.string() })),
  error: errorResponse,
};

// ============ 微信登录 ============

/** 微信小程序登录 */
export const wechatMiniprogramSchema = {
  body: z.object({
    login_code: z.string().min(1, "login_code is required"),
    phone_code: z.string().min(1, "phone_code is required"),
  }),
  response: successResponse(z.object({ token: z.string() })),
  error: errorResponse,
};

/** 微信服务号 OAuth 登录 */
export const wechatMpSchema = {
  body: z.object({
    code: z.string().min(1, "code is required"),
  }),
  response: successResponse(z.object({ token: z.string() })),
  error: errorResponse,
};

// ============ 通用 ============

/** 退出登录 */
export const logoutSchema = {
  response: successResponse(z.null()),
  error: errorResponse,
};

// ============ 管理端 ============

/** 管理员账号登录 */
export const adminLoginSchema = {
  body: z.object({
    username: z.string().min(1, "username is required"),
    password: z.string().min(1, "password is required"),
  }),
  response: successResponse(z.object({
    token: z.string(),
    session_id: z.string(),
    account: z.object({
      id: z.string(),
      username: z.string(),
      nickname: z.string().nullable(),
      role: z.string(),
    }),
  })),
  error: errorResponse,
};

/** 获取当前管理员信息 */
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
