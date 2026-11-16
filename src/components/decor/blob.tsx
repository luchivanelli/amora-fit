import { cn } from "@/lib/utils";

type Tone = "brand" | "blush" | "sand" | "info";

const fills: Record<Tone, string> = {
  brand: "fill-brand-200",
  blush: "fill-blush-soft",
  sand: "fill-sand",
  info: "fill-info-soft",
};

const SHAPES = [
  "M44.9,-57.7C57.6,-49.2,66.8,-34.7,70.4,-18.9C74,-3.1,72,14,64.7,27.9C57.4,41.8,44.8,52.6,30.8,59.6C16.8,66.6,1.4,69.8,-13.9,67.3C-29.2,64.8,-44.3,56.6,-55.1,44.4C-65.9,32.2,-72.4,16.1,-72,0.2C-71.6,-15.7,-65.3,-31.4,-54.5,-40.4C-43.7,-49.4,-28.4,-51.7,-14.2,-58.8C0,-65.9,13.2,-77.8,27.6,-75.5C42,-73.2,57.6,-66.2,44.9,-57.7Z",
  "M39.6,-52.3C51.4,-44.5,61,-33.1,66.5,-19.3C72,-5.5,73.4,10.7,67.9,24.2C62.4,37.7,50,48.5,36.5,56.4C23,64.3,8.4,69.3,-6.3,68.1C-21,66.9,-35.8,59.5,-47.1,48.6C-58.4,37.7,-66.2,23.3,-68.7,7.6C-71.2,-8.1,-68.4,-25.1,-59.4,-37.3C-50.4,-49.5,-35.2,-56.9,-20.8,-63.2C-6.4,-69.5,7.2,-74.7,20.4,-71.7C33.6,-68.7,27.8,-60.1,39.6,-52.3Z",
  "M35.2,-47.4C46.3,-40.5,56.3,-30.7,61.9,-18.3C67.5,-5.9,68.7,9.1,63.6,21.7C58.5,34.3,47.1,44.5,34.5,52.1C21.9,59.7,8.1,64.7,-5.4,64.4C-18.9,64.1,-32.1,58.5,-43.1,49.6C-54.1,40.7,-62.9,28.5,-66.5,14.5C-70.1,0.5,-68.5,-15.3,-61.3,-27.6C-54.1,-39.9,-41.3,-48.7,-28.5,-55C-15.7,-61.3,-2.9,-65.1,8.2,-64.5C19.3,-63.9,24.1,-54.3,35.2,-47.4Z",
];

type Props = {
  tone?: Tone;
  shape?: 0 | 1 | 2;
  blur?: boolean;
  float?: boolean;
  className?: string;
} & Record<`data-${string}`, string | undefined>;

/**
 * Mancha orgánica decorativa. Va absoluta dentro de un contenedor `relative`.
 * `blur` la difumina (fondo suave); sin blur sirve como "pegatina" o marco.
 * Acepta atributos data-* para que GSAP la pueda animar.
 */
export function Blob({ tone = "brand", shape = 0, blur = false, float = false, className, ...rest }: Props) {
  return (
    <svg
      viewBox="-100 -100 200 200"
      aria-hidden
      className={cn("pointer-events-none absolute", fills[tone], blur && "blur-3xl", float && "animate-float-slow", className)}
      {...rest}
    >
      <path d={SHAPES[shape]} transform="scale(1.35)" />
    </svg>
  );
}
