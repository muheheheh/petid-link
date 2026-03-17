import Redis from "ioredis";
import { config } from "@/config";

const KEY_PREFIX = "petid:";

let redis: Redis | null = null;

/** 获取 Redis 客户端（单例） */
function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password || undefined,
      db: config.redis.db,
      lazyConnect: true,
    });

    redis.on("error", (err) => {
      console.error("[Redis] 连接错误:", err.message);
    });

    redis.on("connect", () => {
      console.log("[Redis] 已连接");
    });
  }
  return redis;
}

/** 获取缓存 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const value = await getRedis().get(KEY_PREFIX + key);
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return value as unknown as T;
  }
}

/** 设置缓存，ttl 单位毫秒 */
export async function cacheSet<T>(key: string, value: T, ttl: number): Promise<void> {
  const serialized = typeof value === "string" ? value : JSON.stringify(value);
  await getRedis().set(KEY_PREFIX + key, serialized, "PX", ttl);
}

/** 删除缓存 */
export async function cacheDel(key: string): Promise<void> {
  await getRedis().del(KEY_PREFIX + key);
}

/** 检查 key 是否存在 */
export async function cacheExists(key: string): Promise<boolean> {
  const result = await getRedis().exists(KEY_PREFIX + key);
  return result === 1;
}

/** 设置过期时间，ttl 单位毫秒 */
export async function cacheExpire(key: string, ttl: number): Promise<void> {
  await getRedis().pexpire(KEY_PREFIX + key, ttl);
}
