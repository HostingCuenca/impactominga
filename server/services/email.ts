import nodemailer from "nodemailer";

// Configurar transporter con Hostinger SMTP
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || "465"),
  secure: process.env.EMAIL_SECURE === "true", // SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Verificar configuración del transporter
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Error en configuración de email:", error);
  } else {
    console.log("✅ Servidor de email listo");
  }
});

// =====================================================
// Email: Recuperación de contraseña
// =====================================================
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  firstName: string
) {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: "Recupera tu contraseña - Impacto Minga",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background: #2563eb;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
          }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Impacto Minga</h1>
          </div>
          <div class="content">
            <h2>Hola ${firstName},</h2>
            <p>Recibimos una solicitud para restablecer tu contraseña.</p>
            <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
            <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
            <p>O copia y pega este enlace en tu navegador:</p>
            <p style="word-break: break-all; color: #2563eb;">${resetUrl}</p>
            <p><strong>Este enlace expirará en 1 hora.</strong></p>
            <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este correo.</p>
          </div>
          <div class="footer">
            <p>© 2025 Impacto Minga. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de recuperación enviado a: ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Error enviando email:", error);
    return false;
  }
}

// =====================================================
// Email: Orden creada (confirmación)
// =====================================================
export async function sendOrderConfirmationEmail(
  email: string,
  firstName: string,
  orderNumber: string,
  total: number,
  raffleTitle: string,
  quantity: number
) {
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: `Orden Confirmada #${orderNumber} - Impacto Minga`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .order-box { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background: #2563eb;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
          }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ ¡Orden Creada!</h1>
          </div>
          <div class="content">
            <h2>Hola ${firstName},</h2>
            <p>Tu orden ha sido creada exitosamente. A continuación los detalles:</p>

            <div class="order-box">
              <p><strong>Número de Orden:</strong> ${orderNumber}</p>
              <p><strong>Sorteo:</strong> ${raffleTitle}</p>
              <p><strong>Cantidad de Boletos:</strong> ${quantity}</p>
              <p><strong>Total:</strong> $${total.toFixed(2)}</p>
            </div>

            <h3>📋 Pasos para completar tu compra:</h3>
            <ol>
              <li>Realiza la transferencia bancaria:
                <ul>
                  <li>Banco: Pichincha</li>
                  <li>Cuenta: 2100123456 (Corriente)</li>
                  <li>Beneficiario: Impacto Minga</li>
                  <li>Monto: $${total.toFixed(2)}</li>
                  <li>Referencia: ${orderNumber}</li>
                </ul>
              </li>
              <li>Sube tu comprobante en "Mi Cuenta"</li>
              <li>Espera la verificación (24-48 horas)</li>
            </ol>

            <a href="${process.env.FRONTEND_URL}/dashboard/my-orders" class="button">Ver Mi Orden</a>
          </div>
          <div class="footer">
            <p>© 2025 Impacto Minga. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de confirmación enviado a: ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Error enviando email:", error);
    return false;
  }
}

// =====================================================
// Email: Orden aprobada (números asignados)
// =====================================================
export async function sendOrderApprovedEmail(
  email: string,
  firstName: string,
  orderNumber: string,
  raffleTitle: string,
  ticketNumbers: number[]
) {
  const ticketsList = ticketNumbers.join(", ");

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: `¡Pago Aprobado! Tus números: ${ticketNumbers[0]}... - Impacto Minga`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .tickets-box {
            background: white;
            padding: 20px;
            border-radius: 6px;
            margin: 15px 0;
            border: 2px solid #10b981;
            text-align: center;
          }
          .ticket-number {
            display: inline-block;
            background: #2563eb;
            color: white;
            padding: 8px 12px;
            margin: 4px;
            border-radius: 4px;
            font-weight: bold;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background: #2563eb;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
          }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 ¡Pago Aprobado!</h1>
          </div>
          <div class="content">
            <h2>¡Felicidades ${firstName}!</h2>
            <p>Tu pago ha sido verificado y aprobado. Ya tienes tus números para el sorteo:</p>

            <div class="tickets-box">
              <h3>${raffleTitle}</h3>
              <p><strong>Orden:</strong> ${orderNumber}</p>
              <p><strong>Tus números:</strong></p>
              <div>
                ${ticketNumbers.map(num => `<span class="ticket-number">${num}</span>`).join('')}
              </div>
            </div>

            <p>¡Mucha suerte! 🍀</p>
            <p>Puedes ver tus números en cualquier momento desde tu cuenta.</p>

            <a href="${process.env.FRONTEND_URL}/dashboard/my-orders" class="button">Ver Mis Números</a>
          </div>
          <div class="footer">
            <p>© 2025 Impacto Minga. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de aprobación enviado a: ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Error enviando email:", error);
    return false;
  }
}

// =====================================================
// Email: Orden rechazada
// =====================================================
export async function sendOrderRejectedEmail(
  email: string,
  firstName: string,
  orderNumber: string,
  rejectionReason: string
) {
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: `Orden ${orderNumber} - Pago No Verificado - Impacto Minga`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ef4444; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .reason-box {
            background: #fef2f2;
            padding: 15px;
            border-radius: 6px;
            margin: 15px 0;
            border-left: 4px solid #ef4444;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background: #2563eb;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
          }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Orden No Verificada</h1>
          </div>
          <div class="content">
            <h2>Hola ${firstName},</h2>
            <p>Lamentamos informarte que tu orden <strong>${orderNumber}</strong> no pudo ser verificada.</p>

            <div class="reason-box">
              <p><strong>Motivo:</strong></p>
              <p>${rejectionReason}</p>
            </div>

            <p>Por favor, verifica la información y vuelve a intentarlo.</p>
            <p>Si tienes dudas, contáctanos a través de nuestro WhatsApp o correo electrónico.</p>

            <a href="${process.env.FRONTEND_URL}/dashboard/my-orders" class="button">Ver Mi Cuenta</a>
          </div>
          <div class="footer">
            <p>© 2025 Impacto Minga. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de rechazo enviado a: ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Error enviando email:", error);
    return false;
  }
}

// =====================================================
// Email: Bienvenida (nuevo usuario)
// =====================================================
export async function sendWelcomeEmail(email: string, firstName: string) {
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: "¡Bienvenido a Impacto Minga! 🎉",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background: #2563eb;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
          }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>¡Bienvenido a Impacto Minga!</h1>
          </div>
          <div class="content">
            <h2>Hola ${firstName},</h2>
            <p>¡Gracias por unirte a Impacto Minga! 🎉</p>
            <p>Tu cuenta ha sido creada exitosamente.</p>
            <p>Ahora puedes participar en nuestros sorteos y hacer seguimiento de tus órdenes.</p>

            <a href="${process.env.FRONTEND_URL}/raffles" class="button">Ver Sorteos Activos</a>

            <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
          </div>
          <div class="footer">
            <p>© 2025 Impacto Minga. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de bienvenida enviado a: ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Error enviando email:", error);
    return false;
  }
}
