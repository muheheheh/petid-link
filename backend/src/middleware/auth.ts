import type { Context, Next } from "hono";
import { eq } from "drizzle-orm";
import { ERR as CLIENT_ERR, BizError as ClientBizError } from "@/errors/client";
import { ERR as ADMIN_ERR, BizError as AdminBizError } from "@/errors/admin";
import { verifyClientSession, verifyAdminSession } from "@/services/session";
import { db } from "@/db";
import { admins } from "@/db/schema";
import type { AdminRole } from "@/types";

/** 从 Authorization 头提取 Bearer token */
function extractToken(c: Context): string | null {
  const authorization = c.req.header("Authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  return authorization.slice(7);
}

/**
 * 客户端鉴权中间件
 *
 * 验证 JWT → 设置 userId/sessionId → 滑动续期时通过 X-Refreshed-Token 返回新 token
 */
export async function clientAuth(c: Context, next: Next) {
  const token = extractToken(c);
  if (!token) throw new ClientBizError(CLIENT_ERR.COMMON_UNAUTHORIZED);

  try {
    const result = await verifyClientSession(token);
    c.set("userId", result.accountId);
    c.set("sessionId", result.sessionId);
    await next();
    if (result.newToken) {
      c.header("X-Refreshed-Token", result.newToken);
    }
  } catch {
    throw new ClientBizError(CLIENT_ERR.AUTH_SESSION_EXPIRED);
  }
}

/**
 * 管理端鉴权中间件
 *
 * 验证 JWT → 设置 adminId/sessionId → 滑动续期时通过 X-Refreshed-Token 返回新 token
 */
export async function adminAuth(c: Context, next: Next) {
  const token = extractToken(c);
  if (!token) throw new AdminBizError(ADMIN_ERR.COMMON_UNAUTHORIZED);

  try {
    const result = await verifyAdminSession(token);
    const admin = db.select({ role: admins.role }).from(admins).where(eq(admins.id, result.accountId)).get();
    if (!admin) throw new AdminBizError(ADMIN_ERR.COMMON_UNAUTHORIZED);

    c.set("adminId", result.accountId);
    c.set("sessionId", result.sessionId);
    c.set("adminRole", admin.role as AdminRole);
    await next();
    if (result.newToken) {
      c.header("X-Refreshed-Token", result.newToken);
    }
  } catch {
    throw new AdminBizError(ADMIN_ERR.AUTH_SESSION_EXPIRED);
  }
}

/**
 * 角色权限中间件工厂
 *
 * 传入允许的角色列表，不在列表中的角色返回 FORBIDDEN
 */
export function requireRole(...roles: AdminRole[]) {
  return async (c: Context, next: Next) => {
    const role = c.get("adminRole") as AdminRole;
    if (!roles.includes(role)) throw new AdminBizError(ADMIN_ERR.COMMON_FORBIDDEN);
    await next();
  };
}
