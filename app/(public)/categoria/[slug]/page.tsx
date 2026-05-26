import RecommendedProducts from '@/src/shared/components/RecommendedProducts';
import SearchResults from '@/src/shared/components/SearchResults';
import Image from 'next/image';
import Link from 'next/link';

export default function CategoriaResultPage() {
  return (
    <>
      <SearchResults />

      <RecommendedProducts />
    </>
  );
}