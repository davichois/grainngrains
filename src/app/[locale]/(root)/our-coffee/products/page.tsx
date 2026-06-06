import { ProductShowcase } from "@/src/components/product-showcase";
import { HideHeaderAtTop } from "@/src/components/HeaderVisibility";

export default function ProductPage() {
  return (
    <>
      <HideHeaderAtTop />
      <ProductShowcase />
    </>
  );
}
