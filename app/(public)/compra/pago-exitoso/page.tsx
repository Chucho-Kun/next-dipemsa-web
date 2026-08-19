import PagoExitosoContent from '@/src/shared/components/cart/PagoExitosoContent';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dipemsa | Gracias por tu compra',
  description: 'Tu pago fue procesado exitosamente. Gracias por comprar en DIPEMSA',
};

// Esta es la página principal (Server Component)
export default function PagoExitoso() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#16a34a] mx-auto"></div>
          <p className="mt-4 text-gray-600">Confirmando tu compra...</p>
        </div>
      </div>
    }>
      <PagoExitosoContent />
    </Suspense>
  );
}