import { message } from "antd";
import { getToken, clearAuth } from "./auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/admin";

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  details?: { field: string; message: string }[];
}

interface PaginatedData<T> {
  list: T[];
  total: number;
  page: number;
  page_size: number;
}

class ApiError extends Error {
  code: number;
  details?: { field: string; message: string }[];
  constructor(code: number, message: string, details?: { field: string; message: string }[]) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

async function request<T>(path: string, body?: unknown): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json: ApiResponse<T> = await res.json();

  if (json.code !== 0) {
    if (json.code === 10010005 || json.code === 10010006) {
      if (typeof window !== "undefined") {
        clearAuth();
        message.error(json.message);
        setTimeout(() => { window.location.href = "/login"; }, 1500);
      }
    }
    throw new ApiError(json.code, json.message, json.details);
  }

  return json.data;
}

export { request, ApiError };
export type { PaginatedData };
