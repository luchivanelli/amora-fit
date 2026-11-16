/**
 * Seed de AMORA: usuario admin, categorías y productos de ejemplo.
 * Ejecutar con: npm run db:seed
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import bcrypt from "bcryptjs";

if (typeof globalThis.WebSocket === "undefined") neonConfig.webSocketConstructor = ws;

const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }) });

const slugify = (t: string) =>
  t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const sku = (name: string, size: string, color: string) =>
  `AM-${slugify(name).replace(/-/g, "").slice(0, 4).toUpperCase()}-${size.toUpperCase()}-${slugify(color).slice(0, 3).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

const COLORS: Record<string, string> = {
  Oliva: "#767c4e",
  Crema: "#f3ecdc",
  Negro: "#1f1f1f",
  Arena: "#d9c7a7",
  Rosa: "#e8b4b8",
  Terracota: "#b5634a",
};

type SeedProduct = {
  name: string;
  category: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  sizes: string[];
  colors: string[];
  images: string[];
  isFeatured?: boolean;
  isNew?: boolean;
  status?: "ACTIVE" | "DRAFT";
};

const u = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

const PRODUCTS: SeedProduct[] = [
  { name: "Conjunto Luna", category: "conjuntos", description: "Conjunto de corpiño triángulo y bombacha en microfibra suave, sin costuras marcadas. Pensado para usar todo el día con total comodidad.", price: 18900, sizes: ["S", "M", "L"], colors: ["Oliva", "Crema"], images: [u("photo-1583391733956-6c78276477e2"), u("photo-1596755094514-f87e34085b2c")], isFeatured: true, isNew: true },
  { name: "Conjunto Aurora", category: "conjuntos", description: "Encaje elástico y breteles regulables. Un conjunto delicado y cómodo para sentirte vos.", price: 21500, compareAtPrice: 25900, sizes: ["S", "M", "L", "XL"], colors: ["Negro", "Rosa"], images: [u("photo-1596755094514-f87e34085b2c")], isFeatured: true },
  { name: "Corpiño Deportivo Brisa", category: "tops", description: "Top deportivo de sujeción media, con espalda cruzada y tela que seca rápido. Ideal para yoga, pilates y caminatas.", price: 16500, sizes: ["S", "M", "L", "XL"], colors: ["Oliva", "Negro", "Arena"], images: [u("photo-1518459031867-a89b944bffe4")], isFeatured: true },
  { name: "Calza Alta Nube", category: "calzas", description: "Calza tiro alto con faja ancha que no se baja ni se transparenta. Suave, elástica y con bolsillo lateral.", price: 23900, sizes: ["S", "M", "L", "XL"], colors: ["Oliva", "Negro"], images: [u("photo-1506629082955-511b1aa562c8")], isFeatured: true, isNew: true },
  { name: "Biker Movimiento", category: "calzas", description: "Calza corta tipo biker, cómoda para entrenar o para el día a día.", price: 15900, sizes: ["S", "M", "L"], colors: ["Negro", "Terracota"], images: [u("photo-1571019614242-c5c5dee9f50b")] },
  { name: "Bombacha Vedetina Algodón", category: "bombachas", description: "Pack de 3 bombachas vedetina de algodón con elastano. Suaves, respirables y sin costuras que marquen.", price: 12900, sizes: ["S", "M", "L", "XL"], colors: ["Crema", "Negro", "Rosa"], images: [u("photo-1583391733956-6c78276477e2")] },
  { name: "Corpiño Soft Abrazo", category: "corpinos", description: "Corpiño sin aro con taza suave y espalda ancha. Sostén cómodo para todos los días.", price: 14900, sizes: ["85", "90", "95", "100"], colors: ["Crema", "Negro"], images: [u("photo-1596755094514-f87e34085b2c")], isNew: true },
  { name: "Remera Deportiva Aire", category: "remeras", description: "Remera de corte holgado en tela liviana que no retiene olores. Para entrenar fresca.", price: 13900, sizes: ["S", "M", "L", "XL"], colors: ["Arena", "Oliva"], images: [u("photo-1518459031867-a89b944bffe4")] },
  { name: "Short Deportivo Ritmo", category: "shorts", description: "Short con calza interior y cintura elástica. Bolsillo trasero con cierre.", price: 14500, sizes: ["S", "M", "L"], colors: ["Negro", "Oliva"], images: [u("photo-1571019614242-c5c5dee9f50b")] },
  { name: "Pijama Corto Siesta", category: "pijamas", description: "Pijama de musculosa y short en algodón peinado. Suavecito para dormir fresca.", price: 19900, compareAtPrice: 22900, sizes: ["S", "M", "L", "XL"], colors: ["Rosa", "Crema"], images: [u("photo-1583391733956-6c78276477e2")] },
  { name: "Top Entrenamiento Fuerza", category: "tops", description: "Top de alta sujeción con cierre frontal. Para running y entrenamientos intensos.", price: 19500, sizes: ["S", "M", "L", "XL"], colors: ["Negro"], images: [u("photo-1506629082955-511b1aa562c8")] },
  { name: "Conjunto Deportivo Amanecer", category: "tops", description: "Top y calza combinados. Un conjunto en borrador para que pruebes el flujo de publicación.", price: 36900, sizes: ["S", "M", "L"], colors: ["Terracota"], images: [], status: "DRAFT" },
];

async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@amora.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "cambiame123";
  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN", passwordHash },
    create: { email, name: process.env.ADMIN_NAME || "Dueña AMORA", role: "ADMIN", passwordHash },
  });
  console.log(`✔ Admin: ${admin.email} (contraseña: ${password})`);

  // Categorías
  const tree: Record<string, string[]> = {
    "Ropa íntima": ["Conjuntos", "Corpiños", "Bombachas", "Pijamas"],
    "Ropa deportiva": ["Calzas", "Tops", "Remeras", "Shorts"],
  };
  const categoryIdBySlug = new Map<string, string>();
  let rootPos = 0;
  for (const [rootName, children] of Object.entries(tree)) {
    const root = await prisma.category.upsert({
      where: { slug: slugify(rootName) },
      update: { name: rootName, position: rootPos },
      create: { name: rootName, slug: slugify(rootName), position: rootPos },
    });
    rootPos++;
    for (let i = 0; i < children.length; i++) {
      const child = await prisma.category.upsert({
        where: { slug: slugify(children[i]) },
        update: { name: children[i], parentId: root.id, position: i },
        create: { name: children[i], slug: slugify(children[i]), parentId: root.id, position: i },
      });
      categoryIdBySlug.set(child.slug, child.id);
    }
  }
  console.log("✔ Categorías");

  // Productos
  for (const p of PRODUCTS) {
    const slug = slugify(p.name);
    const categoryId = categoryIdBySlug.get(p.category);
    if (!categoryId) throw new Error(`Categoría no encontrada: ${p.category}`);

    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) continue;

    await prisma.product.create({
      data: {
        name: p.name,
        slug,
        description: p.description,
        categoryId,
        status: p.status ?? "ACTIVE",
        price: p.price,
        compareAtPrice: p.compareAtPrice ?? null,
        isFeatured: p.isFeatured ?? false,
        isNew: p.isNew ?? false,
        images: { create: p.images.map((url, i) => ({ url, alt: p.name, position: i, isMain: i === 0 })) },
        variants: {
          create: p.sizes.flatMap((size) =>
            p.colors.map((color) => ({
              size,
              color,
              colorHex: COLORS[color] ?? null,
              sku: sku(p.name, size, color),
              stock: Math.floor(Math.random() * 8), // algunos quedan en 0 o poco stock a propósito
            })),
          ),
        },
      },
    });
  }
  console.log(`✔ ${PRODUCTS.length} productos de ejemplo`);

  // Pedidos de ejemplo (solo si no hay ninguno)
  if ((await prisma.order.count()) === 0) {
    const variants = await prisma.productVariant.findMany({ take: 6, include: { product: { include: { images: true } } } });
    const mk = (v: (typeof variants)[number], quantity: number) => ({
      productId: v.productId,
      variantId: v.id,
      productName: v.product.name,
      productSlug: v.product.slug,
      variantLabel: `Talle ${v.size} · ${v.color}`,
      sku: v.sku,
      imageUrl: v.product.images[0]?.url ?? null,
      unitPrice: v.product.price,
      quantity,
      lineTotal: Number(v.product.price) * quantity,
    });

    const items1 = [mk(variants[0], 1), mk(variants[1], 2)];
    const sub1 = items1.reduce((a, i) => a + i.lineTotal, 0);
    await prisma.order.create({
      data: {
        status: "PENDIENTE_ACUERDO",
        paymentMethod: "ACORDAR_CON_VENDEDOR",
        contactName: "Carla Pereyra",
        contactPhone: "11 5555 1234",
        contactEmail: "carla@ejemplo.com",
        shippingZone: "Villa Urquiza, CABA",
        notes: "¿Puede ser entrega el sábado a la tarde?",
        subtotal: sub1,
        total: sub1,
        shippingCost: null,
        items: { create: items1 },
      },
    });

    const items2 = [mk(variants[2], 1)];
    const sub2 = items2.reduce((a, i) => a + i.lineTotal, 0);
    await prisma.order.create({
      data: {
        status: "PAGADO",
        paymentMethod: "MERCADO_PAGO",
        contactName: "Mariana López",
        contactPhone: "11 4444 9876",
        contactEmail: "mariana@ejemplo.com",
        shippingStreet: "Av. Cabildo 1234, 5º B",
        shippingCity: "CABA",
        shippingProvince: "Buenos Aires",
        shippingZip: "1426",
        subtotal: sub2,
        shippingCost: 4500,
        total: sub2 + 4500,
        paidAt: new Date(),
        items: { create: items2 },
        payment: { create: { status: "APPROVED", amount: sub2 + 4500, mpPaymentId: "1234567890", approvedAt: new Date() } },
      },
    });

    const items3 = [mk(variants[3], 1), mk(variants[4], 1)];
    const sub3 = items3.reduce((a, i) => a + i.lineTotal, 0);
    await prisma.order.create({
      data: {
        status: "ENVIADO",
        paymentMethod: "ACORDAR_CON_VENDEDOR",
        contactName: "Sofía Giménez",
        contactPhone: "351 555 7788",
        contactEmail: "sofia@ejemplo.com",
        shippingZone: "Córdoba capital",
        subtotal: sub3,
        shippingCost: 6000,
        total: sub3 + 6000,
        paidAt: new Date(Date.now() - 2 * 86400000),
        items: { create: items3 },
      },
    });
    console.log("✔ 3 pedidos de ejemplo");
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
