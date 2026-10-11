import { getTranslations } from "next-intl/server";
import { Lock, ShoppingBag } from "lucide-react";
import { Link } from "@/src/i18n/navigation";
import { CartProvider } from "@/src/components/cart/CartContext";
import { GrainngrainsLogo } from "@/src/components/GrainngrainsLogo";

/* Layout del checkout: header mínimo (sin menú ni footer) para que el
   cliente se concentre en terminar su compra */
export default async function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations();

  return (
    <CartProvider>
      {/* Mismo ancho total que formulario + resumen (31 + 3 + 3 + 25 rem):
          el logo se alinea con el formulario y la bolsa con el resumen */}
      <header className="border-b border-gray-200 bg-white">
        <div className="px-5 py-3 sm:px-8">
          <div className="mx-auto flex w-full max-w-xl items-center justify-between lg:max-w-[62rem]">
            <GrainngrainsLogo tagline={t("nav.farmToFuture")} />
            <div className="flex items-center gap-5 font-ui">
              <p className="hidden items-center gap-1.5 text-[13px] font-medium text-gray-500 sm:flex">
                <Lock size={15} aria-hidden />
                {t("checkout.secure")}
              </p>
              <Link
                href="/our-coffee/products"
                aria-label={t("checkout.backToShop")}
                className="text-gray-700 transition-colors hover:text-[#116e78]"
              >
                <ShoppingBag size={22} aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </header>
      {children}
    </CartProvider>
  );
}
