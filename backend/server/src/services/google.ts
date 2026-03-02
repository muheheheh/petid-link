import { config } from "@/config";
import { ERR, BizError } from "@/errors";

interface GoogleTokenPayload {
  /** Google 用户唯一 ID */
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
}

/**
 * 验证 Google ID Token
 *
 * 通过 Google tokeninfo 端点验证 token 有效性，并校验 audience 是否匹配
 */
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleTokenPayload> {
  const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`;

  const res = await fetch(url);
  const data = await res.json() as GoogleTokenPayload & { aud?: string; error_description?: string };

  if (!data.sub) {
    throw new BizError(ERR.AUTH_GOOGLE_TOKEN_INVALID, `[Google] 令牌验证失败: ${data.error_description || "invalid token"}`);
  }

  if (data.aud !== config.google.clientId) {
    throw new BizError(ERR.AUTH_GOOGLE_TOKEN_INVALID, `[Google] 令牌 audience 不匹配: aud=${data.aud}`);
  }

  return {
    sub: data.sub,
    email: data.email,
    name: data.name,
    picture: data.picture,
  };
}
