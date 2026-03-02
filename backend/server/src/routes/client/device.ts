import { createRoute } from "@hono/zod-openapi";
import { createOpenAPI } from "@/openapi";
import type { AppEnv } from "@/types";
import { ok } from "@/response";
import { clientAuth } from "@/middleware/auth";
import { activateDevice, bindPetToDevice, unbindPetFromDevice, getUserDevices, getDevicePublicInfo } from "@/services/device";
import { activateDeviceSchema, bindPetSchema, unbindPetSchema, deviceListSchema, scanDeviceSchema } from "@/schemas/device";

const device = createOpenAPI<AppEnv>();

device.openapi(
  createRoute({
    method: "post",
    path: "/activate",
    tags: ["设备"],
    summary: "激活设备",
    description: "扫描二维码后输入校验码激活设备到当前用户",
    middleware: [clientAuth],
    security: [{ Bearer: [] }],
    request: {
      body: { content: { "application/json": { schema: activateDeviceSchema.body } } },
    },
    responses: {
      200: {
        content: { "application/json": { schema: activateDeviceSchema.response } },
        description: "激活成功",
      },
    },
  }),
  async (c) => {
    const { device_id, activation_code } = c.req.valid("json");
    const userId = c.get("userId");
    activateDevice(device_id, activation_code, userId);
    return ok(c, null);
  },
);

device.openapi(
  createRoute({
    method: "post",
    path: "/bind-pet",
    tags: ["设备"],
    summary: "绑定宠物",
    description: "传 pet_id 绑定已有宠物，或传宠物信息（name 等）创建新宠物并绑定",
    middleware: [clientAuth],
    security: [{ Bearer: [] }],
    request: {
      body: { content: { "application/json": { schema: bindPetSchema.body } } },
    },
    responses: {
      200: {
        content: { "application/json": { schema: bindPetSchema.response } },
        description: "绑定成功",
      },
    },
  }),
  async (c) => {
    const body = c.req.valid("json");
    const userId = c.get("userId");
    const petId = bindPetToDevice({
      deviceId: body.device_id,
      userId,
      petId: body.pet_id,
      name: body.name,
      avatar: body.avatar,
      gender: body.gender,
      breed: body.breed,
      description: body.description,
      contacts: body.contacts,
      contactName: body.contact_name,
      remark: body.remark,
      images: body.images,
    });
    return ok(c, { pet_id: petId });
  },
);

device.openapi(
  createRoute({
    method: "post",
    path: "/unbind-pet",
    tags: ["设备"],
    summary: "解绑宠物",
    description: "解除设备与宠物的绑定关系（换牌牌前使用）",
    middleware: [clientAuth],
    security: [{ Bearer: [] }],
    request: {
      body: { content: { "application/json": { schema: unbindPetSchema.body } } },
    },
    responses: {
      200: {
        content: { "application/json": { schema: unbindPetSchema.response } },
        description: "解绑成功",
      },
    },
  }),
  async (c) => {
    const { device_id } = c.req.valid("json");
    const userId = c.get("userId");
    unbindPetFromDevice(device_id, userId);
    return ok(c, null);
  },
);

device.openapi(
  createRoute({
    method: "post",
    path: "/list",
    tags: ["设备"],
    summary: "我的设备列表",
    middleware: [clientAuth],
    security: [{ Bearer: [] }],
    responses: {
      200: {
        content: { "application/json": { schema: deviceListSchema.response } },
        description: "查询成功",
      },
    },
  }),
  async (c) => {
    const userId = c.get("userId");
    const list = getUserDevices(userId);
    return ok(c, list);
  },
);

device.openapi(
  createRoute({
    method: "post",
    path: "/scan",
    tags: ["设备"],
    summary: "扫码查看",
    description: "扫描设备二维码查看宠物信息（无需登录）",
    request: {
      body: { content: { "application/json": { schema: scanDeviceSchema.body } } },
    },
    responses: {
      200: {
        content: { "application/json": { schema: scanDeviceSchema.response } },
        description: "查询成功",
      },
    },
  }),
  async (c) => {
    const { device_id } = c.req.valid("json");
    const info = getDevicePublicInfo(device_id);
    return ok(c, info);
  },
);

export default device;
