import { createRoute } from "@hono/zod-openapi";
import { createOpenAPI } from "@/openapi";
import type { AppEnv } from "@/types";
import { ok } from "@/response";
import { clientAuth } from "@/middleware/auth";
import { createPet, updatePet, getUserPets, getPetDetail, togglePetStatus, deletePet } from "@/services/pet";
import { createPetSchema, updatePetSchema, petListSchema, petDetailSchema, togglePetStatusSchema, deletePetSchema } from "@/schemas/pet";

const pet = createOpenAPI<AppEnv>();

pet.openapi(
  createRoute({
    method: "post",
    path: "/create",
    tags: ["宠物"],
    summary: "创建宠物",
    middleware: [clientAuth],
    security: [{ Bearer: [] }],
    request: {
      body: { content: { "application/json": { schema: createPetSchema.body } } },
    },
    responses: {
      200: {
        content: { "application/json": { schema: createPetSchema.response } },
        description: "创建成功",
      },
    },
  }),
  async (c) => {
    const body = c.req.valid("json");
    const userId = c.get("userId");
    const id = createPet({
      userId,
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
    return ok(c, { id });
  },
);

pet.openapi(
  createRoute({
    method: "post",
    path: "/update",
    tags: ["宠物"],
    summary: "编辑宠物信息",
    middleware: [clientAuth],
    security: [{ Bearer: [] }],
    request: {
      body: { content: { "application/json": { schema: updatePetSchema.body } } },
    },
    responses: {
      200: {
        content: { "application/json": { schema: updatePetSchema.response } },
        description: "更新成功",
      },
    },
  }),
  async (c) => {
    const body = c.req.valid("json");
    const userId = c.get("userId");
    updatePet({
      id: body.id,
      userId,
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
    return ok(c, null);
  },
);

pet.openapi(
  createRoute({
    method: "post",
    path: "/list",
    tags: ["宠物"],
    summary: "我的宠物列表",
    description: "返回当前用户的所有宠物，附带设备绑定状态",
    middleware: [clientAuth],
    security: [{ Bearer: [] }],
    responses: {
      200: {
        content: { "application/json": { schema: petListSchema.response } },
        description: "查询成功",
      },
    },
  }),
  async (c) => {
    const userId = c.get("userId");
    const list = getUserPets(userId);
    return ok(c, list);
  },
);

pet.openapi(
  createRoute({
    method: "post",
    path: "/detail",
    tags: ["宠物"],
    summary: "宠物详情",
    middleware: [clientAuth],
    security: [{ Bearer: [] }],
    request: {
      body: { content: { "application/json": { schema: petDetailSchema.body } } },
    },
    responses: {
      200: {
        content: { "application/json": { schema: petDetailSchema.response } },
        description: "查询成功",
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("json");
    const userId = c.get("userId");
    const detail = getPetDetail(id, userId);
    return ok(c, detail);
  },
);

pet.openapi(
  createRoute({
    method: "post",
    path: "/toggle-status",
    tags: ["宠物"],
    summary: "切换宠物状态",
    description: "在 normal（正常）和 lost（走丢）之间切换",
    middleware: [clientAuth],
    security: [{ Bearer: [] }],
    request: {
      body: { content: { "application/json": { schema: togglePetStatusSchema.body } } },
    },
    responses: {
      200: {
        content: { "application/json": { schema: togglePetStatusSchema.response } },
        description: "切换成功",
      },
    },
  }),
  async (c) => {
    const { id, status } = c.req.valid("json");
    const userId = c.get("userId");
    togglePetStatus(id, userId, status);
    return ok(c, null);
  },
);

pet.openapi(
  createRoute({
    method: "post",
    path: "/delete",
    tags: ["宠物"],
    summary: "删除宠物",
    description: "删除宠物并自动解绑关联的设备",
    middleware: [clientAuth],
    security: [{ Bearer: [] }],
    request: {
      body: { content: { "application/json": { schema: deletePetSchema.body } } },
    },
    responses: {
      200: {
        content: { "application/json": { schema: deletePetSchema.response } },
        description: "删除成功",
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("json");
    const userId = c.get("userId");
    deletePet(id, userId);
    return ok(c, null);
  },
);

export default pet;
