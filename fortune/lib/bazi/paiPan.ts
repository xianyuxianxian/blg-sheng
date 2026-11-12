import { EightChar, LunarUtil, Solar, SolarUtil } from "lunar-typescript";
import type { DaYunStep, PaiPanInput, PaiPanResult, QiYun, SiZhu, SiZhuSet } from "./types";
import { buildDaYun, getQiYun } from "./daYun";
import { countWuXing } from "./wuXing";

/** 单柱在 EightChar 上的取值位置。 */
type PillarKey = "year" | "month" | "day" | "hour";

/** 时辰名，仅用于 note 文案。 */
const SHI_CHEN_NAMES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

/**
 * 时辰窗口中点时刻：子 00:30、丑 02:30 ... 午 12:30 ... 亥 22:30。
 * 取窗口中点（起始 + 1.5 小时）而非交点，避开节气/换日恰好落在时辰起始那一分钟的情形。
 */
function midpointOfHourIndex(hourIndex: number): { hour: number; minute: number } {
  return { hour: (hourIndex * 2) % 24, minute: 30 };
}

/** 校验 hour 是否落在 hourIndex 对应的时辰窗口内。子时窗口跨零点（23:00–01:00）。 */
function isInWindow(hourIndex: number, hour: number): boolean {
  if (hourIndex === 0) return hour === 23 || hour === 0;
  const start = hourIndex * 2 - 1;
  const end = hourIndex * 2 + 1;
  return hour >= start && hour < end;
}

function assertValidDate(y: number, m: number, d: number): void {
  if (!Number.isInteger(y) || y < 1900 || y > 2100) {
    throw new Error(`年份需为 1900-2100 的整数：${y}`);
  }
  if (!Number.isInteger(m) || m < 1 || m > 12) {
    throw new Error(`月份需为 1-12 的整数：${m}`);
  }
  const days = SolarUtil.getDaysOfMonth(y, m);
  if (!Number.isInteger(d) || d < 1 || d > days) {
    throw new Error(`日期非法：${y}-${m}-${d}（该月共 ${days} 天）`);
  }
}

/** 解析实际排盘用的时刻：显式传入则用之，否则取时辰中点。 */
function resolveTime(input: PaiPanInput): { hour: number; minute: number; explicit: boolean } {
  const { hourIndex, hour, minute } = input;
  if (!Number.isInteger(hourIndex) || hourIndex < 0 || hourIndex > 11) {
    throw new Error(`hourIndex 需为 0-11 的整数（子=0 ... 亥=11）：${hourIndex}`);
  }
  if (hour === undefined) return { ...midpointOfHourIndex(hourIndex), explicit: false };

  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    throw new Error(`hour 需为 0-23 的整数：${hour}`);
  }
  const mi = minute ?? 0;
  if (!Number.isInteger(mi) || mi < 0 || mi > 59) {
    throw new Error(`minute 需为 0-59 的整数：${mi}`);
  }
  if (!isInWindow(hourIndex, hour)) {
    throw new Error(
      `时刻 ${hour}:${String(mi).padStart(2, "0")} 不在 hourIndex=${hourIndex}（${SHI_CHEN_NAMES[hourIndex]}时）的时辰窗口内`,
    );
  }
  return { hour, minute: mi, explicit: true };
}

/** 从 EightChar 读取一柱。 */
function readPillar(ec: EightChar, key: PillarKey): SiZhu {
  switch (key) {
    case "year":
      return {
        gan: ec.getYearGan(),
        zhi: ec.getYearZhi(),
        hideGan: ec.getYearHideGan(),
        naYin: ec.getYearNaYin(),
        shiShenGan: ec.getYearShiShenGan(),
        shiShenZhi: ec.getYearShiShenZhi(),
      };
    case "month":
      return {
        gan: ec.getMonthGan(),
        zhi: ec.getMonthZhi(),
        hideGan: ec.getMonthHideGan(),
        naYin: ec.getMonthNaYin(),
        shiShenGan: ec.getMonthShiShenGan(),
        shiShenZhi: ec.getMonthShiShenZhi(),
      };
    case "day":
      return {
        gan: ec.getDayGan(),
        zhi: ec.getDayZhi(),
        hideGan: ec.getDayHideGan(),
        naYin: ec.getDayNaYin(),
        shiShenGan: ec.getDayShiShenGan(),
        shiShenZhi: ec.getDayShiShenZhi(),
      };
    case "hour":
      return {
        gan: ec.getTimeGan(),
        zhi: ec.getTimeZhi(),
        hideGan: ec.getTimeHideGan(),
        naYin: ec.getTimeNaYin(),
        shiShenGan: ec.getTimeShiShenGan(),
        shiShenZhi: ec.getTimeShiShenZhi(),
      };
  }
}

/** 十神查表（相对日干）。日干自身按库口径返回 "比肩"，日柱另行标为 "日主"。 */
function shiShen(dayGan: string, gan: string): string {
  const v = LunarUtil.SHI_SHEN[`${dayGan}${gan}`];
  if (!v) throw new Error(`十神查表失败：日干 ${dayGan} 对 ${gan}`);
  return v;
}

/**
 * 晚子时换日后，年柱/月柱的十神必须相对「新的日干」重算，
 * 否则会出现日柱已进位、十神仍按旧日干的矛盾结果（纳音只与干支有关，无需重算）。
 */
function retargetShiShen(pillar: SiZhu, dayGan: string): SiZhu {
  return {
    ...pillar,
    shiShenGan: shiShen(dayGan, pillar.gan),
    shiShenZhi: pillar.hideGan.map((g) => shiShen(dayGan, g)),
  };
}

function buildNote(args: {
  hourIndex: number;
  hour: number;
  minute: number;
  explicit: boolean;
  isLateZi: boolean;
  lateZiSolarYmd: string;
  qiYun: QiYun;
}): string[] {
  const note: string[] = [];
  const clock = `${String(args.hour).padStart(2, "0")}:${String(args.minute).padStart(2, "0")}`;

  note.push("时间口径：按北京时间（东经 120° 平太阳时）排盘，未做真太阳时/经度时差校正。");

  if (args.isLateZi) {
    note.push(
      `晚子时换日：出生时刻 ${clock} 属 23:00–23:59，` +
        `日柱进一位取次日子时（${args.lateZiSolarYmd}）之日柱，年柱月柱不进位，时干按进位后的日干起。`,
    );
  } else if (args.hourIndex === 0) {
    note.push(
      args.explicit
        ? `早子时口径：出生时刻 ${clock} 属 00:00–00:59，日柱用当日日柱（不换日），时干按当日日干起。`
        : `早子时口径：未指定到分钟，子时按当日 00:30 取时，日柱用当日日柱；` +
          `若出生于当日 23:00–24:00，请传 hour/minute 以按晚子时规则换日。`,
    );
  } else if (args.explicit) {
    note.push(`时柱按输入时刻 ${clock} 取（${SHI_CHEN_NAMES[args.hourIndex]}时）。`);
  }

  note.push("节气口径：年柱以立春、月柱以节令为界，按节气精确时刻切换。");
  note.push(
    `大运${args.qiYun.isForward ? "顺排" : "逆排"}，` +
      `起运于出生后 ${args.qiYun.startYear}年${args.qiYun.startMonth}个月${args.qiYun.startDay}天（${args.qiYun.startSolar}）。`,
  );
  note.push("五行口径：四柱天干地支各计 1，共 8 项，不计藏干加权。");

  return note;
}

/**
 * 八字排盘。
 *
 * 口径要点：
 * 1. 年柱以立春、月柱以节令为界（lunar-typescript 按节气精确时刻切换）。
 * 2. 时辰取窗口中点时刻（子 00:30、午 12:30 ...），可按需传 `hour/minute` 精确到分钟。
 * 3. 晚子时显式换日：`hourIndex === 0` 且时刻 ≥ 23:00 时，日柱取次日之日柱、
 *    时干按新日干起，年柱月柱不进位（不依赖库默认的「晚子时不换日」行为）。
 */
export function paiPan(input: PaiPanInput): PaiPanResult {
  const { y, m, d, hourIndex, gender } = input;
  assertValidDate(y, m, d);
  if (gender !== "m" && gender !== "f") {
    throw new Error(`gender 只能是 "m" 或 "f"：${String(gender)}`);
  }

  const { hour, minute, explicit } = resolveTime(input);
  const isLateZi = hourIndex === 0 && hour >= 23;

  const baseSolar = Solar.fromYmdHms(y, m, d, hour, minute, 0);
  const baseEc = EightChar.fromLunar(baseSolar.getLunar());

  const lateZiSolar = isLateZi ? Solar.fromYmdHms(y, m, d, 0, 30, 0).nextDay(1) : null;
  const dayEc = lateZiSolar ? EightChar.fromLunar(lateZiSolar.getLunar()) : baseEc;

  // 年月柱取「当前时刻」的节气状态；日时柱取（可能进位后的）当日日柱。
  let year = readPillar(baseEc, "year");
  let month = readPillar(baseEc, "month");
  const day = readPillar(dayEc, "day");
  const hourPillar = readPillar(dayEc, "hour");

  if (isLateZi) {
    year = retargetShiShen(year, day.gan);
    month = retargetShiShen(month, day.gan);
  }

  const siZhu: SiZhuSet = { year, month, day, hour: hourPillar };
  const wuXing = countWuXing([year, month, day, hourPillar]);
  const daYun: DaYunStep[] = buildDaYun(baseEc, gender);
  const qiYun = getQiYun(baseEc, gender);

  return {
    siZhu,
    wuXing,
    daYun,
    qiYun,
    note: buildNote({
      hourIndex,
      hour,
      minute,
      explicit,
      isLateZi,
      lateZiSolarYmd: lateZiSolar ? lateZiSolar.toYmd() : "",
      qiYun,
    }),
  };
}
