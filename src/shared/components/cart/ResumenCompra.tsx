'use client';

import EntregaComponent from '@/src/shared/components/cart/EntregaComponent';
import MediosdePagoComponent from '@/src/shared/components/cart/MediosdePagoComponent';
import ProductComponent from '@/src/shared/components/cart/ProductComponent';
import { useCartStore } from '@/src/store/cartStore';

export default function ResumenCompraPage() {
    const { items, totalItems, totalPrice } = useCartStore()

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="grid lg:grid-cols-2 gap-10">
        
        {/* === Columna Izquierda: Resumen del Pedido === */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-6">
            Resumen del Pedido  `6 articulos`
            {/* ({`${totalItems}`} {totalItems === 1 ? 'artículo' : 'artículos'}) */}
          </h2>

          {/* Producto 1 */}
          <ProductComponent />

          {/* Producto 2 */}
          

          {/* Totales */}
          <div className="pt-6 space-y-3">
            <div className="flex justify-between text-lg">
              <span className="text-gray-600">SUBTOTAL</span>
              <span className="font-semibold">$272.00</span>
            </div>
            <div className="flex justify-between text-lg">
              <span className="text-gray-600">COSTO DE ENVÍO</span>
              <span className="font-semibold">$300.00</span>
            </div>
            
            <div className="flex justify-between text-2xl font-bold border-t pt-4">
              <span>TOTAL</span>
              <span className="text-[#E30613]">$572.00</span>
            </div>

            <div className="inline-block bg-orange-600 text-white text-sm font-medium px-4 py-1 rounded">
              IVA INCLUIDO
            </div>
          </div>
        </div>

        {/* === Columna Derecha: Entrega y Pago === */}
        <div className="space-y-8">
          {/* Formulario de Entrega */}
          <EntregaComponent />

          {/* Medios de Pago */}
          <MediosdePagoComponent />
        </div>
      </div>
    </div>
  );
}