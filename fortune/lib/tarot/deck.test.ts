import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { TAROT_CARDS, drawSpread, SPREADS } from "./deck";

const PUBLIC_TAROT_DIR = join(process.cwd(), "public", "tarot");

function jpegMagicOk(file: string): boolean {
  if (!existsSync(file)) return false;
  const bytes = readFileSync(file);
  return bytes.length > 2000 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

describe("TAROT_CARDS 牌库", () => {
  it("恰好 78 张", () => {
    expect(TAROT_CARDS).toHaveLength(78);
  });

  it("id 唯一", () => {
    const ids = TAROT_CARDS.map((c) => c.id);
    expect(new Set(ids).size).toBe(78);
  });

  it("大阿尔卡那 22 张、小阿尔卡那 56 张（四花色各 14 张）", () => {
    const majors = TAROT_CARDS.filter((c) => c.arcana === "major");
    const minors = TAROT_CARDS.filter((c) => c.arcana === "minor");
    expect(majors).toHaveLength(22);
    expect(minors).toHaveLength(56);
    for (const suit of ["wands", "cups", "swords", "pentacles"] as const) {
      expect(minors.filter((c) => c.suit === suit)).toHaveLength(14);
    }
  });

  it("字段完整：name/image/upright/reversed 均非空，image 为 /tarot/*.jpg", () => {
    for (const card of TAROT_CARDS) {
      expect(card.name.trim().length).toBeGreaterThan(0);
      expect(card.image).toMatch(/^\/tarot\/[a-z0-9-]+\.jpg$/);
      expect(card.upright.trim().length).toBeGreaterThan(0);
      expect(card.reversed.trim().length).toBeGreaterThan(0);
      if (card.arcana === "minor") {
        expect(["wands", "cups", "swords", "pentacles"]).toContain(card.suit);
      } else {
        expect(card.suit).toBeUndefined();
      }
    }
  });

  it("public/tarot 下 78 张牌图齐全且为有效 JPEG", () => {
    const missing: string[] = [];
    for (const card of TAROT_CARDS) {
      const file = join(PUBLIC_TAROT_DIR, card.image.replace("/tarot/", ""));
      if (!jpegMagicOk(file)) missing.push(card.image);
    }
    expect(missing).toEqual([]);
  });
});

describe("drawSpread 抽牌", () => {
  it("抽 3 张互不重复", () => {
    for (let i = 0; i < 200; i++) {
      const drawn = drawSpread(3);
      expect(drawn).toHaveLength(3);
      expect(new Set(drawn.map((d) => d.card.id)).size).toBe(3);
    }
  });

  it("抽满 78 张时恰为完整牌库（洗牌不增不减）", () => {
    const drawn = drawSpread(78);
    expect(new Set(drawn.map((d) => d.card.id))).toEqual(new Set(TAROT_CARDS.map((c) => c.id)));
  });

  it("10000 次采样正逆位比例在 45%–55%", () => {
    const drawn = drawSpread(78);
    let reversed = 0;
    let total = 0;
    for (let i = 0; i < 10000; i++) {
      const spread = drawSpread(3);
      for (const d of spread) {
        if (d.reversed) reversed++;
        total++;
      }
    }
    const ratio = reversed / total;
    expect(total).toBe(30000);
    expect(ratio).toBeGreaterThan(0.45);
    expect(ratio).toBeLessThan(0.55);
    // 抽样自身不重复的前提仍然成立
    expect(new Set(drawn.map((d) => d.card.id)).size).toBe(78);
  });

  it("count 超过 78 或非正整数时抛错", () => {
    expect(() => drawSpread(79)).toThrow();
    expect(() => drawSpread(0)).toThrow();
    expect(() => drawSpread(1.5)).toThrow();
  });

  it("不修改原始牌库顺序", () => {
    const before = TAROT_CARDS.map((c) => c.id);
    drawSpread(78);
    expect(TAROT_CARDS.map((c) => c.id)).toEqual(before);
  });
});

describe("SPREADS 牌阵", () => {
  it("包含三张阵：过去 / 现在 / 未来", () => {
    expect(SPREADS.three.positions).toHaveLength(3);
    expect(SPREADS.three.positions.map((p) => p.label)).toEqual(["过去", "现在", "未来"]);
    for (const p of SPREADS.three.positions) {
      expect(p.meaning.trim().length).toBeGreaterThan(0);
    }
    expect(SPREADS.three.id).toBe("three");
    expect(SPREADS.three.name.trim().length).toBeGreaterThan(0);
  });
});
