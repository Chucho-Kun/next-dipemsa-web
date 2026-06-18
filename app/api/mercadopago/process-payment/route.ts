// app/api/mercadopago/process-payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log("🔍 Datos completos recibidos:", JSON.stringify(body, null, 2));

    // Extraer el monto de diferentes posibles ubicaciones
    let transactionAmount = 
      Number(body.transaction_amount) || 
      Number(body.amount) || 
      Number(body.transactionAmount);

    if (!transactionAmount || isNaN(transactionAmount)) {
      return NextResponse.json({ 
        error: "No se pudo obtener el monto de la transacción",
        receivedData: body 
      }, { status: 400 });
    }

    const payment = new Payment(client);

    const response = await payment.create({
      body: {
        token: body.token,
        issuer_id: body.issuer_id,
        payment_method_id: body.payment_method_id,
        transaction_amount: transactionAmount,
        installments: Number(body.installments) || 1,
        payer: {
          email: body.payer?.email || body.email || "cliente@dipemsa.com.mx",
        },
      },
    });

    console.log("✅ Pago procesado:", response.status);

    return NextResponse.json({
      status: response.status,
      status_detail: response.status_detail,
      payment_id: response.id,
    });

  } catch (error: any) {
    console.error('Mercado Pago Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Error procesando el pago' 
    }, { status: 500 });
  }
}