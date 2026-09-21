<script setup>
/**
 * The demo page of the component: pick a case, see what the component does with
 * it, and look at the two files it gives back.
 *
 * Nothing here belongs to the component itself — it is an example of use.
 */
import { ref, computed } from 'vue';

import MagicImage from './src/MagicImage.vue';
import DemoParams from './DemoParams.vue';
import './src/assets/style.css';

const BASE = {
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

// the cases the component was made for
const CASES = [
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

// what each mode does, in one line: the cases below are only examples of them
const MODES = {
  any: 'any — the size is not checked. Crop as you like; the picture leaves at the size of the stencil.',
  fixed: 'fixed — the crop always comes back exactly crop-x wide, whatever the stencil was. A picture that cannot give that width is refused.',
  min: 'min — the crop is never narrower than crop-x, but a bigger stencil leaves as it is, without being squeezed.',
};

// prop -> attribute, and what a prop is worth by default: the snippet shows
// only what the case actually changes
const ATTRS = {
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

// the component tells its stage; `empty` means it is free
const stage = ref('empty');

const current = ref(CASES[0]);
const params = ref({ ...BASE, ...CASES[0].params });
const result = ref(null);

// while a picture is open everything around the component gets out of the way:
// the cases and the parameters would throw the work away, and the snippet is
// of no use in the middle of a crop
const idle = computed(() => stage.value === 'empty');

function pick(one) {
  current.value = one;
  params.value = { ...BASE, ...one.params };
  result.value = null;
}

/**
 * The whole example for the case chosen right now: import, handler, call. Meant
 * to be copied as it is, so only the props this case actually changes are in it.
 */
const snippet = computed(() => {
  const attrs = [];

  for (const [key, value] of Object.entries(params.value)) {
    if (value === BASE[key] || value === '' || value === 0) continue;

    attrs.push(typeof value === 'number' ? `:${ATTRS[key]}="${value}"` : `${ATTRS[key]}="${value}"`);
  }

  return [
    '<script setup>',
    "import MagicImage from 'magicimage';",
    '',
    'function onSave({ original, crop }) {',
    '  // two ready File objects — upload them, show them, do what you like',
    '  console.log(original.file, crop.file);',
    '}',
    '<\/script>',
    '',
    '<template>',
    '  <MagicImage',
    ...attrs.map((one) => '    ' + one),
    '    @save="onSave"',
    '  />',
    '</template>',
  ].join('\n');
});

function describe(part) {
  return `${part.file.name} · ${part.format} · ${part.width}×${part.height} · ${Math.round(part.file.size / 1024)} KB`;
}

function download(part) {
  const url = URL.createObjectURL(part.file);
  const link = document.createElement('a');

  link.href = url;
  link.download = part.file.name;
  link.click();

  URL.revokeObjectURL(url);
}
</script>

<template>
  <div class="demo">
    <template v-if="idle">
      <h2 class="demo__title">Cases</h2>

      <div class="demo__cases">
        <button
          v-for="one in CASES"
          :key="one.key"
          type="button"
          class="mi-btn"
          :class="{ 'mi-btn--primary': current.key === one.key }"
          @click="pick(one)"
        >
          {{ one.title }}
        </button>
      </div>

      <p class="demo__about">{{ current.about }}</p>

      <p class="demo__mode">{{ MODES[params.cropMode] }}</p>

      <h2 class="demo__title">Parameters</h2>

      <DemoParams v-model="params" />
    </template>

    <MagicImage
      v-bind="params"
      :key="JSON.stringify(params)"
      @stage="stage = $event"
      @save="result = $event"
    />

    <template v-if="idle">
      <h2 class="demo__title">Install</h2>

      <pre class="demo__code"><code>npm i magicimage</code></pre>

      <h2 class="demo__title">Use</h2>

      <pre class="demo__code"><code>{{ snippet }}</code></pre>
    </template>

    <section v-if="result" class="demo__result">
      <h2 class="h5">save</h2>

      <p>
        original: {{ describe(result.original) }}
        <button type="button" class="mi-btn" @click="download(result.original)">download</button>
      </p>

      <p>
        crop: {{ describe(result.crop) }}
        <button type="button" class="mi-btn" @click="download(result.crop)">download</button>
      </p>
    </section>
  </div>
</template>

<style scoped>
.demo__title {
  margin: 1.25rem 0 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #888;
}

.demo__cases {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.demo__about {
  margin: 0.75rem 0 0;
  font-size: 0.875rem;
  color: #666;
}

.demo__mode {
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  color: #212529;
}

.demo__code {
  margin: 1rem 0 0;
  padding: 0.75rem 1rem;
  font-size: 0.8rem;
  line-height: 1.5;
  color: #212529;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  overflow-x: auto;
}

.demo__result {
  margin-top: 1.5rem;
}

.demo__result p {
  margin: 0.5rem 0;
}
</style>
