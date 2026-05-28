// db/queries.ts
import { db } from '@/src/shared/db';

db
import { productos } from '@/src/shared/db/schema/productList';
import { eq, like, desc, asc, sql } from 'drizzle-orm';

export async function getProductsByMarca( marca: string ) {
    return await db.select()
        .from(productos)
        .where(eq(productos.marca, marca))
        .orderBy(desc(productos.createdat))
}

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

// 3. Productos por categoría
export async function getProductsByCategory(categoria: string) {
  return await db.select()
    .from(productos)
    .where(eq(productos.categoria, categoria))
    .orderBy(desc(productos.destacado));
}

// 4. Productos destacados
export async function getFeaturedProducts(limit = 8) {
  return await db.select()
    .from(productos)
    .where(eq(productos.destacado, true))
    .limit(limit);
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