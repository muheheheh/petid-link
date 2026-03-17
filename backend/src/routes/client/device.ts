import { createRoute } from "@hono/zod-openapi";
import { createOpenAPI } from "@/openapi";
import clientErrors from "@/errors/client";
import type { AppEnv } from "@/types";
import { ok } from "@/response";
import { clientAuth } from "@/middleware/auth";
import { claimDevice, bindPetToDevice, unbindPetFromDevice, unbindDevice, getUserDevices, getDevicePublicInfo } from "@/services/device";
import { claimDeviceSchema, bindPetSchema, unbindPetSchema, unbindDeviceSchema, deviceListSchema, scanDeviceSchema } from "@/schemas/device";

const device = createOpenAPI<AppEnv>(clientErrors);

device.openapi(
  createRoute({
    method: "post",
    path: "/claim",
    tags: ["设备"],
    summary: "绑定设备",
    description: "首次扫码绑定设备到当前用户",
    middleware: [clientAuth],
    security: [{ Bearer: [] }],
    request: {
      body: { content: { "application/json": { schema: claimDeviceSchema.body } } },
    },
    responses: {
      200: {
        content: { "application/json": { schema: claimDeviceSchema.response } },
        description: "绑定成功",
      },
    },
  }),
  async (c) => {
    const { device_id } = c.req.valid("json");
    const userId = c.get("userId");
    const result = claimDevice(device_id, userId);
    return ok(c, result);
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
    description: "解除设备与宠物的绑定关系",
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
    path: "/unbind",
    tags: ["设备"],
    summary: "解绑设备",
    description: "释放设备归属，设备可被其他用户重新绑定",
    middleware: [clientAuth],
    security: [{ Bearer: [] }],
    request: {
      body: { content: { "application/json": { schema: unbindDeviceSchema.body } } },
    },
    responses: {
      200: {
        content: { "application/json": { schema: unbindDeviceSchema.response } },
        description: "解绑成功",
      },
    },
  }),
  async (c) => {
    const { device_id } = c.req.valid("json");
    const userId = c.get("userId");
    unbindDevice(device_id, userId);
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
