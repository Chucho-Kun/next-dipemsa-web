import ProductCardsServer from "@/src/shared/components/ProductCardsServer";
import RecommendedProductsServer from "@/src/shared/components/RecommendedProductsServer";
import { getProductById } from "@/src/shared/db/queries";
import { Metadata } from "next";

type Props = {
  params: Promise<{ id: string; slug: string }>;
};

// Metadata Dinámica con datos reales del producto
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const producto = await getProductById(id);

  if (!producto) {
    return {
      title: "Producto no encontrado | Dipemsa",
      description: "El producto que buscas no está disponible.",
    };
  }

  const tituloProducto = producto.descripcion 
    ? producto.descripcion.split('|')[0].trim() 
    : producto.descripcion || "Producto Dipemsa";

  return {
    title: `${tituloProducto} | Dipemsa`,
    description: `Compra ${tituloProducto} - Marca: ${producto.marca || 'Dipemsa'}. Precio: $${producto.precio}. Disponible en nuestra tienda en línea.`,
    
    openGraph: {
      title: `${tituloProducto} | Dipemsa`,
      description: `Compra ${tituloProducto} al mejor precio. Marca: ${producto.marca || 'Dipemsa'}`,
      url: `https://dipemsa.com.mx/producto/${id}/${producto.descripcion?.split('|')[0] || ''}`,
      images: [
        {
          url: `/fotos/${id}.jpg`,
          width: 366,
          height: 214,
          alt: tituloProducto,
        },
      ],
      type: "website",
      siteName: "Dipemsa",
    },

    twitter: {
      card: "summary_large_image",
      title: `${tituloProducto} | Dipemsa`,
      description: `Compra ${tituloProducto} - ${producto.marca || 'Dipemsa'}`,
      images: [`/fotos/${id}.jpg`],
    },
  };
}

export default async function ProductoPage(props: PageProps<'/producto/[id]/[slug]'>) {

  const { id } = await props.params

  return (
    <>
        <section>
          {/* <ProductCard slug={ slug } /> */}
          <ProductCardsServer id={id} />
        </section>

        <section>
          <RecommendedProductsServer />
        </section>
    </>
  )
}
