import type { CSSProperties } from "react";
import type { Theme } from "../config/themes";

/** Translucent dark card used inside most sections. */
export function cardStyle(theme: Theme): CSSProperties {
  return {
    background: "rgba(0,0,0,0.75)",
    border: `1px solid ${theme.darkDim}`,
    borderRadius: 8,
    padding: 32,
    backdropFilter: "blur(8px)",
  };
}
