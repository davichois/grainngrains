import Image from "next/image";
import { Caveat } from "next/font/google";

import grainngrains from "@/public/grainngrains.svg";
import { Link } from "../i18n/navigation";

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "700"],
});

export function GrainngrainsLogo({ tagline }: { tagline: string }) {
  return (
    <Link href="/" className="shrink-0 flex flex-col items-start leading-none">
      <Image src={grainngrains} alt="logo" width={125} height={125} priority />
      <span
        className={`rotate-[-5deg] px-15 py-1 text-[14px] text-cyan-800 font-medium ${caveat.className}`}
      >
        {tagline}
      </span>
    </Link>
  );
}
