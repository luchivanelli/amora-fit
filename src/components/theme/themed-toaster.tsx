"use client";

import { Toaster } from "sonner";
import { useTheme } from "@/components/theme/theme-provider";

/** Toaster de sonner que sigue al modo claro/oscuro de la app. */
export function ThemedToaster({ duration }: { duration?: number }) {
  const { resolved } = useTheme();
  return (
    <Toaster
      theme={resolved}
      position="top-center"
      richColors
      closeButton
      toastOptions={{ style: { fontSize: "15px", borderRadius: "1rem" }, duration }}
    />
  );
}
