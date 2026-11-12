import type { ReactNode } from "react";
import Link from "next/link";
import { DISCLAIMER_LINE } from "@/data/disclaimer";
import { SITE_NAME } from "@/config/site";

export type DisclaimerFooterProps = {
  /** 该工具特有的口径补充（可选，渲染在免责行之后） */
  note?: ReactNode;
};

/**
 * 全站统一页脚：一句免责 + 关于页链接 + 站点名。
 *
 * 三个功能页原本各自重复这三行，统一到这里；
 * 需要补充口径的页面（如六爻）通过 `note` 传入，不改动其他页面。
 */
export function DisclaimerFooter({ note }: DisclaimerFooterProps) {
  return (
    <footer className="mt-14 border-t border-[#ddd2bb] pt-5 text-[11px] leading-6 text-[#6f6451]">
      <p>{DISCLAIMER_LINE}</p>
      {note ? <p className="mt-1">{note}</p> : null}
      <p className="mt-1">
        <Link
          href="/about"
          className="underline decoration-[#c0b294] underline-offset-4 hover:text-[#a63a2c]"
        >
          了解排盘口径、隐私说明与免责声明
        </Link>
      </p>
      <p className="mt-3 tracking-[0.2em] text-[#786c57]">{SITE_NAME}</p>
    </footer>
  );
}
