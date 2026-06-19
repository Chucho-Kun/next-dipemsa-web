// app/api/mercadopago/preference/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ==================== DEBUG ====================
    console.log("🔍 [PREFERENCE] Items recibidos del frontend:");
    console.log(JSON.stringify(body.items, null, 2));
    // ===============================================
    

    // Mejorar los items antes de enviarlos a Mercado Pago
    const improvedItems = body.items.map((item: any) => ({
      title: item.title || item.titulo || "Producto Dipemsa",           // ← Prioridad al nombre
      description: item.description || item.descripcion || "",
      quantity: Number(item.quantity || item.cantidad),
      unit_price: Number(item.unit_price || item.precio),
      currency_id: "MXN",
      id: item.id || undefined,
    }));

    const preference = new Preference(client);

    const response = await preference.create({
      body: {
        items: improvedItems,
        payer: body.payer,
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_URL}/pago-exitoso`,
          failure: `${process.env.NEXT_PUBLIC_URL}/pago-fallido`,
          pending: `${process.env.NEXT_PUBLIC_URL}/pago-pendiente`,
        },
        //auto_return: 'approved',
      },
    });

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