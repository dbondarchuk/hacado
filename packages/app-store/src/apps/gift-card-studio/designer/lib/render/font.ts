import allFonts from "@hacado/types/fonts";

const knownFonts = allFonts.items.reduce(
  (acc, font) => {
    acc[font.family] = font;
    return acc;
  },
  {} as Record<string, (typeof allFonts.items)[number]>,
);

const GOOGLE_FONTS_BASE = "https://fonts.googleapis.com/css2";

/** In-memory cache: key = `${fontFamily}-${weight}` -> SatoriFont descriptor. */
let _fontCache: Map<string, SatoriFont>;

const _getFontCache = () => {
  if (process.env.NODE_ENV === "development") {
    let globalWithMongo = global as typeof globalThis & {
      _fontCache?: Map<string, SatoriFont>;
    };

    if (!globalWithMongo._fontCache) {
      globalWithMongo._fontCache = new Map<string, SatoriFont>();
    }
    _fontCache = globalWithMongo._fontCache;
  } else {
    // In production mode, it's best to not use a global variable.
    _fontCache = new Map<string, SatoriFont>();
  }
};

const getFontCache = () => {
  if (!_fontCache) {
    _getFontCache();
  }
  return _fontCache;
};

export interface SatoriFont {
  name: string;
  data: ArrayBuffer;
  weight: number;
  style: "normal" | "italic";
}

function cacheKey(font: string, weight: number): string {
  return `${font}-${weight}`;
}

/**
 * Load a single Google Font (one weight) and return raw font data.
 * Uses in-memory cache; repeated calls for the same family+weight return cached data.
 * @param fontFamily - e.g. "Inter"
 * @param weight - e.g. 400 or 700
 */
async function loadGoogleFont(
  font: string,
  weight: number = 400,
): Promise<SatoriFont> {
  const key = cacheKey(font, weight);
  const fontCache = getFontCache();
  const cached = fontCache.get(key);
  if (cached) return cached;

  // const familyParam = encodeURIComponent(`${font}:wght@${weight}`);
  // const url = `${GOOGLE_FONTS_BASE}?family=${familyParam}&display=swap`;
  // const css = await (await fetch(url)).text();
  // const resource = css.match(
  //   /src: url\((.+)\) format\('(opentype|truetype)'\)/,
  // );

  const fontData = knownFonts[font];
  if (!fontData) {
    throw new Error(`font ${font} not found`);
  }

  let weightKey = weight.toString();
  if (weight === 400) {
    weightKey = "regular";
  }

  const file =
    fontData.files[weightKey as keyof typeof fontData.files] ??
    fontData.files.regular;

  if (!file) {
    throw new Error(`font ${font} file for weight ${weightKey} not found`);
  }

  const data = await fetch(file);
  if (data.status !== 200) {
    throw new Error(`failed to load font data: ${font} weight ${weightKey}`);
  }

  const arrayBuffer = await data.arrayBuffer();
  const descriptor: SatoriFont = {
    name: font,
    data: arrayBuffer,
    weight,
    style: "normal",
  };

  fontCache.set(key, descriptor);
  return descriptor;
}

/**
 * Load a font for use with satori. Returns one descriptor per weight.
 * Results are cached in memory by family+weight.
 */
export async function loadGoogleFontForSatori(
  fontFamily: string,
  weights: number[] = [400, 700],
): Promise<SatoriFont[]> {
  const result: SatoriFont[] = [];
  for (const w of weights) {
    const satoriFont = await loadGoogleFont(fontFamily, w);
    result.push(satoriFont);
  }
  return result;
}
