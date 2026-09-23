<script setup>
/**
 * The crop stage as a whole: the stencil on the left, the sizes and the
 * «Resize down» fields on the right. The buttons belong to the owner of this
 * component and arrive through the `actions` slot — the stage itself only hands
 * over a ready canvas when asked.
 */
import { ref, computed, watch } from 'vue';
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';

import { TEXT } from './lib/text.js';
import { shrinkTo } from './lib/pixels.js';
import './assets/style.css';

const props = defineProps({
  // the processed picture the stencil works on
  src: { type: String, required: true },

  // what cropPlan() decided: { mode, ratio, width, height }
  plan: { type: Object, required: true },
});

const emit = defineEmits(['change', 'valid']);

const cropperRef = ref(null);

const cropWidth = ref(0);
const cropHeight = ref(0);

// final size: the «Resize down» checkbox and its fields. The proportion follows
// the stencil, so the other side is always computed
const resizeOn = ref(false);
const resizeSize = ref({ width: 0, height: 0 });

// the checkbox makes no sense in fixed: the size is set by the props
const resizeAllowed = computed(() => props.plan.mode !== 'fixed');

const aspectRatio = computed(() => props.plan.ratio ?? undefined);

function onCropChange({ canvas }) {
  if (!canvas) return;

  cropWidth.value = canvas.width;
  cropHeight.value = canvas.height;

  emit('change', { width: canvas.width, height: canvas.height });
}

/**
 * The fields never correct anybody: whatever is typed stays, the other side
 * follows the stencil proportion. Whether the numbers are any good is decided
 * by `resizeValid`, and «Continue» simply does not show until they are.
 */
function followResize(side) {
  const ratio = cropHeight.value ? cropWidth.value / cropHeight.value : 1;
  const value = Math.round(Number(resizeSize.value[side]) || 0);

  if (value < 1) return;

  resizeSize.value =
    side === 'width' ? { width: value, height: Math.max(1, Math.round(value / ratio)) } : { width: Math.max(1, Math.round(value * ratio)), height: value };
}

// the stencil moved: a final size typed for the old stencil means nothing for
// the new one, so «Resize down» switches off and the fields show the stencil
watch([cropWidth, cropHeight], ([width, height]) => {
  resizeOn.value = false;
  resizeSize.value = { width, height };
});

/** The final size is usable: not empty, not bigger than the stencil, and in min not below the requirement. */
const resizeValid = computed(() => {
  if (!resizeOn.value) return true;

  const { width, height } = resizeSize.value;

  if (!(width >= 1 && height >= 1)) return false;
  if (width > cropWidth.value || height > cropHeight.value) return false;

  return !(props.plan.mode === 'min' && (width < props.plan.width || height < props.plan.height));
});

watch(resizeValid, (ok) => emit('valid', ok), { immediate: true });

watch(resizeOn, (on) => {
  if (on) resizeSize.value = { width: cropWidth.value, height: cropHeight.value };
});

/**
 * The final size measured against the crop we actually hold, not against the
 * numbers the stencil reported: the fields keep the width the owner asked for,
 * the height follows the real proportion.
 */
function fitToCrop(cropped) {
  const ratio = cropped.height ? cropped.width / cropped.height : 1;

  let width = Math.round(Number(resizeSize.value.width) || 0);
  let height = Math.round(width / ratio);

  if (width < 1 || height < 1 || width > cropped.width || height > cropped.height) {
    width = cropped.width;
    height = cropped.height;
  }

  // min never goes below what was asked for
  if (props.plan.mode === 'min' && (width < props.plan.width || height < props.plan.height)) {
    width = props.plan.width;
    height = Math.max(props.plan.height, Math.round(props.plan.width / ratio));
  }

  return { width, height };
}

/**
 * The result, on demand. Returns { canvas } or { error }: the stencil reports
 * its size through an event, and the limits are checked here against the canvas
 * in hand, not against what the interface managed to show.
 */
function getCanvas() {
  const cropped = cropperRef.value?.getResult()?.canvas;

  if (!cropped) return { error: 'encodeFailed' };

  if (props.plan.mode !== 'any' && (cropped.width < props.plan.width || cropped.height < props.plan.height)) {
    return { error: 'tooSmall' };
  }

  const wanted =
    props.plan.mode === 'fixed'
      ? { width: props.plan.width, height: props.plan.height }
      : resizeOn.value
        ? fitToCrop(cropped)
        : { width: cropped.width, height: cropped.height };

  return { canvas: shrinkTo(cropped, wanted.width, wanted.height) };
}

defineExpose({ getCanvas });
</script>

<template>
  <div class="magic-image__body">
    <div class="magic-image__view">
      <Cropper ref="cropperRef" :src="src" :stencil-props="{ aspectRatio: aspectRatio }" :debounce="0" class="magic-image__cropper" @change="onCropChange" />
    </div>

    <div class="magic-image__panel">
      <div class="magic-image__sizes">
        <slot name="info" />

        <div v-if="cropWidth">{{ TEXT.crop }}: {{ cropWidth }} × {{ cropHeight }}</div>
        <div v-if="plan.width">{{ TEXT.required }}: {{ plan.width }} × {{ plan.height }}</div>
      </div>

      <div v-if="resizeAllowed" class="magic-image__resize">
        <label class="mi-check"><input type="checkbox" v-model="resizeOn" /> {{ TEXT.resize }}</label>

        <span class="ms-1" v-if="resizeOn">
          <input class="mi-input" type="number" min="1" v-model.number="resizeSize.width" @input="followResize('width')" />
          ×
          <input class="mi-input" type="number" min="1" v-model.number="resizeSize.height" @input="followResize('height')" />
        </span>
      </div>

      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
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

.magic-image__panel {
  flex: 0 0 300px;
  max-width: 100%;
}

.magic-image__sizes {
  font-size: 0.8rem;
  color: #666;
}

.magic-image__resize {
  margin: 0.25rem 0;
  color: #000;
}
</style>
