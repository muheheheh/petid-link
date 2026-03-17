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
 * 通过登录方式查找或创建用户
 *
 * 匹配优先级：
 * 1. provider + openId 精确匹配（同一方式老用户）
 * 2. phone 匹配（手机号关联已有用户）
 * 3. email 匹配（邮箱关联已有用户）
 * 4. unionId 匹配（微信跨平台关联同一用户）
 * 5. 创建全新用户
 */
export function findOrCreateUser(params: FindOrCreateParams): string {
  // 1. provider + openId 精确匹配
  const existingAuth = db.select()
    .from(userAuths)
    .where(and(eq(userAuths.provider, params.provider), eq(userAuths.openId, params.openId)))
    .get();

  if (existingAuth) {
    if (params.unionId && !existingAuth.unionId) {
      db.update(userAuths).set({ unionId: params.unionId }).where(eq(userAuths.id, existingAuth.id)).run();
    }
    updateUserInfo(existingAuth.userId, params);
    return existingAuth.userId;
  }

  // 2. 手机号匹配已有用户
  if (params.phone) {
    const userByPhone = db.select().from(users).where(eq(users.phone, params.phone)).get();
    if (userByPhone) {
      addAuthToUser(userByPhone.id, params);
      updateUserInfo(userByPhone.id, params);
      return userByPhone.id;
    }
  }

  // 3. 邮箱匹配已有用户
  if (params.email) {
    const userByEmail = db.select().from(users).where(eq(users.email, params.email)).get();
    if (userByEmail) {
      addAuthToUser(userByEmail.id, params);
      updateUserInfo(userByEmail.id, params);
      return userByEmail.id;
    }
  }

  // 4. unionId 匹配（微信跨平台）
  if (params.unionId) {
    const linkedAuth = db.select().from(userAuths).where(eq(userAuths.unionId, params.unionId)).get();
    if (linkedAuth) {
      addAuthToUser(linkedAuth.userId, params);
  updateUserInfo(linkedAuth.userId, params);
      return linkedAuth.userId;
    }
  }

  // 5. 创建全新用户
  const userId = crypto.randomUUID();

  db.insert(users).values({
    id: userId,
    phone: params.phone,
    email: params.email,
    nickname: params.nickname,
    avatar: params.avatar,
  }).run();

  addAuthToUser(userId, params);
  return userId;
}

/** 为已有用户添加新的认证方式 */
function addAuthToUser(userId: string, params: FindOrCreateParams) {
  db.insert(userAuths).values({
    id: crypto.randomUUID(),
    userId,
    provider: params.provider,
    openId: params.openId,
    unionId: params.unionId,
  }).run();
}

/** 更新用户基本信息（有值才更新，不覆盖已有数据） */
function updateUserInfo(userId: string, params: FindOrCreateParams) {
  const user = db.select().from(users).where(eq(users.id, userId)).get();
  if (!user) return;

  const updates: Record<string, string> = {};
  if (params.phone && !user.phone) updates.phone = params.phone;
  if (params.email && !user.email) updates.email = params.email;
  if (params.nickname && !user.nickname) updates.nickname = params.nickname;
  if (params.avatar && !user.avatar) updates.avatar = params.avatar;

  if (Object.keys(updates).length > 0) {
    db.update(users).set(updates).where(eq(users.id, userId)).run();
  }
}
