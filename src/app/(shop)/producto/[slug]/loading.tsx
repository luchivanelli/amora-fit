export default function ProductLoading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-4 py-8 sm:px-6 lg:px-8" aria-busy aria-label="Cargando producto">
      <div className="mb-6 h-4 w-48 rounded bg-sand/70" />
      <div className="grid gap-10 md:grid-cols-2 lg:gap-16">
        <div className="aspect-[4/5] rounded-3xl bg-sand" />
        <div className="flex flex-col gap-6">
          <div className="h-3 w-20 rounded bg-sand/70" />
          <div className="h-12 w-3/4 rounded-xl bg-sand" />
          <div className="h-8 w-32 rounded-lg bg-sand" />
          <div className="h-4 w-full rounded bg-sand/70" />
          <div className="h-4 w-5/6 rounded bg-sand/70" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="size-12 rounded-full bg-sand" />
            ))}
          </div>
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="size-12 rounded-full bg-sand/70" />
            ))}
          </div>
          <div className="h-14 w-full rounded-xl bg-sand" />
        </div>
      </div>
    </div>
  );
}
