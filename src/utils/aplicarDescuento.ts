import { parsePrecio, formatMoney } from "./formatPrice";
import { reglasDescuento, type ReglaDescuento } from "@/src/config/descuentos";

// Normaliza un valor para comparar reglas contra columnas de la base:
// quita espacios sobrantes, acentos y mayúsculas. La coincidencia es exacta
// tras normalizar (no subcadena): 'Panel' no alcanza a 'Cempanel'.
const normalizar = (valor: string): string =>
  valor
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const reglaEsValida = (regla: ReglaDescuento): boolean =>
  regla.activo && regla.porcentaje > 0 && regla.porcentaje < 100;

// Recorre las reglas activas y devuelve el mayor porcentaje cuyo `valor`
// normalizado coincide exacto con la marca o la categoría del producto.
// Devuelve 0 si ninguna aplica.
export const porcentajeDescuento = (
  marca: string | null,
  categoria: string | null
): number => {
  const marcaNorm = marca ? normalizar(marca) : null;
  const categoriaNorm = categoria ? normalizar(categoria) : null;

  let mayor = 0;
  for (const regla of reglasDescuento) {
    if (!reglaEsValida(regla)) continue;
    const objetivo = normalizar(regla.valor);
    const coincide =
      (regla.tipo === "marca" && marcaNorm === objetivo) ||
      (regla.tipo === "categoria" && categoriaNorm === objetivo);
    if (coincide && regla.porcentaje > mayor) {
      mayor = regla.porcentaje;
    }
  }
  return mayor;
};

type ProductoConPrecio = {
  marca?: string | null;
  categoria?: string | null;
  precio?: string | null;
  precioant?: string | null;
};

// Devuelve una copia del producto con `precio` descontado y `precioant`
// igual al precio de lista original. Se devuelve intacto si ninguna regla
// aplica o si el precio no es numérico.
export const aplicarDescuento = <T extends ProductoConPrecio>(producto: T): T => {
  const porcentaje = porcentajeDescuento(
    producto.marca ?? null,
    producto.categoria ?? null
  );
  if (porcentaje === 0) return producto;

  const lista = parsePrecio(producto.precio ?? "");
  if (lista === 0) return producto;

  const nuevo = Math.round(lista * (100 - porcentaje)) / 100;

  return {
    ...producto,
    precio: "$" + formatMoney(nuevo),
    precioant: "$" + formatMoney(lista),
  };
};

export const aplicarDescuentoLista = <T extends ProductoConPrecio>(
  productos: T[]
): T[] => productos.map(aplicarDescuento);
