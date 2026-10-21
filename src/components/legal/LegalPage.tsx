import { getTranslations } from "next-intl/server";
import { FileText, Mail } from "lucide-react";
import { Link } from "@/src/i18n/navigation";
import {
  COMPANY,
  UPDATED,
  legalDoc,
  type LegalDocId,
} from "@/src/content/legal";

const DOCS: { id: LegalDocId; href: string }[] = [
  { id: "terms", href: "/terms" },
  { id: "privacy", href: "/privacy" },
  { id: "cookies", href: "/cookies" },
];

/** Página legal: título, índice, secciones y enlaces a los demás documentos */
export default async function LegalPage({
  locale,
  id,
}: {
  locale: string;
  id: LegalDocId;
}) {
  const t = await getTranslations({ locale, namespace: "legal" });
  const tFooter = await getTranslations({ locale, namespace: "footer" });
  const { doc, lang } = legalDoc(locale, id);
  const updated = new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${UPDATED}T00:00:00Z`));

  return (
    <main className="bg-white px-5 pb-24 pt-36 font-ui sm:px-8 md:pt-44">
      <article lang={lang} className="mx-auto max-w-3xl">
        <header className="border-b border-gray-200 pb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#116e78]">
            {COMPANY.name}
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-gray-900 md:text-5xl">
            {doc.title}
          </h1>
          <p className="mt-3 text-sm text-gray-500">
            {t("updated", { date: updated })}
          </p>
          {lang !== locale && (
            <p
              lang={locale}
              className="mt-5 rounded-xl bg-[#f7f6f3] px-4 py-3 text-sm text-gray-600"
            >
              {t("onlyIn")}
            </p>
          )}
          <p className="mt-6 text-base leading-relaxed text-gray-700">
            {doc.intro}
          </p>
        </header>

        {/* Índice */}
        <nav
          aria-label={t("contents")}
          className="my-8 rounded-xl border border-gray-200 p-5"
        >
          <p className="mb-3 text-sm font-semibold text-gray-900">
            {t("contents")}
          </p>
          <ol className="grid gap-1.5 text-sm sm:grid-cols-2">
            {doc.sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-gray-600 underline-offset-4 hover:text-[#116e78] hover:underline"
                >
                  {s.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="space-y-10">
          {doc.sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-32">
              <h2 className="mb-3 text-xl font-bold text-gray-900">
                {s.heading}
              </h2>
              <div className="space-y-3 text-[15px] leading-relaxed text-gray-700">
                {s.blocks.map((b, i) =>
                  typeof b === "string" ? (
                    <p key={i}>{b}</p>
                  ) : (
                    <ul key={i} className="list-disc space-y-1.5 pl-5">
                      {b.list.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ),
                )}
              </div>
            </section>
          ))}
        </div>

        {/* Contacto y otros documentos */}
        <footer className="mt-14 space-y-6 border-t border-gray-200 pt-8">
          <p className="flex items-center gap-2 text-sm text-gray-600">
            <Mail size={16} aria-hidden className="text-[#116e78]" />
            {t("contact")}{" "}
            <a
              href={`mailto:${COMPANY.email}`}
              className="font-semibold text-[#116e78] hover:underline"
            >
              {COMPANY.email}
            </a>
          </p>
          <nav aria-label={t("related")}>
            <p className="mb-3 text-sm font-semibold text-gray-900">
              {t("related")}
            </p>
            <ul className="flex flex-wrap gap-2.5">
              {DOCS.filter((d) => d.id !== id).map((d) => (
                <li key={d.id}>
                  <Link
                    href={d.href}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-[#116e78] hover:text-[#116e78]"
                  >
                    <FileText size={15} aria-hidden />
                    {tFooter(d.id)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </footer>
      </article>
    </main>
  );
}
