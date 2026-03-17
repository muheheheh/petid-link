import nodemailer from "nodemailer";
import { config } from "@/config";
import { ERR, BizError } from "@/errors/client";

let transporter: nodemailer.Transporter | null = null;

/** 获取 SMTP 传输器（单例） */
function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.mail.host,
      port: config.mail.port,
      secure: config.mail.port === 465,
      auth: {
        user: config.mail.user,
        pass: config.mail.pass,
      },
    });
  }
  return transporter;
}

/** 发送验证码邮件 */
export async function sendVerificationEmail(to: string, code: string): Promise<void> {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">PetID 验证码</h2>
      <p style="color: #666; font-size: 16px;">您的验证码是：</p>
      <p style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 4px;">${code}</p>
      <p style="color: #999; font-size: 14px;">验证码 5 分钟内有效，请勿泄露给他人。</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="color: #999; font-size: 12px;">如果您没有请求此验证码，请忽略此邮件。</p>
    </div>
  `;

  try {
    await getTransporter().sendMail({
      from: config.mail.from,
      to,
      subject: "PetID 验证码",
      html,
    });
  } catch (err) {
    console.error("[MAIL] 发送失败:", err);
    throw new BizError(ERR.AUTH_CODE_SEND_FAILED, "邮件发送失败");
  }
}
