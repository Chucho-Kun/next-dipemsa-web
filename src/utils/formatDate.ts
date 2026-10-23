// Formatea instantes en la zona de Ciudad de México (IANA), independiente de
// la zona horaria del proceso. El servidor de Railway corre en UTC, así que
// usar `Date#toLocaleString` sin `timeZone` mostraba la hora equivocada.
const ZONA_CDMX = 'America/Mexico_City';

// Un solo formatter para todas las llamadas: crear un Intl.DateTimeFormat por
// invocación es trabajo innecesario y no cambia el resultado.
const formatterCDMX = new Intl.DateTimeFormat('es-MX', {
    timeZone: ZONA_CDMX,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
});

// ISO 8601 con designador de zona explícito: "Z" o "±hh:mm" al final.
// Sin ese designador, `new Date()` interpreta el string en la zona del
// proceso (UTC en Railway) y produciría un error silencioso de 6 horas.
const ISO_CON_ZONA = /(Z|[+-]\d{2}:?\d{2})$/i;

/**
 * Formatea un instante como "23/10/2026, 20:45 hrs (CDMX)".
 * Devuelve "—" para valores ausentes, inválidos o ISO sin zona.
 */
export function formatearFechaHoraCDMX(
    valor: string | number | Date | null | undefined
): string {
    if (valor === null || valor === undefined) return '—';

    let fecha: Date;

    if (valor instanceof Date) {
        fecha = valor;
    } else if (typeof valor === 'number') {
        fecha = new Date(valor);
    } else if (typeof valor === 'string') {
        const texto = valor.trim();
        if (!texto || !ISO_CON_ZONA.test(texto)) return '—';
        fecha = new Date(texto);
    } else {
        return '—';
    }

    if (Number.isNaN(fecha.getTime())) return '—';

    const partes = formatterCDMX.formatToParts(fecha);
    const valorDe = (tipo: Intl.DateTimeFormatPartTypes) =>
        partes.find((parte) => parte.type === tipo)?.value ?? '';

    return `${valorDe('day')}/${valorDe('month')}/${valorDe('year')}, ${valorDe('hour')}:${valorDe('minute')} hrs`;
}
