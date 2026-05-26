import ProductsSection from '@/src/shared/components/ProductsSection';
import { productos } from '@/src/shared/db/productos';
import Image from 'next/image';

export default function ProductosPage() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
          PRODUCTOS
        </h2>

        <ProductsSection productos={productos} />

      </div>
    </section>
  );
}