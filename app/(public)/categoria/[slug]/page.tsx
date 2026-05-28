import RecommendedProductsServer from '@/src/shared/components/RecommendedProductsServer';
import SearchResults from '@/src/shared/components/SearchResults';
import Image from 'next/image';
import Link from 'next/link';

export default function CategoriaResultPage() {
  return (
    <>
      <SearchResults />

      <RecommendedProductsServer />
    </>
  );
}