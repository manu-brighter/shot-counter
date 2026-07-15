<template>
  <div class="shell">
    <div
      class="ambient"
      aria-hidden="true"
    />

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

    <main class="board">
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
            @delete="openConfirmDeleteDialog(team)"
          />
        </li>
      </TransitionGroup>

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
import TeamRow from '@/components/TeamRow.vue';
import ShotOdometer from '@/components/ShotOdometer.vue';
import JoinDialog from '@/components/JoinDialog.vue';

const { t, locale } = useI18n();

const {
  teams,
  rankedTeams,
  totalShots,
  loading,
  connected,
  fetchTeams,
  addTeam,
  renameTeam,
  deleteTeam,
  resetCounters,
  adjustCounter,
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
const smallScreen = ref(false);
const screenQuery = window.matchMedia('(max-width: 640px)');
const onScreenChange = () => (smallScreen.value = screenQuery.matches);

onMounted(() => {
  onScreenChange();
  screenQuery.addEventListener('change', onScreenChange);
});

onBeforeUnmount(() => {
  screenQuery.removeEventListener('change', onScreenChange);
});

const addNewTeam = async () => {
  if (!newTeam.value.name.trim()) {
    showSnackbar(t('feedback.nameRequired'), 'error');
    return;
  }
  if (submitting.value) return;
  submitting.value = true;
  try {
    await addTeam(newTeam.value.name);
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

<style scoped>
.shell {
  position: relative;
  max-width: 880px;
  margin: 0 auto;
  padding: clamp(18px, 4vw, 44px) clamp(14px, 4vw, 24px) 40px;
}

.ambient {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(1000px 480px at 50% -10%, rgba(255, 182, 39, 0.09), transparent 65%),
    radial-gradient(800px 500px at 90% 110%, rgba(208, 138, 78, 0.06), transparent 60%);
}

.topbar,
.board {
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

.stat__value {
  font-size: 1.5rem;
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
.board__loading {
  display: flex;
  justify-content: center;
  padding: 80px 0;
}

.board__list {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
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

/* FLIP reordering when a team overtakes another */
.board-move {
  transition: transform 0.5s var(--sc-ease-snap);
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

@media (prefers-reduced-motion: reduce) {
  .board__item {
    animation: none;
  }

  .board-move,
  .board-leave-active {
    transition: none;
  }
}
</style>
