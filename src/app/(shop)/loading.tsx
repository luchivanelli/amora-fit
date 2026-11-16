export default function ShopLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8" aria-busy aria-label="Cargando">
      <div className="skeleton h-4 w-24 rounded-full" />
      <div className="skeleton mt-3 h-12 w-72 rounded-2xl" />
      <div className="skeleton mt-3 h-5 w-96 max-w-full rounded-full" />
      <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <div className="skeleton aspect-[4/5] rounded-3xl" />
            <div className="skeleton mt-3.5 h-3 w-16 rounded-full" />
            <div className="skeleton mt-2 h-5 w-3/4 rounded-full" />
            <div className="skeleton mt-2 h-4 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
