/**
 * composables/useMediaQuery.js
 *
 * Reactive matchMedia wrapper — one listener per query, cleaned up on unmount.
 */

import { ref, onMounted, onBeforeUnmount } from 'vue';

export function useMediaQuery(query) {
  const queryList = window.matchMedia(query);
  const matches = ref(queryList.matches);
  const onChange = () => (matches.value = queryList.matches);

  onMounted(() => {
    onChange();
    queryList.addEventListener('change', onChange);
  });

  onBeforeUnmount(() => {
    queryList.removeEventListener('change', onChange);
  });

  return matches;
}
