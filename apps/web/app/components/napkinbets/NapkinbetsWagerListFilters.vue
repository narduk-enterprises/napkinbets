<script setup lang="ts">
import type {
  NapkinbetsWagerFilterChip,
  NapkinbetsWagerListFilterValue,
} from '../../composables/useNapkinbetsWagerListFilter'

defineProps<{
  chips: NapkinbetsWagerFilterChip[]
  modelValue: NapkinbetsWagerListFilterValue
}>()

const emit = defineEmits<{
  'update:modelValue': [value: NapkinbetsWagerListFilterValue]
}>()

function select(value: NapkinbetsWagerListFilterValue) {
  emit('update:modelValue', value)
}
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <UButton
      v-for="chip in chips"
      :key="chip.value"
      size="sm"
      :color="modelValue === chip.value ? 'primary' : 'neutral'"
      :variant="modelValue === chip.value ? 'soft' : 'ghost'"
      :icon="chip.icon"
      @click="select(chip.value)"
    >
      {{ chip.label }}
    </UButton>
  </div>
</template>
