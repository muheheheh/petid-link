import type { Context } from "hono";
import { ERR, BizError, errMsg } from "@/errors";
import { emit } from "@/logger";
import type { ErrCode, Lang } from "@/errors";

const DEFAULT_LANG: Lang = "zh-Hans";

/**
 * 从 Accept-Language 请求头解析语言
 *
 * 匹配规则：zh-Hans/zh-CN/zh-SG/zh → 简体，zh-Hant/zh-TW/zh-HK → 繁体，en → 英文
 */
export function resolveLang(c: Context): Lang {
  const header = c.req.header("Accept-Language");
  if (!header) return DEFAULT_LANG;

  const tag = (header.split(",")[0] ?? "").trim().toLowerCase();

  if (tag.startsWith("zh-hans") || tag ==="zh-cn" || tag === "zh-sg" || tag === "zh") return "zh-Hans";
  if (tag.startsWith("zh-hant") || tag === "zh-tw" || tag === "zh-hk") return "zh-Hant";
  if (tag.startsWith("en")) return "en";

  return DEFAULT_LANG;
}

/** 统一成功响应 */
export function ok<T>(c: Context, data: T, message = "ok") {
  return c.json({ code: 0 as const, message, data }, 200);
}

/** 统一错误响应，message 根据 Accept-Language 自动匹配 */
export function fail(c: Context, code: ErrCode) {
  const lang = resolveLang(c);
  return c.json({ code, message: errMsg(code, lang) }, 200);
}

/** 从 Error.stack 提取第一个业务代码的文件和行号 */
function extractCaller(stack?: string): string | undefined {
  if (!stack) return undefined;
  const lines = stack.split("\n");
  for (const line of lines) {
    if (line.includes("/src/") && !line.includes("node_modules")) {
      const match = line.match(/\((.+)\)/) || line.match(/at\s+(.+)/);
      return match?.[1]?.trim();
    }
  }
  return undefined;
}

/** 全局错误处理，捕获 BizError 返回统一格式，其他异常返回 COMMON_UNKNOWN */
export function errorHandler(err: Error, c: Context) {
  const rid = c.get("requestId");
  const caller = extractCaller(err.stack);
  if (err instanceof BizError) {
    const lang = resolveLang(c);
    emit("warn", "业务异常", { rid, code: err.code, error: err.message, caller });
    return c.json({ code: err.code, message: errMsg(err.code, lang) }, 200);
  }
  emit("error", "未捕获异常", { rid, error: err.message, caller, stack: err.stack });
  return fail(c, ERR.COMMON_UNKNOWN);
}
