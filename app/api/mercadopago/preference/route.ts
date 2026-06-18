// app/api/mercadopago/preference/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const preference = new Preference(client);

    const response = await preference.create({
      body: {
        items: body.items,
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