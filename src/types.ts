import { StaticImageData } from "next/image";

export interface ImageTab {
  label: string;
  src: string;
  alt: string;
  heading: string;
  body: string[];
}

export interface ImageTabsProps {
  tabs: ImageTab[];
  eyebrow?: React.ReactNode;
  defaultActive?: number;
  className?: string;
}

export interface StatItem {
  value: string | number;
  suffix?: string;
  label: string;
  hex: string;
}

export interface StatsSectionProps {
  eyebrow?: string;
  heading: string;
  stats: StatItem[];
  backgroundAlt?: string;
  overlayOpacity?: number;
  className?: string;
}

export type UtilityNavItem = {
  name: string;
  bold: boolean;
  href: string;
  historyLabel: string;
  dropdown: { label: string; href: string }[];
};

export type MainNavItem = {
  name: string;
  href: string;
  columns: Array<{
    heading: string;
    links: Array<{
      label: string;
      href: string;
    }>;
  }>;
};

export interface CategoryItem {
  name: string;
  href: string;
  image: StaticImageData | string;
  alt?: string;
}

export type CoffeeGrade = {
  id: string;
  title: string;
  image: string;
  description: string;
  button: string;
};

export type SustainabilityBlock = {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  bg: string;
  text: string;
};


export interface CategoryCarouselProps {
  items: CategoryItem[];
  itemWidth?: {
    base?: string;
    sm?: string;
    md?: string;
  };
  scrollStep?: number;
  openInNewTab?: boolean;
  className?: string;
  imageShape?: "circle" | "rounded" | "square";
  imageSizes?: string;
}

export interface FAQ {
  id: number;
  question: string;
  answer: string;
}

export interface FAQSectionProps {
  faqs: FAQ[];
}

export interface Language {
  label: string;
  code: string;
  abreviation: string;
}

export interface LanguageSelectorProps {
  languages: Language[];
}
