import { createRoute } from "@hono/zod-openapi";
import { createOpenAPI } from "@/openapi";
import clientErrors from "@/errors/client";
import type { AppEnv } from "@/types";
import { AUTH_PROVIDERS } from "@/types";
import { ok } from "@/response";
import { createClientSession, logoutClientSession } from "@/services/session";
import { extractDeviceInfo } from "@/services/client";
import { sendVerificationCode, verifyCode } from "@/services/verification";
import { jscode2session, getPhoneNumber, getMpOAuthToken } from "@/services/wechat";
import { findOrCreateUser } from "@/services/user";
import { clientAuth } from "@/middleware/auth";
import {
  phoneSendCodeSchema,
  phoneLoginSchema,
  emailSendCodeSchema,
  emailLoginSchema,
  wechatMiniprogramSchema,
  wechatMpSchema,
  logoutSchema,
} from "@/schemas/auth";

const auth = createOpenAPI<AppEnv>(clientErrors);

// ============ 手机验证码登录 ============

auth.openapi(
  createRoute({
    method: "post",
    path: "/phone/send-code",
    tags: ["认证"],
    summary: "发送手机验证码",
    request: {
      body: { content: { "application/json": { schema: phoneSendCodeSchema.body } } },
    },
    responses: {
      200: {
        content: { "application/json": { schema: phoneSendCodeSchema.response } },
        description: "发送成功",
      },
    },
  }),
  async (c) => {
    const { phone } = c.req.valid("json");
    await sendVerificationCode("phone", phone);
    return ok(c, null);
  },
);

auth.openapi(
  createRoute({
    method: "post",
    path: "/phone/login",
    tags: ["认证"],
    summary: "手机验证码登录",
    request: {
      body: { content: { "application/json": { schema: phoneLoginSchema.body } } },
    },
    responses: {
      200: {
        content: { "application/json": { schema: phoneLoginSchema.response } },
        description: "登录成功",
      },
    },
  }),
  async (c) => {
    const { phone, code } = c.req.valid("json");
    await verifyCode("phone", phone, code);

    const userId = findOrCreateUser({
      provider: AUTH_PROVIDERS.PHONE,
      openId: phone,
      phone,
    });

    const deviceInfo = extractDeviceInfo(c);
    const { token } = await createClientSession({ accountId: userId, deviceInfo });
    return ok(c, { token });
  },
);

// ============ 邮箱验证码登录 ============

auth.openapi(
  createRoute({
    method: "post",
    path: "/email/send-code",
    tags: ["认证"],
    summary: "发送邮箱验证码",
    request: {
      body: { content: { "application/json": { schema: emailSendCodeSchema.body } } },
    },
    responses: {
      200: {
        content: { "application/json": { schema: emailSendCodeSchema.response } },
        description: "发送成功",
      },
    },
  }),
  async (c) => {
    const { email } = c.req.valid("json");
    await sendVerificationCode("email", email);
    return ok(c, null);
  },
);

auth.openapi(
  createRoute({
    method: "post",
    path: "/email/login",
    tags: ["认证"],
    summary: "邮箱验证码登录",
    request: {
      body: { content: { "application/json": { schema: emailLoginSchema.body } } },
    },
    responses: {
      200: {
        content: { "application/json": { schema: emailLoginSchema.response } },
        description: "登录成功",
      },
    },
  }),
  async (c) => {
    const { email, code } = c.req.valid("json");
    await verifyCode("email", email, code);

    const userId = findOrCreateUser({
      provider: AUTH_PROVIDERS.EMAIL,
      openId: email,
      email,
    });

    const deviceInfo = extractDeviceInfo(c);
    const { token } = await createClientSession({ accountId: userId, deviceInfo });
    return ok(c, { token });
  },
);

// ============ 微信小程序登录 ============

auth.openapi(
  createRoute({
    method: "post",
    path: "/wechat/miniprogram",
    tags: ["认证"],
    summary: "微信小程序授权登录",
    request: {
      body: { content: { "application/json": { schema: wechatMiniprogramSchema.body } } },
    },
    responses: {
      200: {
        content: { "application/json": { schema: wechatMiniprogramSchema.response } },
        description: "登录成功",
      },
    },
  }),
  async (c) => {
    const { login_code, phone_code } = c.req.valid("json");

    const wxSession = await jscode2session(login_code);
    const phone = await getPhoneNumber(phone_code);

    const userId = findOrCreateUser({
      provider: AUTH_PROVIDERS.WECHAT_MINIPROGRAM,
      openId: wxSession.openid,
      phone,
      unionId: wxSession.unionid,
    });

    const deviceInfo = extractDeviceInfo(c);
    const { token } = await createClientSession({ accountId: userId, deviceInfo });
    return ok(c, { token });
  },
);

// ============ 微信服务号登录 ============

auth.openapi(
  createRoute({
    method: "post",
    path: "/wechat/mp",
    tags: ["认证"],
    summary: "微信服务号授权登录",
    request: {
      body: { content: { "application/json": { schema: wechatMpSchema.body } } },
    },
    responses: {
      200: {
        content: { "application/json": { schema: wechatMpSchema.response } },
        description: "登录成功",
      },
    },
  }),
  async (c) => {
    const { code } = c.req.valid("json");
    const oauthResult = await getMpOAuthToken(code);

    const userId = findOrCreateUser({
      provider: AUTH_PROVIDERS.WECHAT_MP,
      openId: oauthResult.openid,
      unionId: oauthResult.unionid,
    });

    const deviceInfo = extractDeviceInfo(c);
    const { token } = await createClientSession({ accountId: userId, deviceInfo });
    return ok(c, { token });
  },
);

// ============ 退出登录 ============

auth.openapi(
  createRoute({
    method: "post",
    path: "/logout",
    tags: ["认证"],
    summary: "退出登录",
    middleware: [clientAuth],
    security: [{ Bearer: [] }],
    responses: {
      200: {
        content: { "application/json": { schema: logoutSchema.response } },
        description: "退出成功",
      },
    },
  }),
  async (c) => {
    const sessionId = c.get("sessionId");
    logoutClientSession(sessionId);
    return ok(c, null);
  },
);

export default auth;
