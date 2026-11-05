<script setup lang="ts">
import {BooleanAttribute} from '@/core/attribute/BooleanAttribute';
interface Props {
  attribute: BooleanAttribute,
  labelTrue?: string
  labelFalse?: string
}
const props = defineProps<Props>()
</script>

<template>
  <div class="radio-group" role="radiogroup">
    <label>
      <input
        type="radio"
        :disabled="props.attribute.readOnly"
        :checked="props.attribute.value === true"
        @input="props.attribute.value = true"
      />
      {{ labelTrue || "True" }}
    </label>

    <label>
      <input
        type="radio"
        :disabled="props.attribute.readOnly"
        :checked="props.attribute.value === false"
        @input="props.attribute.value = false"
      />
      {{ labelFalse || "False" }}
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
