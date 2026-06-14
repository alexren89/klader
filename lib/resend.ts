import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendNewMessageEmail({
  to,
  senderName,
  listingTitle,
  conversationId,
}: {
  to: string;
  senderName: string;
  listingTitle: string;
  conversationId: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  await resend.emails.send({
    from: process.env.EMAIL_FROM || "noreply@klader.com",
    to,
    subject: `Nuevo mensaje de ${senderName} - Klader`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4a674b;">Tienes un nuevo mensaje en Klader</h2>
        <p><strong>${senderName}</strong> te ha enviado un mensaje sobre <em>"${listingTitle}"</em>.</p>
        <a href="${appUrl}/messages/${conversationId}"
           style="display: inline-block; background: #4a674b; color: white; padding: 12px 24px;
                  text-decoration: none; border-radius: 6px; margin-top: 16px;">
          Ver mensaje
        </a>
        <p style="color: #666; font-size: 12px; margin-top: 24px;">
          Klader - Moda de segunda mano
        </p>
      </div>
    `,
  });
}

export async function sendOrderConfirmationEmail({
  to,
  buyerName,
  listingTitle,
  totalPrice,
  orderId,
}: {
  to: string;
  buyerName: string;
  listingTitle: string;
  totalPrice: number;
  orderId: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  await resend.emails.send({
    from: process.env.EMAIL_FROM || "noreply@klader.com",
    to,
    subject: `Confirmación de pedido - Klader`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4a674b;">¡Pedido confirmado!</h2>
        <p>Hola <strong>${buyerName}</strong>,</p>
        <p>Tu pedido de <em>"${listingTitle}"</em> ha sido confirmado.</p>
        <p><strong>Total pagado: $${totalPrice.toFixed(2)}</strong></p>
        <a href="${appUrl}/orders/${orderId}"
           style="display: inline-block; background: #4a674b; color: white; padding: 12px 24px;
                  text-decoration: none; border-radius: 6px; margin-top: 16px;">
          Ver pedido
        </a>
      </div>
    `,
  });
}
