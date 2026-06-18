// app/api/mercadopago/process-payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log("🔍 Datos recibidos:", JSON.stringify(body, null, 2));

    // Extraer el monto correctamente (está dentro de formData)
    const formData = body.formData || body;
    
    const transactionAmount = Number(formData.transaction_amount);

    if (!transactionAmount || isNaN(transactionAmount)) {
      return NextResponse.json({ 
        error: "No se pudo obtener el monto de la transacción",
        receivedData: body 
      }, { status: 400 });
    }

    const payment = new Payment(client);

    const response = await payment.create({
      body: {
        token: formData.token,
        issuer_id: formData.issuer_id,
        payment_method_id: formData.payment_method_id,
        transaction_amount: transactionAmount,
        installments: Number(formData.installments) || 1,
        payer: {
          email: formData.payer?.email || "cliente@dipemsa.com.mx",
        },
      },
    });

    console.log("✅ Pago procesado correctamente:", response.status);

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