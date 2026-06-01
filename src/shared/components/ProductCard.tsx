'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Minus, Plus, ShoppingCart } from 'lucide-react';
import { ResultadosType } from '../db/resultados';
import Link from 'next/link';
import { whatsAppNumber } from '../db/contact-info';

export default function ProductCard() {
  const [quantity, setQuantity] = useState(1);

  const increase = () => setQuantity(prev => prev + 1);
  const decrease = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-orange-600 mb-8">
        HOME &gt; HERRAMIENTAS &gt; FOSET &gt; <span className="text-gray-800 font-medium">CALENTADOR SOLAR DE AGUA</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
        
        {/* Imagen del producto */}
        <div className="relative bg-white rounded-2xl overflow-hidden shadow-sm">
          <Image
            src="/fotos/1428.jpg"
            alt="Calentador Solar de Agua Foset"
            width={800}
            height={600}
            className="w-full h-auto object-contain"
            priority
          />
        </div>

        {/* Información del producto */}
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-gray-800 leading-tight">
            Calentador solar de agua, 15 tubos, 195L, 5 personas, Foset
          </h1>
          <p className="text-gray-600">Calentador 15</p>

          {/* Precios */}
          <div className="flex items-center gap-4">
            <span className="text-4xl font-bold text-[#E30613]">$1490.00</span>
            <span className="text-2xl line-through text-gray-400">$1900.00</span>
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
          {/* <button className="w-full bg-[#0033A0] hover:bg-[#002280] text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-3 transition text-lg">
            <ShoppingCart size={24} />
            AGREGAR AL CARRITO
          </button> */}

          <div className="p-5 pt-0 mt-auto">
        <Link 
            href={ `https://api.whatsapp.com/send?phone=${whatsAppNumber}&text=${
                encodeURIComponent(`Hola me interesa cotizar *${ 
                  producto.descripcion?.split('|')[0].trim()
                  }* ${
                  producto.descripcion?.split('|')[1]
                  } - [${ producto.id }]`)}` 
              }
            className="bg-[#FF5E00] hover:bg-[#E30613] text-white font-bold px-6 py-2 w-50 rounded-lg flex items-center gap-2 transition text-sm whitespace-nowrap">
          COTIZA AHORA
          <span className="text-xl">
            <Image 
              src={'/icons/whatsapp.svg'}
              alt="whatsapp icon"
              width={25}
              height={25}
            />
          </span>
        </Link>
      </div>

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