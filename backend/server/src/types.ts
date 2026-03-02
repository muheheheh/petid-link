/** Hono 自定义 context 变量类型 */
export type AppEnv = {
  Variables: {
    requestId: string;
    userId: string;
    adminId: string;
    adminRole: AdminRole;
    sessionId: string;
  };
};

/** 账号角色 */
export const ADMIN_ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  OPERATOR: "operator",
  DEVELOPER: "developer",
} as const;

export type AdminRole = typeof ADMIN_ROLES[keyof typeof ADMIN_ROLES];

/** 客户端设备类型 */
export const DEVICE_TYPES = {
  MINIPROGRAM: "miniprogram",
  H5: "h5",
  WEB: "web",
  ANDROID: "android",
  IOS: "ios",
  ADMIN: "admin",
} as const;

export type DeviceType = typeof DEVICE_TYPES[keyof typeof DEVICE_TYPES];

/** 第三方认证 provider */
export const AUTH_PROVIDERS = {
  WECHAT_MINIPROGRAM: "wechat_miniprogram",
  WECHAT_APP: "wechat_app",
  WECHAT_MP: "wechat_mp",
  WECHAT_OPEN: "wechat_open",
  GOOGLE: "google",
} as const;

export type AuthProvider = typeof AUTH_PROVIDERS[keyof typeof AUTH_PROVIDERS];
