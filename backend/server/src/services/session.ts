import { eq } from "drizzle-orm";
import { sign, verify } from "hono/jwt";
import { db } from "@/db";
import { sessions, adminSessions } from "@/db/schema";
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
async function createSessionRecord(table: any, params: CreateSessionParams, sc: SessionConfig) {
  const sessionId = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + sc.sessionMaxAge);
  const d = params.deviceInfo;
  const idField = table === adminSessions ? "adminId" : "userId";

  const isAdmin = table === adminSessions;

  db.insert(table).values({
    id: sessionId,
    [idField]: params.accountId,
    app: d.app,
    ...(isAdmin ? {} : { deviceType: d.type }),
    device: d.device,
    os: d.os,
    osVersion: d.os_version,
    ip: d.ip,
    userAgent: d.user_agent,
    status: "active",
    lastActiveAt: now,
    expiresAt,
  }).run();

  const token = await signToken(sessionId, params.accountId, expiresAt, sc.secret);
  return { token, sessionId };
}

/**
 * 验证会话：JWT 解码 → 查表 → 状态/过期检查 → 更新活跃时间 → 滑动续期
 *
 * 当剩余有效期 < renewThreshold 时自动续期，返回 newToken
 */
async function verifySessionRecord(table: any, idColumn: any, token: string, sc: SessionConfig): Promise<SessionResult> {
  const payload = await verify(token, sc.secret, "HS256") as unknown as JwtPayload;
  const session = db.select().from(table).where(eq(table.id, payload.sessionId)).get();

  if (!session) throw new Error("Session not found");
  if (session.status !== "active") throw new Error("Session is not active");
  if (session.expiresAt && session.expiresAt.getTime() < Date.now()) throw new Error("Session expired");

  db.update(table)
    .set({ lastActiveAt: new Date() })
    .where(eq(table.id, session.id))
    .run();

  let newToken: string | null = null;
  if (session.expiresAt) {
    const remaining = session.expiresAt.getTime() - Date.now();
    if (remaining < sc.renewThreshold) {
      const newExpiresAt = new Date(Date.now() + sc.sessionMaxAge);
      db.update(table)
        .set({ expiresAt: newExpiresAt })
        .where(eq(table.id, session.id))
        .run();
      newToken = await signToken(session.id, session[idColumn], newExpiresAt, sc.secret);
    }
  }

  return { sessionId: session.id, accountId: session[idColumn], newToken };
}

/** 登出：标记 status 为 logged_out */
function logoutRecord(table: any, sessionId: string) {
  db.update(table)
    .set({ status: "logged_out", loggedOutAt: new Date() })
    .where(eq(table.id, sessionId))
    .run();
}

/** 踢出单个会话 */
function kickRecord(table: any, sessionId: string) {
  db.update(table)
    .set({ status: "kicked", loggedOutAt: new Date() })
    .where(eq(table.id, sessionId))
    .run();
}

/** 踢出某账号的所有会话 */
function kickAllRecords(table: any, idColumn: any, accountId: string) {
  db.update(table)
    .set({ status: "kicked", loggedOutAt: new Date() })
    .where(eq(idColumn, accountId))
    .run();
}

/** 创建客户端会话 */
export function createClientSession(params: CreateSessionParams) {
  return createSessionRecord(sessions, params, config.jwt.client);
}

/** 验证客户端会话 */
export function verifyClientSession(token: string) {
  return verifySessionRecord(sessions, "userId", token, config.jwt.client);
}

/** 客户端登出 */
export function logoutClientSession(sessionId: string) {
  logoutRecord(sessions, sessionId);
}

/** 踢出客户端单个会话 */
export function kickClientSession(sessionId: string) {
  kickRecord(sessions, sessionId);
}

/** 踢出客户端所有会话 */
export function kickAllClientSessions(userId: string) {
  kickAllRecords(sessions, sessions.userId, userId);
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
  logoutRecord(adminSessions, sessionId);
}

/** 踢出管理端单个会话 */
export function kickAdminSession(sessionId: string) {
  kickRecord(adminSessions, sessionId);
}

/** 踢出管理端所有会话 */
export function kickAllAdminSessions(adminId: string) {
  kickAllRecords(adminSessions, adminSessions.adminId, adminId);
}

/** 更新管理端会话活跃时间（心跳） */
export function touchAdminSession(sessionId: string) {
  db.update(adminSessions)
    .set({ lastActiveAt: new Date() })
    .where(eq(adminSessions.id, sessionId))
    .run();
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
