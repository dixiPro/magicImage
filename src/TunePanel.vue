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

/**
 * A number typed by hand. While typing it goes in only once it is a whole
 * number inside the slider range — «0.» on the way to «0.7» must not be turned
 * into 0 under the cursor. On Enter or blur whatever is outside the range is
 * brought to its edge, so the field and the slider never disagree.
 */
function typed(part, key, event, min, max, final = false) {
  const text = event.target.value.trim();
  const value = Number(text);

  if (final) {
    const fixed = text === '' || !Number.isFinite(value) ? props.modelValue[part][key] : Math.min(max, Math.max(min, value));

    event.target.value = String(fixed);
    set(part, key, fixed);
    return;
  }

  if (text === '' || text.endsWith('.') || !Number.isFinite(value) || value < min || value > max) return;

  set(part, key, value);
}

/** The «Apply» checkbox of a tab: the settings stay, only their use changes. */
function toggle(part, on) {
  emit('update:modelValue', {
    ...props.modelValue,
    [part]: { ...props.modelValue[part], on },
  });
}

// resets only the open tab: the neighbouring tabs keep their settings, and the
// tab itself keeps its «Apply» checkbox — reset is about values, not about use
function resetTab() {
  emit('update:modelValue', {
    ...props.modelValue,
    [tab.value]: { ...NEUTRAL[tab.value], on: props.modelValue[tab.value].on },
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
      <label class="mi-check mb-2">
        <input type="checkbox" :checked="modelValue.light.on" @change="toggle('light', $event.target.checked)" />
        {{ TEXT.apply }}
      </label>

      <label>
        {{ TEXT.brightness }}
        <input
          class="mi-input ms-1"
          type="number"
          min="0.5"
          max="1.5"
          step="0.01"
          :value="modelValue.light.brightness"
          :disabled="!modelValue.light.on"
          @input="typed('light', 'brightness', $event, 0.5, 1.5)"
          @change="typed('light', 'brightness', $event, 0.5, 1.5, true)"
        />
      </label>
      <input
        type="range"
        min="0.5"
        max="1.5"
        step="0.01"
        :value="modelValue.light.brightness"
        :disabled="!modelValue.light.on"
        @input="set('light', 'brightness', $event.target.value)"
      />

      <label>
        {{ TEXT.contrast }}
        <input
          class="mi-input ms-1"
          type="number"
          min="0.5"
          max="1.5"
          step="0.01"
          :value="modelValue.light.contrast"
          :disabled="!modelValue.light.on"
          @input="typed('light', 'contrast', $event, 0.5, 1.5)"
          @change="typed('light', 'contrast', $event, 0.5, 1.5, true)"
        />
      </label>
      <input
        type="range"
        min="0.5"
        max="1.5"
        step="0.01"
        :value="modelValue.light.contrast"
        :disabled="!modelValue.light.on"
        @input="set('light', 'contrast', $event.target.value)"
      />

      <label>
        {{ TEXT.saturate }}
        <input
          class="mi-input ms-1"
          type="number"
          min="0"
          max="2"
          step="0.01"
          :value="modelValue.light.saturate"
          :disabled="!modelValue.light.on"
          @input="typed('light', 'saturate', $event, 0, 2)"
          @change="typed('light', 'saturate', $event, 0, 2, true)"
        />
      </label>
      <input
        type="range"
        min="0"
        max="2"
        step="0.01"
        :value="modelValue.light.saturate"
        :disabled="!modelValue.light.on"
        @input="set('light', 'saturate', $event.target.value)"
      />
    </div>

    <div v-show="tab === 'levels'">
      <label class="mi-check mb-2">
        <input type="checkbox" :checked="modelValue.levels.on" @change="toggle('levels', $event.target.checked)" />
        {{ TEXT.apply }}
      </label>

      <canvas ref="histogramRef" width="256" height="80" class="magic-image__histogram"></canvas>

      <label>
        {{ TEXT.black }}
        <input
          class="mi-input ms-1"
          type="number"
          min="0"
          max="254"
          step="1"
          :value="modelValue.levels.black"
          :disabled="!modelValue.levels.on"
          @input="typed('levels', 'black', $event, 0, 254)"
          @change="typed('levels', 'black', $event, 0, 254, true)"
        />
      </label>
      <input
        type="range"
        min="0"
        max="254"
        step="1"
        :value="modelValue.levels.black"
        :disabled="!modelValue.levels.on"
        @input="set('levels', 'black', $event.target.value)"
      />

      <label>
        {{ TEXT.gamma }}
        <input
          class="mi-input ms-1"
          type="number"
          min="0.1"
          max="3"
          step="0.01"
          :value="modelValue.levels.gamma"
          :disabled="!modelValue.levels.on"
          @input="typed('levels', 'gamma', $event, 0.1, 3)"
          @change="typed('levels', 'gamma', $event, 0.1, 3, true)"
        />
      </label>
      <input
        type="range"
        min="0.1"
        max="3"
        step="0.01"
        :value="modelValue.levels.gamma"
        :disabled="!modelValue.levels.on"
        @input="set('levels', 'gamma', $event.target.value)"
      />

      <label>
        {{ TEXT.white }}
        <input
          class="mi-input ms-1"
          type="number"
          min="1"
          max="255"
          step="1"
          :value="modelValue.levels.white"
          :disabled="!modelValue.levels.on"
          @input="typed('levels', 'white', $event, 1, 255)"
          @change="typed('levels', 'white', $event, 1, 255, true)"
        />
      </label>
      <input
        type="range"
        min="1"
        max="255"
        step="1"
        :value="modelValue.levels.white"
        :disabled="!modelValue.levels.on"
        @input="set('levels', 'white', $event.target.value)"
      />
    </div>

    <div v-show="tab === 'sharpen'">
      <label class="mi-check mb-2">
        <input type="checkbox" :checked="modelValue.sharpen.on" @change="toggle('sharpen', $event.target.checked)" />
        {{ TEXT.apply }}
      </label>

      <label>
        {{ TEXT.amount }}
        <input
          class="mi-input ms-1"
          type="number"
          min="0"
          max="200"
          step="1"
          :value="modelValue.sharpen.amount"
          :disabled="!modelValue.sharpen.on"
          @input="typed('sharpen', 'amount', $event, 0, 200)"
          @change="typed('sharpen', 'amount', $event, 0, 200, true)"
        />
      </label>
      <input
        type="range"
        min="0"
        max="200"
        step="1"
        :value="modelValue.sharpen.amount"
        :disabled="!modelValue.sharpen.on"
        @input="set('sharpen', 'amount', $event.target.value)"
      />

      <label>
        {{ TEXT.radius }}
        <input
          class="mi-input ms-1"
          type="number"
          min="0.5"
          max="5"
          step="0.01"
          :value="modelValue.sharpen.radius"
          :disabled="!modelValue.sharpen.on"
          @input="typed('sharpen', 'radius', $event, 0.5, 5)"
          @change="typed('sharpen', 'radius', $event, 0.5, 5, true)"
        />
      </label>
      <input
        type="range"
        min="0.5"
        max="5"
        step="0.01"
        :value="modelValue.sharpen.radius"
        :disabled="!modelValue.sharpen.on"
        @input="set('sharpen', 'radius', $event.target.value)"
      />

      <label>
        {{ TEXT.threshold }}
        <input
          class="mi-input ms-1"
          type="number"
          min="0"
          max="40"
          step="1"
          :value="modelValue.sharpen.threshold"
          :disabled="!modelValue.sharpen.on"
          @input="typed('sharpen', 'threshold', $event, 0, 40)"
          @change="typed('sharpen', 'threshold', $event, 0, 40, true)"
        />
      </label>
      <input
        type="range"
        min="0"
        max="40"
        step="1"
        :value="modelValue.sharpen.threshold"
        :disabled="!modelValue.sharpen.on"
        @input="set('sharpen', 'threshold', $event.target.value)"
      />
    </div>

    <button type="button" class="mi-btn magic-image__reset" @click="resetTab()">{{ TEXT.reset }}</button>

    <ul v-if="tab === 'sharpen'" class="magic-image__help">
      <li v-for="line in TEXT.sharpenHelp" :key="line">{{ line }}</li>
    </ul>
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

.magic-image__help {
  margin: 0.75rem 0 0;
  padding-left: 1.1rem;
  font-size: 0.75rem;
  line-height: 1.4;
  color: #666;
}

.magic-image__help li + li {
  margin-top: 0.25rem;
}

.magic-image__reset {
  margin-top: 0.75rem;
}
</style>
