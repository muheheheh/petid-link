export const config = {
  server: {
    clientPort: Bun.env.CLIENT_PORT || 3000,
    adminPort: Bun.env.ADMIN_PORT || 3001,
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
  },
  /** 短信服务配置 */
  sms: {
    provider: Bun.env.SMS_PROVIDER || "aliyun",
    accessKeyId: Bun.env.SMS_ACCESS_KEY_ID!,
    accessKeySecret: Bun.env.SMS_ACCESS_KEY_SECRET!,
    signName: Bun.env.SMS_SIGN_NAME || "PetID",
    templateCode: Bun.env.SMS_TEMPLATE_CODE!,
  },
  /** 邮件服务配置（SMTP） */
  mail: {
    host: Bun.env.MAIL_HOST!,
    port: Number(Bun.env.MAIL_PORT) || 465,
    user: Bun.env.MAIL_USER!,
    pass: Bun.env.MAIL_PASS!,
    from: Bun.env.MAIL_FROM || "noreply@petid.link",
  },
  /** Redis */
  redis: {
    host: Bun.env.REDIS_HOST || "localhost",
    port: Number(Bun.env.REDIS_PORT) || 6379,
    password: Bun.env.REDIS_PASSWORD || "",
    db: Number(Bun.env.REDIS_DB) || 0,
  },
  /** 验证码配置 */
  verification: {
    /** 验证码有效期（毫秒） */
    ttl: Number(Bun.env.VERIFY_CODE_TTL) || 5 * 60 * 1000,
    /** 同一目标发送间隔（毫秒） */
    interval: Number(Bun.env.VERIFY_CODE_INTERVAL) || 60 * 1000,
    /** 验证码长度 */
    length: Number(Bun.env.VERIFY_CODE_LENGTH) || 6,
  },
  /** 阿里云 OSS */
  oss: {
    region: Bun.env.OSS_REGION || "oss-cn-hangzhou",
    accessKeyId: Bun.env.OSS_ACCESS_KEY_ID!,
    accessKeySecret: Bun.env.OSS_ACCESS_KEY_SECRET!,
    bucket: Bun.env.OSS_BUCKET!,
    /** CDN 域名（可选，不填则使用 OSS 默认域名） */
    cdnDomain: Bun.env.OSS_CDN_DOMAIN || "",
  },
};
