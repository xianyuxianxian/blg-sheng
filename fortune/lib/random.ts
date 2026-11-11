/**
 * 全站统一随机源：crypto.getRandomValues。
 * 禁止使用 Math.random。
 */

/** 密码学安全随机 32 位无符号整数 [0, 2^32) */
function randomUint32(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0];
}

/**
 * 返回 [0, maxExclusive) 内的均匀随机整数。
 * 采用拒绝采样避免模偏差。
 */
export function randomInt(maxExclusive: number): number {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    throw new RangeError(`maxExclusive 必须为正整数，收到: ${maxExclusive}`);
  }
  const limit = Math.floor(0x100000000 / maxExclusive) * maxExclusive;
  let v: number;
  do {
    v = randomUint32();
  } while (v >= limit);
  return v % maxExclusive;
}

/** 从数组中随机取一个元素（数组为空则抛错） */
export function pick<T>(arr: T[]): T {
  if (arr.length === 0) {
    throw new RangeError("pick 不能用于空数组");
  }
  return arr[randomInt(arr.length)];
}
