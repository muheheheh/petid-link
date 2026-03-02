import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { users, userAuths } from "@/db/schema";

export interface FindOrCreateParams {
  provider: string;
  openId: string;
  phone?: string;
  unionId?: string;
  email?: string;
  nickname?: string;
  avatar?: string;
}

/**
 * 通过第三方登录查找或创建用户
 *
 * 匹配优先级：
 * 1. provider + openId 精确匹配（同一平台老用户）
 * 2. unionId 匹配（微信跨平台关联同一用户）
 * 3. 创建全新用户
 */
export function findOrCreateUser(params: FindOrCreateParams): string {
  const existingAuth = db.select()
    .from(userAuths)
    .where(
      and(
        eq(userAuths.provider, params.provider),
        eq(userAuths.openId, params.openId),
      )
    )
    .get();

  if (existingAuth) {
    if (params.unionId && !existingAuth.unionId) {
      db.update(userAuths)
        .set({ unionId: params.unionId })
        .where(eq(userAuths.id, existingAuth.id))
        .run();
    }
    updateUserInfo(existingAuth.userId, params);
    return existingAuth.userId;
  }

  if (params.unionId) {
    const linkedAuth = db.select()
      .from(userAuths)
      .where(eq(userAuths.unionId, params.unionId))
      .get();

    if (linkedAuth) {
      db.insert(userAuths).values({
        id: crypto.randomUUID(),
        userId: linkedAuth.userId,
        provider: params.provider,
        openId: params.openId,
        unionId: params.unionId,
      }).run();

      updateUserInfo(linkedAuth.userId, params);
      return linkedAuth.userId;
    }
  }

  const userId = crypto.randomUUID();

  db.insert(users).values({
    id: userId,
    phone: params.phone,
    email: params.email,
    nickname: params.nickname,
    avatar: params.avatar,
  }).run();

  db.insert(userAuths).values({
    id: crypto.randomUUID(),
    userId,
    provider: params.provider,
    openId: params.openId,
    unionId: params.unionId,
  }).run();

  return userId;
}

/** 更新用户基本信息（有值才更新，不覆盖已有数据） */
function updateUserInfo(userId: string, params: FindOrCreateParams) {
  const updates: Record<string, string> = {};
  if (params.phone) updates.phone = params.phone;
  if (params.email) updates.email = params.email;
  if (params.nickname) updates.nickname = params.nickname;
  if (params.avatar) updates.avatar = params.avatar;

  if (Object.keys(updates).length > 0) {
    db.update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .run();
  }
}
