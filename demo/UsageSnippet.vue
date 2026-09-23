<script setup>
/** How to get the component and how to call it with the parameters chosen. */
import { computed } from 'vue';

import { changedAttrs } from './demoProps.js';

const props = defineProps({
  params: { type: Object, required: true },
});

/** The attribute lines of the call, ready to sit inside the snippet. */
const attrs = computed(() =>
  changedAttrs(props.params)
    .map((one) => '    ' + one + '\n')
    .join('')
);
</script>

<template>
  <section class="install">
    <h2 class="install__title">Install</h2>

    <pre class="install__code"><code>npm i @dixipro/magic-image</code></pre>

    <h2 class="install__title">Use</h2>

    <pre class="install__code"><code>&lt;script setup&gt;
import MagicImage from '@dixipro/magic-image';

function onSave({ original, crop }) {
  // two ready File objects — upload them, show them, do what you like
  console.log(original.file, crop.file);
}
&lt;/script&gt;

&lt;template&gt;
  &lt;MagicImage
{{ attrs }}    @save="onSave"
  /&gt;
&lt;/template&gt;</code></pre>
  </section>
</template>

<style scoped>
.install__title {
  margin: 1.25rem 0 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #888;
}

.install__code {
  margin: 0;
  padding: 0.75rem 1rem;
  font-size: 0.8rem;
  line-height: 1.5;
  color: #212529;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  overflow-x: auto;
}
</style>
