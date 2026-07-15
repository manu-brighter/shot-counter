<template>
  <span
    class="odometer"
    role="img"
    :aria-label="String(value)"
  >
    <span
      v-for="column in columns"
      :key="column.key"
      class="odometer__column"
      aria-hidden="true"
    >
      <span
        class="odometer__strip"
        :style="{ transform: `translateY(-${column.digit}em)` }"
      >
        <span
          v-for="n in 10"
          :key="n - 1"
          class="odometer__cell"
        >{{ n - 1 }}</span>
      </span>
    </span>
  </span>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  value: { type: Number, required: true },
});

// Columns are keyed by their place value (ones, tens, …) so an existing digit
// rolls in place instead of being re-created when the number gains a digit.
const columns = computed(() => {
  const digits = String(Math.max(0, Math.trunc(props.value))).split('');
  return digits.map((digit, index) => ({
    key: digits.length - index,
    digit: Number(digit),
  }));
});
</script>

<style scoped>
.odometer {
  display: inline-flex;
  overflow: hidden;
  height: 1em;
  line-height: 1;
  font-family: var(--sc-display);
  font-variant-numeric: tabular-nums;
}

.odometer__column {
  display: inline-block;
  height: 1em;
}

.odometer__strip {
  display: flex;
  flex-direction: column;
  transition: transform 0.55s var(--sc-ease-snap);
}

.odometer__cell {
  height: 1em;
  line-height: 1;
  text-align: center;
}

@media (prefers-reduced-motion: reduce) {
  .odometer__strip {
    transition: none;
  }
}
</style>
