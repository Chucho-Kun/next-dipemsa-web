'use client';

import { useState } from 'react';
import { useCartStore } from '@/src/store/cartStore';
import { useDeliveryStore } from '@/src/store/deliveryStore';
import MercadoPagoBrick from './MercadoPagoBrick';
import toast from 'react-hot-toast';

export default function MediosdePagoComponent() {
  const { items, totalPrice, subTotal, shippingCost } = useCartStore();
  const { formData, validateForm } = useDeliveryStore();
  
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { formData:{ nombre, apellidos, direccion, entreCalles, ciudad, cp, telefono } } = useDeliveryStore()

  const crearPreferencia = async () => {
    // 1. Validar que haya productos
    if (items.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    // 2. Validar datos de entrega
    const isDeliveryValid = validateForm();
    if (!isDeliveryValid) {
      return; // El toast de errores ya se muestra en validateForm
    }

    setLoading(true);

    try {
      const res = await fetch('/api/mercadopago/preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            title: `${item.titulo} - ${item.descripcion || ''}`.trim(),   // ← Lo más importante
            description: item.descripcion || '',
            quantity: item.cantidad,
            unit_price: parseFloat(item.precio.replace(/[$,]/g, '')) || 0,
            currency_id: 'MXN',
            id: item.id
          })),
          payer: {
            name: formData.nombre,
            surname: formData.apellidos,
            email: '',                    // Puedes agregar un campo de email después
            phone: {
              area_code: "52",
              number: formData.telefono.replace(/\D/g, '')
            },
            address: {
              street_name: formData.direccion,
              street_number: "",           // Puedes agregar campo si quieres
              zip_code: formData.cp
            }
          },
          // Datos adicionales útiles
            // ==================== ADDITIONAL_INFO ====================
          additional_info: {
            items: items.map(item => ({
              id: item.id,
              title: item.titulo,
              description: item.descripcion,
              quantity: item.cantidad,
              unit_price: parseFloat(item.precio.replace(/[$,]/g, '')) || 0,
            })),
            shipments: {
              receiver_address: {
                zip_code: formData.cp,
                street_name: formData.direccion,
              }
            },
            payer: {
              first_name: formData.nombre,
              last_name: formData.apellidos,
              phone: {
                area_code: "52",
                number: formData.telefono.replace(/\D/g, '')
              }
            }
          },
          metadata: {
            ciudad: formData.ciudad,
            entre_calles: formData.entreCalles,
            telefono: formData.telefono,
          }
        }),
      });

      // ← NUEVO: Mejor manejo de respuesta
    const text = await res.text(); // Primero leemos como texto

      if (!res.ok) {
        // console.error("Error del servidor:", text);
        alert(`Error del servidor: ${res.status} - Revisa la consola`);
        return;
      }

      const data = JSON.parse(text); // Solo parseamos si es JSON válido

      if (data.preferenceId) {
        setPreferenceId(data.preferenceId);
      } else {
        alert('Error: No se recibió preferenceId');
      }
    } catch (error) {
      // console.error('Error completo:', error);
      alert('Error al conectar con el servidor de pagos');
    } finally {
      setLoading(false);
    }

  };

  return (
    <div className="min-h-125 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {!preferenceId ? (
          <button
            onClick={crearPreferencia}
            disabled={loading || items.length === 0}
            className="w-full bg-[#00B1EA] hover:bg-[#0099CC] text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50 transition"
          >
            {loading ? 'Procesando...' : 'Pagar con Mercado Pago'}
          </button>
        ) : (
          <MercadoPagoBrick
            preferenceId={preferenceId}
            amount={totalPrice()}
            onSuccess={(data) => {
              window.location.href = `/compra/pago-exitoso?payment_id=${data.payment_id}`;
            }}
          />
        )}

        <button
          onClick={async () => {
            try {
              const testData = {
                orderData: {
                  paymentId: "TEST-" + Date.now(),
                  items: items.length > 0 ? items : [{
                    titulo: "Producto de Prueba",
                    descripcion: "Lija de agua",
                    cantidad: 1,
                    precio: "$450.00"
                  }],
                  subtotal: subTotal(),
                  shipping: shippingCost(),
                  total: totalPrice(),
                },
                customerEmail: "gameroapp@gmail.com",
                deliveryData: { nombre, apellidos, direccion, entreCalles, ciudad, cp, telefono }
              };

              console.log("🧪 Enviando datos de prueba:", testData);

              const res = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testData)
              });

              const result = await res.json();

              if (res.ok) {
                toast.success("✅ Correo de prueba enviado correctamente");
                console.log("✅ Respuesta:", result);
              } else {
                toast.error("❌ Error al enviar correo de prueba");
                console.error("❌ Error:", result);
              }
            } catch (error) {
              toast.error("Error de conexión");
              console.error("❌ Error completo:", error);
            }
          }}
          className="mt-4 bg-orange-600 text-white px-6 py-3 rounded-xl"
        >
          🔧 Probar Envío de Correo (Directo)
        </button>
      </div>
    </div>
  );
}