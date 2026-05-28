import Image from "next/image"
import { ResultadosType } from "../db/resultados"
import { getProductsByMarca } from "../db/queries"

//const productos = resultados

export default async function SearchResults() {

  const productos = await getProductsByMarca('Truper')

  return (
    <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
              RESULTADOS DE LA BÙSQUEDA
            </h2>
    
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {productos.map((producto) => (
                <div
                  key={producto.id}
                  className="bg-white overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group"
                >
                  {/* Badge */}
                  <div className="bg-[#FF5E00] text-white text-xs font-bold px-4 py-1.5 w-fit">
                    DESCUENTO DISPONIBLE
                  </div>
    
                  {/* Imagen */}
                  <div className="relative h-52 bg-white flex items-center justify-center p-6">
                    <Image
                      // src= {`/fotos/${producto.id}.jpg`}
                      src={'/fotos/1750.jpg'}
                      alt={'por definir'}
                      fill
                      className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  </div>
    
                  {/* Contenido */}
                  <div className="p-5">
                    <p className="text-xs font-medium text-gray-500">{producto.marca}</p>
                    <h3 className="font-semibold text-lg leading-tight mt-1 mb-2 line-clamp-2">
                      {producto.descripcion}
                    </h3>
                    <p className="text-sm text-gray-600">{producto.descripcion}</p>
    
                    <div className="mt-4 flex items-baseline gap-2">
                        { producto.precioant && (
                          <span className="line-through text-gray-400 text-sm">
                            { producto.precioant }
                          </span>
                        ) }
                      <span className="text-2xl font-bold text-[#E30613]">
                        {producto.precio}
                      </span>
                    </div>
    
                    <p className="text-xs text-gray-500 mt-1">CLAVE: {producto.clave}</p>
    
                    <button className="mt-6 w-full bg-[#1E2937] hover:bg-black text-white font-semibold py-3 transition text-sm">
                      AGREGAR AL CARRITO
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
  )
}
