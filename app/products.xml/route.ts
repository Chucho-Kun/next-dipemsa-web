// app/products.xml/route.ts
import { getAllProductosXML } from '@/src/shared/db/queries';
import { slugify } from '@/src/utils/slugify';
import { NextResponse } from 'next/server';

export const revalidate = 3600;

export async function GET() {
  try {
    const products = await getAllProductosXML();

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${products
            .map((product) => {
            const slug = slugify(stripInvalidXmlChars(product.descripcion ?? ''));
            const url = `https://www.dipemsa.com.mx/producto/${product.id}/${slug}`;

            return `
        <url>
          <loc>${escapeXml(url)}</loc>
          <lastmod>${product.createdat ? new Date(product.createdat).toISOString() : new Date().toISOString()}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.8</priority>
        </url>`;
          })
          .join('')}
      </urlset>`;

    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  } catch (error) {
    console.error('Error generando products.xml:', error);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
}

// Elimina caracteres inválidos en XML 1.0 (ej. U+001F por copy-paste desde
// Word/PDF/Excel) que rompen el XML aunque se escape &<>"'.
function stripInvalidXmlChars(value: string | null | undefined): string {
  return (value ?? '').replace(
    /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFDD0-\uFDEF\uFFFE\uFFFF]/g,
    ''
  );
}

function escapeXml(unsafe: string | null | undefined): string {
  return stripInvalidXmlChars(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}