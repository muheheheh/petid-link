import { z } from "@hono/zod-openapi";
import { successResponse, errorResponse } from "@/schemas/common";

const contactItem = z.object({
  type: z.string(),
  value: z.string(),
  qr_key: z.string().optional(),
});

const petObject = z.object({
  id: z.string(),
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
  device_id: z.string().nullable(),
  created_at: z.number().nullable(),
});

/** 创建宠物 */
export const createPetSchema = {
  body: z.object({
    name: z.string().min(1, "name is required"),
    avatar: z.string().optional(),
    gender: z.enum(["male", "female", "unknown"]).optional(),
    breed: z.string().optional(),
    description: z.string().optional(),
    contacts: z.array(contactItem).optional(),
    contact_name: z.string().optional(),
    remark: z.string().optional(),
    images: z.array(z.string()).optional(),
  }),
  response: successResponse(z.object({ id: z.string() })),
  error: errorResponse,
};

/** 编辑宠物 */
export const updatePetSchema = {
  body: z.object({
    id: z.string().min(1, "id is required"),
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
  response: successResponse(z.null()),
  error: errorResponse,
};

/** 宠物列表 */
export const petListSchema = {
  response: successResponse(z.array(petObject)),
  error: errorResponse,
};

/** 宠物详情 */
export const petDetailSchema = {
  body: z.object({
    id: z.string().min(1, "id is required"),
  }),
  response: successResponse(petObject),
  error: errorResponse,
};

/** 切换宠物状态 */
export const togglePetStatusSchema = {
  body: z.object({
    id: z.string().min(1, "id is required"),
    status: z.enum(["normal", "lost"]),
  }),
  response: successResponse(z.null()),
  error: errorResponse,
};

/** 删除宠物 */
export const deletePetSchema = {
  body: z.object({
    id: z.string().min(1, "id is required"),
  }),
  response: successResponse(z.null()),
  error: errorResponse,
};

