<script setup>
/**
 * The parameters of the component: a case to start from, the fields to change
 * it by hand, and the button that hands everything over to MagicImage.
 */
import { computed, onMounted, watch } from 'vue';

import { BASE, CASES, MODES } from './demoProps.js';
import './src/assets/style.css';

const params = defineModel('params', { type: Object, required: true });
const ready = defineModel('ready', { type: Boolean, required: true });

/**
 * The case the parameters still match, if any. Nothing is remembered: a field
 * changed by hand puts the parameters beside every case, and none of the
 * buttons stays lit — the set on screen is no longer one of them.
 *
 * The case is the demo's own business anyway; params carry nothing but the
 * props of the component, or they would leak into the call as stray attributes.
 */
const current = computed(() => {
  const now = JSON.stringify(params.value);

  return CASES.find((one) => JSON.stringify({ ...BASE, ...one.params }) === now) ?? null;
});

onMounted(() => {
  if (!Object.keys(params.value).length) pick(CASES[0]);
});

function pick(one) {
  params.value = { ...BASE, ...one.params };
}

/**
 * `fixed` and `min` need a size, and switching the mode by hand leaves the form
 * without one — the component would meet an error instead of a picture. So a
 * mode switch brings a workable size with it.
 */
watch(
  () => params.value.cropMode,
  (mode) => {
    if (!mode || mode === 'any') return;

    if (!params.value.cropX && !params.value.cropY) params.value.cropX = 1200;
    if (!params.value.cropRatio && !(params.value.cropX && params.value.cropY)) params.value.cropRatio = '16/9';
  }
);
</script>

<template>
  <div v-if="params.cropMode" class="demo-params">
    <h2 class="demo-params__title">Cases</h2>

    <div class="demo-params__cases">
      <button
        v-for="one in CASES"
        :key="one.key"
        type="button"
        class="mi-btn"
        :class="{ 'mi-btn--primary': current?.key === one.key }"
        @click="pick(one)"
      >
        {{ one.title }}
      </button>
    </div>

    <p v-if="current" class="demo-params__about">{{ current.about }}</p>


    <h2 class="demo-params__title">Parameters</h2>

    <div class="demo-params__fields">
      <label>
        crop-mode
        <select class="mi-input" v-model="params.cropMode">
          <option value="any">any</option>
          <option value="fixed">fixed</option>
          <option value="min">min</option>
        </select>
      </label>

      <label>
        crop-ratio
        <input class="mi-input" type="text" placeholder="free" v-model="params.cropRatio" />
      </label>

      <label v-if="params.cropMode !== 'any'">
        crop-x
        <input class="mi-input" type="number" min="0" placeholder="not set" v-model.number="params.cropX" />
      </label>

      <label v-if="params.cropMode !== 'any'">
        crop-y
        <input class="mi-input" type="number" min="0" placeholder="not set" v-model.number="params.cropY" />
      </label>

      <label>
        output-format
        <select class="mi-input" v-model="params.outputFormat">
          <option value="png">png</option>
          <option value="jpg">jpg</option>
          <option value="webp">webp</option>
        </select>
      </label>

      <label>
        output-quality
        <input
          v-if="params.outputFormat !== 'png'"
          class="mi-input"
          type="number"
          min="1"
          max="100"
          v-model.number="params.outputQuality"
        />

        <span v-else class="demo-params__lossless">lossless</span>
      </label>
    </div>

    <p class="demo-params__mode">{{ MODES[params.cropMode] }}</p>

    <button type="button" class="mi-btn mi-btn--primary demo-params__go" @click="ready = true">Go</button>
  </div>
</template>

<style scoped>
.demo-params__title {
  margin: 1.25rem 0 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #888;
}

.demo-params__cases {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.demo-params__about {
  margin: 0.75rem 0 0;
  font-size: 0.875rem;
  color: #666;
}

.demo-params__mode {
  margin: 1rem 0 0;
  font-size: 0.875rem;
  color: #212529;
}

.demo-params__fields {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.demo-params__fields label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.8rem;
  color: #666;
}

/* png has no quality: the field gives way to a word */
.demo-params__lossless {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #212529;
}

.demo-params__go {
  margin-top: 1rem;
}
</style>
