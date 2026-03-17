import type { Context } from "hono";
import { getConnInfo } from "hono/bun";
import type { DeviceType } from "@/types";

/** 客户端通过 X-Client-Info 头传递的信息 */
export interface ClientInfo {
  /** 应用标识（固定值 petid-link） */
  app: string;
  /** 客户端类型 */
  type: DeviceType;
  /** 设备型号 */
  device?: string;
  /** 操作系统 */
  os?: string;
  /** 系统版本 */
  os_version?: string;
}

/** 完整的设备信息（客户端传递 + 后端提取） */
export interface DeviceInfo {
  app?: string;
  type?: DeviceType;
  device?: string;
  os?: string;
  os_version?: string;
  /** 后端从请求头提取 */
  ip?: string;
  /** 后端从请求头提取 */
  user_agent?: string;
}

const SHIFT_OFFSET = 5;

/**
 * 编码客户端信息
 *
 * JSON → encodeURIComponent → Base64 → 字节偏移混淆
 */
export function encodeClientInfo(info: ClientInfo): string {
  const json = JSON.stringify(info);
  const base64 = btoa(encodeURIComponent(json));
  return shift(base64, SHIFT_OFFSET);
}

/**
 * 解码客户端信息
 *
 * 字节反偏移 → Base64 → decodeURIComponent → JSON.parse
 */
export function decodeClientInfo(encoded: string): ClientInfo | null {
  try {
    const base64 = shift(encoded, -SHIFT_OFFSET);
    const json = decodeURIComponent(atob(base64));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * 从请求中提取完整设备信息
 *
 * 合并 X-Client-Info 解码结果与后端提取的 IP、User-Agent
 * 当无 X-Client-Info 时，从 User-Agent 解析基本设备信息
 */
export function extractDeviceInfo(c: Context): DeviceInfo {
  const ip = c.req.header("X-Forwarded-For") || c.req.header("X-Real-IP") || c.req.header("CF-Connecting-IP") || getConnectingIP(c);
  const user_agent = c.req.header("User-Agent");
  const encoded = c.req.header("X-Client-Info");
  const clientInfo = encoded ? decodeClientInfo(encoded) : null;

  if (clientInfo) {
    return { ...clientInfo, ip, user_agent };
  }

  return { ...parseUserAgent(user_agent), ip, user_agent };
}

/** 从连接信息中获取 IP */
function getConnectingIP(c: Context): string | undefined {
  try {
    const info = getConnInfo(c);
    return info.remote.address ?? undefined;
  } catch {
    return undefined;
  }
}

/** 从 User-Agent 字符串解析基本设备信息 */
function parseUserAgent(ua?: string): Partial<DeviceInfo> {
  if (!ua) return {};

  let os: string | undefined;
  let os_version: string | undefined;
  let device: string | undefined;
  let type: DeviceType | undefined;

  if (/Windows NT ([\d.]+)/.test(ua)) {
    os = "Windows";
    os_version = RegExp.$1;
    type = "web";
  } else if (/Mac OS X ([\d_]+)/.test(ua)) {
    os = "macOS";
    os_version = RegExp.$1.replace(/_/g, ".");
    type = "web";
  } else if (/iPhone OS ([\d_]+)/.test(ua)) {
    os = "iOS";
    os_version = RegExp.$1.replace(/_/g, ".");
    type = "h5";
  } else if (/Android ([\d.]+)/.test(ua)) {
    os = "Android";
    os_version = RegExp.$1;
    type = "h5";
  } else if (/Linux/.test(ua)) {
    os = "Linux";
    type = "web";
  }

  if (/Chrome\/([\d.]+)/.test(ua)) {
    device = `Chrome ${RegExp.$1.split(".")[0]}`;
  } else if (/Firefox\/([\d.]+)/.test(ua)) {
    device = `Firefox ${RegExp.$1.split(".")[0]}`;
  } else if (/Safari\/([\d.]+)/.test(ua) && /Version\/([\d.]+)/.test(ua)) {
    device = `Safari ${RegExp.$1.split(".")[0]}`;
  } else if (/Edg\/([\d.]+)/.test(ua)) {
    device = `Edge ${RegExp.$1.split(".")[0]}`;
  }

  return { os, os_version, device, type };
}

/** 字符偏移混淆 */
function shift(str: string, offset: number): string {
  return str
    .split("")
    .map((ch) => String.fromCharCode(ch.charCodeAt(0) + offset))
    .join("");
}
