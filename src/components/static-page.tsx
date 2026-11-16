export function StaticPage({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-4xl font-medium sm:text-5xl">{title}</h1>
      {intro && <p className="mt-3 text-lg text-ink-soft">{intro}</p>}
      <div className="prose-amora mt-10 flex flex-col gap-6 text-[15px] leading-relaxed text-ink-soft [&_h2]:mt-4 [&_h2]:font-sans [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-ink [&_a]:text-brand-700 [&_a]:underline-offset-4 hover:[&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mt-1">
        {children}
      </div>
    </article>
  );
}
