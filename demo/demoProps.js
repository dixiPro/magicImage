/**
 * What the demo knows about the component: the props it has, what they are
 * worth by default, and the cases worth showing. Not part of the component.
 */

export const BASE = {
  maxPixels: 16000000,
  clipboardFormat: 'png',
  clipboardQuality: 100,
  outputFormat: 'png',
  outputQuality: 100,
  cropMode: 'any',
  cropRatio: '',
  cropX: 0,
  cropY: 0,
};

// prop -> attribute, for the snippet
export const ATTRS = {
  maxPixels: 'max-pixels',
  clipboardFormat: 'clipboard-format',
  clipboardQuality: 'clipboard-quality',
  outputFormat: 'output-format',
  outputQuality: 'output-quality',
  cropMode: 'crop-mode',
  cropRatio: 'crop-ratio',
  cropX: 'crop-x',
  cropY: 'crop-y',
};

// what each mode does, in one line
export const MODES = {
  any: 'any — the size is not checked. Crop as you like; the picture leaves at the size of the stencil.',
  fixed:
    'fixed — the crop always comes back exactly crop-x wide, whatever the stencil was. A picture that cannot give that width is refused.',
  min: 'min — the crop is never narrower than crop-x, but a bigger stencil leaves as it is, without being squeezed.',
};

// the cases the component was made for
export const CASES = [
  {
    key: 'free',
    title: 'Free crop',
    about: 'Crop as you like, any size. The picture leaves at the size of the stencil.',
    params: {},
  },
  {
    key: 'square',
    title: 'Square',
    about: 'The stencil holds 1:1, the size is still free.',
    params: { cropRatio: '1' },
  },
  {
    key: 'cover',
    title: 'Cover 1200 × 675',
    about: 'Exactly 1200 × 675 whatever the stencil was. Smaller pictures are refused.',
    params: { cropMode: 'fixed', cropX: 1200, cropY: 675 },
  },
  {
    key: 'notless',
    title: 'Not less than 600 wide',
    about: 'Keeps 16/9 and never goes below 600 px; a bigger stencil leaves as it is.',
    params: { cropMode: 'min', cropRatio: '16/9', cropX: 600 },
  },
  {
    key: 'photo',
    title: 'Photo, jpg 82',
    about: 'Free stencil, the crop comes back as jpg at quality 82.',
    params: { outputFormat: 'jpg', outputQuality: 82 },
  },
];

/** The props this set changes, as attribute lines for the snippet. */
export function changedAttrs(params) {
  const lines = [];

  for (const [key, value] of Object.entries(params)) {
    if (!ATTRS[key] || value === BASE[key] || value === '' || value === 0) continue;

    lines.push(typeof value === 'number' ? `:${ATTRS[key]}="${value}"` : `${ATTRS[key]}="${value}"`);
  }

  return lines;
}
