import { db } from '@/src/shared/db';
import { productos } from '@/src/shared/db/schema/productList';
import { ilike, desc } from 'drizzle-orm';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get('q') || '';

  if (search.length < 3) {
    return Response.json([]);
  }

  const results = await db.select({
    id: productos.id,
    descripcion: productos.descripcion,
    precioant: productos.precioant,
    precio: productos.precio,
    marca: productos.marca,
  })
  .from(productos)
  .where(ilike(productos.descripcion, `%${search}%`))
  .orderBy(desc(productos.destacado))
  .limit(10);

  return Response.json(results);
}