import { EightChar, type Yun } from "lunar-typescript";
import type { DaYunStep, QiYun } from "./types";

/** 大运步数，按产品口径固定 10 步。 */
export const DA_YUN_STEPS = 10;

/** lunar-typescript 的 gender 入参：1 = 男，0 = 女（与其 Yun(gender) 保持一致）。 */
function genderCode(gender: "m" | "f"): number {
  return gender === "m" ? 1 : 0;
}

/**
 * 取起运信息。
 *
 * 顺逆由「年干阴阳 + 性别」决定，lunar-typescript 的 `Yun` 已实现该规则
 * （阳男阴女顺排、阴男阳女逆排），此处只做转述，不重复实现。
 */
export function getQiYun(eightChar: EightChar, gender: "m" | "f"): QiYun {
  const yun: Yun = eightChar.getYun(genderCode(gender));
  return {
    isForward: yun.isForward(),
    startYear: yun.getStartYear(),
    startMonth: yun.getStartMonth(),
    startDay: yun.getStartDay(),
    startSolar: yun.getStartSolar().toYmdHms(),
  };
}

/**
 * 生成 10 步大运。
 *
 * lunar-typescript 的 `getDaYun(n)` 返回的数组第 0 项是「起运前童限」（干支为空串），
 * 因此多取一项再丢弃首项，得到 10 步真正的大运。
 */
export function buildDaYun(eightChar: EightChar, gender: "m" | "f"): DaYunStep[] {
  const yun = eightChar.getYun(genderCode(gender));
  const all = yun.getDaYun(DA_YUN_STEPS + 1);
  return all.slice(1).map((d, i) => {
    const ganZhi = d.getGanZhi();
    if (ganZhi.length !== 2) {
      throw new Error(`大运干支异常：${JSON.stringify(ganZhi)}（第 ${i + 1} 步）`);
    }
    return {
      index: i + 1,
      ganZhi,
      gan: ganZhi.charAt(0),
      zhi: ganZhi.charAt(1),
      startAge: d.getStartAge(),
      endAge: d.getEndAge(),
      startYear: d.getStartYear(),
      endYear: d.getEndYear(),
    };
  });
}
