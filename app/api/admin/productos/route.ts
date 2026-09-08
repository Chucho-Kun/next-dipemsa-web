// app/api/admin/productos/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/src/shared/db';
import { productos } from '@/src/shared/db/schema/productList';
import { desc } from 'drizzle-orm';
import { aplicarDescuentoLista } from '@/src/utils/aplicarDescuento';

export async function GET() {
  try {
    const allProducts = await db.select({
      id: productos.id,
      clave: productos.clave,
      descripcion: productos.descripcion,
      precio: productos.precio,
      marca: productos.marca,
      categoria: productos.categoria,
      related_products: productos.related_products,
    })
    .from(productos)
    .orderBy(desc(productos.createdat));   // Ordenar por más recientes

    return NextResponse.json(aplicarDescuentoLista(allProducts));
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Error al obtener productos" }, { status: 500 });
  }
}