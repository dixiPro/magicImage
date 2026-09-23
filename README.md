# ✨ MagicImage

> **Vue 3 image input, crop and adjustment component with clipboard support.**

[![npm](https://img.shields.io/npm/v/@dixipro/magic-image?color=cb3837&logo=npm)](https://www.npmjs.com/package/@dixipro/magic-image)
[![downloads](https://img.shields.io/npm/dm/@dixipro/magic-image?color=cb3837)](https://www.npmjs.com/package/@dixipro/magic-image)
[![license](https://img.shields.io/npm/l/@dixipro/magic-image?color=3da639)](LICENSE)
[![Live demo](https://img.shields.io/badge/demo-live-ff5a5f)](https://magicimage.dixipro.net/demo)
![Vue 3](https://img.shields.io/badge/Vue-3-42b883?logo=vuedotjs&logoColor=white)
![Client side](https://img.shields.io/badge/client--side-only-4c8bf5)
![No backend](https://img.shields.io/badge/backend-not%20required-6c757d)
![PNG](https://img.shields.io/badge/output-PNG-6f42c1)
![JPEG](https://img.shields.io/badge/output-JPEG-f0ad4e)
![WebP](https://img.shields.io/badge/output-WebP-198754)
[![Donate](https://img.shields.io/badge/donate-%E2%9D%A4-e25555)](https://magicimage.dixipro.net/donate)

[![MagicImage: upload or paste, crop and adjust, export the result](media/interface.webp)](https://magicimage.dixipro.net/demo)

**Upload · Clipboard · Crop · Levels · Brightness · Contrast · Saturation · Sharpen · Resize · PNG / JPEG / WebP**

### 👉 [Try the live demo](https://magicimage.dixipro.net/demo)

Pick a case, load a picture, tune it, crop it and download the two files — nothing leaves the browser.

## Why MagicImage?

There are plenty of excellent libraries for cropping and processing images. But almost every time, the same surrounding code has to be written again: file uploads, clipboard paste, controls, UI state management, getting the result, and passing it on to the application.

**MagicImage** brings all of that together in a single Vue 3 component — a kind of **Swiss Army knife for working with images**.

It accepts an image from a file or the clipboard, lets the user crop and adjust it, and returns **two files**:

- 📄 the original image;
- 🖼️ the processed image in the selected format.

The component knows nothing about servers. The result leaves through a `save` event, and what happens after that is entirely up to the application.

> **MagicImage is not intended to replace specialised image-processing libraries.**
>
> Its purpose is to package the entire common browser-side image workflow into one ready-to-use component.

---

## ✨ Features

- 📂 File upload
- 📋 Paste image from clipboard
- ✂️ Mandatory crop
- 📐 Free, fixed and minimum crop modes
- ☀️ Brightness
- ◐ Contrast
- 🎨 Saturation
- 📊 Levels with histogram
- ✨ Sharpening
- 📏 Resize down
- 🖼️ PNG, JPEG and WebP output
- 🧾 Original file preserved
- 🚫 No network requests
- 🚫 No uploads
- 🚫 No backend dependency
- 🧩 One own dependency: [`vue-advanced-cropper`](https://github.com/Norserium/vue-advanced-cropper)

---

## 🧭 Contents

- [Live demo ↗](https://magicimage.dixipro.net/demo)
- [Install](#-install)
- [Quick start](#-quick-start)
- [How it works](#-how-it-works)
- [Requirements](#-requirements)
- [Props](#-props)
- [Tuning](#-tuning)
- [Crop modes](#-crop-modes)
- [Resize down](#-resize-down)
- [Continue and status](#-continue-and-status)
- [Events](#-events)
- [Slots](#-slots)
- [Text and translation](#-text-and-translation)
- [Errors](#-errors)
- [File names](#-file-names)
- [Clipboard](#-clipboard)
- [Architecture](#-architecture)
- [Development](#-development)
- [Donate](#-donate)

---

## 📦 Install

```bash
npm i @dixipro/magic-image
```

[On npm](https://www.npmjs.com/package/@dixipro/magic-image).

`vue` and `vue-advanced-cropper` are peer dependencies. MagicImage uses the copies already installed in the host project.

The package ships the Vue source, so the host bundler compiles the `.vue` file.

No separate stylesheet import is required.

---

## 🚀 Quick start

```vue
<script setup>
import { ref } from 'vue';
import MagicImage from '@dixipro/magic-image';

const busy = ref(false);

function onSave({ original, crop }) {
  // original.file
  // crop.file
}
</script>

<template>
  <div v-if="!busy">…anything that should step aside while the editor works…</div>

  <MagicImage
    :max-pixels="16000000"
    output-format="png"
    :output-quality="100"
    clipboard-format="png"
    :clipboard-quality="100"
    crop-mode="fixed"
    :crop-x="1200"
    :crop-y="675"
    @stage="busy = $event !== 'empty'"
    @save="onSave"
  >
    <template #actions="{ canSave, apply }">
      <button v-if="canSave" @click="apply()">Continue</button>
    </template>
  </MagicImage>
</template>
```

The minimal call:

```vue
<MagicImage @save="onSave" />
```

---

## 🔄 How it works

1. **Upload** — choose a file or paste an image with `Ctrl+V`.
2. **Tune** — brightness, contrast, saturation, levels and sharpening.
3. **Crop** — set the stencil. Cropping is mandatory.
4. **Resize down** — optionally choose a smaller final size.
5. **Continue** — emits `save`, then the component clears itself.

If an image exceeds `maxPixels`, MagicImage shrinks the working copy before editing.

The original file is never modified.

---

## ✅ Requirements

- Vue 3
- Browser with Canvas API support
- Vite, Webpack or another Vue-capable bundler

The component is fully client-side.

---

## ⚙️ Props

| Prop               | Type     |    Default | Values                | Description                                    |
| ------------------ | -------- | ---------: | --------------------- | ---------------------------------------------- |
| `maxPixels`        | `number` | `16000000` | —                     | Images above this limit are shrunk for editing |
| `outputFormat`     | `string` |    `'png'` | `png`, `jpg`, `webp`  | Processed crop format                          |
| `outputQuality`    | `number` |      `100` | `1–100`               | Crop quality                                   |
| `clipboardFormat`  | `string` |    `'png'` | `png`, `jpg`, `webp`  | Format for clipboard originals                 |
| `clipboardQuality` | `number` |      `100` | `1–100`               | Clipboard re-encoding quality                  |
| `cropMode`         | `string` |    `'any'` | `any`, `fixed`, `min` | Crop mode                                      |
| `cropRatio`        | `string` |       `''` | `1`, `1.5`, `16/9`, … | Stencil ratio                                  |
| `cropX`            | `number` |          — | —                     | Required width                                 |
| `cropY`            | `number` |          — | —                     | Required height                                |

Numbers are passed with a colon:

```vue
<MagicImage :crop-x="1200" />
```

### Format notes

> 🟣 **PNG has no quality setting.**  
> PNG is lossless, so `outputQuality` and `clipboardQuality` do not affect PNG output.

> ⚫ **JPEG has no transparency.**  
> A transparent PNG exported as JPEG gets a black background. MagicImage does not add a white underlay.

---

## 🎛️ Tuning

MagicImage has three adjustment tabs.

### ☀️ Light

- brightness
- contrast
- saturation

### 📊 Levels

- black point
- gamma
- white point
- source histogram

### ✨ Sharpen

- amount
- radius
- threshold

Each tab has its own **Apply** switch.

Until the switch is enabled, the tab affects neither preview nor output.

### Controls

- **Slider + number field** stay synchronized.
- Typed decimals are preserved while editing.
- On `Enter` or blur, out-of-range values are clamped.
- **Reset** restores neutral values without changing the Apply state.
- **Sharpen** includes short hints describing its three parameters.

---

## ✂️ Crop modes

### 🆓 `any`

`cropX` and `cropY` are ignored.

With `cropRatio`, the stencil keeps the requested proportion. Without it, the stencil is free.

The result leaves at the current stencil size.

**Resize down** is available with no lower bound.

---

### 🎯 `fixed`

The crop is always scaled to the required width and computed height.

Nothing is enlarged.

The save action appears only when the stencil is large enough.

**Resize down** is not shown because the final size comes from the props.

Parameter normalization:

|   # | `cropRatio` | `cropX` | `cropY` | Result                                       |
| --: | :---------: | :-----: | :-----: | -------------------------------------------- |
|   1 |     ✅      |   ✅    |   ❌    | main case                                    |
|   2 |     ✅      |   ✅    |   ✅    | `cropY` is ignored                           |
|   3 |     ❌      |   ✅    |   ✅    | `cropRatio = x / y`, then `cropY` is ignored |
|   4 |     ✅      |   ❌    |   ✅    | `cropX = cropY × ratio`                      |
|   5 |     ✅      |   ❌    |   ❌    | invalid parameters                           |

Everything ends up as:

```text
ratio + X
```

Any other combination is invalid.

---

### 📐 `min`

Works like `fixed`, but the result is never squeezed down automatically.

- a larger stencil leaves at its current size;
- a smaller stencil is refused;
- **Resize down** is available;
- resize cannot go below the required size.

---

## 📏 Resize down

Available in:

- `any`
- `min`

Not available in:

- `fixed`

Type one side and the other follows the stencil ratio.

The fields do not silently correct the user while typing. Validation is handled by the Continue state.

Moving the stencil:

- switches Resize down off if the crop size changes;
- restores the stencil dimensions;
- keeps the values if only position changed and size stayed the same.

---

## ▶️ Continue and status

The Continue action is not disabled — it is hidden until the current state is valid.

The status line explains why.

### ✅ Ready to save

The stencil satisfies the current mode and Resize down values are valid.

### ❌ The stencil is smaller than required

For `fixed` or `min`, the stencil is below the required dimensions.

### ❌ The final size is out of range

Resize down is:

- empty;
- larger than the stencil;
- below the required minimum in `min`.

While the cropper is still loading, there is no status and no Continue action.

---

## 📡 Events

| Event   | Payload                       | Description                     |
| ------- | ----------------------------- | ------------------------------- |
| `save`  | `{ original, crop }`          | Final files are ready           |
| `stage` | `'empty' \| 'edit' \| 'crop'` | Current component stage changed |

### `save`

```js
{
  original: { file, width, height, format },
  crop:     { file, width, height, format },
}
```

#### `original`

The source file.

- A disk file leaves exactly as received.
- A clipboard image leaves in `clipboardFormat`.

#### `crop`

The processed crop in `outputFormat`.

Both objects are always present.

Immediately after `save`, the component clears itself.

---

### `stage`

Possible values:

```text
empty
edit
crop
```

Example:

```vue
<MagicImage @stage="busy = $event !== 'empty'" @save="onSave" />
```

`empty` means the component is free and holds no image.

The event fires only on a change: the initial `empty` is not emitted. Start with
the component considered free — `busy = false` — and let the event switch it.

---

## 🧩 Slots

### `actions`

```vue
<template #actions="{ canSave, apply }">
  <button v-if="canSave" @click="apply()">Continue</button>
</template>
```

Scope:

| Value     | Meaning                                               |
| --------- | ----------------------------------------------------- |
| `canSave` | `true` when the current crop and final size are valid |
| `apply()` | performs the save action                              |

Without the slot, MagicImage renders its own Continue button, shown only while
`canSave` is true.

The status line remains visible either way.

---

## 🌍 Text and translation

Every word the component says lives in one file:

```text
src/lib/text.js
```

It is a single object, English by default — the buttons, the tab titles, the
labels of the sliders, the status line, the hints of the Sharpen tab and every
error message. Nothing outside that file is shown to the user, and the component
carries no i18n library: translating it means translating one object.

```js
export const TEXT = {
  pick: 'Upload',
  pasteHere: 'Click here and press Ctrl-V',
  light: 'Light',
  // …
  ready: 'Ready to save',
};
```

To translate, copy the `src/` folder into your project and change that file.

> ⚠️ **Installed from npm, the file sits in `node_modules` and must not be
> edited** — the next install wipes it. Until the component takes the words as a
> prop, a translated copy means copying the folder.

---

## ⚠️ Errors

Errors are shown inside the component instead of the action buttons.

### Invalid parameters: the component cannot work with them

The crop props form an unsupported combination.

The component does not accept an image until the props are fixed.

### This picture cannot give the required size

Used by `fixed` and `min` when the working copy is smaller than the required
size — narrower than `cropX` or lower than the computed height.

This may happen because:

- the source image is too small;
- `maxPixels` forced the working copy to shrink.

### This file could not be read as a picture

The image is broken or unsupported by the browser.

### The browser could not encode the picture

`canvas.toBlob()` returned nothing, usually because browser canvas limits were exceeded.

### There is no picture in the clipboard

Something was pasted into the paste field, but it was not an image — text, for
example. Shown under the paste field; nothing is taken.

> The crop is always produced from the working copy, not directly from the full-size original.

---

## 🏷️ File names

| Source     | `original`                    | `crop`                     |
| ---------- | ----------------------------- | -------------------------- |
| `logo.jpg` | `logo.jpg`                    | `logo.<outputFormat>`      |
| clipboard  | `clipBoard.<clipboardFormat>` | `clipBoard.<outputFormat>` |

The names may match.

For example:

```text
logo.png
logo.png
```

That is intentional because the files arrive as separate properties.

---

## 📋 Clipboard

Paste works only inside the dedicated paste field.

MagicImage does not listen to arbitrary `Ctrl+V` events elsewhere on the page.

The paste field exists only while the component is empty, so an open image cannot be replaced accidentally.

Clipboard images are usually already encoded as PNG.

If the clipboard MIME type already matches `clipboardFormat`, MagicImage does **not** re-encode it.

A canvas is created only when conversion is required.

---

## 🏗️ Architecture

```text
src/
  MagicImage.vue        stages, input image, preview, save event
  TunePanel.vue         light, levels, sharpen, histogram
  CropStage.vue         crop stencil, sizes, Resize down
  lib/
    plan.js             formats, ratios and crop modes
    pixels.js           levels, sharpening, shrinking, histogram
    text.js             all component text
  assets/
    style.css           component styles, mi- prefix

test/
  plan.test.js          crop-mode cases

demo/
  main.js               mounts the demo page
  App.vue               the state of the page and which part is on screen
  DemoParams.vue        cases, parameter fields and the «Go» button
  ShowResult.vue        the two files of the last save, with downloads
  UsageSnippet.vue      the install command and the call for the chosen case
  demoProps.js          prop defaults, cases and mode descriptions

index.html              the entry point of Vite
media/
  interface.webp        the cover of the README
```

### `MagicImage.vue`

The orchestrator.

It owns:

- stage: `empty / edit / crop`;
- file and clipboard input;
- working copy;
- preview;
- final `save`.

It intentionally contains no crop arithmetic.

#### Session counter

Image decoding and encoding are asynchronous.

Every new image, cancel and unmount increments a session counter.

Late async results are discarded if they belong to an older session.

This prevents:

- image A appearing over image B;
- cancelled work returning later;
- half-old / half-new save results.

All data required for `save` is captured before asynchronous encoding starts.

---

### `TunePanel.vue`

Receives through `v-model`:

```text
{ light, levels, sharpen }
```

It never mutates the object directly. Every change emits a new object.

Each section contains its own `on` state — the tab's Apply switch.

---

### `CropStage.vue`

Owns:

- crop stencil;
- crop dimensions;
- Resize down;
- final canvas.

Reports:

- `change`
- `valid`

and exposes:

```text
getCanvas() → { canvas } | { error }
```

Canvas limits are validated against the actual generated canvas.

---

### `lib/plan.js`

The single source of truth for:

- crop modes;
- formats;
- ratio handling;
- crop parameter normalization.

It is fully covered by the crop-mode tests.

---

### `lib/pixels.js`

Contains pixel operations:

- levels;
- sharpening;
- shrinking;
- histogram.

It receives settings as arguments and knows nothing about Vue component state.

Disabled tuning sections are skipped.

---

## 🛠️ Development

```bash
npm install
npm run dev
npm run build
npm test
```

| Command         | Purpose                            |
| --------------- | ---------------------------------- |
| `npm run dev`   | run the demo                       |
| `npm run build` | build the demo into `dist/`        |
| `npm test`      | run crop-mode tests in Node        |

`vite.config.js` builds the demo page and nothing else: plain Vite defaults, no
paths to set up. The component itself needs no build — it ships as source and
is compiled by the bundler of the project that installs it.

`npm publish` sends only:

```text
src/
README.md
LICENSE
```

as defined by `files` in `package.json`.

---

## 🙏 Donate

Saved you some time? I’d really appreciate your support.

**[Donate](https://magicimage.dixipro.net/donate)**

Every contribution is appreciated.

---

## 💡 Philosophy

MagicImage is not trying to replace specialised image libraries.

Its job is narrower:

> **take the repetitive everyday browser workflow around an image and make it one reusable Vue component.**

Upload it. Paste it. Tune it. Crop it. Return the files.

Nothing more is assumed.
