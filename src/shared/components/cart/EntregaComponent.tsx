import React from 'react'

export default function EntregaComponent() {
  return (
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
  )}
