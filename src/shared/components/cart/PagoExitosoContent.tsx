'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';
import { useCartStore } from '@/src/store/cartStore';
import { CheckCircle } from 'lucide-react';

export default function PagoExitosoContent() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('payment_id');
  const { clearCart } = useCartStore();

  useEffect(() => {
    if (paymentId) {
      clearCart();
    }
  }, [paymentId, clearCart]);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-6">
        <div className="bg-white rounded-3xl shadow-lg p-10 text-center">
          <div className="mx-auto w-28 h-28 bg-green-100 rounded-full flex items-center justify-center mb-8">
            <CheckCircle className="w-20 h-20 text-green-600" />
          </div>

          <h1 className="text-5xl font-bold text-green-600 mb-4">
            ¡Pago Exitoso!
          </h1>
          
          <p className="text-xl text-gray-600 mb-8">
            Gracias por tu compra en <span className="font-semibold">DIPEMSA</span>
          </p>

          {paymentId && (
            <div className="bg-gray-100 rounded-2xl p-6 mb-8">
              <p className="text-sm text-gray-500 mb-1">Número de pago</p>
              <p className="font-mono text-2xl font-semibold text-gray-800">
                #{paymentId}
              </p>
            </div>
          )}

          {/* Resto de tu contenido (datos de entrega, botones, etc.) */}
          <div className="flex flex-col gap-4">
            <Link
              href="/"
              className="bg-[#1E2A44] text-white py-4 rounded-2xl font-bold text-lg hover:bg-black transition"
            >
              Volver al Inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}