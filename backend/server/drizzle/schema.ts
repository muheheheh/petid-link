import { sqliteTable, foreignKey, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core"
  import { sql } from "drizzle-orm"

export const pets = sqliteTable("pets", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").references(() => users.id),
	name: text().notNull(),
	avatar: text(),
	breed: text(),
	gender: text(),
	status: text().default("normal"),
	createdAt: integer("created_at"),
	description: text(),
	contacts: text(),
	contactName: text("contact_name"),
	remark: text(),
});

export const scanLogs = sqliteTable("scan_logs", {
	id: text().primaryKey().notNull(),
	deviceId: text("device_id").references(() => devices.id),
	ip: text(),
	userAgent: text("user_agent"),
	latitude: text(),
	longitude: text(),
	scannedAt: integer("scanned_at"),
});

export const users = sqliteTable("users", {
	id: text().primaryKey().notNull(),
	nickname: text(),
	avatar: text(),
	phone: text(),
	createdAt: integer("created_at"),
	email: text(),
});

export const userAuths = sqliteTable("user_auths", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull().references(() => users.id),
	provider: text().notNull(),
	openId: text("open_id").notNull(),
	createdAt: integer("created_at"),
	unionId: text("union_id"),
});

export const adminSessions = sqliteTable("admin_sessions", {
	id: text().primaryKey().notNull(),
	adminId: text("admin_id").notNull().references(() => admins.id),
	app: text(),
	deviceType: text("device_type"),
	device: text(),
	os: text(),
	osVersion: text("os_version"),
	ip: text(),
	userAgent: text("user_agent"),
	status: text().default("active"),
	lastActiveAt: integer("last_active_at"),
	loggedOutAt: integer("logged_out_at"),
	expiresAt: integer("expires_at").notNull(),
	createdAt: integer("created_at"),
});

export const admins = sqliteTable("admins", {
	id: text().primaryKey().notNull(),
	username: text().notNull(),
	passwordHash: text("password_hash").notNull(),
	nickname: text(),
	email: text(),
	createdAt: integer("created_at"),
},
(table) => [
	uniqueIndex("admins_username_unique").on(table.username),
]);

export const userSessions = sqliteTable("user_sessions", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull().references(() => users.id),
	app: text(),
	deviceType: text("device_type"),
	device: text(),
	os: text(),
	osVersion: text("os_version"),
	ip: text(),
	userAgent: text("user_agent"),
	status: text().default("active"),
	lastActiveAt: integer("last_active_at"),
	loggedOutAt: integer("logged_out_at"),
	expiresAt: integer("expires_at").notNull(),
	createdAt: integer("created_at"),
});

export const devices = sqliteTable("devices", {
	id: text().primaryKey().notNull(),
	activationCode: text("activation_code").notNull(),
	userId: text("user_id").references(() => users.id),
	petId: text("pet_id").references(() => pets.id),
	activatedAt: integer("activated_at"),
	boundAt: integer("bound_at"),
	createdAt: integer("created_at"),
});

