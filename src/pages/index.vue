<template>
  <div class="shell">
    <div
      class="ambient"
      aria-hidden="true"
    />
    <div
      class="bubbles"
      aria-hidden="true"
    >
      <span
        v-for="n in 14"
        :key="n"
      />
    </div>

    <header class="topbar">
      <!-- Brand name — deliberately not translated. -->
      <h1 class="wordmark">
        SHOT<span class="wordmark__mark">-</span>COUNTER
      </h1>

      <div class="topbar__side">
        <div
          v-if="rankedTeams.length"
          class="stat"
        >
          <ShotOdometer
            :value="totalShots"
            class="stat__value"
          />
          <span class="stat__label">{{ t('stats.totalShots') }}</span>
        </div>

        <v-chip
          v-if="!connected && !loading"
          class="offline-chip"
          size="small"
          variant="tonal"
        >
          <v-icon
            start
            size="x-small"
          >
            $wifiOff
          </v-icon>
          {{ t('stats.reconnecting') }}
        </v-chip>

        <div class="topbar__actions">
          <v-btn
            variant="tonal"
            icon
            class="topbar__icon-btn"
            :disabled="!rankedTeams.length"
            :aria-label="t('actions.newRound')"
            :title="t('actions.newRound')"
            @click="resetDialog = true"
          >
            <v-icon>$restart</v-icon>
          </v-btn>

          <v-btn
            v-if="fullscreenSupported"
            variant="tonal"
            icon
            class="topbar__icon-btn"
            :aria-label="isFullscreen ? t('actions.exitFullscreen') : t('actions.fullscreen')"
            :title="isFullscreen ? t('actions.exitFullscreen') : t('actions.fullscreen')"
            @click="toggleFullscreen"
          >
            <v-icon>{{ isFullscreen ? '$fullscreenExit' : '$fullscreen' }}</v-icon>
          </v-btn>

          <v-btn
            variant="tonal"
            class="join-btn"
            :aria-label="t('actions.join')"
            :title="t('actions.join')"
            @click="joinDialog = true"
          >
            <v-icon
              :start="!smallScreen"
            >
              $qrcode
            </v-icon>
            <span
              v-if="!smallScreen"
              class="join-btn__label"
            >{{ t('actions.join') }}</span>
          </v-btn>

          <v-btn-toggle
            v-model="locale"
            class="locale-toggle"
            :aria-label="t('language.label')"
            mandatory
            density="compact"
            variant="text"
          >
            <v-btn
              v-for="code in SUPPORTED_LOCALES"
              :key="code"
              :value="code"
              :aria-label="t(`language.${code}`)"
              size="small"
            >
              {{ code.toUpperCase() }}
            </v-btn>
          </v-btn-toggle>
        </div>
      </div>
    </header>

    <main
      class="board"
      :style="boardStyle"
    >
      <div
        v-if="!smallScreen && rankedTeams.length"
        class="board__toolbar"
      >
        <v-slider
          v-model="density"
          class="density-slider"
          :aria-label="t('board.density')"
          :min="0"
          :max="1"
          :step="0.01"
          hide-details
          density="compact"
          color="primary"
        >
          <template #prepend>
            <v-icon
              size="small"
              class="density-slider__icon"
            >
              $viewCompact
            </v-icon>
          </template>
          <template #append>
            <v-icon
              size="small"
              class="density-slider__icon"
            >
              $viewComfy
            </v-icon>
          </template>
        </v-slider>
      </div>

      <div
        v-if="loading"
        class="board__loading"
      >
        <v-progress-circular
          indeterminate
          color="primary"
        />
      </div>

      <TransitionGroup
        v-else-if="rankedTeams.length"
        name="board"
        tag="ol"
        class="board__list"
      >
        <li
          v-for="(team, index) in rankedTeams"
          :key="team.id"
          class="board__item"
          :style="{ '--i': index }"
        >
          <TeamRow
            :team="team"
            :rank="index + 1"
            @increment="onAdjust(team, 'increment')"
            @decrement="onAdjust(team, 'decrement')"
            @rename="(name) => onRename(team, name)"
            @set-count="(value) => onSetCount(team, value)"
            @count-invalid="showSnackbar(t('feedback.countInvalid'), 'error')"
            @delete="openConfirmDeleteDialog(team)"
          />
        </li>
      </TransitionGroup>

      <div
        v-else-if="!loaded"
        class="board__unreachable"
      >
        <v-icon
          size="40"
          class="board__unreachable-icon"
        >
          $wifiOff
        </v-icon>
        <p class="board__unreachable-title">
          {{ t('feedback.loadFailed') }}
        </p>
        <p class="board__unreachable-hint">
          {{ t('stats.reconnecting') }}
        </p>
      </div>

      <div
        v-else
        class="empty"
      >
        <svg
          class="empty__glass"
          viewBox="0 0 120 140"
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id="emptyPour"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0"
                stop-color="#ffc93c"
              />
              <stop
                offset="1"
                stop-color="#d98e00"
              />
            </linearGradient>
          </defs>
          <path
            d="M39 82 L44 120 H76 L81 82 Z"
            fill="url(#emptyPour)"
          />
          <path
            d="M30 16 L44 126 H76 L90 16 Z"
            fill="none"
            stroke="currentColor"
            stroke-width="5"
            stroke-linejoin="round"
          />
        </svg>
        <p class="empty__title">
          {{ t('empty.title') }}
        </p>
        <p class="empty__hint">
          {{ t('empty.hint') }}
        </p>
        <v-btn
          color="primary"
          variant="flat"
          size="large"
          class="cta-btn"
          @click="openDialog"
        >
          <v-icon start>
            $plus
          </v-icon>
          {{ t('actions.addTeam') }}
        </v-btn>
      </div>

      <div
        v-if="rankedTeams.length"
        class="board__footer"
      >
        <v-btn
          color="primary"
          variant="flat"
          size="large"
          class="cta-btn"
          @click="openDialog"
        >
          <v-icon start>
            $plus
          </v-icon>
          {{ t('actions.addTeam') }}
        </v-btn>
      </div>
    </main>

    <footer class="footer">
      <span>
        {{ t('footer.credit') }}
        <a
          class="footer__link"
          href="https://manuelheller.dev"
          target="_blank"
          rel="noopener"
        >Manuel Heller</a>
      </span>
      <span class="footer__sep">·</span>
      <a
        class="footer__link"
        href="https://github.com/manu-brighter/shot-counter"
        target="_blank"
        rel="noopener"
      >{{ t('footer.github') }}</a>
    </footer>

    <v-dialog
      v-model="addTeamDialog"
      max-width="400"
    >
      <v-card class="sc-dialog-card">
        <v-card-title>{{ t('addDialog.title') }}</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newTeam.name"
            :label="t('addDialog.label')"
            autofocus
            @keyup.enter="addNewTeam"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="closeDialog"
          >
            {{ t('actions.cancel') }}
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="submitting"
            :disabled="submitting"
            @click="addNewTeam"
          >
            {{ t('actions.confirm') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="confirmDeleteDialog"
      max-width="400"
    >
      <v-card class="sc-dialog-card">
        <v-card-title>{{ t('deleteDialog.title') }}</v-card-title>
        <v-card-text>
          <i18n-t
            keypath="deleteDialog.text"
            tag="span"
            scope="global"
          >
            <template #name>
              <strong>{{ pendingDeleteTeam?.name }}</strong>
            </template>
          </i18n-t>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="cancelDelete"
          >
            {{ t('actions.cancel') }}
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            @click="confirmDelete"
          >
            {{ t('actions.confirm') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="resetDialog"
      max-width="400"
    >
      <v-card class="sc-dialog-card">
        <v-card-title>{{ t('resetDialog.title') }}</v-card-title>
        <v-card-text>
          {{ t('resetDialog.text') }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="resetDialog = false"
          >
            {{ t('actions.cancel') }}
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            @click="confirmReset"
          >
            {{ t('actions.confirm') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <JoinDialog v-model="joinDialog" />

    <v-snackbar
      v-model="snackbar"
      :color="snackbarColor"
      :timeout="3000"
      location="bottom"
    >
      {{ snackbarMessage }}
      <template #actions>
        <v-btn
          variant="text"
          @click="snackbar = false"
        >
          {{ t('actions.close') }}
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import confetti from 'canvas-confetti';

import { SUPPORTED_LOCALES } from '@/plugins/i18n';
import { useTeams } from '@/composables/useTeams';
import { useMediaQuery } from '@/composables/useMediaQuery';
import { useBoardDensity } from '@/composables/useBoardDensity';
import TeamRow from '@/components/TeamRow.vue';
import ShotOdometer from '@/components/ShotOdometer.vue';
import JoinDialog from '@/components/JoinDialog.vue';

const { t, locale } = useI18n();

const {
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
} = useTeams();

const addTeamDialog = ref(false);
const confirmDeleteDialog = ref(false);
const resetDialog = ref(false);
const joinDialog = ref(false);
const newTeam = ref({ name: '' });
const pendingDeleteId = ref(null);
const submitting = ref(false);

const snackbar = ref(false);
const snackbarMessage = ref('');
const snackbarColor = ref('success');

function showSnackbar(message, color = 'success') {
  snackbarMessage.value = message;
  snackbarColor.value = color;
  snackbar.value = true;
}

const pendingDeleteTeam = computed(() => teams.value.find((item) => item.id === pendingDeleteId.value));

// The join button collapses to an icon on phones.
const smallScreen = useMediaQuery('(max-width: 640px)');

// Desktop card-size slider — compact fits ~30 teams on a 1080p screen.
const { density, boardStyle } = useBoardDensity(smallScreen);

// Fullscreen via the HTML API, so it works in the desktop app and in every
// browser on the LAN alike. Electron additionally maps F11 (main.cjs).
// Hidden where the API doesn't exist (iPhone Safari).
const fullscreenSupported = document.fullscreenEnabled ?? false;
const isFullscreen = ref(false);
const onFullscreenChange = () => (isFullscreen.value = Boolean(document.fullscreenElement));

onMounted(() => {
  document.addEventListener('fullscreenchange', onFullscreenChange);
});

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', onFullscreenChange);
});

const toggleFullscreen = () => {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    document.documentElement.requestFullscreen().catch(() => {});
  }
};

const addNewTeam = async () => {
  const name = newTeam.value.name.trim();
  if (!name) {
    showSnackbar(t('feedback.nameRequired'), 'error');
    return;
  }
  if (submitting.value) return;
  submitting.value = true;
  try {
    await addTeam(name);
    closeDialog();
    await fetchTeams();
    showSnackbar(t('feedback.teamAdded'));
  } catch (err) {
    console.error('Error adding team:', err);
    showSnackbar(t('feedback.addFailed'), 'error');
  } finally {
    submitting.value = false;
  }
};

const onAdjust = async (team, direction) => {
  try {
    await adjustCounter(team, direction);
  } catch (err) {
    console.error(`Error running ${direction}:`, err);
    showSnackbar(t('feedback.counterFailed'), 'error');
  }
};

const onSetCount = async (team, value) => {
  try {
    await setCounter(team, value);
  } catch (err) {
    console.error('Error setting counter:', err);
    showSnackbar(t('feedback.counterFailed'), 'error');
  }
};

const onRename = async (team, name) => {
  if (!name) {
    showSnackbar(t('feedback.nameEmpty'), 'error');
    return;
  }
  const original = team.name;
  team.name = name;
  try {
    await renameTeam(team.id, name);
  } catch (err) {
    console.error('Error updating team name:', err);
    team.name = original;
    showSnackbar(t('feedback.renameFailed'), 'error');
  }
};

const openConfirmDeleteDialog = (team) => {
  pendingDeleteId.value = team.id;
  confirmDeleteDialog.value = true;
};

const cancelDelete = () => {
  confirmDeleteDialog.value = false;
  pendingDeleteId.value = null;
};

const confirmDelete = async () => {
  try {
    await deleteTeam(pendingDeleteId.value);
    showSnackbar(t('feedback.teamDeleted'));
    await fetchTeams();
  } catch (err) {
    console.error('Error deleting team:', err);
    showSnackbar(t('feedback.deleteFailed'), 'error');
  } finally {
    cancelDelete();
  }
};

const confirmReset = async () => {
  resetDialog.value = false;
  try {
    await resetCounters();
    await fetchTeams();
    showSnackbar(t('feedback.roundReset'));
  } catch (err) {
    console.error('Error resetting counters:', err);
    showSnackbar(t('feedback.resetFailed'), 'error');
  }
};

const openDialog = () => (addTeamDialog.value = true);
const closeDialog = () => {
  addTeamDialog.value = false;
  newTeam.value = { name: '' };
};

watch(addTeamDialog, (val) => {
  if (!val) newTeam.value = { name: '' };
});

watch(confirmDeleteDialog, (val) => {
  if (!val) pendingDeleteId.value = null;
});

// Another device may delete the team while our confirm dialog is open — the
// dialog would then show an empty name and confirm into a 404.
watch(pendingDeleteTeam, (team) => {
  if (confirmDeleteDialog.value && !team) cancelDelete();
});

// Gold confetti when the lead changes hands. Guarded so deletions and
// resets don't celebrate anything.
let confettiFire = null;

const fireConfetti = () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!confettiFire) {
    const canvas = document.createElement('canvas');
    canvas.className = 'confetti-canvas';
    document.body.appendChild(canvas);
    // Own instance: the library's default fire() spawns a blob worker,
    // which helmet's CSP blocks in the packaged app.
    confettiFire = confetti.create(canvas, { resize: true, useWorker: false });
  }
  confettiFire({
    particleCount: 110,
    spread: 75,
    startVelocity: 42,
    origin: { x: 0.5, y: 0.3 },
    colors: ['#ffc93c', '#ffb627', '#f6eedc', '#d08a4e'],
  });
};

watch(() => rankedTeams.value[0]?.id, (newId, oldId) => {
  if (newId === undefined || oldId === undefined || newId === oldId) return;
  const oldStillThere = teams.value.some((team) => team.id === oldId);
  const leader = rankedTeams.value[0];
  if (!oldStillThere || !leader || leader.counter === 0) return;
  fireConfetti();
});
</script>

<style lang="scss" scoped>
.shell {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  max-width: 880px;
  margin: 0 auto;
  padding: clamp(18px, 4vw, 44px) clamp(14px, 4vw, 24px) 28px;
}

/* --- Ambient backdrop: breathing bar light, rising bubbles, fine grain.
       All of it sits behind the content and stays quiet. --- */

.ambient {
  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.ambient::before,
.ambient::after {
  content: '';
  position: absolute;
  inset: -25%;
  will-change: transform, opacity;
}

.ambient::before {
  background: radial-gradient(42% 34% at 50% 12%, rgba(255, 182, 39, 0.20), transparent 70%);
  animation: glow-drift-a 38s ease-in-out infinite alternate;
}

.ambient::after {
  background: radial-gradient(36% 32% at 84% 92%, rgba(208, 138, 78, 0.14), transparent 70%);
  animation: glow-drift-b 52s ease-in-out infinite alternate;
}

@keyframes glow-drift-a {
  from {
    transform: translate3d(-3%, -1%, 0) scale(1);
    opacity: 0.75;
  }

  to {
    transform: translate3d(3%, 2%, 0) scale(1.18);
    opacity: 1;
  }
}

@keyframes glow-drift-b {
  from {
    transform: translate3d(2%, 2%, 0) scale(1.12);
    opacity: 1;
  }

  to {
    transform: translate3d(-3%, -2%, 0) scale(1);
    opacity: 0.7;
  }
}

/* Bubbles — like carbonation in a glass, barely there */
.bubbles {
  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.bubbles span {
  position: absolute;
  bottom: -3vh;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, rgba(255, 214, 130, 0.65), rgba(255, 182, 39, 0.22) 65%, transparent);
  animation: bubble-rise linear infinite;
  will-change: transform, opacity;
}

@keyframes bubble-rise {
  0% {
    transform: translate3d(0, 0, 0);
    opacity: 0;
  }

  10% {
    opacity: var(--bubble-o, 0.12);
  }

  85% {
    opacity: var(--bubble-o, 0.12);
  }

  100% {
    transform: translate3d(var(--bubble-sway, 24px), -108vh, 0);
    opacity: 0;
  }
}

// left %, size, duration, delay, horizontal sway, peak opacity
$bubbles: (
  (6%, 6px, 26s, -2s, 26px, 0.2),
  (13%, 4px, 34s, -12s, -18px, 0.14),
  (21%, 7px, 22s, -7s, 22px, 0.22),
  (28%, 5px, 30s, -18s, -26px, 0.16),
  (36%, 4px, 38s, -5s, 16px, 0.12),
  (44%, 6px, 24s, -15s, -20px, 0.2),
  (52%, 5px, 32s, -9s, 28px, 0.16),
  (60%, 7px, 21s, -3s, -16px, 0.22),
  (67%, 4px, 36s, -20s, 20px, 0.12),
  (74%, 6px, 27s, -11s, -24px, 0.18),
  (81%, 5px, 33s, -6s, 18px, 0.16),
  (88%, 7px, 23s, -16s, -22px, 0.22),
  (94%, 4px, 39s, -1s, 14px, 0.12),
  (47%, 4px, 41s, -23s, -14px, 0.11),
);

@for $i from 1 through length($bubbles) {
  $b: nth($bubbles, $i);

  .bubbles span:nth-child(#{$i}) {
    left: nth($b, 1);
    width: nth($b, 2);
    height: nth($b, 2);
    animation-duration: nth($b, 3);
    animation-delay: nth($b, 4);
    --bubble-sway: #{nth($b, 5)};
    --bubble-o: #{nth($b, 6)};
  }
}

.topbar,
.board,
.footer {
  position: relative;
}

/* Header */
.topbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px 20px;
  margin-bottom: clamp(20px, 4vw, 36px);
}

.wordmark {
  margin: 0;
  font-family: var(--sc-display);
  font-weight: 400;
  font-size: clamp(1.7rem, 5vw, 2.3rem);
  letter-spacing: 0.05em;
  line-height: 1;
  color: var(--sc-cream);
}

.wordmark__mark {
  color: var(--sc-amber);
}

.topbar__side {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px 18px;
  margin-left: auto;
}

.stat {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

/* Integer px — fractional odometer font sizes leak digit slivers */
.stat__value {
  font-size: 24px;
  color: var(--sc-amber);
}

.stat__label {
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--sc-faded);
}

.offline-chip {
  color: var(--sc-amber);
}

.topbar__actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.topbar__icon-btn {
  width: 40px;
  height: 40px;
}

.join-btn {
  height: 40px;
}

.locale-toggle {
  height: 40px;
  border: 1px solid var(--sc-line);
  border-radius: 999px;
  overflow: hidden;
}

.locale-toggle :deep(.v-btn) {
  height: 100% !important;
  border-radius: 0;
  color: var(--sc-faded);
}

.locale-toggle :deep(.v-btn--active) {
  background: var(--sc-amber);
  color: var(--sc-amber-ink);
}

.locale-toggle :deep(.v-btn--active .v-btn__overlay) {
  opacity: 0;
}

/* Board */
.board__toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}

.density-slider {
  max-width: 210px;
}

.density-slider__icon {
  color: var(--sc-faded);
  opacity: 0.7;
}

.board__loading {
  display: flex;
  justify-content: center;
  padding: 80px 0;
}

/* Server unreachable — distinct from an empty board */
.board__unreachable {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 64px 16px;
  text-align: center;
}

.board__unreachable-icon {
  color: var(--sc-faded);
  opacity: 0.8;
}

.board__unreachable-title {
  margin: 0;
  font-family: var(--sc-display);
  font-size: 1.2rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--sc-cream);
}

.board__unreachable-hint {
  margin: 0;
  color: var(--sc-faded);
}

.board__list {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--sc-list-gap, 12px);
  margin: 0;
  padding: 0;
  list-style: none;
}

.board__item {
  animation: row-in 0.45s var(--sc-ease-snap) both;
  animation-delay: min(calc(var(--i) * 45ms), 450ms);
}

@keyframes row-in {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
}

/* FLIP reordering when a team overtakes another — slow and glassy on purpose,
   the takeover moment is meant to be watched across the room */
.board-move {
  transition: transform 1.1s cubic-bezier(0.35, 0, 0.15, 1);
  will-change: transform;
}

.board-leave-active {
  position: absolute;
  width: 100%;
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.board-leave-to {
  opacity: 0;
  transform: scale(0.96);
}

.board__footer {
  display: flex;
  justify-content: center;
  margin-top: 26px;
}

.cta-btn {
  box-shadow: 0 4px 18px rgba(255, 182, 39, 0.22);
}

/* Empty state */
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 56px 16px 64px;
  text-align: center;
}

.empty__glass {
  width: 96px;
  margin-bottom: 18px;
  color: var(--sc-faded);
  opacity: 0.9;
}

.empty__title {
  margin: 0;
  font-family: var(--sc-display);
  font-size: 1.5rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--sc-cream);
}

.empty__hint {
  margin: 0 0 22px;
  color: var(--sc-faded);
}

/* Footer credit */
.footer {
  display: flex;
  justify-content: center;
  align-items: baseline;
  gap: 8px;
  margin-top: auto;
  padding-top: 36px;
  font-size: 0.78rem;
  letter-spacing: 0.02em;
  color: var(--sc-faded);
  opacity: 0.75;
}

.footer__link {
  color: inherit;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: color 0.15s ease, border-color 0.15s ease;
}

.footer__link:hover,
.footer__link:focus-visible {
  color: var(--sc-amber);
  border-color: var(--sc-amber);
}

.footer__sep {
  opacity: 0.6;
}

/* Phones: two tight header lines — brand, then stat + controls — and a
   full-width add button */
@media (max-width: 640px) {
  .topbar {
    row-gap: 14px;
    margin-bottom: 18px;
    justify-content: space-between;
  }

  /* Dissolve the side wrapper: brand + stat share the first line, the
     controls form a full-width second line with the language switch right. */
  .topbar__side {
    display: contents;
  }

  .topbar__actions {
    width: 100%;
    gap: 8px;
  }

  .topbar__actions .locale-toggle {
    margin-left: auto;
  }

  .topbar__icon-btn {
    width: 38px;
    height: 38px;
  }

  .join-btn {
    min-width: 38px;
    width: 38px;
    height: 38px;
    padding: 0;
  }

  .locale-toggle {
    height: 38px;
  }

  .board__footer {
    margin-top: 18px;
  }

  .cta-btn {
    width: 100%;
  }
}

/* Big screens (beamer at the party): let the board fill the projection */
@media (min-width: 1600px) {
  .shell {
    max-width: 1150px;
  }

  .wordmark {
    font-size: 2.8rem;
  }

  .stat__value {
    font-size: 27px;
  }
}

@media (min-width: 2400px) {
  .shell {
    max-width: 1500px;
  }

  .wordmark {
    font-size: 3.4rem;
  }

  .stat__value {
    font-size: 32px;
  }

  .topbar__icon-btn,
  .join-btn,
  .locale-toggle {
    height: 46px;
  }

  .footer {
    font-size: 0.9rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .board__item {
    animation: none;
  }

  .board-move,
  .board-leave-active {
    transition: none;
  }

  .ambient::before,
  .ambient::after {
    animation: none;
  }

  .bubbles {
    display: none;
  }
}
</style>
