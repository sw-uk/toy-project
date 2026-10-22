import { TriangleIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/** 펼치기 버튼 옆 삼각형. 접혀 있으면 아래(▼), 펼쳐 있으면 위(▲)를 가리킨다. */
export function DisclosureArrow({ open }: { open: boolean }) {
  return (
    <TriangleIcon
      aria-hidden
      data-open={open}
      className={cn("size-2.5 shrink-0 fill-current transition-transform", !open && "rotate-180")}
    />
  );
}
