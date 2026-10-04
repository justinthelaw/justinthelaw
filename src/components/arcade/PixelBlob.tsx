import type { BlobVariant } from "@/types";
import { cn } from "@/lib/utils";
import styles from "./PixelBlob.module.css";

interface PixelBlobProps {
  variant?: BlobVariant;
  className?: string;
  decorative?: boolean;
}

interface Palette {
  edge: string;
  dark: string;
  main: string;
  light: string;
  shine: string;
  blush: string;
}

type PixelRect = readonly [x: number, y: number, width: number, height: number, color: string];

interface Sprite {
  label: string;
  pixels: readonly PixelRect[];
}

function bodyPixels(rows: readonly (readonly [number, number])[], start: number, palette: Palette): PixelRect[] {
  const occupied = new Set(rows.flatMap(([left, right], row) =>
    Array.from({ length: right - left + 1 }, (_, column) => `${left + column},${start + row}`),
  ));
  const pixels: PixelRect[] = [];
  rows.forEach(([left, right], row) => {
    const y = start + row;
    for (let x = left; x <= right; x += 1) {
      const edge = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]
        .some(([neighborX, neighborY]) => !occupied.has(`${neighborX},${neighborY}`));
      const color = edge ? palette.edge
        : y > 23 || x > 23 ? palette.dark
        : x < 11 && y < 21 ? palette.light
        : (x * 5 + y * 7) % 29 === 0 && y < 24 && x < 24 ? palette.light
        : palette.main;
      // Merge adjacent pixels of the same color into crisp horizontal runs.
      const previous = pixels.at(-1);
      if (previous && previous[1] === y && previous[4] === color && previous[0] + previous[2] === x) {
        pixels[pixels.length - 1] = [previous[0], y, previous[2] + 1, 1, color];
      } else {
        pixels.push([x, y, 1, 1, color]);
      }
    }
  });
  return pixels;
}

const blue: Palette = {
  edge: "#2d4867", dark: "#4c7fa7", main: "#78add2",
  light: "#acd6e7", shine: "#d9eef2", blush: "#d9a89f",
};
const lavender: Palette = {
  edge: "#504263", dark: "#826ba0", main: "#b09bc9",
  light: "#d2bfdc", shine: "#e9dcef", blush: "#dba9b5",
};
const apricot: Palette = {
  edge: "#705340", dark: "#b4835d", main: "#dbad7d",
  light: "#edcda2", shine: "#f7e4c2", blush: "#d28879",
};

// Original 32-pixel characters: different silhouettes, faces, and little details.
const SPRITES: Record<BlobVariant, Sprite> = {
  blue: {
    label: "Blue pixel blob with a tiny antenna and rosy cheeks",
    pixels: [
      ...bodyPixels([
        [14, 18], [12, 20], [11, 21], [10, 22], [9, 23], [8, 24],
        [7, 25], [6, 26], [5, 27], [5, 27], [5, 27], [5, 27],
        [6, 26], [6, 26], [7, 25], [8, 24], [10, 22], [12, 20],
      ], 10, blue),
      [15, 7, 2, 3, blue.dark], [16, 6, 3, 2, blue.main], [18, 5, 2, 2, blue.light],
      [11, 26, 4, 3, blue.edge], [12, 26, 3, 2, blue.dark],
      [19, 26, 4, 3, blue.edge], [19, 26, 3, 2, blue.dark],
      [10, 18, 2, 4, "#334549"], [19, 17, 2, 4, "#334549"],
      [10, 18, 1, 1, blue.shine], [19, 17, 1, 1, blue.shine],
      [8, 22, 3, 1, blue.blush], [21, 21, 3, 1, blue.blush],
      [14, 22, 3, 1, blue.edge], [15, 23, 1, 1, blue.edge], [11, 13, 2, 1, blue.shine],
    ],
  },
  lavender: {
    label: "Lavender pixel blob with a little curl and curious eyes",
    pixels: [
      ...bodyPixels([
        [10, 20], [7, 23], [6, 25], [5, 26], [4, 27], [4, 27],
        [4, 27], [4, 27], [4, 28], [5, 29], [5, 29], [6, 28],
        [7, 27], [8, 25], [10, 22], [12, 20],
      ], 12, lavender),
      [12, 10, 2, 3, lavender.edge], [13, 9, 4, 2, lavender.dark],
      [16, 8, 3, 2, lavender.edge], [17, 8, 1, 1, lavender.light],
      [9, 17, 4, 4, "#f3e8e8"], [19, 18, 4, 4, "#f3e8e8"],
      [11, 18, 2, 3, "#483f58"], [19, 19, 2, 3, "#483f58"],
      [7, 22, 3, 1, lavender.blush], [22, 23, 3, 1, lavender.blush],
      [15, 23, 2, 1, lavender.edge], [10, 14, 3, 1, lavender.shine], [6, 17, 1, 2, lavender.shine],
    ],
  },
  apricot: {
    label: "Apricot pixel blob with a sleepy face and tiny feet",
    pixels: [
      ...bodyPixels([
        [11, 21], [9, 23], [8, 24], [7, 25], [7, 25], [6, 26],
        [6, 26], [6, 26], [6, 26], [6, 26], [6, 26], [6, 26],
        [7, 25], [7, 25], [8, 24], [9, 23], [10, 22], [12, 20],
      ], 10, apricot),
      [8, 26, 4, 3, apricot.edge], [9, 26, 3, 2, apricot.dark],
      [20, 26, 4, 3, apricot.edge], [20, 26, 3, 2, apricot.dark],
      [10, 19, 3, 1, "#60483c"], [19, 19, 3, 1, "#60483c"],
      [12, 18, 1, 1, "#60483c"], [19, 18, 1, 1, "#60483c"],
      [9, 22, 3, 1, apricot.blush], [21, 22, 3, 1, apricot.blush],
      [15, 23, 3, 1, "#805943"], [10, 13, 3, 1, apricot.shine],
      [8, 15, 1, 3, apricot.light], [16, 12, 2, 1, apricot.light], [20, 14, 1, 1, apricot.light],
    ],
  },
};

export function PixelBlob({ variant = "blue", className, decorative = false }: PixelBlobProps): React.ReactElement {
  const sprite = SPRITES[variant];
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("size-32", styles.sprite, styles[variant], className)}
      shapeRendering="crispEdges"
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : sprite.label}
      aria-hidden={decorative || undefined}
      focusable="false"
    >
      <path className={styles.shadow} d="M10 29h12v1h2v1H8v-1h2z" fill="#000000" />
      <g className={styles.body} data-testid="pixel-blob-body">
        {sprite.pixels.map(([x, y, width, height, color]) => (
          <rect key={`${x}-${y}-${width}-${height}-${color}`} x={x} y={y} width={width} height={height} fill={color} />
        ))}
      </g>
    </svg>
  );
}
