import CompraConNosotros from "@/src/shared/components/CompraConNosotros";
import ProductsSection from "@/src/shared/components/ProductsSection";
import RecommendedProductsServer from "@/src/shared/components/RecommendedProductsServer";
import SliderMain from "@/src/shared/components/SliderMain";
import TrademarckResults from "@/src/shared/components/TrademarckResults";
import { productos } from "@/src/shared/db/productos";
import MarcasPage from "./marcas/page";

export default function page() {
  return (
    <>
        <section>
          <SliderMain />
        </section>

       <RecommendedProductsServer />

        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
              PRODUCTOS POR CATEGORÍA
            </h2>
            <ProductsSection productos={productos} />  
          </div>
        </section>

        <section>
          <CompraConNosotros />
        </section>

        <MarcasPage />

    </>
  )
}
