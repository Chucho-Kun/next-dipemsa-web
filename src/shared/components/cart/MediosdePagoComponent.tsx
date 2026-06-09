import React from 'react'

export default function MediosdePagoComponent() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h3 className="text-2xl font-bold mb-6">Medios de pago</h3>
    
        <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-orange-500 transition cursor-pointer">
            <p className="text-gray-500 mb-4">Selecciona un método de pago</p>
            <button className="bg-[#0033A0] text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-[#002280] transition">
            PAGAR
            </button>
        </div>
    </div>
  )}

