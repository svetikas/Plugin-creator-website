<!--
  - MIT License
  -
  - Copyright (c) 2024 JustAnyone
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

import {computed, defineProps, onMounted, onUnmounted, ref} from 'vue';

import Panel from 'primevue/panel';
import Button from 'primevue/button';

interface Props {
  title: String,
  removable?: boolean,
  heading?: "h1" | "h2" | "h3" | "h4",
  reorderable?: boolean,
  canMoveUp?: boolean,
  canMoveDown?: boolean
}
const props = defineProps<Props>()

const isCollapsed = ref(false);

defineEmits(['pop', 'moveUp', 'moveDown'])

// Attempt to fix a bug where the title is too long and overflows the panel header, despite
// the css rules that should prevent that.
const viewportWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024);

function updateViewportWidth() {
  viewportWidth.value = window.innerWidth;
}

onMounted(() => window.addEventListener('resize', updateViewportWidth));
onUnmounted(() => window.removeEventListener('resize', updateViewportWidth));

const maxTitleLength = computed(() => {
  const w = viewportWidth.value;
  if (w < 500) return 24;
  if (w < 900) return 50;
  return 90;
});

const displayTitle = computed(() => {
  const title = String(props.title ?? '');
  const max = maxTitleLength.value;
  if (title.length <= max) return title;
  return title.slice(0, max - 1).trimEnd() + '…';
});
</script>

<template>

  <Panel :collapsed="isCollapsed" toggleable class="collapsable-panel">
    <template #header>
      <div class="collapsable-header">
        <slot name="handle"></slot>
        <div class="compact" @click="isCollapsed = !isCollapsed">
          <i class="pi" :class="isCollapsed ? 'pi-chevron-right' : 'pi-chevron-down'"></i>
          <component :is="props.heading ?? 'h3'" :title="String(props.title ?? '')">{{ displayTitle }}</component>
        </div>
      </div>
    </template>
    <template #icons>
      <!--
        Fallback for reordering without dragging
      -->
      <template v-if="props.reorderable ?? false">
        <Button
            icon="pi pi-arrow-up"
            severity="secondary"
            text
            rounded
            :disabled="!(props.canMoveUp ?? true)"
            aria-label="Move up"
            title="Move up"
            @click="(e: Event) => {
              e.preventDefault();
              $emit('moveUp')
            }"
        />
        <Button
            icon="pi pi-arrow-down"
            severity="secondary"
            text
            rounded
            :disabled="!(props.canMoveDown ?? true)"
            aria-label="Move down"
            title="Move down"
            @click="(e: Event) => {
              e.preventDefault();
              $emit('moveDown')
            }"
        />
      </template>
      <Button v-if="props.removable ?? false" icon="pi pi-times" severity="danger" rounded text @click="(e: Event) => {
        e.preventDefault();
        $emit('pop')
      }" />
    </template>
    <slot></slot>
  </Panel>
</template>

<style scoped>
h1, h2, h3, h4, h5, h6 {
  word-wrap: anywhere;
  margin: 0;
}

.collapsable-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex: 1;
  min-width: 0;
}

.compact {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  flex: 1;
  min-width: 0;
  cursor: pointer;
  user-select: none;
}

.compact i {
  font-size: 0.8rem;
  color: var(--app-text-faint);
  transition: transform .15s ease;
}

:deep(h3) {
  font-size: 1rem;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.collapsable-panel :deep(.p-panel-header) {
  background: var(--app-surface-soft);
  border-radius: var(--app-radius) var(--app-radius) 0 0;
}

.collapsable-panel :deep(.p-panel-icons) {
  gap: 0.15rem;
}

.collapsable-panel :deep(.p-panel-content) {
  border-radius: 0 0 var(--app-radius) var(--app-radius);
}

.collapsable-panel {
  border-radius: var(--app-radius);
  overflow: hidden;
}
</style>
