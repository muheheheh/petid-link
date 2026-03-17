const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://petid.link";

/** 根据设备 SN 生成扫码落地页 URL */
export function getDeviceScanUrl(sn: string): string {
  return `${SITE_URL}/s/${sn}`;
}
