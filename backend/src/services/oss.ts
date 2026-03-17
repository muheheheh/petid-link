import OSS from "ali-oss";
import { config } from "@/config";

let client: OSS | null = null;

/** 获取阿里云 OSS 客户端（单例） */
function getClient(): OSS {
  if (!client) {
    client = new OSS({
      region: config.oss.region,
      accessKeyId: config.oss.accessKeyId,
      accessKeySecret: config.oss.accessKeySecret,
      bucket: config.oss.bucket,
    });
  }
  return client;
}

/** OSS 文件夹分类 */
export const OSS_FOLDERS = {
  /** 用户头像 */
  AVATAR: "avatars",
  /** 宠物照片 */
  PET_IMAGES: "pets",
  /** 联系方式二维码（如 ins、微信等） */
  CONTACT_QR: "contacts",
} as const;

type OssFolder = (typeof OSS_FOLDERS)[keyof typeof OSS_FOLDERS];

interface UploadResult {
  /** OSS 完整 URL */
  url: string;
  /** OSS 对象 key */
  key: string;
}

/**
 * 上传文件到 OSS
 *
 * @param folder 文件夹分类
 * @param filename 文件名（建议带扩展名）
 * @param data 文件内容（Buffer 或 Blob）
 */
export async function uploadToOss(
  folder: OssFolder,
  filename: string,
  data: Buffer | Blob,
): Promise<UploadResult> {
  const key = `${folder}/${Date.now()}-${filename}`;
  const buffer = data instanceof Blob ? Buffer.from(await data.arrayBuffer()) : data;

  await getClient().put(key, buffer);

  const url = `${config.oss.cdnDomain || `https://${config.oss.bucket}.${config.oss.region}.aliyuncs.com`}/${key}`;
  return { url, key };
}

/**
 * 从 URL 下载并上传到 OSS（用于保存微信头像等外部图片）
 */
export async function uploadFromUrl(
  folder: OssFolder,
  sourceUrl: string,
  filename?: string,
): Promise<UploadResult> {
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "image/jpeg";
  const ext = contentType.includes("png") ? "png" : contentType.includes("gif") ? "gif" : "jpg";
  const finalFilename = filename || `${crypto.randomUUID()}.${ext}`;

  const buffer = Buffer.from(await response.arrayBuffer());
  return uploadToOss(folder, finalFilename, buffer);
}

/**
 * 删除 OSS 文件
 */
export async function deleteFromOss(key: string): Promise<void> {
  await getClient().delete(key);
}

/**
 * 生成临时上传签名 URL（用于客户端直传）
 *
 * @param folder 文件夹分类
 * @param filename 文件名
 * @param expires 有效期（秒），默认 300
 */
export async function getUploadSignedUrl(
  folder: OssFolder,
  filename: string,
  expires = 300,
): Promise<{ url: string; key: string }> {
  const key = `${folder}/${Date.now()}-${filename}`;
  const url = getClient().signatureUrl(key, {
    method: "PUT",
    expires,
    "Content-Type": "application/octet-stream",
  });
  return { url, key };
}
