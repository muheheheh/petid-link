import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/** 用户表 */
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  nickname: text("nickname"),
  avatar: text("avatar"),
  phone: text("phone"),
  email: text("email"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
});

/** 用户认证方式表（支持一个用户绑定多种登录方式） */
export const userAuths = sqliteTable("user_auths", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  /** wechat_miniprogram | wechat_app | wechat_mp | wechat_open | google */
  provider: text("provider").notNull(),
  /** 第三方平台的唯一标识 */
  openId: text("open_id").notNull(),
  /** 微信 unionid，用于跨平台关联同一用户 */
  unionId: text("union_id"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
});

/** 宠物表 */
export const pets = sqliteTable("pets", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  name: text("name").notNull(),
  avatar: text("avatar"),
  gender: text("gender", { enum: ["male", "female", "unknown"] }),
  breed: text("breed"),
  description: text("description"),
  contacts: text("contacts"),
  contactName: text("contact_name"),
  remark: text("remark"),
  images: text("images"),
  status: text("status", { enum: ["normal", "lost"] }).default("normal"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
});

/** 设备（胸牌）表 */
export const devices = sqliteTable("devices", {
  id: text("id").primaryKey(),
  activationCode: text("activation_code").notNull(),
  batch: text("batch"),
  userId: text("user_id").references(() => users.id),
  petId: text("pet_id").references(() => pets.id),
  activatedAt: integer("activated_at", { mode: "timestamp_ms" }),
  boundAt: integer("bound_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
});

/** 扫码记录表 */
export const scanLogs = sqliteTable("scan_logs", {
  id: text("id").primaryKey(),
  deviceId: text("device_id").references(() => devices.id),
  ip: text("ip"),
  userAgent: text("user_agent"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  scannedAt: integer("scanned_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
});

/** 登录会话表（支持多设备 + 后台踢人） */
export const sessions = sqliteTable("user_sessions", {
  /** sessionId，写进 JWT */
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  app: text("app"),
  /** miniprogram | h5 | android | ios | admin */
  deviceType: text("device_type"),
  device: text("device"),
  os: text("os"),
  osVersion: text("os_version"),
  ip: text("ip"),
  userAgent: text("user_agent"),
  status: text("status", { enum: ["active", "logged_out", "kicked"] }).default("active"),
  lastActiveAt: integer("last_active_at", { mode: "timestamp_ms" }),
  loggedOutAt: integer("logged_out_at", { mode: "timestamp_ms" }),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
});

/** 账号表 */
export const admins = sqliteTable("admins", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  nickname: text("nickname"),
  email: text("email"),
  role: text("role", { enum: ["super_admin", "admin", "operator", "developer"] }).notNull().default("admin"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
});

/** 账号会话表 */
export const adminSessions = sqliteTable("admin_sessions", {
  id: text("id").primaryKey(),
  adminId: text("admin_id").references(() => admins.id).notNull(),
  app: text("app"),
  device: text("device"),
  os: text("os"),
  osVersion: text("os_version"),
  ip: text("ip"),
  userAgent: text("user_agent"),
  status: text("status", { enum: ["active", "logged_out", "kicked"] }).default("active"),
  lastActiveAt: integer("last_active_at", { mode: "timestamp_ms" }),
  loggedOutAt: integer("logged_out_at", { mode: "timestamp_ms" }),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
});
