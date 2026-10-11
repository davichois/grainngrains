import Footer from "@/src/components/Footer";
import Header from "@/src/components/Header";
import { HeaderVisibilityProvider } from "@/src/components/HeaderVisibility";
import { CartProvider } from "@/src/components/cart/CartContext";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <HeaderVisibilityProvider>
      <CartProvider>
        <Header />
        {children}
        <Footer />
      </CartProvider>
    </HeaderVisibilityProvider>
  );
}
