import { eq, like, or, sql, and, desc } from "drizzle-orm";
import { db } from "@/db";
import { admins, adminSessions, users, userAuths, sessions, devices, pets, scanLogs } from "@/db/schema";
import { ERR, BizError } from "@/errors";

interface PaginationParams {
  page: number;
  pageSize: number;
  keyword?: string;
}

/** 验证账号用户名密码 */
export async function verifyAdminCredentials(username: string, password: string) {
  const admin = db.select().from(admins).where(eq(admins.username, username)).get();
  if (!admin) throw new BizError(ERR.AUTH_ADMIN_LOGIN_FAILED);

  const valid = await Bun.password.verify(password, admin.passwordHash);
  if (!valid) throw new BizError(ERR.AUTH_ADMIN_LOGIN_FAILED);

  return { id: admin.id, username: admin.username, nickname: admin.nickname, role: admin.role };
}

export async function changeAdminPassword(adminId: string, oldPassword: string, newPassword: string) {
  const admin = db.select().from(admins).where(eq(admins.id, adminId)).get();
  if (!admin) throw new BizError(ERR.COMMON_NOT_FOUND);

  const valid = await Bun.password.verify(oldPassword, admin.passwordHash);
  if (!valid) throw new BizError(ERR.AUTH_ADMIN_LOGIN_FAILED);

  const passwordHash = await Bun.password.hash(newPassword);
  db.update(admins).set({ passwordHash }).where(eq(admins.id, adminId)).run();
}


// --- 账号管理 ---

const ROLE_LEVEL: Record<string, number> = {
  super_admin: 100,
  admin: 50,
  operator: 10,
  developer: 10,
};

/** 获取角色等级，用于判断是否可以管理目标角色 */
export function canManageRole(operatorRole: string, targetRole: string): boolean {
  return (ROLE_LEVEL[operatorRole] ?? 0) > (ROLE_LEVEL[targetRole] ?? 0);
}

export function getAdminInfo(adminId: string) {
  const admin = db.select().from(admins).where(eq(admins.id, adminId)).get();
  if (!admin) throw new BizError(ERR.COMMON_NOT_FOUND);
  return { id: admin.id, username: admin.username, nickname: admin.nickname, role: admin.role };
}

export function getAdminList(params: PaginationParams) {
  const offset = (params.page - 1) * params.pageSize;
  const conditions = params.keyword
    ? or(like(admins.username, `%${params.keyword}%`), like(admins.nickname, `%${params.keyword}%`))
    : undefined;

  const list = db.select({
    id: admins.id,
    username: admins.username,
    nickname: admins.nickname,
    email: admins.email,
    role: admins.role,
    createdAt: admins.createdAt,
  }).from(admins).where(conditions).limit(params.pageSize).offset(offset).all();

  const countResult = db.select({ count: sql<number>`count(*)` }).from(admins).where(conditions).get();

  return {
    list: list.map((a) => {
      const latestSession = db.select({ lastActiveAt: adminSessions.lastActiveAt, status: adminSessions.status })
        .from(adminSessions)
        .where(eq(adminSessions.adminId, a.id))
        .orderBy(desc(adminSessions.lastActiveAt))
        .limit(1).get();
      const recentActive = db.select({ id: adminSessions.id })
        .from(adminSessions)
        .where(and(
          eq(adminSessions.adminId, a.id),
          eq(adminSessions.status, "active"),
          sql`${adminSessions.lastActiveAt} > ${Date.now() - 60000}`,
        ))
        .limit(1).get();
      return {
        id: a.id,
        username: a.username,
        nickname: a.nickname,
        email: a.email,
        role: a.role,
        online: !!recentActive,
        last_active_at: latestSession?.lastActiveAt?.getTime() ?? null,
        created_at: a.createdAt?.getTime() ?? null,
      };
    }),
    total: countResult?.count ?? 0,
    page: params.page,
    page_size: params.pageSize,
  };
}

export async function createAdmin(username: string, password: string, nickname?: string, email?: string, role?: string): Promise<string> {
  const existing = db.select().from(admins).where(eq(admins.username, username)).get();
  if (existing) throw new BizError(ERR.COMMON_PARAM_INVALID);

  const id = crypto.randomUUID();
  const passwordHash = await Bun.password.hash(password);

  db.insert(admins).values({ id, username, passwordHash, nickname, email, role: (role ?? "admin") as "super_admin" | "admin" | "operator" | "developer" }).run();
  return id;
}

export async function updateAdmin(id: string, nickname?: string, email?: string, password?: string, role?: string, username?: string) {
  const admin = db.select().from(admins).where(eq(admins.id, id)).get();
  if (!admin) throw new BizError(ERR.COMMON_NOT_FOUND);

  const updates: Record<string, unknown> = {};
  if (username !== undefined && username !== admin.username) {
    const existing = db.select().from(admins).where(eq(admins.username, username)).get();
    if (existing) throw new BizError(ERR.COMMON_PARAM_INVALID);
    updates.username = username;
  }
  if (nickname !== undefined) updates.nickname = nickname;
  if (email !== undefined) updates.email = email;
  if (password) updates.passwordHash = await Bun.password.hash(password);
  if (role !== undefined) updates.role = role;

  if (Object.keys(updates).length > 0) {
    db.update(admins).set(updates).where(eq(admins.id, id)).run();
  }
}

export function deleteAdmin(id: string) {
  const admin = db.select().from(admins).where(eq(admins.id, id)).get();
  if (!admin) throw new BizError(ERR.COMMON_NOT_FOUND);

  db.delete(adminSessions).where(eq(adminSessions.adminId, id)).run();
  db.delete(admins).where(eq(admins.id, id)).run();
}

// --- 账号会话 ---

function formatSession(s: any) {
  return {
    id: s.id,
    app: s.app,
    device_type: s.deviceType ?? null,
    device: s.device,
    os: s.os,
    os_version: s.osVersion,
    ip: s.ip,
    user_agent: s.userAgent,
    status: s.status,
    last_active_at: s.lastActiveAt?.getTime() ?? null,
    created_at: s.createdAt?.getTime() ?? null,
  };
}

export function getAdminSessionList(params: PaginationParams & { adminId?: string; currentRole?: string; currentId?: string }) {
  const offset = (params.page - 1) * params.pageSize;
  const conditions: any[] = [];
  if (params.adminId) {
    conditions.push(eq(adminSessions.adminId, params.adminId));
  } else if (params.currentRole === "admin" && params.currentId) {
    const manageableAdmins = db.select({ id: admins.id }).from(admins)
      .where(sql`${admins.role} IN ('operator', 'developer')`)
      .all().map((a) => a.id);
    manageableAdmins.push(params.currentId);
    conditions.push(sql`${adminSessions.adminId} IN (${sql.join(manageableAdmins.map(id => sql`${id}`), sql`, `)})`);
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const list = db.select({
    id: adminSessions.id,
    app: adminSessions.app,
    device: adminSessions.device,
    os: adminSessions.os,
    osVersion: adminSessions.osVersion,
    ip: adminSessions.ip,
    userAgent: adminSessions.userAgent,
    status: adminSessions.status,
    lastActiveAt: adminSessions.lastActiveAt,
    createdAt: adminSessions.createdAt,
    adminName: admins.nickname,
    adminUsername: admins.username,
    adminRole: admins.role,
  }).from(adminSessions)
    .leftJoin(admins, eq(adminSessions.adminId, admins.id))
    .where(where)
    .orderBy(desc(adminSessions.createdAt))
    .limit(params.pageSize).offset(offset).all();

  const countResult = db.select({ count: sql<number>`count(*)` }).from(adminSessions)
    .leftJoin(admins, eq(adminSessions.adminId, admins.id))
    .where(where).get();

  return {
    list: list.map((s) => ({
      ...formatSession(s),
      admin_name: s.adminName || s.adminUsername || null,
      admin_role: s.adminRole || null,
    })),
    total: countResult?.count ?? 0,
    page: params.page,
    page_size: params.pageSize,
  };
}

export function kickAdminSessionById(sessionId: string) {
  const session = db.select().from(adminSessions).where(eq(adminSessions.id, sessionId)).get();
  if (!session) throw new BizError(ERR.COMMON_NOT_FOUND);

  db.update(adminSessions)
    .set({ status: "kicked", loggedOutAt: new Date() })
    .where(eq(adminSessions.id, sessionId)).run();
}

/** 获取会话所属账号 ID */
export function getAdminSessionOwnerId(sessionId: string): string | null {
  const session = db.select({ adminId: adminSessions.adminId }).from(adminSessions).where(eq(adminSessions.id, sessionId)).get();
  return session?.adminId ?? null;
}

// --- 用户管理 ---

export function getUserList(params: PaginationParams & { userId?: string }) {
  const offset = (params.page - 1) * params.pageSize;
  const conditions: any[] = [];
  if (params.keyword) conditions.push(or(like(users.phone, `%${params.keyword}%`), like(users.nickname, `%${params.keyword}%`)));
  if (params.userId) conditions.push(eq(users.id, params.userId));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const list = db.select().from(users).where(where).limit(params.pageSize).offset(offset).all();
  const countResult = db.select({ count: sql<number>`count(*)` }).from(users).where(where).get();

  return {
    list: list.map((u) => {
      const auths = db.select({ provider: userAuths.provider }).from(userAuths).where(eq(userAuths.userId, u.id)).all();
      return {
        id: u.id,
        nickname: u.nickname,
        avatar: u.avatar,
        phone: u.phone,
        email: u.email,
        auth_providers: auths.map((a) => a.provider),
        created_at: u.createdAt?.getTime() ?? null,
      };
    }),
    total: countResult?.count ?? 0,
    page: params.page,
    page_size: params.pageSize,
  };
}

export function getUserDetail(userId: string) {
  const user = db.select().from(users).where(eq(users.id, userId)).get();
  if (!user) throw new BizError(ERR.COMMON_NOT_FOUND);

  const auths = db.select({ provider: userAuths.provider }).from(userAuths).where(eq(userAuths.userId, userId)).all();

  return {
    id: user.id,
    nickname: user.nickname,
    avatar: user.avatar,
    phone: user.phone,
    email: user.email,
    created_at: user.createdAt?.getTime() ?? null,
    auth_providers: auths.map((a) => a.provider),
  };
}

export function getUserSessionList(userId: string, params: PaginationParams) {
  const offset = (params.page - 1) * params.pageSize;

  const list = db.select().from(sessions)
    .where(eq(sessions.userId, userId))
    .limit(params.pageSize).offset(offset).all();

  const countResult = db.select({ count: sql<number>`count(*)` }).from(sessions)
    .where(eq(sessions.userId, userId)).get();

  return {
    list: list.map(formatSession),
    total: countResult?.count ?? 0,
    page: params.page,
    page_size: params.pageSize,
  };
}

export function kickUserSessionById(sessionId: string) {
  const session = db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
  if (!session) throw new BizError(ERR.COMMON_NOT_FOUND);

  db.update(sessions)
    .set({ status: "kicked", loggedOutAt: new Date() })
    .where(eq(sessions.id, sessionId)).run();
}

function parseContacts(raw: string | null) {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function parseImages(raw: string | null): string[] | null {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}



// --- 设备管理 ---

export function getDeviceList(params: PaginationParams & { userId?: string; status?: string[]; batch?: string }) {
  const offset = (params.page - 1) * params.pageSize;
  const conditions: any[] = [];
  if (params.keyword) conditions.push(like(devices.id, `%${params.keyword}%`));
  if (params.userId) conditions.push(eq(devices.userId, params.userId));
  if (params.batch) conditions.push(eq(devices.batch, params.batch));
  if (params.status?.length) {
    const statusConds: any[] = [];
    for (const s of params.status) {
      if (s === "inactive") statusConds.push(sql`${devices.userId} IS NULL`);
      if (s === "activated") statusConds.push(and(sql`${devices.userId} IS NOT NULL`, sql`${devices.petId} IS NULL`));
      if (s === "bound") statusConds.push(sql`${devices.petId} IS NOT NULL`);
    }
    if (statusConds.length) conditions.push(or(...statusConds));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const list = db.select({
    id: devices.id,
    activationCode: devices.activationCode,
    batch: devices.batch,
    userId: devices.userId,
    userNickname: users.nickname,
    petId: devices.petId,
    activatedAt: devices.activatedAt,
    boundAt: devices.boundAt,
    createdAt: devices.createdAt,
  }).from(devices)
    .leftJoin(users, eq(devices.userId, users.id))
    .where(where)
    .limit(params.pageSize).offset(offset).all();

  const countResult = db.select({ count: sql<number>`count(*)` }).from(devices).where(where).get();

  return {
    list: list.map((d) => ({
      id: d.id,
      activation_code: d.activationCode,
      batch: d.batch ?? null,
      user_id: d.userId,
      user_nickname: d.userNickname ?? null,
      pet_id: d.petId,
      activated_at: d.activatedAt?.getTime() ?? null,
      bound_at: d.boundAt?.getTime() ?? null,
      created_at: d.createdAt?.getTime() ?? null,
    })),
    total: countResult?.count ?? 0,
    page: params.page,
    page_size: params.pageSize,
  };
}

/** 去掉易混淆字符（0/O、1/I/L）的字符集 */
const ACTIVATION_CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/** 生成 8 位激活码 */
function generateActivationCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => ACTIVATION_CHARS[b % ACTIVATION_CHARS.length]).join("");
}

export function batchCreateDevices(count: number, batch?: string): { ids: string[]; batch: string } {
  const batchNo = batch || generateBatchNo();
  const ids: string[] = [];
  for (let i = 0; i < count; i++) {
    const id = crypto.randomUUID();
    const activationCode = generateActivationCode();
    db.insert(devices).values({ id, activationCode, batch: batchNo }).run();
    ids.push(id);
  }
  return { ids, batch: batchNo };
}

function generateBatchNo(): string {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const time = `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
  return `B${date}-${time}`;
}

export function getDeviceDetail(deviceId: string) {
  const device = db.select().from(devices).where(eq(devices.id, deviceId)).get();
  if (!device) throw new BizError(ERR.COMMON_NOT_FOUND);

  let user = null;
  if (device.userId) {
    const u = db.select().from(users).where(eq(users.id, device.userId)).get();
    if (u) {
      user = {
        id: u.id,
        nickname: u.nickname,
        avatar: u.avatar,
        phone: u.phone,
        email: u.email,
        created_at: u.createdAt?.getTime() ?? null,
      };
    }
  }

  let pet = null;
  if (device.petId) {
    const p = db.select().from(pets).where(eq(pets.id, device.petId)).get();
    if (p) {
      pet = { id: p.id, name: p.name, avatar: p.avatar, breed: p.breed, status: p.status };
    }
  }

  return {
    id: device.id,
    activation_code: device.activationCode,
    batch: device.batch ?? null,
    user_id: device.userId,
    pet_id: device.petId,
    activated_at: device.activatedAt?.getTime() ?? null,
    bound_at: device.boundAt?.getTime() ?? null,
    created_at: device.createdAt?.getTime() ?? null,
    user,
    pet,
  };
}

// --- 宠物管理 ---

export function getPetList(params: PaginationParams & { userId?: string; status?: string[] }) {
  const offset = (params.page - 1) * params.pageSize;
  const conditions: any[] = [];
  if (params.keyword) conditions.push(or(like(pets.name, `%${params.keyword}%`), like(pets.breed, `%${params.keyword}%`)));
  if (params.userId) conditions.push(eq(pets.userId, params.userId));
  if (params.status?.length) conditions.push(sql`${pets.status} IN (${sql.join(params.status.map(s => sql`${s}`), sql`, `)})`);
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const list = db.select({
    id: pets.id,
    name: pets.name,
    avatar: pets.avatar,
    gender: pets.gender,
    breed: pets.breed,
    status: pets.status,
    userId: pets.userId,
    userNickname: users.nickname,
    createdAt: pets.createdAt,
  }).from(pets)
    .leftJoin(users, eq(pets.userId, users.id))
    .where(where)
    .limit(params.pageSize).offset(offset).all();

  const countResult = db.select({ count: sql<number>`count(*)` }).from(pets).where(where).get();

  return {
    list: list.map((p) => {
      const device = db.select().from(devices).where(eq(devices.petId, p.id)).get();
      return {
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        gender: p.gender,
        breed: p.breed,
        status: p.status,
        user_id: p.userId,
        user_nickname: p.userNickname ?? null,
        device_id: device?.id ?? null,
        created_at: p.createdAt?.getTime() ?? null,
      };
    }),
    total: countResult?.count ?? 0,
    page: params.page,
    page_size: params.pageSize,
  };
}

export function getPetDetail(petId: string) {
  const pet = db.select().from(pets).where(eq(pets.id, petId)).get();
  if (!pet) throw new BizError(ERR.COMMON_NOT_FOUND);

  const device = db.select().from(devices).where(eq(devices.petId, petId)).get();

  let user = null;
  if (pet.userId) {
    const u = db.select().from(users).where(eq(users.id, pet.userId)).get();
    if (u) {
      user = {
        id: u.id,
        nickname: u.nickname,
        avatar: u.avatar,
        phone: u.phone,
        email: u.email,
        created_at: u.createdAt?.getTime() ?? null,
      };
    }
  }

  return {
    id: pet.id,
    name: pet.name,
    avatar: pet.avatar,
    gender: pet.gender,
    breed: pet.breed,
    description: pet.description,
    contacts: parseContacts(pet.contacts),
    contact_name: pet.contactName,
    remark: pet.remark,
    images: parseImages(pet.images),
    status: pet.status,
    user_id: pet.userId,
    device_id: device?.id ?? null,
    created_at: pet.createdAt?.getTime() ?? null,
    user,
    device: device ? {
      id: device.id,
      activation_code: device.activationCode,
      activated_at: device.activatedAt?.getTime() ?? null,
      bound_at: device.boundAt?.getTime() ?? null,
    } : null,
  };
}


// --- 扫码记录 ---

export function getScanLogList(params: PaginationParams & { deviceId?: string; petId?: string }) {
  const offset = (params.page - 1) * params.pageSize;
  const conditions: any[] = [];
  if (params.deviceId) conditions.push(eq(scanLogs.deviceId, params.deviceId));
  if (params.petId) {
    const petDevices = db.select({ id: devices.id }).from(devices).where(eq(devices.petId, params.petId)).all();
    if (petDevices.length) {
      conditions.push(sql`${scanLogs.deviceId} IN (${sql.join(petDevices.map(d => sql`${d.id}`), sql`, `)})`);
    } else {
      return { list: [], total: 0, page: params.page, page_size: params.pageSize };
    }
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const list = db.select().from(scanLogs).where(where).orderBy(desc(scanLogs.scannedAt)).limit(params.pageSize).offset(offset).all();
  const countResult = db.select({ count: sql<number>`count(*)` }).from(scanLogs).where(where).get();

  return {
    list: list.map((s) => {
      const device = s.deviceId ? db.select({ petId: devices.petId }).from(devices).where(eq(devices.id, s.deviceId)).get() : null;
      const pet = device?.petId ? db.select({ id: pets.id, name: pets.name }).from(pets).where(eq(pets.id, device.petId)).get() : null;
      return {
        id: s.id,
        device_id: s.deviceId,
        pet_id: pet?.id ?? null,
        pet_name: pet?.name ?? null,
        ip: s.ip,
        user_agent: s.userAgent,
        latitude: s.latitude,
        longitude: s.longitude,
        scanned_at: s.scannedAt?.getTime() ?? null,
      };
    }),
    total: countResult?.count ?? 0,
    page: params.page,
    page_size: params.pageSize,
  };
}


// --- 首页统计 ---

export function getDashboardStats(startTime?: number, endTime?: number) {
  const now = new Date();
  const start = startTime ?? new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const end = endTime ?? now.getTime();

  const userCount = db.select({ count: sql<number>`count(*)` }).from(users).get()?.count ?? 0;
  const petCount = db.select({ count: sql<number>`count(*)` }).from(pets).get()?.count ?? 0;
  const deviceCount = db.select({ count: sql<number>`count(*)` }).from(devices).get()?.count ?? 0;
  const deviceActivatedCount = db.select({ count: sql<number>`count(*)` }).from(devices).where(sql`${devices.userId} IS NOT NULL`).get()?.count ?? 0;
  const deviceBoundCount = db.select({ count: sql<number>`count(*)` }).from(devices).where(sql`${devices.petId} IS NOT NULL`).get()?.count ?? 0;
  const lostPetCount = db.select({ count: sql<number>`count(*)` }).from(pets).where(eq(pets.status, "lost")).get()?.count ?? 0;

  const timeRange = and(sql`created_at >= ${start}`, sql`created_at <= ${end}`);
  const newUserCount = db.select({ count: sql<number>`count(*)` }).from(users).where(timeRange).get()?.count ?? 0;
  const newPetCount = db.select({ count: sql<number>`count(*)` }).from(pets).where(timeRange).get()?.count ?? 0;
  const newDeviceCount = db.select({ count: sql<number>`count(*)` }).from(devices).where(timeRange).get()?.count ?? 0;

  const scanCount = db.select({ count: sql<number>`count(*)` }).from(scanLogs)
    .where(and(sql`${scanLogs.scannedAt} >= ${start}`, sql`${scanLogs.scannedAt} <= ${end}`)).get()?.count ?? 0;

  const recentScans = db.select().from(scanLogs).orderBy(desc(scanLogs.scannedAt)).limit(5).all();
  const recent_scans = recentScans.map((s) => {
    const device = s.deviceId ? db.select({ petId: devices.petId }).from(devices).where(eq(devices.id, s.deviceId)).get() : null;
    const pet = device?.petId ? db.select({ name: pets.name }).from(pets).where(eq(pets.id, device.petId)).get() : null;
    return {
      id: s.id,
      device_id: s.deviceId,
      pet_name: pet?.name ?? null,
      scanned_at: s.scannedAt?.getTime() ?? null,
    };
  });

  return {
    user_count: userCount,
    new_user_count: newUserCount,
    pet_count: petCount,
    new_pet_count: newPetCount,
    device_count: deviceCount,
    new_device_count: newDeviceCount,
    device_activated_count: deviceActivatedCount,
    device_bound_count: deviceBoundCount,
    lost_pet_count: lostPetCount,
    scan_count: scanCount,
    recent_scans,
  };
}
