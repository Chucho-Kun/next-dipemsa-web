// app/api/mercadopago/preference/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("🔍 Items recibidos del frontend:", JSON.stringify(body.items, null, 2));

    // ← Versión más agresiva para forzar el nombre
    const itemsMP = body.items.map((item: any) => ({
      title: `${item.titulo || item.title || "Producto Dipemsa"}`.trim(),
      description: `${item.descripcion || item.description || ""}`.trim(),
      quantity: Number(item.cantidad || item.quantity),
      unit_price: Number(item.precio || item.unit_price),
      currency_id: "MXN",
      id: item.id?.toString(),
    }));

    console.log("✅ Items enviados a Mercado Pago:", JSON.stringify(itemsMP, null, 2));

    const preference = new Preference(client);

    const response = await preference.create({
      body: {
        items: itemsMP,
        payer: body.payer,
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_URL}/pago-exitoso`,
          failure: `${process.env.NEXT_PUBLIC_URL}/pago-fallido`,
          pending: `${process.env.NEXT_PUBLIC_URL}/pago-pendiente`,
        },
      },
    });

    console.log("✅ Preferencia creada:", response.id);

    return NextResponse.json({ 
      preferenceId: response.id,
      init_point: response.init_point 
    });

  } catch (error: any) {
    console.error('Mercado Pago Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Error al crear preferencia' 
    }, { status: 500 });
  }
}