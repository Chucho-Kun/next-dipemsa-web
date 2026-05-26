import Image from 'next/image';
import Link from 'next/link';

const marcas = [
  { name: "Owens Corning", src: "/marcas/owens-corning.jpeg" },
  { name: "Dipemsa", src: "/marcas/dipemsa.jpeg" },
  { name: "Gram-Bel", src: "/marcas/gram-bel.jpeg" },
  { name: "USG", src: "/marcas/usg.jpeg" },
  { name: "Cem Panel", src: "/marcas/cempanel.jpeg" },
  { name: "Panel Rey", src: "/marcas/panel-rey.jpeg" },
  { name: "Truper", src: "/marcas/truper.jpeg" },
  { name: "Armstrong", src: "/marcas/armstrong.jpeg" },
  { name: "Stabilit", src: "/marcas/stabilit.jpeg" },
  { name: "Riho", src: "/marcas/riho.jpeg" },
  { name: "Fischer", src: "/marcas/fischer.jpeg" },
  { name: "Trim-Tex", src: "/marcas/trim-tex.jpeg" },
  { name: "Mapei", src: "/marcas/mapei.jpeg" },
  { name: "Pennsylvania", src: "/marcas/pennsylvania.jpeg" },
  { name: "Plaka", src: "/marcas/plaka.jpeg" },
];

export default function MarcasPage() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
          MARCAS
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {marcas.map((marca, index) => (
            <Link key={index} href={'/marca/owens-corning'} >
              <div
                className="group bg-white rounded-2xl p-6 flex items-center justify-center aspect-square border border-gray-100 hover:border-[#FF5E00] hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                <div className="relative w-full h-full flex items-center justify-center cursor-pointer">
                  <Image
                    src={marca.src}
                    alt={marca.name}
                    width={180}
                    height={90}
                    className="object-contain grayscale group-hover:grayscale-0 transition-all duration-300"
                    />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}