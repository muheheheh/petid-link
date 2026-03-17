import Dysmsapi20170525, * as $Dysmsapi20170525 from "@alicloud/dysmsapi20170525";
import * as $OpenApi from "@alicloud/openapi-client";
import { config } from "@/config";
import { ERR, BizError } from "@/errors/client";

let client: Dysmsapi20170525 | null = null;

/** 获取阿里云短信客户端（单例） */
function getClient(): Dysmsapi20170525 {
  if (!client) {
    const openApiConfig = new $OpenApi.Config({
      accessKeyId: config.sms.accessKeyId,
      accessKeySecret: config.sms.accessKeySecret,
      endpoint: "dysmsapi.aliyuncs.com",
    });
    client = new Dysmsapi20170525(openApiConfig);
  }
  return client;
}

/** 发送短信验证码 */
export async function sendSms(phone: string, code: string): Promise<void> {
  const { signName, templateCode } = config.sms;

  const request = new $Dysmsapi20170525.SendSmsRequest({
    phoneNumbers: phone,
    signName,
    templateCode,
    templateParam: JSON.stringify({ code }),
  });

  try {
    const response = await getClient().sendSms(request);
    if (response.body?.code !== "OK") {
      console.error("[SMS] 发送失败:", response.body);
      throw new BizError(ERR.AUTH_CODE_SEND_FAILED, `短信发送失败: ${response.body?.message}`);
    }
  } catch (err) {
    if (err instanceof BizError) throw err;
    console.error("[SMS] 发送异常:", err);
    throw new BizError(ERR.AUTH_CODE_SEND_FAILED, "短信服务异常");
  }
}
