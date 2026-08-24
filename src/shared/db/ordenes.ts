// db/ordenes.ts
import { db } from '@/src/shared/db';
import { ordenes, OrdenItem } from '@/src/shared/db/schema/ordenes';

export type NuevaOrden = {
  mp_payment_id: string;
  mp_status: string;
  mp_status_detail: string;
  payment_method_id: string;
  installments: number;
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  direccion: string;
  entre_calles: string;
  ciudad: string;
  cp: string;
  subtotal: number;
  envio: number;
  total: number;
  items: OrdenItem[];
};

export async function registrarOrden(datos: NuevaOrden): Promise<void> {
  try {
    await db.insert(ordenes).values({
      mp_payment_id: datos.mp_payment_id,
      mp_status: datos.mp_status,
      mp_status_detail: datos.mp_status_detail,
      payment_method_id: datos.payment_method_id,
      installments: datos.installments,
      nombre: datos.nombre,
      apellidos: datos.apellidos,
      email: datos.email,
      telefono: datos.telefono,
      direccion: datos.direccion,
      entre_calles: datos.entre_calles,
      ciudad: datos.ciudad,
      cp: datos.cp,
      subtotal: String(datos.subtotal),
      envio: String(datos.envio),
      total: String(datos.total),
      items: datos.items,
    });
  } catch (error) {
    console.error('❌ No se pudo registrar la orden', { mp_payment_id: datos.mp_payment_id, error });
  }
}
