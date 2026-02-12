"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Locale, SUPPORTED_LOCALES } from "@/lib/i18n";

/*
  Locale switcher component.

  Rewrites only the locale segment while preserving the rest of the current path.
*/

interface LanguageSwitcherProps {
  currentLocale: Locale;
}

function toLocalePath(pathname: string, nextLocale: Locale): string {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return `/${nextLocale}`;
  }

  if (SUPPORTED_LOCALES.includes(segments[0] as Locale)) {
    segments[0] = nextLocale;
    return `/${segments.join("/")}`;
  }

  return `/${nextLocale}/${segments.join("/")}`;
}

export function LanguageSwitcher({ currentLocale }: LanguageSwitcherProps) {
  const { t } = useTranslation();
  const pathname = usePathname();

  return (
    <div className="flex items-center justify-center w-52 gap-3 rounded-2xl border border-violet-200/70 bg-white/80 p-2 text-sm text-slate-600 backdrop-blur-sm">
      <p className="pr-3 font-semibold tracking-wide text-slate-700">
        {t("localeLabel")}
      </p>

      <div className="flex items-center gap-1 rounded-xl bg-violet-100/70 p-1">
        {SUPPORTED_LOCALES.map((locale) => (
          <Link
            key={locale}
            href={toLocalePath(pathname, locale)}
            className={
              currentLocale === locale
                ? "rounded-lg bg-linear-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-white shadow-sm transition-all duration-200"
                : "rounded-lg px-3 py-1.5 text-slate-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:text-slate-900"
            }
          >
            {locale.toUpperCase()}
          </Link>
        ))}
      </div>
    </div>
  );
}
