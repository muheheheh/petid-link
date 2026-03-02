import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 将毫秒时间戳转为用户本地时区的 yyyy-MM-dd HH:mm:ss */
export function formatTime(ms: number | null | undefined): string {
  if (!ms) return "-";
  const d = new Date(ms);
  if (isNaN(d.getTime())) return "-";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

const SESSION_STATUS_MAP: Record<string, { label: string; color: string }> = {
  active: { label: "活跃", color: "green" },
  logged_out: { label: "已登出", color: "default" },
  kicked: { label: "已踢出", color: "red" },
};

/** 会话状态中文映射 */
export function formatSessionStatus(status: string | null | undefined): string {
  if (!status) return "-";
  return SESSION_STATUS_MAP[status]?.label ?? status;
}

/** 会话状态颜色 */
export function sessionStatusColor(status: string | null | undefined): string {
  if (!status) return "default";
  return SESSION_STATUS_MAP[status]?.color ?? "default";
}
