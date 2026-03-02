const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://petid.link";

/** 根据设备 ID 生成扫码落地页 URL */
export function getDeviceScanUrl(deviceId: string): string {
  return `${SITE_URL}/s/${deviceId}`;
}
