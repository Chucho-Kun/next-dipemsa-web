// db/schema.ts
import { pgTable, varchar, text, integer, numeric, boolean, timestamp } from 'drizzle-orm/pg-core';

export const productos = pgTable('productos', {
  id: varchar('id', { length: 10 }).primaryKey(),
  clave: varchar('clave', { length: 20 }),
  variante: varchar('variante', { length: 20 }),
  descripcion: text('descripcion'),
  informacion: text('informacion'),
  disponible: varchar('disponible', { length: 20 }),
  marca: varchar('marca', { length: 50 }),
  categoria: varchar('categoria', { length: 50 }),
  existencias: integer('existencias').default(0),
  precioant: varchar('precioant', { length: 30 }),
  precio: varchar('precio', { length: 30 }),         
  destacado: boolean('destacado').default(false),
  createdat: timestamp('createdat').defaultNow(),
});