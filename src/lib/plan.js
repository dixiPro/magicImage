/**
 * Everything that comes from the props: formats, the stencil proportion and
 * the crop modes. No Vue here and no canvas — plain functions over plain data,
 * which is what makes this file the one worth testing.
 */

// short names outside, mime types inside
const FORMATS = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};

/** The mime type of a short name, or null when the name is not one of ours. */
export function mimeOf(format) {
  return FORMATS[String(format).toLowerCase()] ?? null;
}

/** The extension of a short name: jpeg and jpg both end up as jpg. */
export function extensionOf(format) {
  const name = String(format).toLowerCase();

  return name === 'jpeg' ? 'jpg' : name;
}

/** Quality is 1-100 outside and 0-1 inside; png ignores it completely. */
export function qualityOf(value) {
  return Math.min(1, Math.max(0.01, value / 100));
}

/** 1, 1.5 or 16/9 — all three are the same thing. Anything else is nothing. */
export function parseRatio(value) {
  const text = String(value ?? '').trim();

  if (!text) return null;

  const [left, right] = text.split('/');
  const ratio = right === undefined ? Number(left) : Number(left) / Number(right);

  return Number.isFinite(ratio) && ratio > 0 ? ratio : null;
}

/**
 * Brings the props to one shape: the mode, the stencil proportion and the
 * required width with its height. Whatever the owner wrote, `fixed` and `min`
 * end up as «proportion plus X»; what cannot be brought to that is an error,
 * and an error leaves the component without buttons.
 *
 * Returns { mode, ratio, width, height } or { error: 'badParams' }.
 */
export function cropPlan(props) {
  const mode = props.cropMode ?? 'any';

  if (!['any', 'fixed', 'min'].includes(mode)) return { error: 'badParams' };
  if (!mimeOf(props.outputFormat ?? 'png') || !mimeOf(props.clipboardFormat ?? 'png')) {
    return { error: 'badParams' };
  }

  const ratio = parseRatio(props.cropRatio);

  // any: the size is nobody's business, the proportion is optional
  if (mode === 'any') return { mode, ratio, width: 0, height: 0 };

  const x = props.cropX > 0 ? Math.round(props.cropX) : 0;
  const y = props.cropY > 0 ? Math.round(props.cropY) : 0;

  // no proportion: it comes from both sides, and y is spent doing that
  if (!ratio) {
    if (!x || !y) return { error: 'badParams' };

    return { mode, ratio: x / y, width: x, height: y };
  }

  // the proportion is there: x leads, and when it is missing y gives it
  const width = x || (y ? Math.round(y * ratio) : 0);

  if (!width) return { error: 'badParams' };

  return { mode, ratio, width, height: Math.max(1, Math.round(width / ratio)) };
}
