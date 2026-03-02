import { z } from "@hono/zod-openapi";
import { successResponse, errorResponse } from "@/schemas/common";

const contactItem = z.object({
  type: z.string(),
  value: z.string(),
});

/** 激活设备 */
export const activateDeviceSchema = {
  body: z.object({
    device_id: z.string().min(1, "device_id is required"),
    activation_code: z.string().min(1, "activation_code is required"),
  }),
  response: successResponse(z.null()),
  error: errorResponse,
};

/** 绑定宠物（二选一：传 pet_id 绑已有宠物，或传宠物信息创建并绑定） */
export const bindPetSchema = {
  body: z.object({
    device_id: z.string().min(1, "device_id is required"),
    pet_id: z.string().optional(),
    name: z.string().optional(),
    avatar: z.string().optional(),
    gender: z.enum(["male", "female", "unknown"]).optional(),
    breed: z.string().optional(),
    description: z.string().optional(),
    contacts: z.array(contactItem).optional(),
    contact_name: z.string().optional(),
    remark: z.string().optional(),
    images: z.array(z.string()).optional(),
  }),
  response: successResponse(z.object({ pet_id: z.string() })),
  error: errorResponse,
};

/** 解绑宠物 */
export const unbindPetSchema = {
  body: z.object({
    device_id: z.string().min(1, "device_id is required"),
  }),
  response: successResponse(z.null()),
  error: errorResponse,
};

/** 我的设备列表 */
export const deviceListSchema = {
  response: successResponse(
    z.array(z.object({
      id: z.string(),
      activated_at: z.number().nullable(),
      bound_at: z.number().nullable(),
      pet: z.object({
        id: z.string(),
        name: z.string(),
        avatar: z.string().nullable(),
        breed: z.string().nullable(),
        status: z.string().nullable(),
      }).nullable(),
    })),
  ),
  error: errorResponse,
};

/** 扫码查看 */
export const scanDeviceSchema = {
  body: z.object({
    device_id: z.string().min(1, "device_id is required"),
  }),
  response: successResponse(
    z.object({
      activated: z.boolean(),
      pet: z.object({
        name: z.string(),
        avatar: z.string().nullable(),
        gender: z.string().nullable(),
        breed: z.string().nullable(),
        description: z.string().nullable(),
        contacts: z.array(contactItem).nullable(),
        contact_name: z.string().nullable(),
        remark: z.string().nullable(),
        images: z.array(z.string()).nullable(),
        status: z.string().nullable(),
      }).nullable(),
    }),
  ),
  error: errorResponse,
};
