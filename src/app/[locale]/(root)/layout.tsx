import Footer from "@/src/components/Footer";
import Header from "@/src/components/Header";
import { HeaderVisibilityProvider } from "@/src/components/HeaderVisibility";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <HeaderVisibilityProvider>
      <Header />
      {children}
      <Footer />
    </HeaderVisibilityProvider>
  );
}
