'use server';

import nodemailer from 'nodemailer';

export async function sendContactEmail(formData: FormData) {
  const nombre = formData.get('nombre') as string;
  const email = formData.get('email') as string;
  const mensaje = formData.get('mensaje') as string;

  // Validación básica
  if (!nombre || !email || !mensaje) {
    return { success: false, message: "Todos los campos son obligatorios" };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: "mail.dipemsa.com.mx",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_PASSWORD,
        pass: "@#Avisos123#@",
      },
    });

    await transporter.sendMail({
      from: `"Sitio Web Dipemsa" ${ process.env.EMAIL_PASSWORD }`,
      to: "gameroapp@gmail.com", //"contacto@dipemsa.com.mx",
      replyTo: email,   // Para que puedas responder directamente
      subject: `Nuevo mensaje desde el sitio web - ${nombre}`,
      html: `
        <h2>Nuevo mensaje de contacto</h2>
        <p><strong>Nombre:</strong> ${nombre}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Mensaje:</strong></p>
        <p>${mensaje.replace(/\n/g, '<br>')}</p>
        <hr>
        <small>Enviado desde: dipemsa.com.mx</small>
      `,
    });

    return { 
      success: true, 
      message: "¡Mensaje enviado correctamente! Te contactaremos pronto." 
    };

  } catch (error) {
    console.error("Error enviando email:", error);
    return { 
      success: false, 
      message: "Hubo un error al enviar el mensaje. Inténtalo más tarde." 
    };
  }
}