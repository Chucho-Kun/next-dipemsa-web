'use client';

import { useEffect } from 'react';
import { CheckCircle, Clock, Loader2 } from 'lucide-react';

type Props = {
  variante: 'aprobado' | 'pendiente';
};

const COPY = {
  aprobado: {
    titulo: '¡Compra exitosa!',
    cuerpo: 'Te enviaremos un correo de confirmación con el detalle de tu pedido.',
  },
  pendiente: {
    titulo: 'Estamos confirmando tu pago',
    cuerpo: 'Te enviaremos un correo en cuanto se acredite.',
  },
};

export default function PagoProcesadoOverlay({ variante }: Props) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const { titulo, cuerpo } = COPY[variante];

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-sm flex items-center justify-center px-6"
    >
      <div className="max-w-md w-full text-center">
        <div
          className="mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-8"
          style={{ backgroundColor: variante === 'aprobado' ? '#16a34a1a' : '#f59e0b1a' }}
        >
          {variante === 'aprobado' ? (
            <CheckCircle className="w-16 h-16" style={{ color: '#16a34a' }} />
          ) : (
            <Clock className="w-16 h-16 text-amber-500" />
          )}
        </div>

        <h1 className="text-3xl font-bold mb-4" style={{ color: variante === 'aprobado' ? '#16a34a' : '#b45309' }}>
          {titulo}
        </h1>

        <p className="text-lg text-gray-600 mb-8">{cuerpo}</p>

        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <Loader2 className="animate-spin" size={18} />
          <span>No cierres esta ventana, te estamos redirigiendo…</span>
        </div>
      </div>
    </div>
  );
}
