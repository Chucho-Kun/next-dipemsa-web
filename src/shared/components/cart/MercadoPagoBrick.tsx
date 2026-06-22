'use client';

import { useCartStore } from '@/src/store/cartStore';
import { useDeliveryStore } from '@/src/store/deliveryStore';
import { Payment } from '@mercadopago/sdk-react';
import { initMercadoPago } from '@mercadopago/sdk-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

initMercadoPago(process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY!, {
  locale: 'es-MX',
});

interface Props {
  preferenceId: string;
  amount: number;
  onSuccess?: (data: any) => void;
}

export default function MercadoPagoBrick({ preferenceId, amount, onSuccess }: Props) {
    const [ resetKey,  setResetKey ] = useState(0)
    const { formData: { nombre, apellidos, direccion, entreCalles, ciudad, cp, telefono } } = useDeliveryStore()

    const { shippingCost, subTotal, totalPrice, items } = useCartStore()

    const handleReset = () => {
        setResetKey( prev => prev + 1)
    }

  return (
    <div className="max-w-lg mx-auto">
      <Payment
        key={resetKey}
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

            const { formData:{ payer} } = formData

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

            // ==================== ENVÍO DE CORREO ====================
                console.log("📧 Intentando enviar correo...");

                toast.success('Se está procesando su pago, favor de no salir de esta ventana...',{
                    duration: 20000
                })

                const emailRes = await fetch('/api/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                    orderData: {
                        paymentId: result.payment_id || 'N/A',
                        items: items,
                        subtotal: subTotal(),
                        shipping: shippingCost(),
                        total: totalPrice(),
                    },
                    customerEmail: payer.email ,
                    deliveryData: { nombre, apellidos, direccion, entreCalles, ciudad, cp, telefono }
                    })
                });

                const emailResult = await emailRes.json();

                if (emailRes.ok) {
                    console.log("✅ Correo enviado correctamente:", emailResult);
                    toast.success("¡Pago exitoso! Te hemos enviado un correo de confirmación.");
                } else {
                    console.error("❌ Error enviando correo:", emailResult);
                    toast.error("Pago exitoso, pero no se pudo enviar el correo de confirmación.");
                }
                // ========================================================
                setTimeout(() => {
                    onSuccess?.(result);
                },2000)
            
            } else {

                if(result.status_detail == "cc_rejected_insufficient_amount") {
                    toast.error( // FUND
                        <div className="text-left">
                            <span className="font-bold">Fondos insuficientes en tu tarjeta.</span><br />
                            Por favor verifica el saldo disponible o utiliza otra tarjeta.
                        </div>,
                        { duration: 10000 }
                    );
                    handleReset()
                } else if( result.status_detail == "cc_rejected_other_reason" ){
                    toast.error( // OTHE
                        <div className="text-left">
                            <span className="font-bold">Lo sentimos, hubo un error al procesar tu pago.</span><br />
                            Por favor intenta nuevamente o utiliza otro método de pago.
                        </div>,
                        { duration: 10000 }
                    );
                    handleReset()
                } else if( result.status_detail == "cc_rejected_bad_filled_security_code" ){
                    toast.error( // SECU
                        <div className="text-left">
                            <span className="font-bold">El código de seguridad (CVV) es incorrecto.</span><br />
                            Por favor verifica los 3 o 4 dígitos de la parte trasera de tu tarjeta.
                        </div>,
                        { duration: 10000 }
                    );
                    handleReset()
                } else if( result.status_detail == "cc_rejected_bad_filled_date" ){
                    toast.error( // EXPI
                        <div className="text-left">
                            <span className="font-bold">La tarjeta ha expirado.</span><br />
                            Por favor verifica la fecha de vencimiento o utiliza otra tarjeta.
                        </div>,
                        { duration: 10000 }
                    );
                    handleReset()
                } else if( result.status_detail == "cc_rejected_call_for_authorize" ){
                    toast.error( // CALL
                        <div className="text-left">
                            <span className="font-bold">Tu banco requiere autorización adicional.</span><br />
                            Por favor contacta a tu banco para autorizar el pago e intenta nuevamente.
                        </div>,
                        { duration: 10000 }
                    );
                    handleReset()
                } else if( result.status_detail == "pending_contingency" ){
                    toast.error( // CONT
                        <div className="text-left">
                            <span className="font-bold">Tu pago está en proceso.</span><br />
                            Estamos esperando la confirmación del banco. Te avisaremos en cuanto se complete.
                        </div>,
                        { duration: 10000 }
                    );
                } else {
                     toast.error(
                        <div className="text-left">
                            <span className="font-bold">Ocurrió un error al procesar tu pago.</span><br />
                            Por favor intenta con otra tarjeta o utiliza otro método de pago.
                        </div>,
                        { duration: 10000 }
                    ); 
                    handleReset()
                }

            }
        } catch (error) {
            console.error(error);
            alert('Error al procesar el pago');
        }
        }}
        onReady={() => console.log('✅ Brick cargado correctamente')}
        onError={(error) => {
          console.error('Error cargando el Brick:', error);
        }}
      />
    </div>
  );
}