import { eq } from "drizzle-orm";
import { sign, verify } from "hono/jwt";
import { db } from "@/db";
import { userSessions, adminSessions } from "@/db/schema";
import { config } from "@/config";
import type { DeviceInfo } from "@/services/client";

interface JwtPayload {
  sessionId: string;
  accountId: string;
  exp: number;
}

interface CreateSessionParams {
  accountId: string;
  deviceInfo: DeviceInfo;
}

interface SessionResult {
  sessionId: string;
  accountId: string;
  newToken: string | null;
}

interface SessionConfig {
  secret: string;
  sessionMaxAge: number;
  renewThreshold: number;
}

/** 创建会话记录并签发 JWT */
async function createSessionRecord(table: typeof userSessions | typeof adminSessions, params: CreateSessionParams, sc: SessionConfig) {
  const sessionId = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + sc.sessionMaxAge);
  const d = params.deviceInfo;
  const isAdmin = table === adminSessions;

  const values: Record<string, unknown> = {
    id: sessionId,
    app: d.app,
    device: d.device,
    os: d.os,
    osVersion: d.os_version,
    ip: d.ip,
    userAgent: d.user_agent,
    status: "active",
    lastActiveAt: now,
    expiresAt,
  };

  if (isAdmin) {
    values.adminId = params.accountId;
  } else {
    values.userId = params.accountId;
    values.deviceType = d.type;
  }

  await db.insert(table).values(values as any);

  const token = await signToken(sessionId, params.accountId, expiresAt, sc.secret);
  return { token, sessionId };
}

/**
 * 验证会话：JWT 解码 → 查表 → 状态/过期检查 → 更新活跃时间 → 滑动续期
 */
async function verifySessionRecord(table: typeof userSessions | typeof adminSessions, idField: string, token: string, sc: SessionConfig): Promise<SessionResult> {
  const payload = await verify(token, sc.secret, "HS256") as unknown as JwtPayload;
  const [session] = await db.select().from(table).where(eq(table.id, payload.sessionId)).limit(1);

  if (!session) throw new Error("Session not found");
  if ((session as any).status !== "active") throw new Error("Session is not active");
  if ((session as any).expiresAt && (session as any).expiresAt.getTime() < Date.now()) throw new Error("Session expired");

  await db.update(table)
    .set({ lastActiveAt: new Date() } as any)
    .where(eq(table.id, (session as any).id));

  let newToken: string | null = null;
  if ((session as any).expiresAt) {
    const remaining = (session as any).expiresAt.getTime() - Date.now();
    if (remaining < sc.renewThreshold) {
      const newExpiresAt = new Date(Date.now() + sc.sessionMaxAge);
      await db.update(table)
        .set({ expiresAt: newExpiresAt } as any)
        .where(eq(table.id, (session as any).id));
      newToken = await signToken((session as any).id, (session as any)[idField], newExpiresAt, sc.secret);
    }
  }

  return { sessionId: (session as any).id, accountId: (session as any)[idField], newToken };
}

/** 登出：标记 status 为 logged_out */
async function logoutRecord(table: typeof userSessions | typeof adminSessions, sessionId: string) {
  await db.update(table)
    .set({ status: "logged_out", loggedOutAt: new Date() } as any)
    .where(eq(table.id, sessionId));
}

/** 踢出单个会话 */
async function kickRecord(table: typeof userSessions | typeof adminSessions, sessionId: string) {
  await db.update(table)
    .set({ status: "kicked", loggedOutAt: new Date() } as any)
    .where(eq(table.id, sessionId));
}

/** 踢出某账号的所有会话 */
async function kickAllRecords(table: typeof userSessions | typeof adminSessions, idColumn: any, accountId: string) {
  await db.update(table)
    .set({ status: "kicked", loggedOutAt: new Date() } as any)
    .where(eq(idColumn, accountId));
}

/** 创建客户端会话 */
export function createClientSession(params: CreateSessionParams) {
  return createSessionRecord(userSessions, params, config.jwt.client);
}

/** 验证客户端会话 */
export function verifyClientSession(token: string) {
  return verifySessionRecord(userSessions, "userId", token, config.jwt.client);
}

/** 客户端登出 */
export function logoutClientSession(sessionId: string) {
  return logoutRecord(userSessions, sessionId);
}

/** 踢出客户端单个会话 */
export function kickClientSession(sessionId: string) {
  return kickRecord(userSessions, sessionId);
}

/** 踢出客户端所有会话 */
export function kickAllClientSessions(userId: string) {
  return kickAllRecords(userSessions, userSessions.userId, userId);
}

/** 创建管理端会话 */
export function createAdminSession(params: CreateSessionParams) {
  return createSessionRecord(adminSessions, params, config.jwt.admin);
}

/** 验证管理端会话 */
export function verifyAdminSession(token: string) {
  return verifySessionRecord(adminSessions, "adminId", token, config.jwt.admin);
}

/** 管理端登出 */
export function logoutAdminSession(sessionId: string) {
  return logoutRecord(adminSessions, sessionId);
}

/** 踢出管理端单个会话 */
export function kickAdminSession(sessionId: string) {
  return kickRecord(adminSessions, sessionId);
}

/** 踢出管理端所有会话 */
export function kickAllAdminSessions(adminId: string) {
  return kickAllRecords(adminSessions, adminSessions.adminId, adminId);
}

/** 更新管理端会话活跃时间（心跳） */
export async function touchAdminSession(sessionId: string) {
  await db.update(adminSessions)
    .set({ lastActiveAt: new Date() })
    .where(eq(adminSessions.id, sessionId));
}

/** 签发 JWT */
async function signToken(sessionId: string, accountId: string, expiresAt: Date, secret: string) {
  return await sign(
    {
      sessionId,
      accountId,
      exp: Math.floor(expiresAt.getTime() / 1000),
    },
    secret,
  );
}
