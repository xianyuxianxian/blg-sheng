import type { ReactNode } from "react";
import Link from "next/link";
import { SITE_NAME } from "@/config/site";

/**
 * 页面外壳：header（logo + 右侧链接）+ 版心容器。
 *
 * 五个页面原本逐字重复 header 块与 `max-w-2xl` 容器（同类问题 DisclaimerFooter
 * 已抽取，header 没抽）；统一到这里后，改 logo / 加导航项只动一个文件。
 *
 * 桌面适配：版心从单一 `max-w-2xl` 升级为两档——
 * 移动到桌面（<1024px）保持 `max-w-2xl` 单栏阅读；`lg:` 起
 * 功能页需要输入+结果同屏，版心放宽到 `max-w-6xl`（由 `wide` 控制）。
 */
export type PageShellProps = {
  /** 当前页是否为首页：首页 logo 静态展示，其余页 logo 链接回首页 */
  isHome?: boolean;
  /** 右上角链接目标与文案：首页指向「关于」，功能页/关于页各自定制 */
  headerHref?: string;
  headerLabel?: string;
  /** 桌面宽版心：功能页传 true，启用 lg:max-w-6xl */
  wide?: boolean;
  /** 页脚插槽：默认页用 DisclaimerFooter，关于页有自定义页脚 */
  footer?: ReactNode;
  children: ReactNode;
};

/** 「命」字方印 logo：首页静态，其余页链接回首页。 */
function Logo({ isHome }: { isHome: boolean }) {
  const inner = (
    <>
      <span
        aria-hidden
        className="grid h-6 w-6 place-items-center bg-accent font-serif text-[13px] leading-none text-on-accent"
      >
        命
      </span>
      <span className="font-serif">{SITE_NAME}</span>
    </>
  );
  if (isHome) {
    return (
      <span className="flex items-center gap-2.5 text-sm tracking-[0.2em] text-fg-soft">
        {inner}
      </span>
    );
  }
  return (
    <Link
      href="/"
      className="tap flex items-center gap-2.5 text-sm tracking-[0.2em] text-fg-soft hover:text-accent"
    >
      {inner}
    </Link>
  );
}

export function PageShell({
  isHome = false,
  headerHref = "/about",
  headerLabel = "关于",
  wide = false,
  footer,
  children,
}: PageShellProps) {
  return (
    <div className="min-h-screen border-t-2 border-accent bg-surface text-fg">
      <div
        className={`mx-auto flex min-h-screen w-full flex-col px-5 pb-10 pt-6 sm:px-8 sm:pt-8 ${
          wide ? "max-w-2xl lg:max-w-6xl" : "max-w-2xl"
        }`}
      >
        <header className="flex items-center justify-between border-b border-rule pb-4">
          <Logo isHome={isHome} />
          <Link
            href={headerHref}
            className="tap text-[11px] tracking-[0.15em] text-fg-muted hover:text-accent"
          >
            {headerLabel}
          </Link>
        </header>

        <main className="flex-1">{children}</main>
        {footer}
      </div>
    </div>
  );
}
