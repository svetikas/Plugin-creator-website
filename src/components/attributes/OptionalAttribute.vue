<script setup lang="ts">
import Attribute from "@/components/attributes/Attribute.vue";
import Button from 'primevue/button';
interface Props {
  name: string
  description: string
  errors: Array<string>
}

const props = defineProps<Props>()
defineEmits(['pop', 'raiseError'])
</script>

<template>
  <Attribute
      :name="props.name"
      :description="props.description"
      :errors="props.errors"
      @raise-error="$emit('raiseError')"
  >
    <template #actions>
      <Button icon="pi pi-times" severity="danger" rounded text aria-label="Remove attribute" title="Remove attribute" @click="(e: Event) => {
        e.preventDefault();
        $emit('pop')
      }" />
    </template>
    <slot></slot>
  </Attribute>
</template>
