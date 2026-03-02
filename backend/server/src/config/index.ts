export const config = {
  server: {
    port: Bun.env.PORT || 3000,
    baseUrl: Bun.env.BASE_URL || "http://localhost:3000",
  },
  /** 扫码落地页域名，二维码内容为 {siteUrl}/s/{device_id} */
  siteUrl: Bun.env.SITE_URL || "https://petid.link",
  jwt: {
    client: {
      secret: Bun.env.CLIENT_JWT_SECRET || "petid-client-dev-secret",
      sessionMaxAge: Number(Bun.env.CLIENT_SESSION_MAX_AGE) || 30 * 24 * 60 * 60 * 1000,
      renewThreshold: Number(Bun.env.CLIENT_SESSION_RENEW_THRESHOLD) || 7 * 24 * 60 * 60 * 1000,
    },
    admin: {
      secret: Bun.env.ADMIN_JWT_SECRET || "petid-admin-dev-secret",
      sessionMaxAge: Number(Bun.env.ADMIN_SESSION_MAX_AGE) || 7 * 24 * 60 * 60 * 1000,
      renewThreshold: Number(Bun.env.ADMIN_SESSION_RENEW_THRESHOLD) || 1 * 24 * 60 * 60 * 1000,
    },
  },
  wechat: {
    miniprogram: {
      appId: Bun.env.WECHAT_MINIPROGRAM_APP_ID!,
      appSecret: Bun.env.WECHAT_MINIPROGRAM_APP_SECRET!,
    },
    mp: {
      appId: Bun.env.WECHAT_MP_APP_ID!,
      appSecret: Bun.env.WECHAT_MP_APP_SECRET!,
    },
    app: {
      appId: Bun.env.WECHAT_APP_APP_ID!,
      appSecret: Bun.env.WECHAT_APP_APP_SECRET!,
    },
    open: {
      appId: Bun.env.WECHAT_OPEN_APP_ID!,
      appSecret: Bun.env.WECHAT_OPEN_APP_SECRET!,
    },
  },
  google: {
    clientId: Bun.env.GOOGLE_CLIENT_ID!,
  },
};
