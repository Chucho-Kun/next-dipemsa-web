import ProductCard from "@/src/shared/components/ProductCard";
import ProductCardsServer from "@/src/shared/components/ProductCardsServer";
import RecommendedProductsServer from "@/src/shared/components/RecommendedProductsServer";
import { Metadata } from "next";

// Metadata dinámica
export async function generateMetadata(props: PageProps<'/producto/[id]/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params;
  
  return {
    title: `Dipemsa | ${slug.replace(/-/g, ' ')
                            .replace(/\b\w/g, letra => letra.toUpperCase())
    }`,
    description: `Explora nuestra selección de ${slug.toLowerCase()} de las mejores marcas.`,
    openGraph: {
      title: `${slug}`,
    }
  };
}

export default async function ProductoPage(props: PageProps<'/producto/[id]/[slug]'>) {

  const { id } = await props.params

  return (
    <>
        <section>
          {/* <ProductCard slug={ slug } /> */}
          <ProductCardsServer id={id} />
        </section>

        <section>
          <RecommendedProductsServer />
        </section>
    </>
  )
}
