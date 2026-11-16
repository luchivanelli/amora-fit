import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getProductForForm } from "@/server/queries/admin/products";
import { getCategoryOptions } from "@/server/queries/admin/categories";
import { ProductForm } from "@/components/admin/products/form/product-form";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductForForm(id);
  return { title: product?.name || "Nuevo producto" };
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const [product, categories] = await Promise.all([getProductForForm(id), getCategoryOptions()]);
  if (!product) notFound();
  if (product.isArchived) redirect("/admin/productos?estado=archivados");

  return <ProductForm key={product.id} product={product} categories={categories} />;
}
