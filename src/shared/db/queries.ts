// db/queries.ts
import { db } from '@/src/shared/db';
import { productos } from '@/src/shared/db/schema/productList';
import { eq, like, desc, asc, sql, ilike } from 'drizzle-orm';

export function slugToMarca(slug: string): string {
  const mapa: Record<string, string> = {
    'owens-corning': 'Owens corning',
    'gram-bel': 'Gram bel',
    'panel-rey': 'Panel Rey',
    'trim-tex': 'Trim-Tex',
    'cempanel': 'Cempanel',
  };

  return mapa[slug] || slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

export function slugToCategory(slug: string): string {
  const mapa: Record<string, string> = {
    'owens-corning': 'Anclajes y químicos epoxicos ',
    'gram-bel': 'Sistemas de fijacion convencional.',
    'panel-rey': 'Perfiles galvanizados ',
    'trim-tex': 'Liner panel ',
    'cempanel': 'Herramientas',
    // Agrega más según necesites
  };

  return mapa[slug] || slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

export async function getProductsByMarca(slug: string) {
  const marcaReal = slugToMarca(slug);   // "gram-bel" → "Gram Bel"

  return await db.select()
    .from(productos)
    .where(
      ilike(productos.marca, `%${marcaReal}%`)
    )
    .orderBy(desc(productos.destacado), desc(productos.createdat));
}


///// NUEVO FEATURE DE AGRUGAR RESULTADOS POR VARIANTE
export async function getProductsByGroups(categoria: string) {
  const marcaReal = slugToMarca(categoria);

  const rawProducts = await db.select()
    .from(productos)
    .where(
      ilike(productos.marca, `%${marcaReal}%`)
    )
    .orderBy(desc(productos.destacado), desc(productos.createdat));
    
  // === Agrupación por nombre base ===
  const grouped = rawProducts.reduce((acc, producto) => {
    const fullDesc = producto.descripcion || '';
    const baseName = fullDesc.split('|')[0].trim(); // Todo antes del "|"

    if (!acc[baseName]) {
      acc[baseName] = [];
    }

    acc[baseName].push(producto);
    return acc;
  }, {} as Record<string, any[]>);

  // Convertimos a array ordenado
  return Object.entries(grouped).map(([baseName, variants]) => ({
    baseName,
    variants: variants.sort((a, b) => {
      // Ordenar variantes por precio o existencias
      return parseFloat(a.precio || '0') - parseFloat(b.precio || '0');
    })
  }));
}

/////

export async function getRecomendedProducts() {
        return await db.select()
            .from(productos)
            .where(eq(productos.destacado, true))
}

export async function getProductsByCategory(categoria: string) {
  const categoriaReal = slugToCategory(categoria);   // "gram-bel" → "Gram Bel"

  return await db.select()
    .from(productos)
    .where(
      ilike(productos.categoria, `%${categoriaReal}%`)
    )
    .orderBy(desc(productos.destacado), desc(productos.createdat));
}

// export async function getRecomendedProducts(limit = 12) {
//     return await db.select()
//         .from(productos)
//         .where(eq(productos.destacado, true))
//         .limit(limit);
// }





// 1. Obtener todos los productos (con paginación)
export async function getAllProducts(page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  
  const data = await db.select()
    .from(productos)
    .orderBy(desc(productos.destacado), asc(productos.marca))
    .limit(limit)
    .offset(offset);

  const total = await db.select({ count: sql<number>`count(*)` }).from(productos);

  return {
    data,
    pagination: {
      page,
      limit,
      total: total[0].count,
      totalPages: Math.ceil(total[0].count / limit)
    }
  };
}

// 2. Buscar productos (búsqueda por nombre o descripción)
export async function searchProducts(searchTerm: string) {
  return await db.select()
    .from(productos)
    .where(
      like(productos.descripcion, `%${searchTerm}%`)
    )
    .orderBy(desc(productos.destacado));
}

// 5. Obtener un producto por ID o Clave
export async function getProductById(id: string) {
  const result = await db.select()
    .from(productos)
    .where(eq(productos.id, id))
    .limit(1);

  return result[0];
}

// 6. Productos con stock bajo
export async function getLowStockProducts(threshold = 10) {
  return await db.select()
    .from(productos)
    .where(sql`${productos.existencias} <= ${threshold}`);
}