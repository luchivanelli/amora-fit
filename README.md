# AMORA · Tienda online y panel de administración

Ecommerce de AMORA (ropa íntima y deportiva): tienda pública con carrito, checkout por Mercado Pago o "acordar con la vendedora", cuenta de clienta, y un panel para que la dueña cargue productos, maneje pedidos y ordene categorías desde el celular, sin conocimientos técnicos.

**Stack:** Next.js 15 (App Router) · TypeScript · Server Actions · Prisma 6 · Neon (PostgreSQL) · Tailwind CSS 4 (tokens semánticos con modo claro/oscuro en `src/styles/globals.css`) · Auth.js v5 · GSAP · Cloudinary (fotos) · Resend (mails) · Mercado Pago Checkout Pro.

## Mapa de la tienda

| Ruta | Qué es |
| --- | --- |
| `/` | Home: hero animado, categorías, destacados, nuevos ingresos, beneficios, newsletter |
| `/tienda` | Catálogo con filtros en la URL (`categoria`, `sub`, `talle`, `color`, `min`, `max`, `orden`, `page`, `q` para búsqueda por texto) |
| `/producto/[slug]` | Detalle con galería, selector de talle/color con stock, guía de talles, relacionados y JSON-LD |
| `/checkout` | Datos, entrega (dirección o zona), cupón, método de pago. Invitada o con cuenta |
| `/checkout/confirmacion/[id]` | Confirmación. En "acordar": botones de WhatsApp y mail con el pedido prellenado |
| `/checkout/retorno` | Vuelta desde Mercado Pago |
| `/cuenta/*` | Datos, pedidos, direcciones, favoritos |
| `/ingresar`, `/registro`, `/olvide-mi-contrasena` | Acceso (clientas y dueña; cada rol va a su lugar) |
| `/contacto`, `/preguntas-frecuentes`, `/cambios-y-devoluciones`, `/terminos`, `/privacidad` | Páginas estáticas |
| `/admin/*` | Panel (solo rol ADMIN) |
| `/api/webhooks/mercadopago` | Única API route: recibe los avisos de pago de Mercado Pago |

## Flujo de compra y stock

1. El carrito vive en la base (cookie `amora_cart` para invitadas, asociado al usuario al iniciar sesión; ambos se fusionan).
2. Al confirmar, en una transacción se descuenta el stock de cada variante solo si alcanza (sin sobreventa), se crea la orden con snapshot de precios y se vacía el carrito.
3. **Mercado Pago:** se crea la preferencia y se redirige. El webhook verifica la firma (`x-signature`), consulta el pago a MP, comprueba que el monto coincida y marca el pedido como `PAGADO`. Si no se paga en 24 h, el pedido se cancela y el stock vuelve (se revisa al iniciar un checkout, en el webhook y en el panel).
4. **Acordar con la vendedora:** la orden queda `PENDIENTE_ACUERDO`, se avisa por mail a la vendedora y a la clienta, y la confirmación ofrece WhatsApp (`wa.me`) o mail con el resumen. Desde el panel se marca el pago recibido y se carga el envío acordado.
5. Cancelar un pedido (desde el panel, por devolución en MP o por vencimiento) devuelve el stock y deja registro en `StockMovement`.

### Configurar Mercado Pago

1. En [developers.mercadopago.com](https://www.mercadopago.com.ar/developers) creá una aplicación y copiá el **Access Token** en `MP_ACCESS_TOKEN` (usá las credenciales de prueba para probar).
2. En *Webhooks* configurá la URL `https://tu-dominio.com/api/webhooks/mercadopago` para el evento **Pagos** y copiá la **clave secreta** en `MP_WEBHOOK_SECRET`.
3. En local, exponé el puerto con `ngrok` o similar y poné esa URL en `NEXT_PUBLIC_SITE_URL` para que MP pueda avisar. Sin `MP_WEBHOOK_SECRET` en desarrollo, el webhook acepta avisos sin firma.
4. Si `MP_ACCESS_TOKEN` está vacío, el checkout solo ofrece "Acordar con la vendedora".

---

## 1. Instalación

Requisitos: Node 20 o superior (recomendado 22) y una base de datos en [Neon](https://neon.tech).

```bash
npm install
cp .env.example .env     # en Windows: copy .env.example .env
```

Completá el archivo `.env` (ver tabla más abajo). Después:

```bash
npm run db:generate      # genera el cliente de Prisma
npm run db:migrate       # crea las tablas (pide un nombre para la migración, ej: init)
npm run db:seed          # crea el admin, categorías y productos de ejemplo
npm run dev              # http://localhost:3000/admin
```

Si preferís no cargar datos de ejemplo, en lugar de `db:seed` ejecutá solo `npm run admin:create` (ver punto 3).

## 2. Variables de entorno

| Variable | Obligatoria | Para qué sirve |
| --- | --- | --- |
| `DATABASE_URL` | Sí | Conexión **pooled** de Neon (el host termina en `-pooler`). La usa la app. |
| `DIRECT_URL` | Sí | Conexión **directa** de Neon (sin `-pooler`). La usan las migraciones. |
| `AUTH_SECRET` | Sí | Clave para firmar la sesión. Generar con `openssl rand -base64 32`. |
| `AUTH_URL` | En producción | URL pública del sitio (ej. `https://amora.com.ar`). En local no hace falta. |
| `AUTH_TRUST_HOST` | Sí | Dejar en `true` (necesario en Vercel). |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | Para el seed | Datos del primer usuario admin. |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Para subir fotos | Credenciales de [Cloudinary](https://cloudinary.com) (plan gratuito alcanza). Sin esto, el panel avisa que las fotos no están configuradas. |
| `CLOUDINARY_FOLDER` | No | Carpeta donde se guardan las fotos. Por defecto `amora/productos`. |
| `RESEND_API_KEY`, `EMAIL_FROM` | Para mails | Envío del mail de "olvidé mi contraseña". Si está vacío, el link se imprime en la consola del servidor (útil en desarrollo). |
| `NEXT_PUBLIC_SITE_URL` | Sí | URL base para armar los links de los mails. |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Sí | Número de WhatsApp de la vendedora en formato internacional sin `+` (ej. `5491112345678`). Lo usan la confirmación del pedido, el footer y contacto. |
| `SELLER_EMAIL` | Sí | Mail de la vendedora: recibe el aviso de cada pedido y las consultas del formulario de contacto. |
| `MP_ACCESS_TOKEN` | Para Mercado Pago | Access Token de la aplicación de Mercado Pago. Vacío = solo "acordar con la vendedora". |
| `MP_WEBHOOK_SECRET` | Para Mercado Pago | Clave secreta del webhook, para verificar la firma de los avisos. |
| `SHIPPING_FLAT_RATE` | No | Costo fijo de envío que se cobra en pedidos con Mercado Pago. Vacío = "a coordinar". |
| `FREE_SHIPPING_FROM` | No | Monto a partir del cual el envío es gratis (solo con `SHIPPING_FLAT_RATE`). |

Las variables que no empiezan con `NEXT_PUBLIC_` nunca llegan al navegador.

## 3. Crear el primer usuario admin

Opción A, con el seed (crea además categorías y productos de ejemplo):

```bash
npm run db:seed
```

Opción B, solo el usuario, tomando `ADMIN_EMAIL` / `ADMIN_PASSWORD` del `.env`:

```bash
npm run admin:create
```

Opción C, pasando los datos por parámetro:

```bash
npm run admin:create -- duena@amora.com UnaClaveSegura123 "Nombre"
```

Si el mail ya existe, el script lo convierte en admin y actualiza la contraseña. Después, entrá a `/ingresar`.

Para cambiar la contraseña más adelante: "Olvidé mi contraseña" en la pantalla de ingreso (necesita `RESEND_API_KEY` en producción) o volver a correr `admin:create`.

## 4. Comandos útiles

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Compilar y correr en producción |
| `npm run typecheck` | Verificación de tipos |
| `npm run db:generate` | Regenerar el cliente de Prisma tras tocar `schema.prisma` |
| `npm run db:migrate` | Crear y aplicar una migración (desarrollo) |
| `npm run db:deploy` | Aplicar migraciones pendientes (producción) |
| `npm run db:push` | Sincronizar el schema sin migración (solo para probar rápido) |
| `npm run db:seed` | Cargar datos de ejemplo |
| `npm run db:studio` | Abrir Prisma Studio para ver la base |

## 5. Despliegue en Vercel + Neon

1. Subí el repositorio a GitHub e importalo en Vercel.
2. En Vercel → Settings → Environment Variables, cargá todas las variables del punto 2 (`AUTH_URL` con tu dominio).
3. Build command: `prisma generate && next build` (ya es el `npm run build` del proyecto).
4. Para aplicar migraciones en producción, corré localmente con las variables de producción:
   ```bash
   DATABASE_URL=... DIRECT_URL=... npm run db:deploy
   ```
   o agregá `prisma migrate deploy &&` al principio del build command.
5. Creá el admin en producción con `npm run admin:create` usando el `DATABASE_URL` de producción.

Neon: usá una rama (branch) distinta para desarrollo y producción. La conexión pooled va en `DATABASE_URL` y la directa en `DIRECT_URL`.

## 6. Estructura del proyecto

```
prisma/           schema.prisma, seed.ts, migraciones
scripts/          create-admin.ts
src/app/          rutas (App Router)
  (auth)/         ingresar, olvidé mi contraseña, restablecer
  admin/          inicio, productos, pedidos, categorías, ayuda
  api/            solo lo que exige Auth.js (y el futuro webhook de Mercado Pago)
src/components/   ui/ (botones, campos, diálogos…), admin/ (pantallas), motion/ (GSAP)
src/server/       actions/ (Server Actions), queries/ (lecturas), services/ (mail, WhatsApp, Cloudinary, stock)
src/lib/          prisma, auth, validaciones Zod, utilidades
```

## 7. Decisiones de diseño

- **Seguridad en dos capas.** El middleware bloquea `/admin` sin sesión de ADMIN, y además cada Server Action llama a `requireAdmin()`.
- **Sesión de 30 días** (JWT) para que la dueña no tenga que ingresar todo el tiempo.
- **"Eliminar" es archivar.** Los productos nunca se borran físicamente (`deletedAt`), para no romper el historial de pedidos. Se pueden recuperar desde el filtro "Eliminados".
- **Borrador primero.** "Agregar producto" crea un borrador vacío y abre el formulario; así el autoguardado y las fotos tienen dónde guardarse desde el primer segundo. Mientras es borrador, nadie lo ve en la tienda.
- **Autoguardado + copia local.** El formulario guarda solo a los pocos segundos de cada cambio y además deja una copia en el navegador por si se corta internet.
- **Fotos directas a Cloudinary.** Se comprimen en el celular (máximo 1600 px) y suben con una firma generada por Server Action, sin pasar por el servidor ni crear API routes.
- **Slug y SKU automáticos.** Se generan en el servidor a partir del nombre; la dueña nunca los ve.
- **Stock derivado.** "Sin stock" se calcula sumando las variantes; nunca queda desactualizado.
- **Cancelar un pedido devuelve el stock** en una transacción y queda registrado en `StockMovement`.
- **Rate limiting en memoria** para login y recuperación de contraseña. En Vercel cada instancia cuenta por separado; si hace falta algo más estricto se puede conectar Upstash sin tocar las pantallas.
