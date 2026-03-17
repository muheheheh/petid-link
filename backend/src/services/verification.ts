import { config } from "@/config";
import { ERR, BizError } from "@/errors/client";
import { cacheGet, cacheSet, cacheDel } from "@/services/cache";
import { sendSms } from "@/services/sms";
import { sendVerificationEmail } from "@/services/mail";

type VerifyType = "phone" | "email";

interface CodeRecord {
  code: string;
  createdAt: number;
}

/** 生成随机数字验证码 */
function generateCode(length: number): string {
  const digits = "0123456789";
  let code = "";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  for (let i = 0; i < length; i++) {
    code += digits[bytes[i]! % 10];
  }
  return code;
}

/** 获取缓存 key */
function getCacheKey(type: VerifyType, target: string): string {
  return `verify:${type}:${target}`;
}

/**
 * 发送验证码
 *
 * 检查发送间隔 → 生成验证码 → 发送 → 缓存
 */
export async function sendVerificationCode(type: VerifyType, target: string): Promise<void> {
  const cacheKey = getCacheKey(type, target);
  const existing = await cacheGet<CodeRecord>(cacheKey);

  // 检查发送间隔
  if (existing && Date.now() - existing.createdAt < config.verification.interval) {
    throw new BizError(ERR.AUTH_CODE_SEND_TOO_FAST);
  }

  const code = generateCode(config.verification.length);

  // 开发环境直接打印
  if (Bun.env.NODE_ENV !== "production") {
    console.log(`[VERIFY] ${type === "phone" ? "手机" : "邮箱"} ${target} 验证码: ${code}`);
  }

  // 发送验证码
  if (type === "phone") {
    await sendSms(target, code);
  } else {
    await sendVerificationEmail(target, code);
  }

  // 缓存验证码
  await cacheSet(cacheKey, { code, createdAt: Date.now() }, config.verification.ttl);
}

/**
 * 校验验证码
 *
 * 校验成功后删除缓存（一次性使用）
 */
export async function verifyCode(type: VerifyType, target: string, code: string): Promise<void> {
  const cacheKey = getCacheKey(type, target);
  const record = await cacheGet<CodeRecord>(cacheKey);

  if (!record || record.code !== code) {
    throw new BizError(ERR.AUTH_CODE_INVALID);
  }

  // 验证成功，删除缓存
  await cacheDel(cacheKey);
}
