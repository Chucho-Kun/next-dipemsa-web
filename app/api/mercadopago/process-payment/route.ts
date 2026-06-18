// app/api/mercadopago/process-payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const formData = body.formData || body;

    // ← CORRECCIÓN IMPORTANTE: Redondear a 2 decimales
    const transactionAmount = Math.round(Number(formData.transaction_amount) * 100) / 100;

    console.log("🔍 Monto original:", formData.transaction_amount);
    console.log("✅ Monto corregido:", transactionAmount);

    if (!transactionAmount || isNaN(transactionAmount) || transactionAmount <= 0) {
      return NextResponse.json({ 
        error: "transaction_amount inválido",
        received: formData.transaction_amount 
      }, { status: 400 });
    }

    const payment = new Payment(client);

    const response = await payment.create({
      body: {
        token: formData.token,
        issuer_id: formData.issuer_id,
        payment_method_id: formData.payment_method_id,
        transaction_amount: transactionAmount,     // ← Aquí va el monto corregido
        installments: Number(formData.installments) || 1,
        payer: {
          email: formData.payer?.email || "cliente@dipemsa.com.mx",
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