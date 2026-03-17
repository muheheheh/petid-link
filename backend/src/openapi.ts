import { OpenAPIHono } from "@hono/zod-openapi";
import type { ErrorModule } from "@/errors";
import { resolveLang } from "@/response";
import type { Env } from "hono";

/**
 * 创建带统一参数校验错误处理的 OpenAPIHono 实例
 *
 * 传入该端的错误模块
 */
export function createOpenAPI<E extends Env = Env>(errors: ErrorModule<any>) {
  return new OpenAPIHono<E>({
    defaultHook: (result, c) => {
      if (!result.success) {
        const lang = resolveLang(c);
        const details = result.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        }));
        return c.json({ ...errors.paramInvalid(lang), details }, 200);
      }
    },
  });
}
