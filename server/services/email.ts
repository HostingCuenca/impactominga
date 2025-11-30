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
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=Raleway:wght@400;500;600;700&display=swap');

          body {
            font-family: 'Raleway', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f3f4f6;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
          }
          .header {
            background: #000000;
            padding: 30px 20px;
            text-align: center;
            border-bottom: 4px solid #d4af37;
          }
          .logo {
            max-width: 180px;
            height: auto;
          }
          .banner {
            background: #d4af37;
            color: #000000;
            text-align: center;
            padding: 12px;
            font-family: 'Oswald', sans-serif;
            font-weight: 700;
            font-size: 18px;
            letter-spacing: 1px;
          }
          .content {
            padding: 30px 20px;
            background: #ffffff;
          }
          .greeting {
            font-family: 'Oswald', sans-serif;
            font-size: 24px;
            font-weight: 600;
            color: #000000;
            margin-bottom: 15px;
          }
          .order-box {
            background: #f9fafb;
            border-left: 4px solid #d4af37;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
          }
          .order-box p {
            margin: 8px 0;
            font-size: 15px;
          }
          .order-box strong {
            color: #000000;
            font-weight: 600;
          }
          .section-title {
            font-family: 'Oswald', sans-serif;
            font-size: 20px;
            font-weight: 700;
            color: #000000;
            margin: 25px 0 15px 0;
          }
          .bank-details {
            background: #f3f4f6;
            padding: 20px;
            border-radius: 8px;
            margin: 15px 0;
            border: 2px solid #d4af37;
          }
          .bank-details p {
            margin: 10px 0;
            font-size: 15px;
          }
          .account-number {
            font-family: monospace;
            font-size: 18px;
            color: #d4af37;
            font-weight: bold;
          }
          .total-amount {
            color: #d4af37;
            font-weight: bold;
            font-size: 20px;
          }
          .whatsapp-button {
            display: inline-block;
            background: #25D366;
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-family: 'Oswald', sans-serif;
            font-weight: 700;
            font-size: 16px;
            margin: 20px 0;
            text-align: center;
          }
          .footer {
            background: #000000;
            color: #ffffff;
            text-align: center;
            padding: 25px 20px;
            font-size: 13px;
          }
          .footer-gold {
            color: #d4af37;
            font-weight: 600;
          }
          ol {
            padding-left: 20px;
          }
          ol li {
            margin: 15px 0;
            line-height: 1.8;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header con Logo -->
          <div class="header">
            <img src="${process.env.FRONTEND_URL}/logo.png" alt="Impacto Minga" class="logo">
          </div>

          <!-- Banner Dorado -->
          <div class="banner">
            ✅ ¡ORDEN CREADA EXITOSAMENTE!
          </div>

          <!-- Contenido -->
          <div class="content">
            <h2 class="greeting">¡Hola ${firstName}!</h2>
            <p>Tu orden ha sido creada exitosamente. A continuación encontrarás todos los detalles:</p>

            <!-- Detalles de la Orden -->
            <div class="order-box">
              <p><strong>Número de Orden:</strong> ${orderNumber}</p>
              <p><strong>Sorteo:</strong> ${raffleTitle}</p>
              <p><strong>Cantidad de Boletos:</strong> ${quantity}</p>
              <p><strong>Total a Pagar:</strong> <span class="total-amount">$${total.toFixed(2)} USD</span></p>
            </div>

            <!-- Pasos para Completar -->
            <h3 class="section-title">📋 Pasos para Completar tu Compra</h3>
            <ol>
              <li>
                <strong>Realiza la transferencia bancaria:</strong>
                <div class="bank-details">
                  <p><strong>Banco:</strong> BANCO PICHINCHA</p>
                  <p><strong>Tipo de Cuenta:</strong> CUENTA AHORRO</p>
                  <p><strong># de Cuenta:</strong> <span class="account-number">2213830211</span></p>
                  <p><strong>Titular:</strong> MINGA TIPANLUIZA RICHARD DUFFER</p>
                  <p><strong>C.I:</strong> 1501260440</p>
                  <p><strong>Monto:</strong> <span class="total-amount">$${total.toFixed(2)}</span></p>
                  <p><strong>Referencia:</strong> ${orderNumber}</p>
                </div>
              </li>
              <li><strong>Envía tu comprobante por WhatsApp</strong> para verificación rápida y segura</li>
              <li><strong>Espera la verificación</strong> (24-48 horas hábiles)</li>
            </ol>

            <!-- Botón WhatsApp -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://wa.me/593980212915?text=Hola%2C%20realicé%20una%20transferencia%20para%20la%20orden%20${orderNumber}%20por%20%24${total.toFixed(2)}%20y%20adjunto%20el%20comprobante." class="whatsapp-button">
                📱 ENVIAR COMPROBANTE POR WHATSAPP
              </a>
            </div>

            <!-- Botón Ver Mi Orden - COMENTADO -->
            <!-- <div style="text-align: center; margin: 20px 0;">
              <a href="${process.env.FRONTEND_URL}/dashboard/my-orders" style="display: inline-block; background: #000000; color: #d4af37; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-family: 'Oswald', sans-serif; font-weight: 600; border: 2px solid #d4af37;">
                VER MI ORDEN
              </a>
            </div> -->

            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              Si tienes alguna pregunta, no dudes en contactarnos por WhatsApp o nuestras redes sociales.
            </p>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p style="margin: 5px 0;">© 2025 <span class="footer-gold">IMPACTO MINGA</span></p>
            <p style="margin: 5px 0;">Todos los derechos reservados</p>
            <p style="margin: 15px 0 5px 0;">Síguenos en nuestras redes:</p>
            <p style="margin: 5px 0;">
              <span class="footer-gold">Instagram:</span> @impacto_minga |
              <span class="footer-gold">TikTok:</span> @impacto_minga
            </p>
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
  // Generar los tickets en grupos de 3 columnas
  const ticketsHTML = ticketNumbers.map(num => `
    <div style="display: inline-block; width: 30%; margin: 1%; vertical-align: top;">
      <div style="
        background: linear-gradient(135deg, #d4af37 0%, #f0d98f 100%);
        border: 3px dashed #000000;
        border-radius: 12px;
        padding: 20px 10px;
        text-align: center;
        box-shadow: 0 4px 6px rgba(0,0,0,0.2);
        position: relative;
        overflow: hidden;
      ">
        <!-- Círculos decorativos en los bordes -->
        <div style="
          position: absolute;
          top: 50%;
          left: -10px;
          width: 20px;
          height: 20px;
          background: #ffffff;
          border-radius: 50%;
          transform: translateY(-50%);
        "></div>
        <div style="
          position: absolute;
          top: 50%;
          right: -10px;
          width: 20px;
          height: 20px;
          background: #ffffff;
          border-radius: 50%;
          transform: translateY(-50%);
        "></div>

        <!-- Contenido del ticket -->
        <div style="position: relative; z-index: 1;">
          <p style="
            font-family: 'Oswald', sans-serif;
            font-size: 11px;
            font-weight: 600;
            color: #000000;
            margin: 0 0 5px 0;
            text-transform: uppercase;
            letter-spacing: 1px;
          ">TICKET</p>
          <p style="
            font-family: 'Oswald', sans-serif;
            font-size: 36px;
            font-weight: 700;
            color: #000000;
            margin: 0;
            line-height: 1;
            text-shadow: 2px 2px 0px rgba(255,255,255,0.3);
          ">${num.toString().padStart(4, '0')}</p>
          <p style="
            font-family: 'Raleway', sans-serif;
            font-size: 9px;
            color: #000000;
            margin: 5px 0 0 0;
            font-weight: 600;
          ">IMPACTO MINGA</p>
        </div>
      </div>
    </div>
  `).join('');

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: `🎉 ¡Pago Aprobado! Tus números del sorteo - Impacto Minga`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=Raleway:wght@400;500;600;700&display=swap');

          body {
            font-family: 'Raleway', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f3f4f6;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
          }
          .header {
            background: #000000;
            padding: 30px 20px;
            text-align: center;
            border-bottom: 4px solid #d4af37;
          }
          .logo {
            max-width: 180px;
            height: auto;
          }
          .banner {
            background: #d4af37;
            color: #000000;
            text-align: center;
            padding: 15px;
            font-family: 'Oswald', sans-serif;
            font-weight: 700;
            font-size: 22px;
            letter-spacing: 1px;
          }
          .content {
            padding: 30px 20px;
            background: #ffffff;
          }
          .greeting {
            font-family: 'Oswald', sans-serif;
            font-size: 28px;
            font-weight: 700;
            color: #000000;
            margin-bottom: 15px;
            text-align: center;
          }
          .success-icon {
            text-align: center;
            font-size: 60px;
            margin: 20px 0;
          }
          .order-info {
            background: #f9fafb;
            border-left: 4px solid #d4af37;
            padding: 15px 20px;
            border-radius: 6px;
            margin: 20px 0;
          }
          .section-title {
            font-family: 'Oswald', sans-serif;
            font-size: 20px;
            font-weight: 700;
            color: #000000;
            margin: 30px 0 20px 0;
            text-align: center;
            text-transform: uppercase;
          }
          .tickets-container {
            background: #f3f4f6;
            padding: 20px;
            border-radius: 12px;
            margin: 20px 0;
            border: 2px solid #d4af37;
          }
          .footer {
            background: #000000;
            color: #ffffff;
            text-align: center;
            padding: 25px 20px;
            font-size: 13px;
          }
          .footer-gold {
            color: #d4af37;
            font-weight: 600;
          }
          @media only screen and (max-width: 600px) {
            .tickets-container > div {
              width: 48% !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header con Logo -->
          <div class="header">
            <img src="${process.env.FRONTEND_URL}/logo.png" alt="Impacto Minga" class="logo">
          </div>

          <!-- Banner Dorado -->
          <div class="banner">
            🎉 ¡PAGO APROBADO - ORDEN CONFIRMADA!
          </div>

          <!-- Contenido -->
          <div class="content">
            <div class="success-icon">✅</div>
            <h2 class="greeting">¡Felicidades ${firstName}!</h2>

            <p style="text-align: center; font-size: 16px; color: #333; margin: 20px 0;">
              Tu pago ha sido <strong style="color: #d4af37;">verificado y aprobado</strong> exitosamente.
            </p>

            <!-- Información de la Orden -->
            <div class="order-info">
              <p style="margin: 8px 0;"><strong>📋 Número de Orden:</strong> ${orderNumber}</p>
              <p style="margin: 8px 0;"><strong>🎯 Sorteo:</strong> ${raffleTitle}</p>
              <p style="margin: 8px 0;"><strong>🎟️ Total de Números:</strong> ${ticketNumbers.length}</p>
            </div>

            <!-- Título de Tickets -->
            <h3 class="section-title">🎫 TUS NÚMEROS DE LA SUERTE</h3>

            <p style="text-align: center; color: #666; font-size: 14px; margin-bottom: 20px;">
              Guarda estos números. ¡Uno de ellos podría hacerte ganar!
            </p>

            <!-- Tickets en Columnas de 3 -->
            <div class="tickets-container">
              ${ticketsHTML}
            </div>

            <!-- Mensaje de Suerte -->
            <div style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border-left: 4px solid #d4af37; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center;">
              <p style="margin: 0; font-family: 'Oswald', sans-serif; font-size: 20px; font-weight: 700; color: #000000;">
                🍀 ¡MUCHA SUERTE!
              </p>
              <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">
                Mantente atento a nuestras redes sociales para conocer los ganadores
              </p>
            </div>

            <!-- Botón Ver Mis Números - COMENTADO -->
            <!-- <div style="text-align: center; margin: 25px 0;">
              <a href="${process.env.FRONTEND_URL}/dashboard/my-orders" style="display: inline-block; background: #000000; color: #d4af37; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-family: 'Oswald', sans-serif; font-weight: 700; font-size: 16px; border: 2px solid #d4af37;">
                VER MIS NÚMEROS
              </a>
            </div> -->

            <p style="margin-top: 30px; font-size: 14px; color: #666; text-align: center;">
              Puedes consultar tus números en cualquier momento desde el sitio web en la sección consultar boletos con el correo que realizaste tu compra.
            </p>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p style="margin: 5px 0;">© 2025 <span class="footer-gold">IMPACTO MINGA</span></p>
            <p style="margin: 5px 0;">Todos los derechos reservados</p>
            <p style="margin: 15px 0 5px 0;">Síguenos en nuestras redes:</p>
            <p style="margin: 5px 0;">
              <span class="footer-gold">Instagram:</span> @impacto_minga |
              <span class="footer-gold">TikTok:</span> @impacto_minga
            </p>
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
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=Raleway:wght@400;500;600;700&display=swap');

          body {
            font-family: 'Raleway', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f3f4f6;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
          }
          .header {
            background: #000000;
            padding: 30px 20px;
            text-align: center;
            border-bottom: 4px solid #d4af37;
          }
          .logo {
            max-width: 180px;
            height: auto;
          }
          .banner {
            background: #d4af37;
            color: #000000;
            text-align: center;
            padding: 12px;
            font-family: 'Oswald', sans-serif;
            font-weight: 700;
            font-size: 18px;
            letter-spacing: 1px;
          }
          .content {
            padding: 30px 20px;
            background: #ffffff;
          }
          .greeting {
            font-family: 'Oswald', sans-serif;
            font-size: 24px;
            font-weight: 600;
            color: #000000;
            margin-bottom: 15px;
          }
          .credentials-box {
            background: #fffbeb;
            border-left: 4px solid #d4af37;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
          }
          .credentials-box p {
            margin: 8px 0;
            font-size: 15px;
          }
          .password-code {
            background: #ffffff;
            padding: 8px 12px;
            border-radius: 4px;
            font-family: monospace;
            color: #d4af37;
            font-weight: bold;
            font-size: 16px;
            border: 2px solid #d4af37;
          }
          .footer {
            background: #000000;
            color: #ffffff;
            text-align: center;
            padding: 25px 20px;
            font-size: 13px;
          }
          .footer-gold {
            color: #d4af37;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header con Logo -->
          <div class="header">
            <img src="${process.env.FRONTEND_URL}/logo.png" alt="Impacto Minga" class="logo">
          </div>

          <!-- Banner Dorado -->
          <div class="banner">
            🎉 ¡BIENVENIDO A IMPACTO MINGA!
          </div>

          <!-- Contenido -->
          <div class="content">
            <h2 class="greeting">¡Hola ${firstName}!</h2>
            <p>¡Gracias por unirte a <strong style="color: #d4af37;">Impacto Minga</strong>!</p>
            <p>Estamos emocionados de tenerte con nosotros.</p>

            <div style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border-left: 4px solid #d4af37; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
              <p style="margin: 0; font-family: 'Oswald', sans-serif; font-size: 18px; font-weight: 700; color: #000000;">
                ✅ TU CUENTA HA SIDO CREADA EXITOSAMENTE
              </p>
              <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">
                Ya puedes participar en nuestros sorteos y cambiar vidas
              </p>
            </div>

            <p style="margin-top: 25px; font-size: 15px; line-height: 1.8;">
              Cada número que compras no solo te da la oportunidad de ganar increíbles premios, sino que también contribuye a una causa noble. <strong style="color: #d4af37;">¡Gracias por ser parte del cambio!</strong>
            </p>

            <p style="background: #f9fafb; padding: 15px; border-radius: 6px; font-size: 14px; margin-top: 20px;">
              📧 <strong>Recibirás un correo</strong> cuando tu pago sea aprobado con tus números asignados
            </p>

            <!-- Credenciales - COMENTADO (Ya no se envían) -->
            <!-- <div class="credentials-box">
              <p style="margin: 0 0 15px 0; font-weight: bold; color: #000000; font-size: 16px;">🔐 Tus Credenciales de Acceso:</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Contraseña:</strong> <span class="password-code">impactopassword</span></p>
            </div> -->

            <!-- Botón - COMENTADO -->
            <!-- <div style="text-align: center; margin: 25px 0;">
              <a href="${process.env.FRONTEND_URL}/raffles" style="display: inline-block; background: #000000; color: #d4af37; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-family: 'Oswald', sans-serif; font-weight: 600; border: 2px solid #d4af37;">
                VER SORTEOS ACTIVOS
              </a>
            </div> -->

            <p style="margin-top: 30px; font-size: 14px; color: #666; text-align: center;">
              Si tienes alguna pregunta, contáctanos por <strong>WhatsApp: +593 98 021 2915</strong>
            </p>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p style="margin: 5px 0;">© 2025 <span class="footer-gold">IMPACTO MINGA</span></p>
            <p style="margin: 5px 0;">Todos los derechos reservados</p>
            <p style="margin: 15px 0 5px 0;">Síguenos en nuestras redes:</p>
            <p style="margin: 5px 0;">
              <span class="footer-gold">Instagram:</span> @impacto_minga |
              <span class="footer-gold">TikTok:</span> @impacto_minga
            </p>
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
