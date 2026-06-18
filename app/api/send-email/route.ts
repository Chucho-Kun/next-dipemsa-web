// app/api/send-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { orderData, customerEmail } = await request.json();

    // Configuración para correo empresarial (SMTP)
        const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,        // Ej: smtp.hostinger.com
        port: Number(process.env.EMAIL_PORT) || 465,
        secure: true,                        // true para 465, false para 587
        auth: {
            user: process.env.EMAIL_USER,      // tu correo completo
            pass: process.env.EMAIL_PASSWORD,  // contraseña normal del correo
        },
        });

    const htmlContent = `
      <h2>¡Gracias por tu compra en DIPEMSA!</h2>
      <p><strong>Número de pago:</strong> ${orderData.paymentId}</p>
      <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-MX')}</p>
      
      <h3>Resumen de tu pedido:</h3>
      <ul>
        ${orderData.items.map((item: any) => `
          <li>
            ${item.cantidad} × ${item.titulo} - ${item.descripcion} 
            <strong>$${item.precio}</strong>
          </li>
        `).join('')}
      </ul>
      
      <p><strong>Subtotal:</strong> $${orderData.subtotal}</p>
      <p><strong>Envío:</strong> $${orderData.shipping}</p>
      <h3><strong>Total pagado: $${orderData.total}</strong></h3>
      
      <p>Nos pondremos en contacto pronto para coordinar la entrega.</p>
      <p>¡Gracias por preferirnos!</p>
    `;

    await transporter.sendMail({
      from: `"DIPEMSA" <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject: `Confirmación de compra - Orden #${orderData.paymentId}`,
      html: htmlContent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error enviando correo' }, { status: 500 });
  }
}