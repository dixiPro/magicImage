/**
 * Everything done to the pixels. No Vue either: the settings arrive as
 * arguments, nothing here reads the state of a component.
 */

/**
 * Neutral settings: what «Reset» goes back to and what counts as untouched.
 * `on` is the «Apply» checkbox of the tab: switched off, the settings stay on
 * the sliders but reach neither the preview nor the file.
 */
export const NEUTRAL = {
  light: { on: false, brightness: 1, contrast: 1, saturate: 1 },
  levels: { on: false, black: 0, gamma: 1, white: 255 },
  sharpen: { on: false, amount: 0, radius: 1, threshold: 3 },
};

/** Fresh set of settings for a new picture. */
export function neutralAdjust() {
  return {
    light: { ...NEUTRAL.light },
    levels: { ...NEUTRAL.levels },
    sharpen: { ...NEUTRAL.sharpen },
  };
}

/** The part is switched on and actually changes something. */
export function isTouched(part, values) {
  if (!values.on) return false;
  if (part === 'sharpen') return values.amount > 0;

  return Object.keys(NEUTRAL[part]).some((key) => key !== 'on' && values[key] !== NEUTRAL[part][key]);
}

/** The css filter of the light settings: the browser applies it to the canvas. */
export function lightCss(light) {
  if (!light.on) return 'none';

  return `brightness(${light.brightness}) contrast(${light.contrast}) saturate(${light.saturate})`;
}

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

export function toBlob(canvas, mime, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, mime, quality));
}

/**
 * The working copy. Shrinking to maxPixels measures the area: that is what
 * browsers cap (Safari at about 16.7 Mpx), and a side limit lets a 6000×4000
 * photo through.
 */
export function fitToPixels(image, maxPixels) {
  const pixels = image.naturalWidth * image.naturalHeight;
  const scale = pixels > maxPixels ? Math.sqrt(maxPixels / pixels) : 1;

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

  canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);

  return { canvas, shrunk: scale < 1 };
}

/** Shrinks a canvas down to the given size; it never enlarges. */
export function shrinkTo(source, width, height) {
  if (width >= source.width && height >= source.height) return source;

  const canvas = document.createElement('canvas');

  canvas.width = Math.max(1, width);
  canvas.height = Math.max(1, height);

  const ctx = canvas.getContext('2d');

  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

  return canvas;
}

/** A 256 value table: black point, gamma, white point. */
export function buildLut({ black, gamma, white }) {
  const lut = new Uint8ClampedArray(256);
  const span = Math.max(1, white - black);
  const inverse = 1 / Math.max(0.01, gamma);

  for (let i = 0; i < 256; i++) {
    const value = Math.min(1, Math.max(0, (i - black) / span));
    lut[i] = Math.round(255 * Math.pow(value, inverse));
  }

  return lut;
}

// alpha is left alone: levels tune color, not transparency
export function applyLevels(ctx, w, h, levels) {
  const image = ctx.getImageData(0, 0, w, h);
  const data = image.data;
  const lut = buildLut(levels);

  for (let i = 0; i < data.length; i += 4) {
    data[i] = lut[data[i]];
    data[i + 1] = lut[data[i + 1]];
    data[i + 2] = lut[data[i + 2]];
  }

  ctx.putImageData(image, 0, 0);
}

/** Unsharp mask: the browser blurs the copy, the difference goes back in. */
export function applySharpen(ctx, w, h, { amount, radius, threshold }) {
  if (amount <= 0) return;

  const blurred = document.createElement('canvas');
  blurred.width = w;
  blurred.height = h;

  const blurCtx = blurred.getContext('2d', { willReadFrequently: true });
  blurCtx.filter = `blur(${radius}px)`;
  blurCtx.drawImage(ctx.canvas, 0, 0);

  const image = ctx.getImageData(0, 0, w, h);
  const soft = blurCtx.getImageData(0, 0, w, h).data;
  const data = image.data;
  const force = amount / 100;

  for (let i = 0; i < data.length; i += 4) {
    for (let channel = 0; channel < 3; channel++) {
      const diff = data[i + channel] - soft[i + channel];

      if (diff > -threshold && diff < threshold) continue;

      // Uint8ClampedArray keeps the values inside 0..255 by itself
      data[i + channel] = data[i + channel] + force * diff;
    }
  }

  ctx.putImageData(image, 0, 0);
}

/**
 * Draws the source into the canvas at the given size and puts the pixel work
 * over it: levels and sharpening. The light is a css filter and stays outside —
 * on the preview the browser applies it to the element itself.
 */
export function renderTo(canvas, source, width, height, adjust) {
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(source, 0, 0, width, height);

  if (isTouched('levels', adjust.levels)) applyLevels(ctx, width, height, adjust.levels);

  if (isTouched('sharpen', adjust.sharpen)) applySharpen(ctx, width, height, adjust.sharpen);

  return canvas;
}

/**
 * The working copy with every edit applied, at its full size.
 *
 * The order is the one the eye sees: levels and sharpening over the pixels, and
 * the css filter on top, exactly as the browser puts it over the preview canvas.
 */
export function processed(source, adjust) {
  const canvas = renderTo(document.createElement('canvas'), source, source.width, source.height, adjust);

  if (!isTouched('light', adjust.light)) return canvas;

  const out = document.createElement('canvas');
  out.width = canvas.width;
  out.height = canvas.height;

  const outCtx = out.getContext('2d');
  outCtx.filter = lightCss(adjust.light);
  outCtx.drawImage(canvas, 0, 0);

  return out;
}

/**
 * The histogram is built from the source: it shows what came in, not what came
 * out. The sample only ever shrinks — blowing a narrow picture up to 256 wide
 * costs a canvas the browser may well refuse to allocate.
 */
export function histogram(source) {
  const scale = Math.min(1, 256 / source.width, 256 / source.height);
  const width = Math.max(1, Math.round(source.width * scale));
  const height = Math.max(1, Math.round(source.height * scale));

  const small = document.createElement('canvas');
  small.width = width;
  small.height = height;

  const ctx = small.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(source, 0, 0, width, height);

  const data = ctx.getImageData(0, 0, width, height).data;
  const bins = new Array(256).fill(0);

  for (let i = 0; i < data.length; i += 4) {
    bins[(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) | 0]++;
  }

  return bins;
}
