import { OpenAPIHono } from "@hono/zod-openapi";
import { ERR, errMsg } from "@/errors";
import { resolveLang } from "@/response";
import type { Env } from "hono";

/** 创建带统一参数校验错误处理的 OpenAPIHono 实例 */
export function createOpenAPI<E extends Env = Env>() {
  return new OpenAPIHono<E>({
    defaultHook: (result, c) => {
      if (!result.success) {
        const lang = resolveLang(c);
        const details = result.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        }));
        return c.json(
          {
            code: ERR.COMMON_PARAM_INVALID,
            message: errMsg(ERR.COMMON_PARAM_INVALID, lang),
            details,
          },
          200,
        );
      }
    },
  });
}
