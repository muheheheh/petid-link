import { config } from "@/config";
import { cacheGet, cacheSet } from "@/services/cache";
import { ERR, BizError } from "@/errors/client";

interface JsCode2SessionResult {
  openid: string;
  session_key: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

interface PhoneNumberResult {
  phone_info: {
    phoneNumber: string;
    purePhoneNumber: string;
    countryCode: string;
  };
  errcode?: number;
  errmsg?: string;
}

interface AccessTokenResult {
  access_token: string;
  expires_in: number;
  errcode?: number;
  errmsg?: string;
}

interface OAuthTokenResult {
  access_token: string;
  openid: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

/** 小程序 login code 换 openid + session_key */
export async function jscode2session(code: string): Promise<JsCode2SessionResult> {
  const { appId, appSecret } = config.wechat.miniprogram;
  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`;

  const res = await fetch(url);
  const data = await res.json() as JsCode2SessionResult;

  if (data.errcode) {
    throw new BizError(ERR.AUTH_WECHAT_LOGIN_FAILED, `[微信] 小程序登录凭证校验失败: errcode=${data.errcode}, errmsg=${data.errmsg}`);
  }

  return data;
}

/**
 * 获取小程序全局 access_token
 *
 * 带内存缓存，提前 5 分钟过期（微信有效期 7200 秒）
 */
async function getMiniprogramAccessToken(): Promise<string> {
  const { appId, appSecret } = config.wechat.miniprogram;
  const cacheKey = `wechat:miniprogram:${appId}:access_token`;
  const cached = await cacheGet<string>(cacheKey);
  if (cached) return cached;

  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
  const res = await fetch(url);
  const data = await res.json() as AccessTokenResult;

  if (data.errcode) {
    throw new BizError(ERR.AUTH_WECHAT_LOGIN_FAILED, `[微信] 获取小程序 access_token 失败: errcode=${data.errcode}, errmsg=${data.errmsg}`);
  }

  await cacheSet(cacheKey, data.access_token, (data.expires_in - 300) * 1000);
  return data.access_token;
}

/** 通过 phone code 获取用户手机号 */
export async function getPhoneNumber(phoneCode: string): Promise<string> {
  const accessToken = await getMiniprogramAccessToken();
  const url = `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${accessToken}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: phoneCode }),
  });
  const data = await res.json() as PhoneNumberResult;

  if (data.errcode) {
    throw new BizError(ERR.AUTH_WECHAT_PHONE_FAILED, `[微信] 获取手机号失败: errcode=${data.errcode}, errmsg=${data.errmsg}`);
  }

  return data.phone_info.phoneNumber;
}

/** 服务号 OAuth：code 换 access_token + openid（微信内 H5 授权） */
export async function getMpOAuthToken(code: string): Promise<OAuthTokenResult> {
  const { appId, appSecret } = config.wechat.mp;
  const url = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appId}&secret=${appSecret}&code=${code}&grant_type=authorization_code`;

  const res = await fetch(url);
  const data = await res.json() as OAuthTokenResult;

  if (data.errcode) {
    throw new BizError(ERR.AUTH_WECHAT_OAUTH_FAILED, `[微信] 服务号 OAuth 授权失败: errcode=${data.errcode}, errmsg=${data.errmsg}`);
  }

  return data;
}
