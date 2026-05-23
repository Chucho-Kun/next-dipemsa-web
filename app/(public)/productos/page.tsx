import Image from 'next/image';

const productos = [
  { name: "AISLANTES", src: "/productos/aislantes.jpg" },
  { name: "PERFILES GALVANIZADOS", src: "/productos/perfiles-galvanizados.jpg" },
  { name: "SISTEMAS DE FIJACIÓN CONVENCIONAL", src: "/productos/sistemas-de-fijacion-convencional.jpg" },
  { name: "COMPUESTOS Y CINTAS", src: "/productos/compuestos-y-cintas.jpg" },
  { name: "CEMPANEL", src: "/productos/cempanel.jpg" },
  { name: "TORNILLERÍA", src: "/productos/tornilleria.jpg" },
  { name: "HERRAMIENTAS", src: "/productos/herramientas.jpg" },
  { name: "TABLAROCA", src: "/productos/tablaroca.jpg" },
  { name: "PLAFONES", src: "/productos/plafones.jpg" },
  { name: "LINER PANEL", src: "/productos/liner-panel.jpg" },
  { name: "SUSPENSIÓN", src: "/productos/suspension.jpg" },
  { name: "ANCLAJES Y QUÍMICOS EPOXICOS", src: "/productos/anclajes-y-quimicos-epoxicos.jpg" },
  { name: "PERFILES PLÁSTICOS", src: "/productos/perfiles-plasticos.jpg" },
  { name: "SELLADO", src: "/productos/sellado.jpg" },
  { name: "PINTURA", src: "/productos/pintura.jpg" },
  { name: "ADHESIVOS Y NIVELANTES", src: "/productos/adhesivos-y-nivelantes.jpg" },
];

export default function ProductosPage() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
          PRODUCTOS
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 cursor-pointer">
          {productos.map((producto, index) => (
            <div
              key={index}
              className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100"
            >
              {/* Imagen */}
              <div className="relative h-48 bg-gray-200">
                <Image
                  src={producto.src}
                  alt={producto.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>

              {/* Nombre del producto */}
              <div className="p-5 text-center">
                <h3 className="font-semibold text-gray-800 text-lg leading-tight">
                  {producto.name}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}