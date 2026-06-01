import RecommendedProductsServer from "@/src/shared/components/RecommendedProductsServer";
import TrademarckResults from "@/src/shared/components/TrademarckResults";
import { slugToMarca } from "@/src/shared/db/queries";
import { Metadata } from "next";

// Metadata dinámica
export async function generateMetadata(props: PageProps<'/categoria/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params;
  const marcaNombre = slugToMarca(slug);

  return {
    title: `Dipemsa | ${marcaNombre}`,
    description: `Explora productos de la marca ${marcaNombre.toLowerCase()}`,
    openGraph: {
      title: `${marcaNombre}`,
    }
  };
}

export default async function MarcaResultPage(props: PageProps<'/marca/[slug]'>) {

  const { slug } = await props.params
  
  return (
      <>
        <TrademarckResults slug={ slug } />
        <RecommendedProductsServer />
      </>

  )
}
