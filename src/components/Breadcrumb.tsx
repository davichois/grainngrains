"use client";

import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { Link } from "../i18n/navigation";

interface BreadcrumbProps {
  labels?: Record<string, string>;
  hideSegments?: string[];
  className?: string;
}

function toLabel(segment: string): string {
  return segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function Breadcrumb({
  labels = {},
  hideSegments = [],
  className = "",
}: BreadcrumbProps) {
  const pathname = usePathname();

  const segments = pathname.split("/").filter(Boolean);

  const crumbs = [
    { label: labels[""] ?? "Home", href: "/" },
    ...segments
      .filter((seg) => !hideSegments.includes(seg))
      .map((seg, i, arr) => ({
        label: labels[seg] ?? toLabel(seg),
        href: "/" + segments.slice(1, segments.indexOf(seg) + 1).join("/"),
        isLast: i === arr.length - 1,
      })),
  ];

  return (
    <nav
      aria-label="breadcrumb"
      data-theme="light"
      className={`breadcrumb-wrapper inset-x-0 w-full z-20 border-y border-gray-300 ${className} lg:px-20 px-4 py-4`}
    >
      <ul className="flex mx-auto py-2.75 md:py-4.5 3xl:max-w-screen-3xl 3xl:mx-auto spacing overflow-x-auto whitespace-nowrap scrollbar-hide">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;

          return (
            <li key={`${i}-${crumb.href}`} className="inline-flex items-center">
              {isLast ? (
                <span className="text-base md:text-lg text-ofi-black dark:text-ofi-white font-semibold normal-case">
                  {crumb.label}
                </span>
              ) : (
                <>
                  <Link
                    href={crumb.href}
                    className="cursor-pointer text-ofi-black text-base md:text-lg font-normal normal-case dark:text-ofi-white hover:text-ofi-purple"
                  >
                    {crumb.label}
                  </Link>
                  <span className="block px-1 md:px-2 text-ofi-purple dark:text-ofi-orange">
                    <ChevronRight className="text-cyan-700" />
                  </span>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
