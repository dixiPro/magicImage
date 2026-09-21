<script setup>
/**
 * Starting parameters of the demo, over one model. Not part of the component:
 * the component takes props, and this is just a way to type them by hand.
 *
 * A field shows its real value; the grey word in an empty field says what the
 * emptiness means, so a value is never mistaken for a hint.
 *
 * crop-x and crop-y are only shown for `fixed` and `min`: in `any` the
 * component ignores them, and a field that changes nothing is a lie.
 */
const props = defineProps({
  modelValue: { type: Object, required: true },
});

const emit = defineEmits(['update:modelValue']);

function set(key, value) {
  emit('update:modelValue', repair({ ...props.modelValue, [key]: value }, key));
}

/**
 * `fixed` and `min` need a size, and switching the mode by hand leaves the
 * form without one — the component would meet an error instead of a picture.
 * So a mode switch brings a workable size with it; the fields are there to be
 * changed afterwards.
 */
function repair(next, key) {
  if (key !== 'cropMode' || next.cropMode === 'any') return next;

  const fixed = { ...next };

  if (!fixed.cropX && !fixed.cropY) fixed.cropX = 1200;
  if (!fixed.cropRatio && !(fixed.cropX && fixed.cropY)) fixed.cropRatio = '16/9';

  return fixed;
}
</script>

<template>
  <div class="demo-params">
    <label>
      crop-mode
      <select class="mi-input" :value="modelValue.cropMode" @change="set('cropMode', $event.target.value)">
        <option value="any">any</option>
        <option value="fixed">fixed</option>
        <option value="min">min</option>
      </select>
    </label>

    <label>
      crop-ratio
      <input
        class="mi-input"
        type="text"
        placeholder="free"
        :value="modelValue.cropRatio"
        @change="set('cropRatio', $event.target.value)"
      />
    </label>

    <label v-if="modelValue.cropMode !== 'any'">
      crop-x
      <input
        class="mi-input"
        type="number"
        min="0"
        placeholder="not set"
        :value="modelValue.cropX || ''"
        @change="set('cropX', Number($event.target.value))"
      />
    </label>

    <label v-if="modelValue.cropMode !== 'any'">
      crop-y
      <input
        class="mi-input"
        type="number"
        min="0"
        placeholder="not set"
        :value="modelValue.cropY || ''"
        @change="set('cropY', Number($event.target.value))"
      />
    </label>

    <label>
      output-format
      <select class="mi-input" :value="modelValue.outputFormat" @change="set('outputFormat', $event.target.value)">
        <option value="png">png</option>
        <option value="jpg">jpg</option>
        <option value="webp">webp</option>
      </select>
    </label>

    <label>
      output-quality
      <input
        v-if="modelValue.outputFormat !== 'png'"
        class="mi-input"
        type="number"
        min="1"
        max="100"
        :value="modelValue.outputQuality"
        @change="set('outputQuality', Number($event.target.value))"
      />

      <span v-else class="demo-params__lossless">lossless</span>
    </label>
  </div>
</template>

<style scoped>
.demo-params {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin: 0.75rem 0;
}

/* png has no quality: the field gives way to a word */
.demo-params__lossless {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #212529;
}

.demo-params label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.8rem;
  color: #666;
}
</style>
