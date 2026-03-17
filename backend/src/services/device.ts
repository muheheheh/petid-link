import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { devices, pets } from "@/db/schema";
import { ERR, BizError } from "@/errors/client";

interface ContactItem {
  type: string;
  value: string;
}

/**
 * 首次扫码绑定设备到用户
 *
 * 设备无主 → 绑定到当前用户
 * 设备已有主 → 返回已绑定状态（不报错）
 */
export function claimDevice(deviceId: string, userId: string): { claimed: boolean } {
  const device = db.select().from(devices).where(eq(devices.id, deviceId)).get();
  if (!device) throw new BizError(ERR.DEVICE_NOT_FOUND);

  // 已经是自己的
  if (device.userId === userId) return { claimed: false };
  // 已被别人绑定
  if (device.userId) throw new BizError(ERR.DEVICE_ALREADY_BOUND);

  db.update(devices)
    .set({ userId, boundAt: new Date() })
    .where(eq(devices.id, deviceId))
    .run();

  return { claimed: true };
}

interface BindPetParams {
  deviceId: string;
  userId: string;
  petId?: string;
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

/** 绑定宠物：传 petId 绑已有宠物，或传宠物信息创建新宠物并绑定 */
export function bindPetToDevice(params: BindPetParams): string {
  const device = db.select().from(devices).where(eq(devices.id, params.deviceId)).get();
  if (!device) throw new BizError(ERR.DEVICE_NOT_FOUND);
  if (device.userId !== params.userId) throw new BizError(ERR.DEVICE_NOT_OWNED);
  if (device.petId) throw new BizError(ERR.DEVICE_ALREADY_BOUND);

  let petId: string;

  if (params.petId) {
    const pet = db.select().from(pets).where(eq(pets.id, params.petId)).get();
    if (!pet || pet.userId !== params.userId) throw new BizError(ERR.PET_NOT_FOUND);
    petId = params.petId;
  } else if (params.name) {
    petId = crypto.randomUUID();
    db.insert(pets).values({
      id: petId,
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
  } else {
    throw new BizError(ERR.COMMON_PARAM_INVALID);
  }

  db.update(devices)
    .set({ petId })
    .where(eq(devices.id, params.deviceId))
    .run();

  return petId;
}

/** 解绑宠物（用户端） */
export function unbindPetFromDevice(deviceId: string, userId: string) {
  const device = db.select().from(devices).where(eq(devices.id, deviceId)).get();
  if (!device) throw new BizError(ERR.DEVICE_NOT_FOUND);
  if (device.userId !== userId) throw new BizError(ERR.DEVICE_NOT_OWNED);
  if (!device.petId) throw new BizError(ERR.DEVICE_NOT_FOUND);

  db.update(devices)
    .set({ petId: null })
    .where(eq(devices.id, deviceId))
    .run();
}

/** 解绑设备（释放设备归属，同时清除宠物绑定） */
export function unbindDevice(deviceId: string, userId: string) {
  const device = db.select().from(devices).where(eq(devices.id, deviceId)).get();
  if (!device) throw new BizError(ERR.DEVICE_NOT_FOUND);
  if (device.userId !== userId) throw new BizError(ERR.DEVICE_NOT_OWNED);

  db.update(devices)
    .set({ userId: null, petId: null, boundAt: null })
    .where(eq(devices.id, deviceId))
    .run();
}

/** 我的设备列表 */
export function getUserDevices(userId: string) {
  const rows = db.select().from(devices).where(eq(devices.userId, userId)).all();

  return rows.map((d) => {
    let pet = null;
    if (d.petId) {
      const p = db.select().from(pets).where(eq(pets.id, d.petId)).get();
      if (p) {
        pet = { id: p.id, name: p.name, avatar: p.avatar, breed: p.breed, status: p.status };
      }
    }
    return {
      id: d.id,
      bound_at: d.boundAt?.getTime() ?? null,
      pet,
    };
  });
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

/** 扫码查询设备信息（公开接口） */
export function getDevicePublicInfo(deviceId: string) {
  const device = db.select().from(devices).where(eq(devices.id, deviceId)).get();
  if (!device) throw new BizError(ERR.SCAN_DEVICE_NOT_FOUND);

  if (!device.userId) return { bound: false, pet: null };
  if (!device.petId) return { bound: true, pet: null };

  const pet = db.select().from(pets).where(eq(pets.id, device.petId)).get();
  if (!pet) return { bound: true, pet: null };

  return {
    bound: true,
    pet: {
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
    },
  };
}
