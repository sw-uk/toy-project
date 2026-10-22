"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useI18n } from "@/features/i18n/provider";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", key: "nav_home" },
  { href: "/rates", key: "nav_rates" },
] as const;

export function NavLinks() {
  const { t } = useI18n();
  const pathname = usePathname();
  // 이벤트 상세는 홈에서 들어가는 화면이라 홈을 현재 위치로 표시한다.
  const current = pathname.startsWith("/rates") ? "/rates" : "/";

  return (
    <nav aria-label="main" className="inline-flex gap-0.5 rounded-lg bg-muted p-[3px]">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={current === link.href ? "page" : undefined}
          className={cn(
            "rounded-md px-3 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground",
            current === link.href && "bg-background text-foreground ring-1 ring-border",
          )}
        >
          {t(link.key)}
        </Link>
      ))}
    </nav>
  );
}
