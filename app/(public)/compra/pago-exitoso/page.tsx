'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';
import { useCartStore } from '@/src/store/cartStore';
import { CheckCircle } from 'lucide-react';

export default function PagoExitosoPage() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('payment_id');
  const { clearCart, items } = useCartStore();

  // Limpiar carrito al confirmar el pago exitoso
  useEffect(() => {
    if (paymentId) {
      clearCart();
    }
  }, [paymentId, clearCart]);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-6">
        <div className="bg-white rounded-3xl shadow-lg p-10 text-center">
          
          {/* Icono de éxito */}
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

          <div className="border-t border-b py-6 mb-8 text-left">
            <h3 className="font-semibold text-lg mb-4">¿Qué sigue ahora?</h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start gap-3">
                <span className="text-green-600 mt-1">✓</span>
                Recibirás un correo de confirmación
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 mt-1">✓</span>
                Te contactaremos vía WhatsApp para coordinar la entrega
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 mt-1">✓</span>
                Tu pedido está siendo preparado
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <Link
              href="/"
              className="bg-[#1E2A44] text-white py-4 rounded-2xl font-bold text-lg hover:bg-black transition"
            >
              Volver al Inicio
            </Link>

            <Link
              href={ `https://api.whatsapp.com/send?phone=5537091930=&text=${ 
                encodeURIComponent(`Hola, realicé una compra en su sitio web con el ID: ${ paymentId }`)
                }`}
              target='_blank'
              className="border border-gray-300 py-4 rounded-2xl font-medium hover:bg-gray-50 transition"
            >
              Contactar por WhatsApp
            </Link>
          </div>

          <p className="text-gray-400 mt-8">
            Cualquier duda puedes escribirnos a contacto@dipemsa.com.mx
          </p>
        </div>
      </div>
    </div>
  );
}