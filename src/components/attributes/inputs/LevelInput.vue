<!--
  - MIT License
  -
  - Copyright (c) 2023 JustAnyone
  -
  - Permission is hereby granted, free of charge, to any person obtaining a copy
  - of this software and associated documentation files (the "Software"), to deal
  - in the Software without restriction, including without limitation the rights
  - to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  - copies of the Software, and to permit persons to whom the Software is
  - furnished to do so, subject to the following conditions:
  -
  - The above copyright notice and this permission notice shall be included in all
  - copies or substantial portions of the Software.
  -
  - THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  - IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  - FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  - AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  - LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  - OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  - SOFTWARE.
  -
  -->

<script setup lang="ts">
import {LevelAttribute} from '@/core/attribute/LevelAttribute';
interface Props {
  attribute: LevelAttribute
}
const props = defineProps<Props>()
</script>

<template>
  <div class="radio-group" role="radiogroup">
    <label>
      <input
          type="radio"
          :checked="props.attribute.value === 1"
          @input="props.attribute.value = 1"
      />
      Poor
    </label>

    <label>
      <input
          type="radio"
          :checked="props.attribute.value === 2"
          @input="props.attribute.value = 2"
      />
      Middle
    </label>

    <label>
      <input
          type="radio"
          :checked="props.attribute.value === 3"
          @input="props.attribute.value = 3"
      />
      Rich
    </label>
  </div>
</template>

<style scoped>
.radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.radio-group label {
  display: inline-flex !important;
  align-items: center;
  gap: 0.45rem;
  margin: 0 !important;
  padding: 0.45rem 0.85rem;
  font-weight: 500 !important;
  background: var(--app-surface);
  border: 1px solid var(--app-border-strong);
  border-radius: var(--app-radius-sm);
  cursor: pointer;
  transition: border-color .15s ease, background-color .15s ease;
}

.radio-group label:hover {
  border-color: var(--app-text-faint);
}

.radio-group label:has(input:checked) {
  background: var(--app-primary-soft);
  border-color: var(--app-primary);
  color: var(--app-primary-dark);
}

.radio-group label:has(input:disabled) {
  opacity: 0.6;
  cursor: not-allowed;
}

.radio-group input {
  margin: 0;
  accent-color: var(--app-primary);
}
</style>
