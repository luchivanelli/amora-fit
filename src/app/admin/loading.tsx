export default function AdminLoading() {
  return (
    <div className="animate-pulse" aria-busy aria-label="Cargando">
      <div className="h-10 w-56 rounded-xl bg-sand" />
      <div className="mt-2 h-4 w-40 rounded bg-sand/70" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-36 rounded-2xl bg-surface ring-1 ring-sand-dark/50" />
        ))}
      </div>
      <div className="mt-6 flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-surface ring-1 ring-sand-dark/50" />
        ))}
      </div>
    </div>
  );
}
