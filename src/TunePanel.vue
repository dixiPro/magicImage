<script setup>
/**
 * The tuning column: three tabs over one model. The panel owns no picture of
 * its own — the preview canvas lives in MagicImage; what it does own is the
 * histogram, because that belongs to the «Levels» tab.
 */
import { ref, watch, nextTick } from 'vue';

import { TEXT } from './lib/text.js';
import { NEUTRAL, histogram } from './lib/pixels.js';
import './assets/style.css';

const props = defineProps({
  // { light, levels, sharpen }
  modelValue: { type: Object, required: true },

  // the working canvas; the histogram is counted from it
  work: { type: Object, default: null },
});

const emit = defineEmits(['update:modelValue']);

const TABS = [
  { key: 'light', title: TEXT.light },
  { key: 'levels', title: TEXT.levels },
  { key: 'sharpen', title: TEXT.sharpen },
];

const tab = ref('light');
const histogramRef = ref(null);

/** One slider moved: the model leaves as a new object, props stay untouched. */
function set(part, key, value) {
  emit('update:modelValue', {
    ...props.modelValue,
    [part]: { ...props.modelValue[part], [key]: Number(value) },
  });
}

// resets only the open tab: the neighbouring tabs keep their settings
function resetTab() {
  emit('update:modelValue', {
    ...props.modelValue,
    [tab.value]: { ...NEUTRAL[tab.value] },
  });
}

function drawHistogram() {
  const canvas = histogramRef.value;

  if (!canvas || !props.work) return;

  const bins = histogram(props.work);
  const max = Math.max(...bins) || 1;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#333';

  bins.forEach((value, index) => {
    const bar = Math.round((value / max) * canvas.height);
    ctx.fillRect(index, canvas.height - bar, 1, bar);
  });
}

// the tab is only in the dom while it is open, so the canvas waits for it
watch([() => props.work, tab], async () => {
  await nextTick();
  drawHistogram();
}, { immediate: true });
</script>

<template>
  <div class="magic-image__tune">
    <ul class="mi-nav">
      <li v-for="one in TABS" :key="one.key">
        <button
          type="button"
          class="mi-nav__link"
          :class="{ 'is-active': tab === one.key }"
          @click="tab = one.key"
        >
          {{ one.title }}
        </button>
      </li>
    </ul>

    <div v-show="tab === 'light'">
      <label>{{ TEXT.brightness }} {{ modelValue.light.brightness }}</label>
      <input
        type="range"
        min="0.5"
        max="1.5"
        step="0.01"
        :value="modelValue.light.brightness"
        @input="set('light', 'brightness', $event.target.value)"
      />

      <label>{{ TEXT.contrast }} {{ modelValue.light.contrast }}</label>
      <input
        type="range"
        min="0.5"
        max="1.5"
        step="0.01"
        :value="modelValue.light.contrast"
        @input="set('light', 'contrast', $event.target.value)"
      />

      <label>{{ TEXT.saturate }} {{ modelValue.light.saturate }}</label>
      <input
        type="range"
        min="0"
        max="2"
        step="0.01"
        :value="modelValue.light.saturate"
        @input="set('light', 'saturate', $event.target.value)"
      />
    </div>

    <div v-show="tab === 'levels'">
      <canvas ref="histogramRef" width="256" height="80" class="magic-image__histogram"></canvas>

      <label>{{ TEXT.black }} {{ modelValue.levels.black }}</label>
      <input
        type="range"
        min="0"
        max="254"
        step="1"
        :value="modelValue.levels.black"
        @input="set('levels', 'black', $event.target.value)"
      />

      <label>{{ TEXT.gamma }} {{ modelValue.levels.gamma }}</label>
      <input
        type="range"
        min="0.1"
        max="3"
        step="0.01"
        :value="modelValue.levels.gamma"
        @input="set('levels', 'gamma', $event.target.value)"
      />

      <label>{{ TEXT.white }} {{ modelValue.levels.white }}</label>
      <input
        type="range"
        min="1"
        max="255"
        step="1"
        :value="modelValue.levels.white"
        @input="set('levels', 'white', $event.target.value)"
      />
    </div>

    <div v-show="tab === 'sharpen'">
      <label>{{ TEXT.amount }} {{ modelValue.sharpen.amount }}</label>
      <input
        type="range"
        min="0"
        max="200"
        step="1"
        :value="modelValue.sharpen.amount"
        @input="set('sharpen', 'amount', $event.target.value)"
      />

      <label>{{ TEXT.radius }} {{ modelValue.sharpen.radius }}</label>
      <input
        type="range"
        min="0.5"
        max="5"
        step="0.01"
        :value="modelValue.sharpen.radius"
        @input="set('sharpen', 'radius', $event.target.value)"
      />

      <label>{{ TEXT.threshold }} {{ modelValue.sharpen.threshold }}</label>
      <input
        type="range"
        min="0"
        max="40"
        step="1"
        :value="modelValue.sharpen.threshold"
        @input="set('sharpen', 'threshold', $event.target.value)"
      />
    </div>

    <button type="button" class="mi-btn magic-image__reset" @click="resetTab()">{{ TEXT.reset }}</button>
  </div>
</template>

<style scoped>
.magic-image__tune label {
  display: block;
  font-size: 0.8rem;
  margin-top: 0.5rem;
}

.magic-image__tune input[type='range'] {
  width: 100%;
}

.magic-image__histogram {
  border: 1px solid #ccc;
  width: 100%;
  height: 80px;
}

.magic-image__reset {
  margin-top: 0.75rem;
}
</style>
