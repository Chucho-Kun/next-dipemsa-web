'use client';

import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const productosRecomendados = [
  {
    id: 1,
    marca: "PENNSYLVANIA",
    nombre: "Sellador Duretán Pennsylvania",
    descripcion: "Cartucho Blanco 300ml",
    precioOriginal: 1990,
    precioActual: 1490,
    clave: "1010101",
    imagen: "/fotos/1750.jpg",
  },
  {
    id: 2,
    marca: "PENNSYLVANIA",
    nombre: "Sellador Duretán Pennsylvania",
    descripcion: "Cartucho Blanco 300ml",
    precioOriginal: 1990,
    precioActual: 1490,
    clave: "1010101",
    imagen: "/fotos/1428.jpg",
  },
  {
    id: 3,
    marca: "PENNSYLVANIA",
    nombre: "Sellador Duretán Pennsylvania",
    descripcion: "Cartucho Blanco 300ml",
    precioOriginal: 1990,
    precioActual: 1490,
    clave: "1010101",
    imagen: "/fotos/497.jpg",
  },{
    id: 4,
    marca: "PENNSYLVANIA",
    nombre: "Sellador Duretán Pennsylvania",
    descripcion: "Cartucho Blanco 300ml",
    precioOriginal: 1990,
    precioActual: 1490,
    clave: "1010101",
    imagen: "/fotos/1750.jpg",
  },{
    id: 5,
    marca: "PENNSYLVANIA",
    nombre: "Sellador Duretán Pennsylvania",
    descripcion: "Cartucho Blanco 300ml",
    precioOriginal: 1990,
    precioActual: 1490,
    clave: "1010101",
    imagen: "/fotos/1750.jpg",
  },
  {
    id: 6,
    marca: "PENNSYLVANIA",
    nombre: "Sellador Duretán Pennsylvania",
    descripcion: "Cartucho Blanco 300ml",
    precioOriginal: 1990,
    precioActual: 1490,
    clave: "1010101",
    imagen: "/fotos/1428.jpg",
  },
];

export default function RecommendedProducts() {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true, 
      align: 'start',
      slidesToScroll: 1,
      skipSnaps: false,
      dragFree: false
    },
    [Autoplay({ delay: 5000, stopOnInteraction: true })]
  );

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
          PRODUCTOS RECOMENDADOS
        </h2>

        <div className="relative">
          {/* Slider */}
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-6 p-2">
              {productosRecomendados.map((producto) => (
                <div key={producto.id} className="flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_33.33%] xl:flex-[0_0_25%] min-w-0">
                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                    
                    {/* Badge */}
                    <div className="bg-[#FF5E00] text-white text-xs font-bold px-4 py-1 w-fit">
                      PRODUCTO DESTACADO
                    </div>

                    {/* Imagen */}
                    <div className="relative h-52 bg-white flex items-center justify-center p-6 overflow-hidden rounded-t-2xl">
                      <Image
                        src={producto.imagen}
                        alt={producto.nombre}
                        fill
                        className="object-contain hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    </div>

                    {/* Información */}
                    <div className="p-5 flex-1 flex flex-col">
                      <p className="text-sm font-medium text-gray-500">{producto.marca}</p>
                      <h3 className="font-semibold text-lg leading-tight mt-1 mb-2">
                        {producto.nombre}
                      </h3>
                      <p className="text-sm text-gray-600">{producto.descripcion}</p>

                      <div className="mt-auto pt-4">
                        <div className="flex items-baseline gap-2">
                          <span className="line-through text-gray-400 text-sm">
                            ${producto.precioOriginal}.00
                          </span>
                          <span className="text-2xl font-bold text-[#E30613]">
                            ${producto.precioActual}.00
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">CLAVE: {producto.clave}</p>
                      </div>

                      <button className="mt-5 w-full bg-[#1E2937] hover:bg-black text-white font-semibold py-3 rounded-xl transition">
                        AGREGAR AL CARRITO
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Botones de navegación */}
          <button
            onClick={scrollPrev}
            className="absolute -left-4 top-1/2 -translate-y-1/2 bg-white shadow-lg p-3 rounded-full hover:bg-gray-100 transition hidden md:block"
          >
            <ChevronLeft size={24} />
          </button>

          <button
            onClick={scrollNext}
            className="absolute -right-4 top-1/2 -translate-y-1/2 bg-white shadow-lg p-3 rounded-full hover:bg-gray-100 transition hidden md:block"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    </section>
  );
}