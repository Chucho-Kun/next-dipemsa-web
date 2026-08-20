export const parsePrecio = (precio: string): number => {
    if (!precio) return 0;
    const precioNumerico = parseFloat(precio.replace(/[\$,]/g, '').trim());
    return isNaN(precioNumerico) ? 0 : precioNumerico;
}

// Formatea un número a string con separador de miles ("1,234.56").
// Solo agrega la coma cuando el valor es mayor al millar (comportamiento
// nativo de toLocaleString); no altera el valor numérico subyacente.
export const formatMoney = (valor: number): string => {
    return valor.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Formatea un precio guardado como string (ej. "$1234.56") para mostrarlo
// con separador de miles, sin afectar el valor original transportado.
export const formatPrecio = (precio: string): string => {
    return formatMoney(parsePrecio(precio));
}

export const totalxcantidad = ( precio: string, cantidad: number ) => {
        return formatMoney(parsePrecio(precio) * cantidad);
    }