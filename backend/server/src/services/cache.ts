interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const KEY_PREFIX = "petid-link:";

/** 内存缓存（一级），后续可扩展 Redis（二级） */
const store = new Map<string, CacheEntry<unknown>>();

/** 获取缓存，过期自动清除返回 null */
export function cacheGet<T>(key: string): T | null {
  const entry = store.get(KEY_PREFIX + key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(KEY_PREFIX + key);
    return null;
  }
  return entry.value;
}

/** 设置缓存，ttl 单位毫秒 */
export function cacheSet<T>(key: string, value: T, ttl: number): void {
  store.set(KEY_PREFIX + key, {
    value,
    expiresAt: Date.now() + ttl,
  });
}

/** 删除缓存 */
export function cacheDel(key: string): void {
  store.delete(KEY_PREFIX + key);
}
