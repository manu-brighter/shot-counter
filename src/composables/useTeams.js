/**
 * composables/useTeams.js
 *
 * Data layer for the leaderboard: REST mutations plus live sync. The server
 * pushes the full team list over SSE on every mutation, so all devices stay
 * in step; while the stream is down, a slow poll covers the gap and the
 * stream is re-created.
 */

import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

// Relative in production: the packaged app serves the SPA from the same Express
// instance that hosts the API, so the port needn't be baked into the bundle.
export const API_BASE = import.meta.env.VITE_API_BASE_URL
  ?? (import.meta.env.DEV ? 'http://localhost:5000' : '');

const FALLBACK_POLL_MS = 4000;

async function request(path, options) {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function useTeams() {
  const teams = ref([]);
  const loading = ref(true);
  // True once any team list arrived. Distinguishes "the board is empty" from
  // "the server was never reachable" — those need different empty screens.
  const loaded = ref(false);
  // False while the SSE stream is down — the UI shows a "reconnecting" hint,
  // because a party app that silently stops syncing is worse than one that
  // says so.
  const connected = ref(false);

  const rankedTeams = computed(() => {
    return [...teams.value].sort((a, b) => b.counter - a.counter || a.id - b.id);
  });

  const totalShots = computed(() => teams.value.reduce((sum, team) => sum + team.counter, 0));

  const fetchTeams = async () => {
    try {
      teams.value = await request('/api/teams');
      loaded.value = true;
    } finally {
      loading.value = false;
    }
  };

  const addTeam = (name) => request('/api/teams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });

  const renameTeam = (id, name) => request(`/api/teams/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });

  const deleteTeam = (id) => request(`/api/teams/${id}`, { method: 'DELETE' });

  const resetCounters = () => request('/api/teams/reset', { method: 'POST' });

  // Optimistic counter change: bump immediately so the odometer reacts on the
  // tap, then reconcile with the server's answer (and the SSE broadcast).
  const adjustCounter = async (team, direction) => {
    const entry = teams.value.find((item) => item.id === team.id);
    if (!entry) return;
    const before = entry.counter;
    entry.counter = direction === 'increment' ? before + 1 : Math.max(0, before - 1);
    try {
      const updated = await request(`/api/teams/${team.id}/${direction}`, { method: 'POST' });
      entry.counter = updated.counter;
    } catch (err) {
      entry.counter = before;
      throw err;
    }
  };

  // Absolute set, same optimistic pattern as adjustCounter.
  const setCounter = async (team, value) => {
    const entry = teams.value.find((item) => item.id === team.id);
    if (!entry) return;
    const before = entry.counter;
    entry.counter = value;
    try {
      const updated = await request(`/api/teams/${team.id}/counter`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ counter: value }),
      });
      entry.counter = updated.counter;
    } catch (err) {
      entry.counter = before;
      throw err;
    }
  };

  let eventSource = null;
  let fallbackTimer = null;

  function openStream() {
    eventSource?.close();
    eventSource = new EventSource(`${API_BASE}/api/events`);
    eventSource.addEventListener('teams', (event) => {
      teams.value = JSON.parse(event.data);
      loaded.value = true;
      loading.value = false;
    });
    eventSource.onopen = () => (connected.value = true);
    eventSource.onerror = () => (connected.value = false);
  }

  // Safety net while the stream is down: poll slowly and re-create a stream
  // the browser gave up on (EventSource stops retrying after a non-200).
  function pollWhileDisconnected() {
    if (eventSource?.readyState === EventSource.OPEN) return;
    if (eventSource?.readyState === EventSource.CLOSED) openStream();
    fetchTeams().catch(() => {});
  }

  // Phones lock and tabs sleep; catch up the moment we're visible again.
  function onVisible() {
    if (document.visibilityState !== 'visible') return;
    if (eventSource?.readyState === EventSource.CLOSED) openStream();
    fetchTeams().catch(() => {});
  }

  onMounted(() => {
    openStream();
    fallbackTimer = setInterval(pollWhileDisconnected, FALLBACK_POLL_MS);
    document.addEventListener('visibilitychange', onVisible);
  });

  onBeforeUnmount(() => {
    eventSource?.close();
    clearInterval(fallbackTimer);
    document.removeEventListener('visibilitychange', onVisible);
  });

  return {
    teams,
    rankedTeams,
    totalShots,
    loading,
    loaded,
    connected,
    fetchTeams,
    addTeam,
    renameTeam,
    deleteTeam,
    resetCounters,
    adjustCounter,
    setCounter,
  };
}
