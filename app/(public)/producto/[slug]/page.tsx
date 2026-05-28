import ProductCard from "@/src/shared/components/ProductCard";
import RecommendedProductsServer from "@/src/shared/components/RecommendedProductsServer";

export default function SlugPage() {
  return (
    <>
        <section>
          <ProductCard />
        </section>

        <section>
          <RecommendedProductsServer />
        </section>
    </>
  )
}
