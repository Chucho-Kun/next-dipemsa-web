'use client';

import { Payment } from '@mercadopago/sdk-react';
import { initMercadoPago } from '@mercadopago/sdk-react';

initMercadoPago(process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY!, {
  locale: 'es-MX',
});

interface Props {
  preferenceId: string;
  amount: number;
  onSuccess?: (data: any) => void;
}

export default function MercadoPagoBrick({ preferenceId, amount, onSuccess }: Props) {

  return (
    <div className="max-w-lg mx-auto">
      <Payment
        initialization={{ 
          preferenceId,
          amount 
        }}
        customization={{
          paymentMethods: {
            ticket: 'all',
            creditCard: 'all',
            debitCard: 'all',
            bankTransfer: 'all',
          },
        }}
        onSubmit={async (formData, brick) => {
        try {
            console.log("Enviando al backend:", formData);

            const res = await fetch('/api/mercadopago/process-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
            });

            const result = await res.json();
            console.log("Respuesta del servidor:", result);

            if (result.status === 'approved' || result.status === 'in_process') {
            onSuccess?.(result);
            } else {
            alert(`Pago ${result.status || 'no aprobado'}`);
            }
        } catch (error) {
            console.error(error);
            alert('Error al procesar el pago');
        }
        }}
        onReady={() => console.log('✅ Brick cargado correctamente')}
        onError={(error) => {
          console.error('Error en Brick:', error);
        }}
      />
    </div>
  );
}