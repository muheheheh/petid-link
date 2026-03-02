import { z } from "@hono/zod-openapi";
import { successResponse, errorResponse, paginationQuery, paginatedResponse } from "@/schemas/common";

const contactItem = z.object({
  type: z.string(),
  value: z.string(),
});

const adminItem = z.object({
  id: z.string(),
  username: z.string(),
  nickname: z.string().nullable(),
  email: z.string().nullable(),
  role: z.string(),
  online: z.boolean(),
  last_active_at: z.number().nullable(),
  created_at: z.number().nullable(),
});

const sessionItem = z.object({
  id: z.string(),
  app: z.string().nullable(),
  device_type: z.string().nullable(),
  device: z.string().nullable(),
  os: z.string().nullable(),
  os_version: z.string().nullable(),
  ip: z.string().nullable(),
  user_agent: z.string().nullable(),
  status: z.string().nullable(),
  last_active_at: z.number().nullable(),
  created_at: z.number().nullable(),
});

const adminSessionItem = sessionItem.extend({
  admin_name: z.string().nullable(),
  admin_role: z.string().nullable(),
});

const userItem = z.object({
  id: z.string(),
  nickname: z.string().nullable(),
  avatar: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  created_at: z.number().nullable(),
});

const userListItem = userItem.extend({
  auth_providers: z.array(z.string()),
});

const userDetailItem = userListItem;

const deviceItem = z.object({
  id: z.string(),
  activation_code: z.string(),
  batch: z.string().nullable(),
  user_id: z.string().nullable(),
  user_nickname: z.string().nullable(),
  pet_id: z.string().nullable(),
  activated_at: z.number().nullable(),
  bound_at: z.number().nullable(),
  created_at: z.number().nullable(),
});

const deviceDetailItem = z.object({
  id: z.string(),
  activation_code: z.string(),
  batch: z.string().nullable(),
  user_id: z.string().nullable(),
  pet_id: z.string().nullable(),
  activated_at: z.number().nullable(),
  bound_at: z.number().nullable(),
  created_at: z.number().nullable(),
  user: userItem.nullable(),
  pet: z.object({
    id: z.string(),
    name: z.string(),
    avatar: z.string().nullable(),
    breed: z.string().nullable(),
    status: z.string().nullable(),
  }).nullable(),
});

const petItem = z.object({
id: z.string(),
  name: z.string(),
  avatar: z.string().nullable(),
  gender: z.string().nullable(),
  breed: z.string().nullable(),
  description: z.string().nullable(),
  contacts: z.array(contactItem).nullable(),
  contact_name: z.string().nullable(),
  remark: z.string().nullable(),
  status: z.string().nullable(),
  device_id: z.string().nullable(),
  created_at: z.number().nullable(),
});

// --- 账号管理 ---

export const adminManagerListSchema = {
  body: paginationQuery,
  response: paginatedResponse(adminItem),
};

export const adminManagerCreateSchema = {
  body: z.object({
    username: z.string().min(1, "username is required"),
    password: z.string().min(6, "password must be at least 6 characters"),
    nickname: z.string().optional(),
    email: z.string().optional(),
    role: z.enum(["super_admin", "admin", "operator", "developer"]).optional(),
  }),
  response: successResponse(z.object({ id: z.string() })),
};

export const adminManagerUpdateSchema = {
  body: z.object({
    id: z.string().min(1, "id is required"),
    username: z.string().min(1).optional(),
    nickname: z.string().optional(),
    email: z.string().optional(),
    password: z.string().min(6).optional(),
    role: z.enum(["super_admin", "admin", "operator", "developer"]).optional(),
  }),
  response: successResponse(z.null()),
};

export const adminManagerDeleteSchema = {
  body: z.object({
    id: z.string().min(1, "id is required"),
  }),
  response: successResponse(z.null()),
};

export const adminSessionListSchema = {
  body: paginationQuery.extend({
    admin_id: z.string().optional(),
  }),
  response: paginatedResponse(adminSessionItem),
};

export const adminKickSessionSchema = {
  body: z.object({
    session_id: z.string().min(1, "session_id is required"),
  }),
  response: successResponse(z.null()),
};

export const adminResetPasswordSchema = {
  body: z.object({
    id: z.string().min(1, "id is required"),
    new_password: z.string().min(6, "new_password must be at least 6 characters"),
  }),
  response: successResponse(z.null()),
};

// --- 用户管理 ---

export const adminUserListSchema = {
  body: paginationQuery.extend({
    user_id: z.string().optional(),
  }),
  response: paginatedResponse(userListItem),
};

export const adminUserDetailSchema = {
  body: z.object({
    id: z.string().min(1, "id is required"),
  }),
  response: successResponse(userDetailItem),
};

export const adminUserSessionListSchema = {
  body: paginationQuery.extend({
    user_id: z.string().min(1, "user_id is required"),
  }),
  response: paginatedResponse(sessionItem),
};

export const adminUserKickSessionSchema = {
  body: z.object({
    session_id: z.string().min(1, "session_id is required"),
  }),
  response: successResponse(z.null()),
};

// --- 设备管理 ---

export const adminDeviceListSchema = {
  body: paginationQuery.extend({
    user_id: z.string().optional(),
    batch: z.string().optional(),
    status: z.array(z.enum(["inactive", "activated", "bound"])).optional(),
  }),
  response: paginatedResponse(deviceItem),
};

export const adminDeviceCreateSchema = {
  body: z.object({
    count: z.number().int().min(1).max(1000),
    batch: z.string().optional(),
  }),
  response: successResponse(z.object({ ids: z.array(z.string()), batch: z.string() })),
};

export const adminDeviceDetailSchema = {
  body: z.object({
    id: z.string().min(1, "id is required"),
  }),
  response: successResponse(deviceDetailItem),
};

// --- 宠物管理 ---

const petListItem = z.object({
  id: z.string(),
  name: z.string(),
  avatar: z.string().nullable(),
  gender: z.string().nullable(),
  breed: z.string().nullable(),
  status: z.string().nullable(),
  user_id: z.string().nullable(),
  user_nickname: z.string().nullable(),
  device_id: z.string().nullable(),
  created_at: z.number().nullable(),
});

const petDetailItem = petListItem.extend({
  description: z.string().nullable(),
  contacts: z.array(contactItem).nullable(),
  contact_name: z.string().nullable(),
  remark: z.string().nullable(),
  images: z.array(z.string()).nullable(),
  user: userItem.nullable(),
  device: z.object({
    id: z.string(),
    activation_code: z.string(),
    activated_at: z.number().nullable(),
    bound_at: z.number().nullable(),
  }).nullable(),
});

export const adminPetListSchema = {
  body: paginationQuery.extend({
    user_id: z.string().optional(),
    status: z.array(z.enum(["normal", "lost"])).optional(),
  }),
  response: paginatedResponse(petListItem),
};

export const adminPetDetailSchema = {
  body: z.object({
    id: z.string().min(1, "id is required"),
  }),
  response: successResponse(petDetailItem),
};

// --- 扫码记录 ---

export const adminScanLogListSchema = {
  body: paginationQuery.extend({
    device_id: z.string().optional(),
    pet_id: z.string().optional(),
  }),
  response: paginatedResponse(z.object({
    id: z.string(),
    device_id: z.string().nullable(),
    pet_id: z.string().nullable(),
    pet_name: z.string().nullable(),
    ip: z.string().nullable(),
    user_agent: z.string().nullable(),
    latitude: z.string().nullable(),
    longitude: z.string().nullable(),
    scanned_at: z.number().nullable(),
  })),
};
