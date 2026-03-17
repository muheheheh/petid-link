import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { pets, devices } from "@/db/schema";
import { ERR, BizError } from "@/errors/client";

interface ContactItem {
  type: string;
  value: string;
}

interface CreatePetParams {
  userId: string;
  name: string;
  avatar?: string;
  gender?: string;
  breed?: string;
  description?: string;
  contacts?: ContactItem[];
  contactName?: string;
  remark?: string;
  images?: string[];
}

/** 创建宠物 */
export function createPet(params: CreatePetParams): string {
  const id = crypto.randomUUID();
  db.insert(pets).values({
    id,
    userId: params.userId,
    name: params.name,
    avatar: params.avatar,
    gender: params.gender as any,
    breed: params.breed,
    description: params.description,
    contacts: params.contacts ? JSON.stringify(params.contacts) : undefined,
    contactName: params.contactName,
    remark: params.remark,
    images: params.images ? JSON.stringify(params.images) : undefined,
  }).run();
  return id;
}

interface UpdatePetParams {
  id: string;
  userId: string;
  name?: string;
  avatar?: string;
  gender?: string;
  breed?: string;
  description?: string;
  contacts?: ContactItem[];
  contactName?: string;
  remark?: string;
  images?: string[];
}

/** 编辑宠物信息 */
export function updatePet(params: UpdatePetParams) {
  const pet = db.select().from(pets).where(and(eq(pets.id, params.id), eq(pets.userId, params.userId))).get();
  if (!pet) throw new BizError(ERR.PET_NOT_FOUND);

  const updates: Record<string, unknown> = {};
  if (params.name !== undefined) updates.name = params.name;
  if (params.avatar !== undefined) updates.avatar = params.avatar;
  if (params.gender !== undefined) updates.gender = params.gender;
  if (params.breed !== undefined) updates.breed = params.breed;
  if (params.description !== undefined) updates.description = params.description;
  if (params.contacts !== undefined) updates.contacts = JSON.stringify(params.contacts);
  if (params.contactName !== undefined) updates.contactName = params.contactName;
  if (params.remark !== undefined) updates.remark = params.remark;
  if (params.images !== undefined) updates.images = JSON.stringify(params.images);

  if (Object.keys(updates).length > 0) {
    db.update(pets).set(updates).where(eq(pets.id, params.id)).run();
  }
}

/** 解析 contacts JSON */
function parseContacts(raw: string | null): ContactItem[] | null {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function parseImages(raw: string | null): string[] | null {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

/** 格式化宠物信息 */
function formatPet(p: typeof pets.$inferSelect, deviceId: string | null = null) {
  return {
    id: p.id,
    name: p.name,
    avatar: p.avatar,
    gender: p.gender,
    breed: p.breed,
    description: p.description,
    contacts: parseContacts(p.contacts),
    contact_name: p.contactName,
    remark: p.remark,
    images: parseImages(p.images),
    status: p.status,
    device_id: deviceId,
    created_at: p.createdAt?.getTime() ?? null,
  };
}

/** 我的宠物列表（附带设备绑定状态） */
export function getUserPets(userId: string) {
  const rows = db.select().from(pets).where(eq(pets.userId, userId)).all();
  return rows.map((p) => {
    const device = db.select().from(devices).where(and(eq(devices.petId, p.id), eq(devices.userId, userId))).get();
    return formatPet(p, device?.id ?? null);
  });
}

/** 宠物详情 */
export function getPetDetail(petId: string, userId: string) {
  const pet = db.select().from(pets).where(and(eq(pets.id, petId), eq(pets.userId, userId))).get();
  if (!pet) throw new BizError(ERR.PET_NOT_FOUND);
  const device = db.select().from(devices).where(and(eq(devices.petId, petId), eq(devices.userId, userId))).get();
  return formatPet(pet, device?.id ?? null);
}

/** 切换宠物状态 */
export function togglePetStatus(petId: string, userId: string, status: "normal" | "lost") {
  const pet = db.select().from(pets).where(and(eq(pets.id, petId), eq(pets.userId, userId))).get();
  if (!pet) throw new BizError(ERR.PET_NOT_FOUND);
  db.update(pets).set({ status }).where(eq(pets.id, petId)).run();
}

/** 删除宠物（同时解绑设备） */
export function deletePet(petId: string, userId: string) {
  const pet = db.select().from(pets).where(and(eq(pets.id, petId), eq(pets.userId, userId))).get();
  if (!pet) throw new BizError(ERR.PET_NOT_FOUND);

  db.update(devices)
    .set({ petId: null, boundAt: null })
    .where(and(eq(devices.petId, petId), eq(devices.userId, userId)))
    .run();

  db.delete(pets).where(eq(pets.id, petId)).run();
}
