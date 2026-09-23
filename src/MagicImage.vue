<script setup>
/**
 * MagicImage: picture in, two files out.
 *
 * The flow is fixed: take a file or paste from the clipboard, tune it
 * (light, levels, sharpen), then crop — the cropper is not optional — and
 * press «Continue». The component knows nothing about servers: it emits
 * `save` with the original and the crop, and forgets everything it had.
 *
 * This file is the orchestrator: stages, the incoming picture, the preview and
 * the result. The tuning column lives in TunePanel, the crop stage in
 * CropStage, the arithmetic in lib/.
 */
import { ref, computed, watch, onUnmounted, nextTick } from 'vue';

import TunePanel from './TunePanel.vue';
import CropStage from './CropStage.vue';

import { TEXT } from './lib/text.js';
import { mimeOf, extensionOf, qualityOf, cropPlan } from './lib/plan.js';
import { neutralAdjust, lightCss, loadImage, toBlob, fitToPixels, renderTo, processed } from './lib/pixels.js';

import './assets/style.css';

const props = defineProps({
  // pixel budget: anything bigger is shrunk at load
  maxPixels: { type: Number, default: 16000000 },

  // how the crop is encoded; png, jpg or webp — the mime type is ours to build
  outputFormat: { type: String, default: 'png' },
  outputQuality: { type: Number, default: 100 },

  // the same for a picture from the clipboard: it has no file of its own
  clipboardFormat: { type: String, default: 'png' },
  clipboardQuality: { type: Number, default: 100 },

  // any - the size is nobody's business, fixed - exactly cropX, min - not less
  cropMode: { type: String, default: 'any' },

  // stencil proportion: 1, 1.5 or 16/9 — any of the three spellings
  cropRatio: { type: [String, Number], default: '' },

  // the required size; zero means «not set»
  cropX: { type: Number, default: 0 },
  cropY: { type: Number, default: 0 },
});

const emit = defineEmits(['save', 'stage']);

// --- state -----------------------------------------------------------------

// empty - nothing taken yet, edit - tuning, crop - the stencil
const stage = ref('empty');

// the owner hears every move: `empty` means the component is free and whatever
// stands around it can be shown again
watch(stage, (value) => emit('stage', value));

const originalFile = ref(null); // what leaves in save.original
const originalWidth = ref(0);
const originalHeight = ref(0);

// where the picture came from; the crop name depends on it and a file named
// clipboard.jpg on disk is still a file from disk
const fromClipboard = ref(false);

// what went wrong, in the component's own words
const errorMsg = ref('');

/**
 * Every take, every cancel and the unmount raise the counter. An operation
 * keeps its number and drops whatever it produced if the number has moved:
 * decoding and encoding are slow, and the one that finishes last must not win.
 */
let session = 0;

function newSession() {
  return ++session;
}

// working copy: shrunk when the source is bigger than maxPixels
const work = ref(null); // canvas
const shrunk = ref(false);

const cropSrc = ref(null); // the processed picture the stencil works on
const cropWidth = ref(0);
const cropHeight = ref(0);

// the «Resize down» fields hold numbers that can be used (CropStage decides)
const resizeValid = ref(true);

const busy = ref(false);

// light, levels, sharpen — one model, TunePanel edits it
const adjust = ref(neutralAdjust());

const plan = computed(() => cropPlan(props));
const planError = computed(() => (plan.value.error ? TEXT.badParams : ''));

/** The required size is out of reach: the working copy is smaller than asked. */
const tooSmall = computed(() => {
  if (!work.value || plan.value.error || plan.value.mode === 'any') return false;

  return work.value.width < plan.value.width || work.value.height < plan.value.height;
});

const canSave = computed(() => {
  if (stage.value !== 'crop' || plan.value.error || tooSmall.value || !resizeValid.value) return false;

  // fixed and min both refuse to enlarge: the stencil must hold the size
  if (plan.value.mode !== 'any') {
    return cropWidth.value >= plan.value.width && cropHeight.value >= plan.value.height;
  }

  return cropWidth.value > 0 && cropHeight.value > 0;
});

/**
 * What the crop stage says about the save: ready, or why not. «Continue» is
 * simply hidden until it is ready, so the reason has to be written somewhere.
 */
const saveState = computed(() => {
  // nothing to say yet: not cropping, or the stencil is still loading
  if (stage.value !== 'crop' || plan.value.error || tooSmall.value || !cropWidth.value) return null;

  if (canSave.value) return { ok: true, text: TEXT.ready };

  const { mode, width, height } = plan.value;

  if (mode !== 'any' && (cropWidth.value < width || cropHeight.value < height)) {
    return { ok: false, text: TEXT.stencilSmall };
  }

  return { ok: false, text: TEXT.resizeBad };
});

const lightFilter = computed(() => lightCss(adjust.value.light));

const viewRef = ref(null);
const previewRef = ref(null);
const cropRef = ref(null);
const fileInput = ref(null);

// --- preview ---------------------------------------------------------------

// the preview always takes the full width of the column: the panel keeps its
// 300px, the picture takes the rest, the height follows the proportion
const viewWidth = ref(520);

let viewObserver = null;

watch(viewRef, (el) => {
  viewObserver?.disconnect();
  viewObserver = null;

  if (!el) return;

  viewObserver = new ResizeObserver(([entry]) => {
    const width = Math.round(entry.contentRect.width);

    if (width > 0 && width !== viewWidth.value) viewWidth.value = width;
  });

  viewObserver.observe(el);
});

function drawPreview() {
  const canvas = previewRef.value;
  const source = work.value;

  if (!canvas || !source) return;

  const scale = Math.min(1, viewWidth.value / source.width);

  renderTo(canvas, source, Math.max(1, Math.round(source.width * scale)), Math.max(1, Math.round(source.height * scale)), adjust.value);
}

// a slider fires faster than a frame is computed: only the last one counts
let queued = false;

function queuePreview() {
  if (queued) return;

  queued = true;

  requestAnimationFrame(() => {
    queued = false;
    drawPreview();
  });
}

watch(viewWidth, queuePreview);
watch(adjust, queuePreview, { deep: true });

// --- incoming picture ------------------------------------------------------

async function start(image, file, clipboard, token) {
  if (token !== session) return;

  errorMsg.value = '';
  originalFile.value = file;
  originalWidth.value = image.naturalWidth;
  originalHeight.value = image.naturalHeight;
  fromClipboard.value = clipboard;

  const fitted = fitToPixels(image, props.maxPixels);

  work.value = fitted.canvas;
  shrunk.value = fitted.shrunk;
  adjust.value = neutralAdjust();

  stage.value = 'edit';

  await nextTick();

  if (token !== session) return;

  drawPreview();
}

/** A file from disk leaves in original as it came: its own type, its own bytes. */
async function takeFile(file) {
  const token = newSession();
  const url = URL.createObjectURL(file);

  errorMsg.value = '';

  try {
    await start(await loadImage(url), file, false, token);
  } catch {
    if (token === session) errorMsg.value = TEXT.loadFailed;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * A picture from the clipboard has no file, so the original is the picture
 * itself, encoded with clipboardFormat: no other source exists here.
 */
async function takeClipboard(blob) {
  const token = newSession();
  const url = URL.createObjectURL(blob);

  errorMsg.value = '';

  try {
    const image = await loadImage(url);

    if (token !== session) return;

    const mime = mimeOf(props.clipboardFormat);
    const name = 'clipBoard.' + extensionOf(props.clipboardFormat);

    // the clipboard hands over an encoded picture already, almost always png:
    // when it is the format we were asked for, there is nothing to re-encode
    let data = blob;

    if (blob.type !== mime) {
      const full = document.createElement('canvas');
      full.width = image.naturalWidth;
      full.height = image.naturalHeight;
      full.getContext('2d').drawImage(image, 0, 0);

      data = await toBlob(full, mime, qualityOf(props.clipboardQuality));

      if (token !== session) return;

      // toBlob hands the callback null when the browser gives up on the canvas
      if (!data) {
        errorMsg.value = TEXT.encodeFailed;
        return;
      }
    }

    await start(image, new File([data], name, { type: mime }), true, token);
  } catch {
    if (token === session) errorMsg.value = TEXT.loadFailed;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function onFileSelect(event) {
  const file = event.target.files?.[0];

  // reset it, otherwise picking the same file again fires no event
  event.target.value = '';

  if (file) takeFile(file);
}

/**
 * The paste is caught by the field, not by the window: what is pasted into
 * someone else's input is none of our business. The field exists only while
 * nothing is taken, so a picture already open cannot be overwritten — «Cancel»
 * clears everything first.
 */
function onPaste(event) {
  for (const item of event.clipboardData?.items ?? []) {
    if (item.type.startsWith('image/')) {
      takeClipboard(item.getAsFile());
      return;
    }
  }

  errorMsg.value = TEXT.pasteEmpty;
}

onUnmounted(() => {
  newSession();

  viewObserver?.disconnect();

  if (cropSrc.value) URL.revokeObjectURL(cropSrc.value);
});

// --- crop and result -------------------------------------------------------

/** The stencil gets the already processed picture: the sliders are done by then. */
async function goCrop() {
  const token = session;
  const canvas = processed(work.value, adjust.value);
  const blob = await toBlob(canvas, 'image/png');

  // cancelled or replaced while encoding: this result belongs to nobody
  if (token !== session) return;

  if (!blob) {
    errorMsg.value = TEXT.encodeFailed;
    return;
  }

  if (cropSrc.value) URL.revokeObjectURL(cropSrc.value);

  cropSrc.value = URL.createObjectURL(blob);

  // zero until the stencil reports its own size: the cropper is still loading
  // the picture, and a size taken from anywhere else lets «Continue» fire into
  // an empty canvas
  cropWidth.value = 0;
  cropHeight.value = 0;

  stage.value = 'crop';
}

async function backToEdit() {
  stage.value = 'edit';

  await nextTick();

  drawPreview();
}

function onCropChange({ width, height }) {
  cropWidth.value = width;
  cropHeight.value = height;
}

/** The crop name: the source file name, extension by outputFormat. */
function cropName() {
  const extension = '.' + extensionOf(props.outputFormat);

  // a clipboard picture has no name of its own
  if (fromClipboard.value) return 'clipBoard' + extension;

  const source = originalFile.value?.name ?? 'crop';
  const base = source.includes('.') ? source.slice(0, source.lastIndexOf('.')) : source;

  return base + extension;
}

async function apply() {
  if (!canSave.value || busy.value) return;

  const token = session;

  busy.value = true;
  errorMsg.value = '';

  try {
    const result = cropRef.value?.getCanvas();

    if (!result?.canvas) {
      errorMsg.value = TEXT[result?.error] ?? TEXT.encodeFailed;
      return;
    }

    const canvas = result.canvas;
    const mime = mimeOf(props.outputFormat);

    // everything the event needs is taken before the wait: a cancel during
    // encoding must not turn into a half of one picture and a half of another
    const source = {
      file: originalFile.value,
      width: originalWidth.value,
      height: originalHeight.value,
      format: originalFile.value.type,
      name: cropName(),
    };

    const blob = await toBlob(canvas, mime, qualityOf(props.outputQuality));

    if (token !== session) return;

    if (!blob) {
      errorMsg.value = TEXT.encodeFailed;
      return;
    }

    emit('save', {
      original: {
        file: source.file,
        width: source.width,
        height: source.height,
        format: source.format,
      },
      crop: {
        file: new File([blob], source.name, { type: mime }),
        width: canvas.width,
        height: canvas.height,
        format: mime,
      },
    });

    clear();
  } finally {
    busy.value = false;
  }
}

function clear() {
  // whatever is still decoding or encoding belongs to the previous session now
  newSession();

  if (cropSrc.value) URL.revokeObjectURL(cropSrc.value);

  stage.value = 'empty';
  originalFile.value = null;
  originalWidth.value = 0;
  originalHeight.value = 0;
  fromClipboard.value = false;
  errorMsg.value = '';
  work.value = null;
  shrunk.value = false;
  cropSrc.value = null;
  cropWidth.value = 0;
  cropHeight.value = 0;

  adjust.value = neutralAdjust();
}
</script>

<template>
  <div class="magic-image">
    <div class="magic-image__small" v-if="planError">{{ planError }}</div>

    <div class="magic-image__take" v-else-if="stage === 'empty'">
      <input ref="fileInput" type="file" accept="image/*" hidden @change="onFileSelect" />

      <button type="button" class="mi-btn" @click="fileInput.click()">{{ TEXT.pick }}</button>

      <input class="mi-input magic-image__paste" type="text" :placeholder="TEXT.pasteHere" @paste.prevent="onPaste" @beforeinput.prevent />

      <div class="magic-image__small" v-if="errorMsg">{{ errorMsg }}</div>
    </div>

    <div class="magic-image__body" v-else-if="stage === 'edit'">
      <div class="magic-image__view" ref="viewRef">
        <canvas ref="previewRef" :style="{ filter: lightFilter }" class="magic-image__preview"></canvas>
      </div>

      <div class="magic-image__panel">
        <div class="magic-image__sizes">
          <div class="mb-2">{{ TEXT.size }}: {{ originalWidth }} × {{ originalHeight }}</div>
          <div class="mb-2" v-if="shrunk">{{ TEXT.shrunk }}: {{ work.width }} × {{ work.height }}</div>
          <div class="mb-2" v-if="plan.width">{{ TEXT.required }}: {{ plan.width }} × {{ plan.height }}</div>
        </div>

        <div class="magic-image__small" v-if="errorMsg">{{ errorMsg }}</div>

        <template v-if="tooSmall">
          <div class="magic-image__small">{{ TEXT.tooSmall }}</div>

          <div class="magic-image__actions">
            <button type="button" class="mi-btn" @click="clear()">{{ TEXT.cancel }}</button>
          </div>
        </template>

        <template v-else>
          <TunePanel v-model="adjust" :work="work" />

          <div class="magic-image__actions">
            <button type="button" class="mi-btn mi-btn--primary" @click="goCrop()">{{ TEXT.toCrop }}</button>
            <button type="button" class="mi-btn" @click="clear()">{{ TEXT.cancel }}</button>
          </div>
        </template>
      </div>
    </div>

    <CropStage v-else ref="cropRef" :src="cropSrc" :plan="plan" @change="onCropChange" @valid="resizeValid = $event">
      <template #info>
        <div>{{ TEXT.size }}: {{ originalWidth }} × {{ originalHeight }}</div>
        <div v-if="shrunk">{{ TEXT.shrunk }}: {{ work.width }} × {{ work.height }}</div>
      </template>

      <template #actions>
        <div class="magic-image__small" v-if="errorMsg">{{ errorMsg }}</div>

        <div v-if="saveState" class="magic-image__status" :class="{ 'is-ok': saveState.ok }">{{ saveState.ok ? '✓' : '✕' }} {{ saveState.text }}</div>

        <div class="magic-image__actions">
          <slot name="actions" :can-save="canSave" :apply="apply">
            <button v-if="canSave" type="button" class="mi-btn mi-btn--primary" :disabled="busy" @click="apply()">
              {{ TEXT.next }}
            </button>
          </slot>

          <button type="button" class="mi-btn" :disabled="busy" @click="backToEdit()">{{ TEXT.back }}</button>
          <button type="button" class="mi-btn" :disabled="busy" @click="clear()">{{ TEXT.cancel }}</button>
        </div>
      </template>
    </CropStage>
  </div>
</template>

<style scoped>
/* the component takes the full width of the container it was put in */
.magic-image {
  width: 100%;
}

.magic-image__body {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

/* the panel is exactly 300px, the rest goes to the picture */
.magic-image__view {
  flex: 1 1 320px;
  min-width: 0;
}

.magic-image__preview {
  max-width: 100%;
  border: 1px solid #ccc;
}

.magic-image__panel {
  flex: 0 0 300px;
  max-width: 100%;
}

.magic-image__paste {
  width: 16rem;
  max-width: 100%;
}

.magic-image__sizes {
  font-size: 0.8rem;
  color: #666;
}

.magic-image__small {
  color: #b00;
  margin: 0.5rem 0;
}

.magic-image__status {
  margin-top: 0.75rem;
  font-size: 0.875rem;
  color: #b02a37;
}

.magic-image__status.is-ok {
  color: #198754;
}

.magic-image__actions {
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
</style>
