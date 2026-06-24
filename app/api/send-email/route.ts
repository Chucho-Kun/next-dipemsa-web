// app/api/send-email/route.ts
import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { orderData, customerEmail, deliveryData } = await request.json();

    console.log("📧 [RESEND] Enviando a:", customerEmail);
    console.log("📧 [RESEND] Orden:", orderData.paymentId);

    const { data, error } = await resend.emails.send({
      from: 'DIPEMSA <noreplay@dipemsa.com.mx>',
      to: [customerEmail],
      bcc: ['jesus_web_master@hotmail.com'],
      subject: `Confirmación de compra - Orden #${orderData.paymentId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #000B66;">¡Gracias por tu compra en DIPEMSA!</h2>
          <p><strong>Número de Orden:</strong> ${orderData.paymentId}</p>
          <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-MX')}</p>

          <h3>Datos de Entrega:</h3>
          <p><strong>Nombre:</strong> ${deliveryData?.nombre} ${deliveryData?.apellidos}</p>
          <p><strong>Dirección:</strong> ${deliveryData?.direccion}</p>
          <p><strong>Entre calles:</strong> ${deliveryData?.entreCalles}</p>
          <p><strong>Ciudad:</strong> ${deliveryData?.ciudad} | <strong>CP:</strong> ${deliveryData?.cp}</p>
          <p><strong>Teléfono:</strong> ${deliveryData?.telefono}</p>

          <h3>Productos:</h3>
          <ul>
            ${orderData.items.map((item: any) => `
              <li>${item.cantidad} × ${item.titulo} - ${item.descripcion}</li>
            `).join('')}
          </ul>

          <p><strong>Subtotal:</strong> $${orderData.subtotal}</p>
          <p><strong>Envío:</strong> $${orderData.shipping}</p>
          <h3><strong>Total Pagado: $${orderData.total}</strong></h3>

          <p>Nos pondremos en contacto pronto para coordinar la entrega.</p>
          <p>¡Gracias por preferirnos!</p>
        </div>
      `,
    });

    if (error) {
      console.error("❌ Error Resend:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("✅ Correo enviado con Resend:", data?.id);
    return NextResponse.json({ success: true, messageId: data?.id });

  } catch (error: any) {
    console.error("❌ Error enviando correo:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}