// ⚠️ 此文件由 scripts/gen-errors.ts 自动生成，请勿手动修改
// 源文件: resources/errors-admin.json

import { defineErrors } from "@/errors";

const errors = defineErrors({
  /** 管理员用户名或密码错误 */
  AUTH_LOGIN_FAILED: 10010001,
  /** 会话已过期或 JWT 验证失败 */
  AUTH_SESSION_EXPIRED: 10010002,
  /** 会话被踢出 */
  AUTH_SESSION_KICKED: 10010003,
} as const, {
  [10010001]: { "zh-Hans": "用户名或密码错误", "zh-Hant": "使用者名稱或密碼錯誤", "en": "Invalid username or password" },
  [10010002]: { "zh-Hans": "登录已过期，请重新登录", "zh-Hant": "登入已過期，請重新登入", "en": "Session expired, please login again" },
  [10010003]: { "zh-Hans": "账号已在其他设备登录", "zh-Hant": "帳號已在其他裝置登入", "en": "Account logged in on another device" },
});

export default errors;
export const { ERR, errMsg, BizError } = errors;
