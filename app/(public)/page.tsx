import CompraConNosotros from "@/src/shared/components/CompraConNosotros";
import ProductsSection from "@/src/shared/components/ProductsSection";
import RecommendedProducts from "@/src/shared/components/RecommendedProducts";
import SliderMain from "@/src/shared/components/SliderMain";
import { productos } from "@/src/shared/db/productos";

export default function page() {
  return (
    <>
        <section>
          <SliderMain />
        </section>

        <section>
          <RecommendedProducts />
        </section>

        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
              CATEGORÍAS
            </h2>
            <ProductsSection productos={productos} />  
          </div>
        </section>

        <section>
          <CompraConNosotros />
        </section>

    </>
  )
}
