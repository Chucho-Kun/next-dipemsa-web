'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Minus, Plus, ShoppingCart } from 'lucide-react';
import { ResultadosType } from '../db/resultados';

type Props = {
  producto: ResultadosType
}

export default async function ProductCard({producto}: Props) {
  
  const [quantity, setQuantity] = useState(1);

  const increase = () => setQuantity(prev => prev + 1);
  const decrease = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-orange-600 mb-8">
        HOME &gt; { producto.marca?.toUpperCase() } &gt; <span className="text-gray-800 font-medium">{ producto.categoria?.toUpperCase() }</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
        
        {/* Imagen del producto */}
        <div className="relative bg-white rounded-2xl overflow-hidden shadow-sm">
          <Image
            src={`/fotos/${ producto.id }.jpg`} 
            alt={ producto.descripcion! }
            width={800}
            height={600}
            className="w-full h-auto object-contain"
            priority
          />
        </div>

        {/* Información del producto */}
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-gray-800 leading-tight">
            { producto.descripcion?.split('|')[0]}
          </h1>
          <p className="text-gray-600">{ producto.descripcion?.split('|')[1]}</p>

          {/* Precios */}
          <div className="flex items-center gap-4">
            <span className="text-4xl font-bold text-[#E30613]">{ producto.precio }</span>
            { producto.precioant && (
              <span className="text-2xl line-through text-gray-400">{ producto.precioant }</span>
            ) }
            
          </div>

          <div className="inline-block bg-red-600 text-white text-sm font-bold px-5 py-2 rounded">
            IVA INCLUIDO
          </div>

          {/* Selector de cantidad */}
          <div className="flex items-center gap-4">
            <span className="font-medium text-gray-700">Cantidad:</span>
            <div className="flex items-center border border-gray-300 rounded-xl">
              <button 
                onClick={decrease}
                className="px-4 py-3 hover:bg-gray-100 transition"
              >
                <Minus size={18} />
              </button>
              <span className="px-6 py-3 font-semibold border-x border-gray-300">{quantity}</span>
              <button 
                onClick={increase}
                className="px-4 py-3 hover:bg-gray-100 transition"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Botón Agregar al carrito */}
          <button className="w-full bg-[#0033A0] hover:bg-[#002280] text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-3 transition text-lg">
            <ShoppingCart size={24} />
            AGREGAR AL CARRITO
          </button>

          {/* Descripción */}
          <div className="pt-6 border-t">
            <p className="text-gray-700 leading-relaxed">
              Utiliza la energía del sol para calentar el agua, funciona sin gas. 
              Tanque interno y estructura fabricados de acero inoxidable. 
              Tanque con aislamiento térmico de alto nivel que conserva el agua caliente por más tiempo. 
              Alcanza temperaturas superiores a 70°C. 
              Tubos colectores de radiación solar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}