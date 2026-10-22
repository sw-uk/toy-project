import Link from "next/link";

import { LocaleSelect } from "./locale-select";
import { NavLinks } from "./nav-links";

export function SiteHeader() {
  return (
    <header className="flex flex-wrap items-center gap-3">
      <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
        <span className="size-2.5 rounded-full bg-primary ring-4 ring-primary/15" />
        PreSignal
      </Link>
      <NavLinks />
      <span className="flex-1" />
      <LocaleSelect />
    </header>
  );
}
