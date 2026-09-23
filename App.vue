<script setup>
/**
 * The demo page: choose the parameters, run the component, look at what it gave
 * back. Everything visible lives in the three components below; this file only
 * holds the state and decides which of them is on screen.
 *
 * Nothing here belongs to the component itself — it is an example of use.
 */
import { ref } from 'vue';

import MagicImage from './src/MagicImage.vue';
import DemoParams from './DemoParams.vue';
import ShowResult from './ShowResult.vue';
import InstallMagicImage from './InstallMagicImage.vue';
import './src/assets/style.css';

const params = ref({});
const ready = ref(false);
const result = ref(null);

function onSave(payload) {
  result.value = payload;
  ready.value = false;
}

// «Cancel» inside the component brings the parameters back
function onStage(stage) {
  if (stage === 'empty') ready.value = false;
}
</script>

<template>
  <div class="demo">
    <DemoParams v-if="!ready" v-model:params="params" v-model:ready="ready" />

    <MagicImage v-else v-bind="params" @stage="onStage" @save="onSave" />

    <template v-if="!ready">
      <ShowResult :result="result" />

      <InstallMagicImage :params="params" />
    </template>
  </div>
</template>
