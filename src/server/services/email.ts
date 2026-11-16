import { Resend } from "resend";

type SendArgs = { to: string; subject: string; html: string; text?: string };

/**
 * Envía un mail con Resend. Si no hay API key (desarrollo), lo imprime en la consola
 * para poder copiar el link y seguir probando.
 */
export async function sendEmail({ to, subject, html, text }: SendArgs) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "AMORA <onboarding@resend.dev>";

  if (!apiKey) {
    console.log(`\n📧 [MAIL SIMULADO] Para: ${to}\nAsunto: ${subject}\n${text ?? html}\n`);
    return { ok: true, simulated: true };
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({ from, to, subject, html, text });
  if (error) {
    console.error("Error enviando mail:", error);
    return { ok: false, simulated: false };
  }
  return { ok: true, simulated: false };
}

export function passwordResetEmail(link: string) {
  return {
    subject: "Restablecer tu contraseña de AMORA",
    text: `Hola! Para elegir una nueva contraseña entrá a este link (vence en 1 hora):\n${link}\n\nSi no pediste cambiarla, ignorá este mail.`,
    html: `
      <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:32px;color:#2b2a26">
        <h1 style="font-weight:500;color:#767c4e;letter-spacing:2px">AMORA</h1>
        <p style="font-family:Arial,sans-serif;font-size:16px;line-height:1.6">Hola! Para elegir una nueva contraseña hacé clic en el botón. El link vence en 1 hora.</p>
        <p style="margin:28px 0">
          <a href="${link}" style="background:#767c4e;color:#fff;padding:14px 22px;border-radius:12px;text-decoration:none;font-family:Arial,sans-serif;font-size:16px">Elegir nueva contraseña</a>
        </p>
        <p style="font-family:Arial,sans-serif;font-size:13px;color:#6b685f">Si no pediste cambiarla, ignorá este mail y tu contraseña seguirá igual.</p>
      </div>`,
  };
}
