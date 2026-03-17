// ⚠️ 此文件由 scripts/gen-errors.ts 自动生成，请勿手动修改
// 源文件: resources/errors-client.json

import { defineErrors } from "@/errors";

const errors = defineErrors({
  /** 小程序 jscode2session 调用失败 */
  AUTH_WECHAT_LOGIN_FAILED: 10010001,
  /** 小程序获取手机号接口调用失败 */
  AUTH_WECHAT_PHONE_FAILED: 10010002,
  /** 微信 OAuth code 换 token 失败 */
  AUTH_WECHAT_OAUTH_FAILED: 10010003,
  /** 会话已过期或 JWT 验证失败 */
  AUTH_SESSION_EXPIRED: 10010004,
  /** 会话被踢出 */
  AUTH_SESSION_KICKED: 10010005,
  /** 验证码发送过于频繁 */
  AUTH_CODE_SEND_TOO_FAST: 10010006,
  /** 验证码错误或已过期 */
  AUTH_CODE_INVALID: 10010007,
  /** 验证码发送失败 */
  AUTH_CODE_SEND_FAILED: 10010008,
  /** 指定的宠物 ID 不存在 */
  PET_NOT_FOUND: 10020001,
  /** 指定的设备 ID 不存在 */
  DEVICE_NOT_FOUND: 10030001,
  /** 设备已被其他用户绑定 */
  DEVICE_ALREADY_BOUND: 10030002,
  /** 设备不属于当前用户 */
  DEVICE_NOT_OWNED: 10030003,
  /** 扫码对应的设备 ID 不存在 */
  SCAN_DEVICE_NOT_FOUND: 10040001,
} as const, {
  [10010001]: { "zh-Hans": "微信登录失败", "zh-Hant": "微信登入失敗", "en": "WeChat login failed" },
  [10010002]: { "zh-Hans": "获取手机号失败", "zh-Hant": "取得手機號碼失敗", "en": "Failed to get phone number" },
  [10010003]: { "zh-Hans": "微信授权失败", "zh-Hant": "微信授權失敗", "en": "WeChat OAuth failed" },
  [10010004]: { "zh-Hans": "登录已过期，请重新登录", "zh-Hant": "登入已過期，請重新登入", "en": "Session expired, please login again" },
  [10010005]: { "zh-Hans": "账号已在其他设备登录", "zh-Hant": "帳號已在其他裝置登入", "en": "Account logged in on another device" },
  [10010006]: { "zh-Hans": "发送过于频繁，请稍后再试", "zh-Hant": "發送過於頻繁，請稍後再試", "en": "Too many requests, please try again later" },
  [10010007]: { "zh-Hans": "验证码错误或已过期", "zh-Hant": "驗證碼錯誤或已過期", "en": "Invalid or expired verification code" },
  [10010008]: { "zh-Hans": "验证码发送失败，请稍后再试", "zh-Hant": "驗證碼發送失敗，請稍後再試", "en": "Failed to send verification code" },
  [10020001]: { "zh-Hans": "宠物不存在", "zh-Hant": "寵物不存在", "en": "Pet not found" },
  [10030001]: { "zh-Hans": "设备不存在", "zh-Hant": "裝置不存在", "en": "Device not found" },
  [10030002]: { "zh-Hans": "设备已被绑定", "zh-Hant": "裝置已被綁定", "en": "Device already bound" },
  [10030003]: { "zh-Hans": "无权操作此设备", "zh-Hant": "無權操作此裝置", "en": "Not your device" },
  [10040001]: { "zh-Hans": "扫码设备不存在", "zh-Hant": "掃碼裝置不存在", "en": "Scanned device not found" },
});

export default errors;
export const { ERR, errMsg, BizError } = errors;
