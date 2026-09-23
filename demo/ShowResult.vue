<script setup>
/** The two files the component gave back, with a way to look at them. */
defineProps({
  // { original, crop } or null while nothing has been saved yet
  result: { type: Object, default: null },
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
  <section v-if="result" class="show-result">
    <h2 class="show-result__title">save</h2>

    <p>
      original: {{ describe(result.original) }}
      <button type="button" class="mi-btn" @click="download(result.original)">download</button>
    </p>

    <p>
      crop: {{ describe(result.crop) }}
      <button type="button" class="mi-btn" @click="download(result.crop)">download</button>
    </p>
  </section>
</template>

<style scoped>
.show-result {
  margin-top: 1.5rem;
}

.show-result__title {
  margin: 1.25rem 0 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #888;
}

.show-result p {
  margin: 0.5rem 0;
}
</style>
