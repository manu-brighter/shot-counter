/**
 * composables/useBoardDensity.js
 *
 * The desktop card-size slider. Maps a 0–1 density value to the row metric
 * CSS variables TeamRow.vue consumes; at 0 roughly 30 teams fit on a 1080p
 * screen. Big screens (FHD+/4K, e.g. a beamer at a party) scale the
 * comfortable end up so the board fills the projection.
 */

import { ref, computed, watch } from 'vue';

import { useMediaQuery } from '@/composables/useMediaQuery';

const STORAGE_KEY = 'shot-counter.density';

function initialDensity() {
  try {
    // Number(null) is 0, so a missing key must be caught before coercion.
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const stored = Number(raw);
      if (Number.isFinite(stored) && stored >= 0 && stored <= 1) return stored;
    }
  } catch {
    // Storage blocked — fall through to the default.
  }
  // No stored preference yet — start mid-slider, a balanced default size.
  return 0.5;
}

export function useBoardDensity(smallScreen) {
  const density = ref(initialDensity());

  const xlScreen = useMediaQuery('(min-width: 1600px)');
  const uhdScreen = useMediaQuery('(min-width: 2400px)');

  watch(density, (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      // Storage blocked — the choice just won't survive a restart.
    }
  });

  const boardStyle = computed(() => {
    // Phones keep their own fixed compact layout.
    if (smallScreen.value) return undefined;

    // Upscale only the comfortable end — compact stays compact everywhere.
    const boost = uhdScreen.value ? 1.4 : (xlScreen.value ? 1.16 : 1);
    const lerp = (min, max) => min + (max * boost - min) * density.value;
    const px = (min, max) => `${Math.round(lerp(min, max))}px`;
    const rem = (min, max) => `${lerp(min, max).toFixed(3)}rem`;

    return {
      '--sc-row-pad-y': px(1, 14),
      '--sc-row-pad-x': px(10, 18),
      '--sc-row-radius': px(8, 18),
      '--sc-rank': px(18, 44),
      '--sc-rank-font': rem(0.66, 1.15),
      '--sc-name-font': rem(0.82, 1.08),
      // px on purpose — fractional odometer font sizes leak digit slivers
      '--sc-count-font': px(16, 34),
      '--sc-plus': px(24, 54),
      '--sc-minus': px(20, 42),
      '--sc-more': px(22, 40),
      '--sc-actions-gap': px(3, 10),
      '--sc-list-gap': px(2, 12),
    };
  });

  return { density, boardStyle };
}
