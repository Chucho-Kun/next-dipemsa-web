import ProductCard from "@/src/shared/components/ProductCard";
import RecommendedProducts from "@/src/shared/components/RecommendedProducts";

export default function SlugPage() {
  return (
    <>
        <section>
          <ProductCard />
        </section>

        <section>
          <RecommendedProducts />
        </section>
    </>
  )
}
