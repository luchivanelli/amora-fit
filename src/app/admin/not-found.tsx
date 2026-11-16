import { SearchX } from "lucide-react";
import { LinkButton } from "@/components/ui/button";

export default function AdminNotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-sand text-ink-soft">
        <SearchX className="size-7" aria-hidden />
      </span>
      <h1 className="text-3xl font-medium">No encontramos eso</h1>
      <p className="max-w-sm text-[15px] text-ink-soft">Puede que lo hayas eliminado o que el link esté mal escrito.</p>
      <LinkButton href="/admin/productos" variant="secondary">
        Ir a Productos
      </LinkButton>
    </div>
  );
}
