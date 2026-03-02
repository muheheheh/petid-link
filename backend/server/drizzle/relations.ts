import { relations } from "drizzle-orm/relations";
import { users, pets, devices, scanLogs, userAuths, admins, adminSessions, userSessions } from "./schema";

export const petsRelations = relations(pets, ({one, many}) => ({
	user: one(users, {
		fields: [pets.userId],
		references: [users.id]
	}),
	devices: many(devices),
}));

export const usersRelations = relations(users, ({many}) => ({
	pets: many(pets),
	userAuths: many(userAuths),
	userSessions: many(userSessions),
	devices: many(devices),
}));

export const scanLogsRelations = relations(scanLogs, ({one}) => ({
	device: one(devices, {
		fields: [scanLogs.deviceId],
		references: [devices.id]
	}),
}));

export const devicesRelations = relations(devices, ({one, many}) => ({
	scanLogs: many(scanLogs),
	pet: one(pets, {
		fields: [devices.petId],
		references: [pets.id]
	}),
	user: one(users, {
		fields: [devices.userId],
		references: [users.id]
	}),
}));

export const userAuthsRelations = relations(userAuths, ({one}) => ({
	user: one(users, {
		fields: [userAuths.userId],
		references: [users.id]
	}),
}));

export const adminSessionsRelations = relations(adminSessions, ({one}) => ({
	admin: one(admins, {
		fields: [adminSessions.adminId],
		references: [admins.id]
	}),
}));

export const adminsRelations = relations(admins, ({many}) => ({
	adminSessions: many(adminSessions),
}));

export const userSessionsRelations = relations(userSessions, ({one}) => ({
	user: one(users, {
		fields: [userSessions.userId],
		references: [users.id]
	}),
}));