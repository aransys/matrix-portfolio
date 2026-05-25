/**
 * @deprecated The standalone 2D canvas rain has been folded into
 * `MatrixRain.tsx`, which now picks WebGL first and falls back to a
 * richer 2D implementation. This file remains as a thin re-export so
 * any older imports keep compiling — remove on the next pass.
 */
export { MatrixRain as MatrixRain2D } from "./MatrixRain";
export type { MatrixRainProps as MatrixRain2DProps } from "./MatrixRain";
