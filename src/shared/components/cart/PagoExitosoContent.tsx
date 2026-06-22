'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCartStore } from '@/src/store/cartStore';
import { CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PagoExitoso() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('payment_id');
  const { clearCart } = useCartStore();
  const [isResending, setIsResending] = useState(false);

//   useEffect(() => {
//     if (paymentId) {
//       clearCart();
//     }
//   }, [paymentId, clearCart]);

  const resendEmail = async () => {
    if (!paymentId) return;

    setIsResending(true);
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderData: {
            paymentId: paymentId,
            // Puedes pasar items vacíos o reconstruirlos si los tienes guardados
            items: [],
            subtotal: 0,
            shipping: 0,
            total: 0,
          },
          customerEmail: "gameroapp@gmail.com", // Idealmente guardar el email del usuario
          deliveryData: {} // Puedes guardar los datos de entrega también
        })
      });

      if (res.ok) {
        toast.success("✅ Correo reenviado correctamente");
      } else {
        toast.error("No se pudo reenviar el correo");
      }
    } catch (error) {
      toast.error("Error al reenviar el correo");
    } finally {
      setIsResending(false);
    }
  };

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
              <p className="text-sm text-gray-500 mb-1">Número de Orden</p>
              <p className="font-mono text-2xl font-semibold text-gray-800">#{paymentId}</p>
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={resendEmail}
              disabled={isResending}
              className="w-full border border-gray-300 hover:bg-gray-50 py-4 rounded-2xl font-medium transition disabled:opacity-50"
            >
              {isResending ? "Enviando correo..." : "📧 Reenviar Correo de Confirmación"}
            </button>

            <Link
              href="/"
              className="block w-full bg-[#1E2A44] text-white py-4 rounded-2xl font-bold hover:bg-black transition"
            >
              Volver al Inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}