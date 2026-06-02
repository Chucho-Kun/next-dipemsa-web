import CompraConNosotros from "@/src/shared/components/CompraConNosotros";
import ProductsSection from "@/src/shared/components/ProductsSection";
import RecommendedProductsServer from "@/src/shared/components/RecommendedProductsServer";
import SliderMain from "@/src/shared/components/SliderMain";
import MarcasPage from "./marcas/page";
import { Metadata } from "next";
import { productos } from "@/src/shared/db/productos";

// ==================== METADATA SEO ====================
export const metadata: Metadata = {
  title: "Dipemsa | Materiales de Construcción Ligera",
  description: "Somos DIPEMSA una empresa distribuidora de materiales para construcción ligera, contamos con las mejores marcas y stock siempre en existencia. Surtimos desde una pieza hasta una obra completa.",
  
  keywords: [
    "materiales de construcción ligera","distribuidora de materiales","construcción ligera",
    "armstrong","cempanel","dipemsa","fischer","gram bel","gyproc","mapei","pennsylvania","panel rey","truper","owens corning","riho","stabilit","trim tex","usg",
    "aislantes térmicos","perfiles galvanizados","sistemas de fijación","compuestos y cintas","cempanel","tornilleria","herramientas","tablaroca","plafones","liner panel","suspensiones",
    "anclajes y quimicos epoxicos","perfiles plasticos","sellado","adhesivos y nivelantes",
    "perfiles metálicos",
    "ecatepec",
    "cdmx"
  ],

  authors: [{ name: "Dipemsa" }],
  openGraph: {
    title: "Dipemsa | Materiales de Construcción Ligera",
    description: "Somos DIPEMSA una empresa distribuidora de materiales para construcción ligera, contamos con las mejores marcas y stock siempre en existencia. Surtimos desde una pieza hasta una obra completa.",
    url: "https://dipemsa.com.mx/",
    siteName: "Dipemsa",
    images: [
      {
        url: "https://dipemsa.com.mx/logoDipemsa.jpg",   // Cambia por tu imagen real
        width: 1200,
        height: 630,
        alt: "Dipemsa - Materiales de Construcción",
      },
    ],
    type: "website",
    locale: "es_MX",
  },

  twitter: {
    card: "summary_large_image",
    title: "Dipemsa | Materiales de Construcción Ligera",
    description: "Somos DIPEMSA una empresa distribuidora de materiales para construcción ligera, contamos con las mejores marcas y stock siempre en existencia. Surtimos desde una pieza hasta una obra completa.",
    images: ["https://dipemsa.com.mx/logoDipemsa.jpg"],
  },
};
// =====================================================

export default function page() {
  return (
    <>
      {/* Schema.org JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "Dipemsa",
            "description": "Somos DIPEMSA una empresa distribuidora de materiales para construcción ligera, contamos con las mejores marcas y stock siempre en existencia. Surtimos desde una pieza hasta una obra completa.",
            "url": "https://dipemsa.com.mx",
            "logo": "https://dipemsa.com.mx/logo.webp",
            "image": "https://dipemsa.com.mx/logoDipemsa.jpg",
            
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Manzana 014, Anahuac 2da Secc, 55882 Tepexpan, Méx Tepexpan, 55882 México, Méx.",
              "addressLocality": "Ecatepec de Morelos",
              "addressRegion": "Estado de México",
              "postalCode": "55882",
              "addressCountry": "MX"
            },
            
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": 19.612469596852044,
              "longitude": -98.95722941415411
            },
            
            "telephone": "+52-55-3265-1039",
            "email": "contacto@dipemsa.com.mx",   // Cambia si tienes uno oficial
            
            "openingHoursSpecification": [
              {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                "opens": "08:00",
                "closes": "18:00"
              },
              {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": "Saturday",
                "opens": "08:00",
                "closes": "14:00"
              }
            ],
            
            "priceRange": "$$",
            "paymentAccepted": ["Cash", "Credit Card", "Transferencia", "Mercado Pago"],
            
            "areaServed": {
              "@type": "City",
              "name": "Ecatepec de Morelos"
            },
            
            "sameAs": [
              "https://www.facebook.com/Dipemsa/"
            ]
          })
        }} />

      <section>
        <SliderMain />
      </section>

      <RecommendedProductsServer />

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
            PRODUCTOS POR CATEGORÍA
          </h2>
          <ProductsSection productos={productos} />  
        </div>
      </section>

      <section>
        <CompraConNosotros />
      </section>

      <MarcasPage />
    </>
  );
}