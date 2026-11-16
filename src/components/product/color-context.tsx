"use client";

import { createContext, useContext, useState } from "react";

type Ctx = { color: string | null; setColor: (color: string | null) => void };

const SelectedColorContext = createContext<Ctx>({ color: null, setColor: () => {} });

/** Color elegido en la página de producto: lo comparten el selector de variantes y la galería. */
export function SelectedColorProvider({ initial = null, children }: { initial?: string | null; children: React.ReactNode }) {
  const [color, setColor] = useState<string | null>(initial);
  return <SelectedColorContext.Provider value={{ color, setColor }}>{children}</SelectedColorContext.Provider>;
}

export const useSelectedColor = () => useContext(SelectedColorContext);
