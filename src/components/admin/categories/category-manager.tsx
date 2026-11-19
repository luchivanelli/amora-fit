"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GripVertical, Pencil, Plus, Trash2, Check, X, Tags } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import type { CategoryNode } from "@/server/queries/admin/categories";
import { createCategory, deleteCategory, renameCategory, reorderCategories } from "@/server/actions/admin/categories";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { inputClass } from "@/components/ui/field";

export function CategoryManager({ tree: initial }: { tree: CategoryNode[] }) {
  const router = useRouter();
  const [tree, setTree] = useState(initial);
  const [adding, setAdding] = useState<string | null | false>(false); // null = raíz, string = parentId
  const [toDelete, setToDelete] = useState<CategoryNode | null>(null);
  const [pending, start] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const persistOrder = (parentId: string | null, orderedIds: string[], previous: CategoryNode[]) => {
    void reorderCategories({ parentId, orderedIds }).then((res) => {
      if (!res.ok) {
        setTree(previous);
        toast.error(res.error);
      }
    });
  };

  const onRootDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = tree.findIndex((c) => c.id === active.id);
    const to = tree.findIndex((c) => c.id === over.id);
    const next = arrayMove(tree, from, to);
    const previous = tree;
    setTree(next);
    persistOrder(null, next.map((c) => c.id), previous);
  };

  const onChildDragEnd = (parentId: string) => (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const previous = tree;
    const next = tree.map((root) => {
      if (root.id !== parentId) return root;
      const from = root.children.findIndex((c) => c.id === active.id);
      const to = root.children.findIndex((c) => c.id === over.id);
      return { ...root, children: arrayMove(root.children, from, to) };
    });
    setTree(next);
    const ordered = next.find((r) => r.id === parentId)?.children.map((c) => c.id) ?? [];
    persistOrder(parentId, ordered, previous);
  };

  const rename = (id: string, name: string) =>
    start(async () => {
      const res = await renameCategory({ id, name });
      if (!res.ok) { toast.error(res.error); return; }
      toast.success("Nombre actualizado.");
      router.refresh();
    });

  const create = (name: string, parentId: string | null) =>
    start(async () => {
      const res = await createCategory({ name, parentId });
      if (!res.ok) { toast.error(res.error); return; }
      toast.success(parentId ? "Subcategoría creada." : "Categoría creada.");
      setAdding(false);
      router.refresh();
    });

  const remove = () => {
    if (!toDelete) return;
    start(async () => {
      const res = await deleteCategory(toDelete.id);
      setToDelete(null);
      if (!res.ok) { toast.error(res.error); return; }
      toast.success("Categoría eliminada.");
      router.refresh();
    });
  };

  // Sincronizar con lo que devuelve el servidor después de cada refresh.
  useEffect(() => {
    setTree(initial);
  }, [initial]);

  return (
    <div className="flex flex-col gap-4">
      {tree.length === 0 && adding === false ? (
        <EmptyState
          icon={<Tags className="size-7" />}
          title="Todavía no hay categorías"
          description="Creá las principales (por ejemplo, Ropa íntima y Ropa deportiva) y después agregá subcategorías."
          action={
            <Button onClick={() => setAdding(null)} size="lg">
              <Plus className="size-5" aria-hidden /> Crear categoría
            </Button>
          }
        />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onRootDragEnd}>
          <SortableContext items={tree.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col gap-3">
              {tree.map((root) => (
                <SortableRow key={root.id} id={root.id}>
                  {(handle) => (
                    <div className="rounded-2xl border border-sand-dark/70 bg-surface">
                      <CategoryLine node={root} handle={handle} onRename={rename} onDelete={() => setToDelete(root)} isRoot />
                      <div className="border-t border-sand px-3 pb-3 pt-2 sm:pl-12">
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onChildDragEnd(root.id)}>
                          <SortableContext items={root.children.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                            <ul className="flex flex-col">
                              {root.children.map((child) => (
                                <SortableRow key={child.id} id={child.id}>
                                  {(h) => <CategoryLine node={child} handle={h} onRename={rename} onDelete={() => setToDelete(child)} />}
                                </SortableRow>
                              ))}
                            </ul>
                          </SortableContext>
                        </DndContext>
                        {adding === root.id ? (
                          <InlineCreate placeholder="Nombre de la subcategoría" onCancel={() => setAdding(false)} onSubmit={(n) => create(n, root.id)} loading={pending} />
                        ) : (
                          <button type="button" onClick={() => setAdding(root.id)} className="mt-1 inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-[15px] font-medium text-brand-700 hover:bg-brand-50">
                            <Plus className="size-4" aria-hidden /> Agregar subcategoría
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </SortableRow>
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {adding === null ? (
        <div className="rounded-2xl border border-sand-dark/70 bg-surface p-4">
          <InlineCreate placeholder="Nombre de la categoría (ej: Ropa deportiva)" onCancel={() => setAdding(false)} onSubmit={(n) => create(n, null)} loading={pending} autoFocus />
        </div>
      ) : (
        tree.length > 0 && (
          <Button variant="secondary" onClick={() => setAdding(null)} className="self-start">
            <Plus className="size-5" aria-hidden /> Agregar categoría principal
          </Button>
        )
      )}

      <ConfirmDialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={remove}
        title={`¿Eliminar “${toDelete?.name}”?`}
        description={
          toDelete && toDelete.productCount > 0
            ? `Tiene ${toDelete.productCount} ${toDelete.productCount === 1 ? "producto" : "productos"}. Primero cambiales la categoría.`
            : "Esta acción no se puede deshacer."
        }
        confirmLabel="Sí, eliminar"
        destructive
        loading={pending}
      />
    </div>
  );
}

function SortableRow({ id, children }: { id: string; children: (handle: React.ReactNode) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const handle = (
    <button
      type="button"
      {...attributes}
      {...listeners}
      className="flex size-10 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-ink-muted hover:bg-sand active:cursor-grabbing"
      aria-label="Arrastrar para reordenar"
    >
      <GripVertical className="size-5" />
    </button>
  );
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn(isDragging && "z-10 opacity-80")}>
      {children(handle)}
    </li>
  );
}

function CategoryLine({
  node,
  handle,
  onRename,
  onDelete,
  isRoot,
}: {
  node: CategoryNode;
  handle: React.ReactNode;
  onRename: (id: string, name: string) => void;
  onDelete: () => void;
  isRoot?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(node.name);

  const submit = () => {
    const clean = name.trim();
    if (clean.length < 2) { toast.error("El nombre tiene que tener al menos 2 letras."); return; }
    if (clean !== node.name) onRename(node.id, clean);
    setEditing(false);
  };

  return (
    <div className={cn("flex items-center gap-2 px-3", isRoot ? "min-h-16" : "min-h-14")}>
      {handle}
      {editing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="flex flex-1 items-center gap-2"
        >
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
            maxLength={60}
            className="h-11 flex-1 rounded-lg border border-brand-400 px-3 text-base"
            aria-label="Nuevo nombre"
          />
          <button type="submit" className="flex size-11 items-center justify-center rounded-lg bg-brand-600 text-white" aria-label="Guardar nombre">
            <Check className="size-5" />
          </button>
          <button type="button" onClick={() => { setEditing(false); setName(node.name); }} className="flex size-11 items-center justify-center rounded-lg text-ink-muted hover:bg-sand" aria-label="Cancelar">
            <X className="size-5" />
          </button>
        </form>
      ) : (
        <>
          <div className="min-w-0 flex-1">
            <p className={cn("truncate", isRoot ? "text-lg font-semibold" : "text-[15px] font-medium")}>{node.name}</p>
            <p className="text-sm text-ink-muted">
              {node.productCount} {node.productCount === 1 ? "producto" : "productos"}
            </p>
          </div>
          <button type="button" onClick={() => setEditing(true)} className="flex size-11 items-center justify-center rounded-lg text-ink-soft hover:bg-sand hover:text-ink" aria-label={`Renombrar ${node.name}`}>
            <Pencil className="size-5" />
          </button>
          <button type="button" onClick={onDelete} className="flex size-11 items-center justify-center rounded-lg text-ink-soft hover:bg-danger-soft hover:text-danger" aria-label={`Eliminar ${node.name}`}>
            <Trash2 className="size-5" />
          </button>
        </>
      )}
    </div>
  );
}

function InlineCreate({
  placeholder,
  onSubmit,
  onCancel,
  loading,
  autoFocus = true,
}: {
  placeholder: string;
  onSubmit: (name: string) => void;
  onCancel: () => void;
  loading?: boolean;
  autoFocus?: boolean;
}) {
  const [name, setName] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim().length < 2) { toast.error("El nombre tiene que tener al menos 2 letras."); return; }
        onSubmit(name.trim());
        setName("");
      }}
      className="mt-2 flex flex-col gap-2 sm:flex-row"
    >
      <input
        autoFocus={autoFocus}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && onCancel()}
        placeholder={placeholder}
        maxLength={60}
        // En celular el form es columna: `flex-1` ahí pone flex-basis 0 y aplasta el alto (h-12),
        // por eso solo se estira en fila (sm:). Mismo estilo que el resto de los campos del panel.
        className={inputClass(false, "min-w-0 shrink-0 sm:flex-1")}
        aria-label={placeholder}
      />
      <div className="flex gap-2">
        <Button type="submit" loading={loading}>
          Crear
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
