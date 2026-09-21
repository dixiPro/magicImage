import { describe, it, expect } from 'vitest';

import { cropPlan, parseRatio, mimeOf, extensionOf, qualityOf } from '../src/lib/plan.js';

describe('parseRatio', () => {
  it('takes all three spellings', () => {
    expect(parseRatio('16/9')).toBeCloseTo(16 / 9);
    expect(parseRatio('1.5')).toBe(1.5);
    expect(parseRatio(1)).toBe(1);
  });

  it('gives null for empty and for rubbish', () => {
    expect(parseRatio('')).toBe(null);
    expect(parseRatio(null)).toBe(null);
    expect(parseRatio('wide')).toBe(null);
    expect(parseRatio('16/0')).toBe(null);
    expect(parseRatio('-2')).toBe(null);
  });
});

describe('formats', () => {
  it('turns short names into mime types', () => {
    expect(mimeOf('png')).toBe('image/png');
    expect(mimeOf('jpg')).toBe('image/jpeg');
    expect(mimeOf('JPEG')).toBe('image/jpeg');
    expect(mimeOf('webp')).toBe('image/webp');
    expect(mimeOf('avif')).toBe(null);
  });

  it('keeps one extension for jpeg and jpg', () => {
    expect(extensionOf('jpeg')).toBe('jpg');
    expect(extensionOf('jpg')).toBe('jpg');
    expect(extensionOf('png')).toBe('png');
  });

  it('brings quality from 1-100 to 0-1', () => {
    expect(qualityOf(100)).toBe(1);
    expect(qualityOf(82)).toBeCloseTo(0.82);
    expect(qualityOf(0)).toBe(0.01);
  });
});

// the table of task.04.md, row by row
describe('cropPlan: fixed', () => {
  const fixed = (extra) => cropPlan({ cropMode: 'fixed', ...extra });

  it('row 1: proportion and X — the main case', () => {
    expect(fixed({ cropRatio: '16/9', cropX: 1200 })).toMatchObject({ width: 1200, height: 675 });
  });

  it('row 2: Y is dropped when the proportion is there', () => {
    expect(fixed({ cropRatio: '16/9', cropX: 1200, cropY: 99 })).toMatchObject({ width: 1200, height: 675 });
  });

  it('row 3: no proportion — it comes from X and Y', () => {
    const plan = fixed({ cropX: 1200, cropY: 675 });

    expect(plan).toMatchObject({ width: 1200, height: 675 });
    expect(plan.ratio).toBeCloseTo(1200 / 675);
  });

  it('row 4: no X — it comes from Y and the proportion', () => {
    expect(fixed({ cropRatio: '16/9', cropY: 675 })).toMatchObject({ width: 1200, height: 675 });
  });

  it('row 5: neither X nor Y — an error', () => {
    expect(fixed({ cropRatio: '16/9' }).error).toBe('badParams');
  });

  it('no proportion and only one side — an error', () => {
    expect(fixed({ cropX: 1200 }).error).toBe('badParams');
    expect(fixed({ cropY: 675 }).error).toBe('badParams');
    expect(fixed({}).error).toBe('badParams');
  });

  it('a plain number as the proportion works too', () => {
    expect(fixed({ cropRatio: '1.5', cropX: 900 })).toMatchObject({ width: 900, height: 600 });
  });
});

describe('cropPlan: min', () => {
  it('is brought to the same shape as fixed', () => {
    expect(cropPlan({ cropMode: 'min', cropRatio: '1', cropX: 600 })).toMatchObject({
      mode: 'min',
      width: 600,
      height: 600,
    });
  });

  it('refuses the same combinations as fixed', () => {
    expect(cropPlan({ cropMode: 'min', cropRatio: '1' }).error).toBe('badParams');
  });
});

describe('cropPlan: any', () => {
  it('ignores X and Y', () => {
    expect(cropPlan({ cropMode: 'any', cropX: 1, cropY: 2 })).toMatchObject({ width: 0, height: 0 });
  });

  it('keeps the proportion when it is given', () => {
    expect(cropPlan({ cropMode: 'any', cropRatio: '16/9' }).ratio).toBeCloseTo(16 / 9);
  });

  it('is the default mode and needs nothing at all', () => {
    expect(cropPlan({}).mode).toBe('any');
    expect(cropPlan({}).error).toBe(undefined);
  });
});

describe('cropPlan: bad props', () => {
  it('an unknown mode is an error', () => {
    expect(cropPlan({ cropMode: 'square' }).error).toBe('badParams');
  });

  it('an unknown format is an error', () => {
    expect(cropPlan({ outputFormat: 'avif' }).error).toBe('badParams');
    expect(cropPlan({ clipboardFormat: 'bmp' }).error).toBe('badParams');
  });
});
