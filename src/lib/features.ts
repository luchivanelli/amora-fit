/**
 * Funciones opcionales de la tienda. Solo para Server Components / Server Actions.
 *
 * Mails automáticos (confirmación de pedido, recuperar contraseña, etc.): el código sigue
 * en `server/services/email.ts`, pero la UI no los menciona hasta que se cargue RESEND_API_KEY
 * con un dominio verificado en EMAIL_FROM.
 */
export function emailsEnabled() {
  return Boolean(process.env.RESEND_API_KEY);
}
