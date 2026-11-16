export default function CatalogLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8" aria-busy aria-label="Cargando productos">
      <div className="skeleton h-4 w-20 rounded-full" />
      <div className="skeleton mt-3 h-14 w-80 max-w-full rounded-2xl" />
      <div className="mt-8 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-10 w-28 rounded-full" />
        ))}
      </div>
      <div className="mt-8 flex items-center justify-between">
        <div className="skeleton h-5 w-24 rounded-full" />
        <div className="skeleton h-10 w-44 rounded-full" />
      </div>
      <div className="mt-6 lg:grid lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-10">
        <div className="skeleton hidden h-[32rem] rounded-3xl lg:block" />
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i}>
              <div className="skeleton aspect-[4/5] rounded-3xl" />
              <div className="skeleton mt-3.5 h-3 w-16 rounded-full" />
              <div className="skeleton mt-2 h-5 w-3/4 rounded-full" />
              <div className="skeleton mt-2 h-4 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
