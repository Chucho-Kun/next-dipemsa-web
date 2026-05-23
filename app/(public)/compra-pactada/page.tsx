'use client';

import Image from 'next/image';

export default function CompraPactadaPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="grid lg:grid-cols-2 gap-10">
        
        {/* === Columna Izquierda: Resumen del Pedido === */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-6">Resumen del Pedido</h2>

          {/* Producto 1 */}
          <div className="flex gap-4 py-4 border-b">
            <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden relative shrink-0">
              <Image
                src="/fotos/1750.jpg"
                alt="Lija de agua"
                fill
                className="object-cover"
                sizes="366px"
              />
            </div>
            <div className="flex-1">
              <div className="flex justify-between">
                <div>
                  <p className="font-medium">Lija de agua grano 280 de carburo de silicio</p>
                  <p className="text-sm text-gray-500">1 Pieza</p>
                  <p className="text-sm text-gray-500">TRUPER</p>
                </div>
                <div className="text-right">
                  <p className="line-through text-gray-400">$100.00</p>
                  <p className="font-bold text-lg">$89.00</p>
                </div>
              </div>
            </div>
          </div>

          {/* Producto 2 */}
          <div className="flex gap-4 py-4 border-b">
            <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden relative flex-shrink-0">
              <Image
                src="/fotos/1428.jpg"
                alt="Malla Autoadherible Fibra de Vidrio"
                fill
                className="object-cover"
                sizes="366px"
              />
            </div>
            <div className="flex-1">
              <div className="flex justify-between">
                <div>
                  <p className="font-medium">Malla Autoadherible Fibra de Vidrio</p>
                  <p className="text-sm text-gray-500">10 x 45</p>
                  <p className="text-sm text-gray-500">DIPEMSA</p>
                </div>
                <div className="text-right">
                  <p className="line-through text-gray-400">$300.00</p>
                  <p className="font-bold text-lg">$183.00</p>
                </div>
              </div>
            </div>
          </div>

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
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="text-2xl font-bold mb-6">Entrega</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Nombre:" className="border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500" />
              <input type="text" placeholder="Apellidos:" className="border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500" />
            </div>

            <input type="text" placeholder="Dirección de entrega:" className="w-full mt-4 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500" />
            <input type="text" placeholder="Entre calles:" className="w-full mt-4 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500" />

            <div className="grid grid-cols-2 gap-4 mt-4">
              <input type="text" placeholder="Ciudad / Municipio" className="border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500" />
              <input type="text" placeholder="CP:" className="border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500" />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <input type="tel" placeholder="Teléfono" className="border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500" />
            </div>
          </div>

          {/* Medios de Pago */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="text-2xl font-bold mb-6">Medios de pago</h3>
            
            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-orange-500 transition cursor-pointer">
              <p className="text-gray-500 mb-4">Selecciona un método de pago</p>
              <button className="bg-[#0033A0] text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-[#002280] transition">
                PAGAR
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}