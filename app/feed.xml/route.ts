// app/feed.xml/route.ts
import { getAllProductosXML } from '@/src/shared/db/queries';
import { slugify } from '@/src/utils/slugify';
import { NextResponse } from 'next/server';

export const revalidate = 3600;

export async function GET() {
  try {
    const products = await getAllProductosXML();

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
        <channel>
            <title>Dipemsa - Productos</title>
            <description>Catálogo de productos Dipemsa para Google Merchant Center</description>
            <link>https://www.dipemsa.com.mx</link>
            <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>

            ${products
            .map((product) => {
                const precioNum = parseFloat(
                  (product.precio ?? '').replace(/[$,]/g, '').trim()
                );
                if (!precioNum || isNaN(precioNum)) return '';
                const precioLimpio = precioNum.toFixed(2);

                const descripcion = stripInvalidXmlChars(product.descripcion ?? '');
                const slug = slugify(descripcion);

                return `
                    <item>
                    <g:id>${escapeXml(String(product.id))}</g:id>
                    <g:title>${escapeXml(descripcion)}</g:title>
                    <g:description>${escapeXml(product.informacion || descripcion)}</g:description>
                    <g:link>${escapeXml(`https://www.dipemsa.com.mx/producto/${product.id}/${slug}`)}</g:link>
                    <g:image_link>${escapeXml(`https://www.dipemsa.com.mx/fotos/webp/${product.id}.webp`)}</g:image_link>

                    <g:condition>new</g:condition>
                    <g:availability>in stock</g:availability>
                    <g:price>${precioLimpio} MXN</g:price>

                    <g:brand>${escapeXml(product.marca || 'Dipemsa')}</g:brand>${product.clave ? `
                    <g:mpn>${escapeXml(product.clave)}</g:mpn>` : ''}

                    <g:shipping>
                        <g:country>MX</g:country>
                        <g:service>Estándar</g:service>
                        <g:price>300.00 MXN</g:price>
                    </g:shipping>
                    </item>`;
            })
            .join('')}
        </channel>
        </rss>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error generando feed Merchant Center:', error);
    return new NextResponse('Error generando feed', { status: 500 });
  }
}

// Función para eliminar caracteres inválidos en XML 1.0 (ej. Char value 31 / U+001F
// que llega por copy-paste desde Word/PDF/Excel y rompe el feed aunque se escape &<>"').
function stripInvalidXmlChars(value: string | null | undefined): string {
  return (value ?? '').replace(
    /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFDD0-\uFDEF\uFFFE\uFFFF]/g,
    ''
  );
}

// Función para escapar caracteres especiales en XML
function escapeXml(unsafe: string | null | undefined): string {
  return stripInvalidXmlChars(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}