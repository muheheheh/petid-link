"use client";

import { request, ApiError } from "./api";

export type AdminRole = "super_admin" | "admin" | "operator" | "developer";

export interface AdminInfo {
  id: string;
  username: string;
  nickname: string | null;
  role: AdminRole;
}

const STORAGE_KEYS = {
  TOKEN: "petid_token",
  SESSION_ID: "petid_session_id",
  ADMIN_INFO: "petid_admin_info",
  THEME: "petid_theme",
} as const;

export { STORAGE_KEYS };

export async function login(username: string, password: string): Promise<string> {
  const data = await request<{ token: string; session_id: string; account: AdminInfo }>("/auth/login", { username, password });
  localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
  localStorage.setItem(STORAGE_KEYS.SESSION_ID, data.session_id);
  localStorage.setItem(STORAGE_KEYS.ADMIN_INFO, btoa(encodeURIComponent(JSON.stringify(data.account))));
  return data.token;
}

export function logout() {
  request("/auth/logout").catch(() => {});
  clearAuth();
  window.location.href = "/login";
}

/** 清除所有认证相关的本地存储 */
export function clearAuth() {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
  localStorage.removeItem(STORAGE_KEYS.ADMIN_INFO);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
}

export function getSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEYS.SESSION_ID);
}

export function getAdminInfo(): AdminInfo | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEYS.ADMIN_INFO);
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(atob(raw)));
  } catch {
    clearAuth();
    window.location.href = "/login";
    return null;
  }
}

export function setAdminInfo(info: AdminInfo) {
  localStorage.setItem(STORAGE_KEYS.ADMIN_INFO, btoa(encodeURIComponent(JSON.stringify(info))));
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export { ApiError };
