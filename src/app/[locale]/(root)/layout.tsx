import Footer from "@/src/components/Footer";
import Header from "@/src/components/Header";
import { HeaderVisibilityProvider } from "@/src/components/HeaderVisibility";
import { CartProvider } from "@/src/components/cart/CartContext";
import WhatsAppButton from "@/src/components/WhatsAppButton";
import PromoModal from "@/src/components/PromoModal";
import WelcomeModal from "@/src/components/WelcomeModal";
import IntroSplash from "@/src/components/IntroSplash";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <HeaderVisibilityProvider>
      <CartProvider>
        {/* Intro con los rostros de los productores: sale al entrar a la web */}
        <IntroSplash />
        <Header />
        {children}
        <Footer />
        <WhatsAppButton />
        <PromoModal />
        <WelcomeModal />
      </CartProvider>
    </HeaderVisibilityProvider>
  );
}
