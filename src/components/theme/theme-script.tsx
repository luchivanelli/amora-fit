export const THEME_STORAGE_KEY = "amora-theme";

/**
 * Se ejecuta antes del primer render (inline en <head>) para aplicar la clase
 * .dark sin parpadeo. Lee la preferencia guardada o la del sistema.
 */
const script = `(function(){try{var k="${THEME_STORAGE_KEY}";var s=localStorage.getItem(k);var d=s==="dark"||(s!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var h=document.documentElement;h.classList.toggle("dark",d);h.style.colorScheme=d?"dark":"light";}catch(e){}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
