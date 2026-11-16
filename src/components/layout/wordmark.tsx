import Link from "next/link";
import { cn } from "@/lib/utils";

/** Logotipo "AMORA" con un punto rosa. Si no se pasa `href`, se renderiza como texto. */
export function Wordmark({ href = "/", className, size = "md" }: { href?: string | null; className?: string; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "text-2xl", md: "text-3xl", lg: "text-4xl" }[size];
  const inner = (
    <span className={cn("inline-flex items-baseline font-display font-semibold tracking-[0.22em] text-brand-700", sizes, className)}>
      AMORA
      <span aria-hidden className="ml-0.5 inline-block size-[0.28em] -translate-y-[0.08em] rounded-full bg-blush" />
    </span>
  );
  if (!href) return inner;
  return (
    <Link href={href} aria-label="AMORA, ir al inicio" className="group/logo inline-flex items-center">
      {inner}
    </Link>
  );
}
