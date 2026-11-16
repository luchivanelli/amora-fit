import { Badge } from "@/components/ui/badge";
import { PRODUCT_DISPLAY_LABELS, type ProductDisplayStatus } from "@/lib/labels";

const tone: Record<ProductDisplayStatus, "success" | "neutral" | "warning" | "danger"> = {
  publicado: "success",
  borrador: "neutral",
  "sin-stock": "warning",
  archivado: "danger",
};

export function ProductStatusBadge({ status }: { status: ProductDisplayStatus }) {
  return <Badge tone={tone[status]}>{PRODUCT_DISPLAY_LABELS[status]}</Badge>;
}
