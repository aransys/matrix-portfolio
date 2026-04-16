import type { ThemeKey } from "../config/themes";
import { MatrixRain2D } from "./MatrixRain2D";

export interface MatrixRainProps {
  theme: ThemeKey;
}

/** Full-viewport 2D canvas rain (see 2D-CINEMA-GUIDE.md). */
export function MatrixRain({ theme }: MatrixRainProps) {
  return <MatrixRain2D theme={theme} />;
}
