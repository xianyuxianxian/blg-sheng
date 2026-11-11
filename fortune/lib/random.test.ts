import { randomInt, pick } from "./random";
import { describe, it, expect } from "vitest";

describe("randomInt", () => {
  it("randomInt(1) 恒返回 0", () => {
    for (let i = 0; i < 100; i++) {
      expect(randomInt(1)).toBe(0);
    }
  });

  it("10000 次采样全部落在 [0, max)", () => {
    const max = 7;
    for (let i = 0; i < 10000; i++) {
      const v = randomInt(max);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(max);
      expect(Number.isInteger(v)).toBe(true);
    }
  });
});

describe("pick", () => {
  it("返回数组元素之一", () => {
    const arr = ["a", "b", "c"];
    for (let i = 0; i < 10000; i++) {
      expect(arr).toContain(pick(arr));
    }
  });
});
