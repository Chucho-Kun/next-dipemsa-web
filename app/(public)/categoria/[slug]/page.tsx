import CategoryResults from '@/src/shared/components/CategoryResults';
import RecommendedProductsServer from '@/src/shared/components/RecommendedProductsServer';
import { slugToCategory } from '@/src/shared/db/queries';
import { Metadata } from 'next';

// Metadata dinámica
export async function generateMetadata(props: PageProps<'/categoria/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params;
  const categoriaNombre = slugToCategory(slug); // "perfiles-plasticos" → "Perfiles Plásticos"

  return {
    title: `Dipemsa | ${categoriaNombre}`,
    description: `Explora nuestra selección de ${categoriaNombre.toLowerCase()} de las mejores marcas.`,
    openGraph: {
      title: `${categoriaNombre}`,
    }
  };
}

export default async function CategoriaResultPage(props: PageProps<'/categoria/[slug]'>) {

  const { slug } = await props.params

  return (
    <>
      <CategoryResults slug={ slug } />

      <RecommendedProductsServer />
    </>
  );
}