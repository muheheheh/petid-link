import type { Context } from "hono";

export type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * 带 requestId 的结构化日志
 *
 * 业务代码中使用，自动从 context 提取 rid，保证同一请求的日志可串联
 */
export function log(c: Context, level: LogLevel, message: string, data?: Record<string, unknown>) {
  emit(level, message, { rid: c.get("requestId"), ...data });
}

/** 不依赖 context 的日志输出（中间件、启动阶段等） */
export function emit(level: LogLevel, message: string, data?: Record<string, unknown>) {
  const entry: Record<string, unknown> = {
    time: new Date().toISOString(),
    level,
    message,
    ...data,
  };
  const output = JSON.stringify(entry);

  switch (level) {
    case "debug":
      console.debug(output);
      break;
    case "warn":
      console.warn(output);
      break;
    case "error":
      console.error(output);
      break;
    default:
      console.log(output);
  }
}
