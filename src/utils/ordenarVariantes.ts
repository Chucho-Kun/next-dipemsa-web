// Intenta leer un número al inicio del texto de una variante, ignorando
// cualquier unidad o texto que le siga ("5mm" → 5, "1/4.in" → 0.25).
// Soporta enteros, decimales y fracciones simples ("1/4", "1 1/2").
// Devuelve null si el texto no empieza con un número.
const extraerCantidad = (texto: string): number | null => {
  const limpio = texto.trim();

  const mixta = limpio.match(/^(\d+)\s+(\d+)\/(\d+)/);
  if (mixta) {
    const [, entero, num, den] = mixta;
    return Number(den) === 0 ? Number(entero) : Number(entero) + Number(num) / Number(den);
  }

  const fraccion = limpio.match(/^(\d+)\/(\d+)/);
  if (fraccion) {
    const [, num, den] = fraccion;
    return Number(den) === 0 ? null : Number(num) / Number(den);
  }

  // La coma es siempre separador de miles (se descarta), igual que
  // parsePrecio en src/utils/formatPrice.ts — ej. "10,000 piezas" → 10000.
  const simple = limpio.match(/^(\d+(?:,\d+)*(?:\.\d+)?)/);
  if (simple) {
    return parseFloat(simple[1].replace(/,/g, ""));
  }

  return null;
};

type VarianteConDescripcion = {
  descripcion?: string | null;
};

// Ordena variantes con un único criterio: las que tienen cantidad extraíble
// van primero, ascendente por esa cantidad; las que no, van después, en
// orden alfabético entre ellas. Cubre grupos 100% numéricos, 100% no
// numéricos y mixtos sin lógica especial. No muta el arreglo recibido.
export const ordenarVariantesPorCantidad = <T extends VarianteConDescripcion>(
  variantes: T[]
): T[] => {
  const conClave = variantes.map((variante) => {
    const texto = (variante.descripcion?.split("|")[1] ?? variante.descripcion ?? "").trim();
    return { variante, texto, cantidad: extraerCantidad(texto) };
  });

  conClave.sort((a, b) => {
    if (a.cantidad !== null && b.cantidad !== null) return a.cantidad - b.cantidad;
    if (a.cantidad !== null) return -1;
    if (b.cantidad !== null) return 1;
    return a.texto.localeCompare(b.texto);
  });

  return conClave.map((c) => c.variante);
};
