import { createRoute } from "@hono/zod-openapi";
import { createOpenAPI } from "@/openapi";
import type { AppEnv } from "@/types";
import { AUTH_PROVIDERS } from "@/types";
import { ok } from "@/response";
import { createClientSession, logoutClientSession } from "@/services/session";
import { extractDeviceInfo } from "@/services/client";
import { jscode2session, getPhoneNumber, getOAuthToken, getMpOAuthToken } from "@/services/wechat";
import { verifyGoogleIdToken } from "@/services/google";
import { findOrCreateUser } from "@/services/user";
import { clientAuth } from "@/middleware/auth";
import {
  wechatMiniprogramSchema,
  wechatOAuthSchema,
  googleAuthSchema,
  logoutSchema,
} from "@/schemas/auth";

const auth = createOpenAPI<AppEnv>();

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

auth.openapi(
  createRoute({
    method: "post",
    path: "/wechat/app",
    tags: ["认证"],
    summary: "微信 App 授权登录",
    request: {
      body: { content: { "application/json": { schema: wechatOAuthSchema.body } } },
 },
    responses: {
      200: {
        content: { "application/json": { schema: wechatOAuthSchema.response } },
        description: "登录成功",
      },
    },
  }),
  async (c) => {
    const { code } = c.req.valid("json");
    const oauthResult = await getOAuthToken(code, "app");

    const userId = findOrCreateUser({
      provider: AUTH_PROVIDERS.WECHAT_APP,
      openId: oauthResult.openid,
      unionId: oauthResult.unionid,
    });

    const deviceInfo = extractDeviceInfo(c);
    const { token } = await createClientSession({ accountId: userId, deviceInfo });
    return ok(c, { token });
  },
);

auth.openapi(
  createRoute({
    method: "post",
    path: "/wechat/qrcode",
    tags: ["认证"],
    summary: "微信扫码授权登录",
    request: {
      body: { content: { "application/json": { schema: wechatOAuthSchema.body } } },
    },
    responses: {
      200: {
        content: { "application/json": { schema: wechatOAuthSchema.response } },
        description: "登录成功",
      },
    },
  }),
  async (c) => {
    const { code } = c.req.valid("json");
    const oauthResult = await getOAuthToken(code, "open");

    const userId = findOrCreateUser({
      provider: AUTH_PROVIDERS.WECHAT_OPEN,
      openId: oauthResult.openid,
      unionId: oauthResult.unionid,
    });

    const deviceInfo = extractDeviceInfo(c);
    const { token } = await createClientSession({ accountId: userId, deviceInfo });
    return ok(c, { token });
  },
);

auth.openapi(
  createRoute({
    method: "post",
    path: "/wechat/mp",
    tags: ["认证"],
    summary: "微信公众号授权登录",
    request: {
      body: { content: { "application/json": { schema: wechatOAuthSchema.body } } },
    },
    responses: {
      200: {
        content: { "application/json": { schema: wechatOAuthSchema.response } },
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

auth.openapi(
  createRoute({
    method: "post",
    path: "/google",
    tags: ["认证"],
    summary: "Google 授权登录",
    request: {
      body: { content: { "application/json": { schema: googleAuthSchema.body } } },
    },
    responses: {
      200: {
        content: { "application/json": { schema: googleAuthSchema.response } },
        description: "登录成功",
      },
    },
  }),
  async (c) => {
    const { id_token } = c.req.valid("json");
    const googleUser = await verifyGoogleIdToken(id_token);

    const userId = findOrCreateUser({
      provider: AUTH_PROVIDERS.GOOGLE,
      openId: googleUser.sub,
      email: googleUser.email,
      nickname: googleUser.name,
      avatar: googleUser.picture,
    });

    const deviceInfo = extractDeviceInfo(c);
    const { token } = await createClientSession({ accountId: userId, deviceInfo });
    return ok(c, { token });
  },
);

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
