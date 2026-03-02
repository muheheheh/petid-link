import type { Context, Next } from "hono";
import { emit } from "@/logger";

const PRINTABLE_TYPES = [
  "application/json",
  "application/xml",
  "text/xml",
  "text/plain",
  "text/html",
  "application/x-www-form-urlencoded",
  "multipart/form-data",
];

/** 判断 content-type 是否为可打印类型 */
function isPrintable(contentType: string | undefined): boolean {
  if (!contentType) return false;
  return PRINTABLE_TYPES.some((t) => contentType.includes(t));
}

/** 提取请求头为普通对象 */
function headersToObject(headers: Headers): Record<string, string> {
  const obj: Record<string, string> = {};
  headers.forEach((value, key) => {
    obj[key] = value;
  });
  return obj;
}

/**
 * 请求日志中间件
 *
 * 每个请求分配 requestId，记录请求/响应的完整信息（JSON 格式）。
 * 请求体仅打印 JSON/Form/XML 等文本类型，跳过文件和流。
 * 认证后的 userId/adminId/sessionId 会自动附加到日志。
 */
export async function requestLogger(c: Context, next: Next) {
  const requestId = crypto.randomUUID();
  c.set("requestId", requestId);

  const start = performance.now();
  const method = c.req.method;
  const path = c.req.path;
  const reqContentType = c.req.header("content-type");

  let requestBody: unknown = undefined;
  if (method !== "GET" && method !== "HEAD" && isPrintable(reqContentType)) {
    try {
      if (reqContentType?.includes("application/json")) {
        requestBody = await c.req.json();
      } else {
        requestBody = await c.req.text();
      }
    } catch {
      requestBody = "[parse error]";
    }
  }

  const reqData: Record<string, unknown> = {
    rid: requestId,
    method,
    path,
    headers: headersToObject(c.req.raw.headers),
  };
  if (requestBody !== undefined) {
    reqData.body = requestBody;
  }
  emit("info", "request", reqData);

  await next();

  const duration = Math.round(performance.now() - start);
  const status = c.res.status;
  const resContentType = c.res.headers.get("content-type");

  let responseBody: unknown = undefined;
  if (isPrintable(resContentType ?? undefined)) {
    try {
      responseBody = await c.res.clone().json();
    } catch {
      try {
        responseBody = await c.res.clone().text();
      } catch {
        responseBody = "[parse error]";
      }
    }
  }

  const resData: Record<string, unknown> = {
    rid: requestId,
    method,
    path,
    status,
    duration: `${duration}ms`,
    headers: headersToObject(c.res.headers),
  };
  if (responseBody !== undefined) {
    resData.body = responseBody;
  }

  const userId = c.get("userId");
  const adminId = c.get("adminId");
  const sessionId = c.get("sessionId");
  if (userId) resData.userId = userId;
  if (adminId) resData.adminId = adminId;
  if (sessionId) resData.sessionId = sessionId;

  emit("info", "response", resData);
}
