// ⚠️ 此文件由 scripts/gen-errors.ts 自动生成，请勿手动修改
// 源文件: errors.json

export type ErrCode = (typeof ERR)[keyof typeof ERR];
export type Lang = "zh-Hans" | "zh-Hant" | "en";

export const ERR = {
  /** 未知的服务器内部错误 */
  COMMON_UNKNOWN: 10000500,
  /** 请求参数校验失败 */
  COMMON_PARAM_INVALID: 10000400,
  /** 未携带有效的认证凭证 */
  COMMON_UNAUTHORIZED: 10000401,
  /** 已认证但无权访问该资源 */
  COMMON_FORBIDDEN: 10000403,
  /** 请求的资源不存在 */
  COMMON_NOT_FOUND: 10000404,
  /** 小程序 jscode2session 调用失败 */
  AUTH_WECHAT_LOGIN_FAILED: 10010001,
  /** 小程序获取手机号接口调用失败 */
  AUTH_WECHAT_PHONE_FAILED: 10010002,
  /** 微信 OAuth code 换 token 失败 */
  AUTH_WECHAT_OAUTH_FAILED: 10010003,
  /** Google ID Token 验证失败或 audience 不匹配 */
  AUTH_GOOGLE_TOKEN_INVALID: 10010004,
  /** 会话已过期或 JWT 验证失败 */
  AUTH_SESSION_EXPIRED: 10010005,
  /** 会话被踢出 */
  AUTH_SESSION_KICKED: 10010006,
  /** 账号用户名或密码错误 */
  AUTH_ADMIN_LOGIN_FAILED: 10010007,
  /** 指定的宠物 ID 不存在 */
  PET_NOT_FOUND: 10020001,
  /** 指定的设备 ID 不存在 */
  DEVICE_NOT_FOUND: 10030001,
  /** 设备已绑定到其他宠物 */
  DEVICE_ALREADY_BOUND: 10030002,
  /** 激活码不存在或已使用 */
  DEVICE_CODE_INVALID: 10030003,
  /** 设备已被其他用户激活 */
  DEVICE_ALREADY_ACTIVATED: 10030004,
  /** 设备尚未激活，无法绑定宠物 */
  DEVICE_NOT_ACTIVATED: 10030005,
  /** 设备不属于当前用户 */
  DEVICE_NOT_OWNED: 10030006,
  /** 扫码对应的设备 ID 不存在 */
  SCAN_DEVICE_NOT_FOUND: 10040001,
} as const;

const messages: Record<number, Record<Lang, string>> = {
  [10000500]: { "zh-Hans": "系统错误", "zh-Hant": "系統錯誤", "en": "System error" },
  [10000400]: { "zh-Hans": "参数错误", "zh-Hant": "參數錯誤", "en": "Invalid parameters" },
  [10000401]: { "zh-Hans": "未登录", "zh-Hant": "未登入", "en": "Unauthorized" },
  [10000403]: { "zh-Hans": "无权限", "zh-Hant": "無權限", "en": "Forbidden" },
  [10000404]: { "zh-Hans": "资源不存在", "zh-Hant": "資源不存在", "en": "Not found" },
  [10010001]: { "zh-Hans": "微信登录失败", "zh-Hant": "微信登入失敗", "en": "WeChat login failed" },
  [10010002]: { "zh-Hans": "获取手机号失败", "zh-Hant": "取得手機號碼失敗", "en": "Failed to get phone number" },
  [10010003]: { "zh-Hans": "微信授权失败", "zh-Hant": "微信授權失敗", "en": "WeChat OAuth failed" },
  [10010004]: { "zh-Hans": "Google 令牌无效", "zh-Hant": "Google 令牌無效", "en": "Invalid Google token" },
  [10010005]: { "zh-Hans": "登录已过期，请重新登录", "zh-Hant": "登入已過期，請重新登入", "en": "Session expired, please login again" },
  [10010006]: { "zh-Hans": "账号已在其他设备登录", "zh-Hant": "帳號已在其他裝置登入", "en": "Account logged in on another device" },
  [10010007]: { "zh-Hans": "用户名或密码错误", "zh-Hant": "使用者名稱或密碼錯誤", "en": "Invalid username or password" },
  [10020001]: { "zh-Hans": "宠物不存在", "zh-Hant": "寵物不存在", "en": "Pet not found" },
  [10030001]: { "zh-Hans": "设备不存在", "zh-Hant": "裝置不存在", "en": "Device not found" },
  [10030002]: { "zh-Hans": "设备已绑定", "zh-Hant": "裝置已綁定", "en": "Device already bound" },
  [10030003]: { "zh-Hans": "激活码无效", "zh-Hant": "啟用碼無效", "en": "Invalid activation code" },
  [10030004]: { "zh-Hans": "设备已被激活", "zh-Hant": "裝置已被啟用", "en": "Device already activated" },
  [10030005]: { "zh-Hans": "设备未激活", "zh-Hant": "裝置未啟用", "en": "Device not activated" },
  [10030006]: { "zh-Hans": "无权操作此设备", "zh-Hant": "無權操作此裝置", "en": "Not your device" },
  [10040001]: { "zh-Hans": "扫码设备不存在", "zh-Hant": "掃碼裝置不存在", "en": "Scanned device not found" },
};

export function errMsg(code: ErrCode, lang: Lang = "zh-Hans"): string {
  return messages[code]?.[lang] ?? messages[10000500]?.[lang] ?? "Unknown error";
}

// 业务异常
export class BizError extends Error {
  code: ErrCode;
  constructor(code: ErrCode, message?: string) {
    super(message ?? errMsg(code));
    this.code = code;
  }
}
