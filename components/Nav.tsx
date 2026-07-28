"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/leads", label: "Leads" },
  { href: "/deals", label: "Deals" },
  { href: "/projects", label: "Projects" },
  { href: "/contacts", label: "Contacts" },
  { href: "/invoices", label: "Invoices" },
  { href: "/reports", label: "Reports" },
];

export function Nav({ signOutAction }: { signOutAction: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-6 border-b border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="font-semibold text-zinc-900 dark:text-zinc-50">
        TBK Enterprise Consulting
      </div>
      <nav className="flex flex-1 items-center gap-1">
        {NAV_ITEMS.map((item) => {
          const current = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={current ? "page" : undefined}
              className={
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors " +
                (current
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800")
              }
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <form action={signOutAction}>
        <button
          type="submit"
          className="text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
