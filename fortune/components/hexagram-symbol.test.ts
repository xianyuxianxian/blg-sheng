import { describe, expect, it } from "vitest";
import guaDoc from "../data/64gua.json";
import { hexagramNumber, hexagramSymbol } from "./hexagram-symbol";
import type { Trigram } from "@/lib/liuyao/types";

/**
 * 数据层的 64 卦表：`gua64` 数组下标 0 即文王卦序第 1 卦（乾），依次到未济。
 * 用相对路径引入而不是 `@/`：vitest 没有配 alias，`@/` 只在 tsc/Next 里成立。
 */
const GUA64 = guaDoc.gua64 as {
  name: string;
  shangGua: Trigram;
  xiaGua: Trigram;
}[];

/**
 * 校验口径：Unicode「Yijing Hexagram Symbols」区块按文王卦序排列，
 * U+4DC0 = 第 1 卦乾䷀，U+4DFF = 第 64 卦未济䷿。
 */
describe("hexagramSymbol：上下经卦 → 卦符", () => {
  it("与 data/64gua.json 的文王序逐条锁死（64 条全量）", () => {
    expect(GUA64).toHaveLength(64);
    GUA64.forEach((gua, index) => {
      const label = `第 ${index + 1} 卦 ${gua.name}（${gua.shangGua}上${gua.xiaGua}下）`;
      expect(hexagramNumber(gua.shangGua, gua.xiaGua), label).toBe(index + 1);
      expect(hexagramSymbol(gua.shangGua, gua.xiaGua), label).toBe(
        String.fromCodePoint(0x4dc0 + index),
      );
    });
  });

  it("六十四卦之首尾两卦取到纯卦符号（乾䷀ / 坤䷁）", () => {
    expect(hexagramSymbol("乾", "乾")).toBe("䷀");
    expect(hexagramSymbol("坤", "坤")).toBe("䷁");
    expect(hexagramNumber("乾", "乾")).toBe(1);
    expect(hexagramNumber("坤", "坤")).toBe(2);
  });

  it("卦序末端是未济䷿（离上坎下）", () => {
    expect(hexagramNumber("离", "坎")).toBe(64);
    expect(hexagramSymbol("离", "坎")).toBe("䷿");
  });

  it("非纯卦按通行本卦序取符（晋䷢ 35、姤䷫ 44）", () => {
    // 晋＝离上坤下；姤＝乾上巽下
    expect(hexagramNumber("离", "坤")).toBe(35);
    expect(hexagramSymbol("离", "坤")).toBe("䷢");
    expect(hexagramNumber("乾", "巽")).toBe(44);
    expect(hexagramSymbol("乾", "巽")).toBe("䷫");
  });

  it("上下卦颠倒不是同一卦（屯䷂ vs 解䷧）", () => {
    expect(hexagramSymbol("坎", "震")).toBe("䷂");
    expect(hexagramSymbol("震", "坎")).toBe("䷧");
  });

  it("8×8 组合全部落在 U+4DC0–U+4DFF 且互不重复", () => {
    const trigrams: Trigram[] = ["乾", "兑", "离", "震", "巽", "坎", "艮", "坤"];
    const symbols = new Set<string>();
    const numbers = new Set<number>();

    for (const shang of trigrams) {
      for (const xia of trigrams) {
        const number = hexagramNumber(shang, xia);
        const symbol = hexagramSymbol(shang, xia);
        const code = symbol.codePointAt(0) ?? 0;
        expect(code).toBeGreaterThanOrEqual(0x4dc0);
        expect(code).toBeLessThanOrEqual(0x4dff);
        symbols.add(symbol);
        numbers.add(number);
      }
    }

    expect(numbers.size).toBe(64);
    expect(symbols.size).toBe(64);
  });
});
