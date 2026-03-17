/** 支持的语言 */
export type Lang = "zh-Hans" | "zh-Hant" | "en";

/** 公共错误码（两端共用 code，各端可覆盖文案） */
export const COMMON_CODES = {
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
} as const;

/** 公共错误码默认文案 */
export const COMMON_MESSAGES: Record<number, Record<Lang, string>> = {
  [10000500]: { "zh-Hans": "系统错误", "zh-Hant": "系統錯誤", en: "System error" },
  [10000400]: { "zh-Hans": "参数错误", "zh-Hant": "參數錯誤", en: "Invalid parameters" },
  [10000401]: { "zh-Hans": "未登录", "zh-Hant": "未登入", en: "Unauthorized" },
  [10000403]: { "zh-Hans": "无权限", "zh-Hant": "無權限", en: "Forbidden" },
  [10000404]: { "zh-Hans": "资源不存在", "zh-Hant": "資源不存在", en: "Not found" },
};

/** 所有错误模块必须包含的公共错误码 key */
export type CommonErrDef = typeof COMMON_CODES;

/** 错误码定义约束 */
type ErrDef = CommonErrDef & Record<string, number>;

/** 从错误码定义推导出联合类型 */
export type ErrCodeOf<T extends ErrDef> = T[keyof T];

/** 预构建的 { code, message } 响应体 */
export interface ErrPayload {
  code: number;
  message: string;
}

/** 错误模块实例 */
export interface ErrorModule<T extends ErrDef> {
  ERR: T;
  errMsg: (code: ErrCodeOf<T>, lang?: Lang) => string;
  BizError: new (code: ErrCodeOf<T>, message?: string) => BizError;

  /** 便捷方法：返回公共错误的 { code, message } */
  unknown: (lang?: Lang) => ErrPayload;
  paramInvalid: (lang?: Lang) => ErrPayload;
  unauthorized: (lang?: Lang) => ErrPayload;
  forbidden: (lang?: Lang) => ErrPayload;
  notFound: (lang?: Lang) => ErrPayload;
}

/** 业务异常基类 */
export class BizError extends Error {
  code: number;
  constructor(code: number, message?: string) {
    super(message ?? String(code));
    this.code = code;
  }
}

/**
 * 创建错误模块
 *
 * 自动合并公共错误码；各端传入的 messages 可覆盖公共文案
 */
export function defineErrors<T extends Record<string, number>>(
  codes: T,
  messages: Record<number, Record<Lang, string>>,
): ErrorModule<typeof COMMON_CODES & T> {
  const merged = { ...COMMON_CODES, ...codes } as typeof COMMON_CODES & T;
  const mergedMsg = { ...COMMON_MESSAGES, ...messages };

  type Merged = typeof merged;

  function errMsg(code: ErrCodeOf<Merged>, lang: Lang = "zh-Hans"): string {
    return mergedMsg[code]?.[lang] ?? mergedMsg[COMMON_CODES.COMMON_UNKNOWN]?.[lang] ?? "Unknown error";
  }

  class ModuleBizError extends BizError {
    constructor(code: ErrCodeOf<Merged>, message?: string) {
      super(code, message ?? errMsg(code));
    }
  }

  const payload = (code: number) => (lang: Lang = "zh-Hans"): ErrPayload => ({
    code,
    message: errMsg(code as ErrCodeOf<Merged>, lang),
  });

  return {
    ERR: merged,
    errMsg,
    BizError: ModuleBizError as any,
    unknown: payload(COMMON_CODES.COMMON_UNKNOWN),
    paramInvalid: payload(COMMON_CODES.COMMON_PARAM_INVALID),
    unauthorized: payload(COMMON_CODES.COMMON_UNAUTHORIZED),
    forbidden: payload(COMMON_CODES.COMMON_FORBIDDEN),
    notFound: payload(COMMON_CODES.COMMON_NOT_FOUND),
  };
}
