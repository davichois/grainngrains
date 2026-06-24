import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { pageMetadata, metaText } from "@/src/lib/site";

import Image from "next/image";
import { CategoryItem, CoffeeGrade } from "@/src/types";
import headershop from "@/public/images/shop/header-shop.webp";
import CategoryCarousel from "@/src/components/Categorycarousel";
import DegreeReports, { ReportFile } from "@/src/components/DegreeReports";

import coffee01 from "@/public/images/shop/coffee-1.webp";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const title = `${t("shop.types.greenCoffee")} · ${t("shop.types.roastedCoffee")} · ${t("shop.types.groundCoffee")}`;
  return pageMetadata({
    locale,
    path: "/shop",
    title,
    description: metaText(t("motto")),
  });
}

/* Lee los PDFs de public/reports/<carpeta> y arma nombre + URL pública */
function readReports(folder: string): ReportFile[] {
  const dir = path.join(process.cwd(), "public", "reports", folder);
  let files: string[] = [];
  try {
    files = fs.readdirSync(dir).filter((f) => /\.pdf$/i.test(f));
  } catch {
    files = [];
  }
  return files.sort().map((file) => ({
    name: file
      .replace(/\.[^.]+$/, "")
      .replace(/grain\s*(and|&|y)\s*grains/i, "")
      .replace(/\bGrando\b/i, "Grado") // corrige typo en el nombre del archivo
      .replace(/\bpuntos\b/i, "puntos")
      .replace(/\s+/g, " ")
      .trim(),
    url: `/reports/${folder}/${encodeURIComponent(file)}`,
  }));
}

export default async function Home() {
  const t = await getTranslations();

  const categories: CategoryItem[] = [
    {
      name: t("shop.degrees.degree1"),
      href: "/shop-by-category/spices",
      image: coffee01,
      alt: t("shop.degrees.degree1"),
    },
    {
      name: t("shop.degrees.degree2"),
      href: "/shop-by-category/cocoa",
      image: coffee01,
      alt: t("shop.degrees.degree2"),
    },
    {
      name: t("shop.degrees.degree3"),
      href: "/shop-by-category/nuts",
      image: coffee01,
      alt: t("shop.degrees.degree3"),
    },
  ];

  const degrees: CoffeeGrade[] = [
    {
      id: "degree1",
      title: t("shop.degrees.degree1"),
      image: "coffee01",
      description: t("shop.degrees.description1"),
      button: t("shop.cta"),
    },
    {
      id: "degree2",
      title: t("shop.degrees.degree2"),
      image: "coffee01",
      description: t("shop.degrees.description2"),
      button: t("shop.cta"),
    },
  ];

  /* Informes por grado, leídos de /public/reports */
  const reports: Record<string, ReportFile[]> = {
    degree1: readReports("grado-1"),
    degree2: readReports("grado-2"),
  };

  const reportLabels = {
    title: t("shop.reports.title"),
    choose: t("shop.reports.choose"),
    preview: t("shop.reports.preview"),
    download: t("shop.reports.download"),
    close: t("shop.reports.close"),
  };

  return (
    <div className="bg-white text-cyan-950 overflow-x-hidden min-h-screen">
      <div className="h-30 md:h-20"></div>

      <div className="relative w-full h-36 sm:h-48 md:h-60 lg:h-72 xl:h-80">
        <Image
          src={headershop}
          alt="Shop Header"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>

      <div className="flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
        <h1
          className={`font-extrabold tracking-wide text-[clamp(1rem,3.5vw,2rem)] text-center mb-3`}
        >
          {t("shop.title")}
        </h1>
        <strong className="font-black tracking-tight leading-[0.85] text-[clamp(2.3rem,10vw,8rem)] wrap-break-word text-center max-w-full">
          {t("shop.subtitle")}
        </strong>
        <CategoryCarousel items={categories} />
      </div>

      <section className="text-[#0a656f] bg-gray-100 py-10 px-6 mt-14">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-[clamp(25px,4.2vw,26px)] font-thin">
            {t("shop.whatsOurCoffee")}
          </h3>
        </div>
      </section>

      <section className="text-white bg-cyan-950 py-10 md:py-25 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-thin tracking-wide text-[clamp(1.4rem,5vw,2.6rem)] mb-3">
            {t("shop.degreePresentationTitle")}
          </h1>
          <strong className="font-black tracking-tight leading-[0.85] text-[clamp(1.8rem,5vw,10rem)] wrap-break-word">
            {t("shop.degreePresentationSubtitle")}
          </strong>
        </div>
      </section>

      {/* Grados: grilla responsive + previsualización/descarga de informes */}
      <DegreeReports
        degrees={degrees}
        reports={reports}
        labels={reportLabels}
      />
    </div>
  );
}
