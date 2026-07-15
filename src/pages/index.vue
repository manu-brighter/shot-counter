<template>
  <v-container>
    <v-card
      class="mx-auto my-5 score-card"
    >
      <v-card-title class="d-flex align-center ga-4">
        <!-- Brand name — deliberately not translated. -->
        <h1 class="card-title-heading">
          SHOT-COUNTER
        </h1>
        <v-spacer />
        <v-btn-toggle
          v-model="locale"
          :aria-label="t('language.label')"
          mandatory
          density="compact"
          variant="outlined"
          divided
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
      </v-card-title>
      <v-card-text>
        <v-data-table
          :items="rankedTeams"
          :headers="headers"
          :loading="loading"
          class="elevation-1"
          density="compact"
          hide-default-footer
        >
          <!-- This slot replaces the whole tbody, so the empty state has to be
               rendered here — v-data-table's own no-data-text never shows. -->
          <template #body="{ items }">
            <tr v-if="!items.length && !loading">
              <td
                :colspan="headers.length"
                class="text-center text-medium-emphasis py-8"
              >
                {{ t('table.noTeams') }}
              </td>
            </tr>
            <tr
              v-for="(team, index) in items"
              :key="team.id"
              :class="{ 'golden-glow': index === 0 }"
            >
              <td>{{ index + 1 }}</td>
              <td>
                <button
                  v-if="editingTeamId !== team.id"
                  type="button"
                  class="team-name-btn"
                  @click="startEditing(team)"
                >
                  {{ team.name }}
                  <v-icon
                    size="small"
                    class="team-name__edit-icon"
                  >
                    $edit
                  </v-icon>
                </button>
                <v-text-field
                  v-else
                  v-model="team.name"
                  variant="outlined"
                  density="compact"
                  hide-details="true"
                  autofocus
                  :aria-label="t('actions.editTeamName')"
                  @blur="saveTeamName(team)"
                  @keyup.enter="saveTeamName(team)"
                />
              </td>
              <td class="counter-column">
                <Transition
                  name="counter-bump"
                  mode="out-in"
                >
                  <span
                    :key="team.counter"
                    class="counter-value"
                  >{{ team.counter }}</span>
                </Transition>
              </td>
              <td class="actions-column">
                <v-btn
                  size="x-large"
                  icon
                  :aria-label="t('actions.addShot')"
                  @click="adjustCounter(team, 'increment')"
                >
                  <v-icon>$plus</v-icon>
                </v-btn>
                <v-btn
                  size="x-large"
                  icon
                  :aria-label="t('actions.removeShot')"
                  @click="adjustCounter(team, 'decrement')"
                >
                  <v-icon>$minus</v-icon>
                </v-btn>
                <v-btn
                  size="small"
                  icon
                  color="error"
                  class="ml-4"
                  :aria-label="t('actions.deleteTeam', { name: team.name })"
                  @click="openConfirmDeleteDialog(team)"
                >
                  <v-icon>$delete</v-icon>
                </v-btn>
              </td>
            </tr>
          </template>
        </v-data-table>
      </v-card-text>
      <v-card-actions>
        <v-btn
          color="primary"
          @click="openDialog"
        >
          {{ t('actions.addTeam') }}
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-dialog
      v-model="addTeamDialog"
      max-width="400"
    >
      <v-card>
        <v-card-title>{{ t('addDialog.title') }}</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newTeam.name"
            :label="t('addDialog.label')"
            variant="outlined"
            density="compact"
            @keyup.enter="addTeam"
          />
        </v-card-text>
        <v-card-actions>
          <v-btn
            variant="text"
            @click="closeDialog"
          >
            {{ t('actions.cancel') }}
          </v-btn>
          <v-btn
            color="primary"
            :loading="submitting"
            :disabled="submitting"
            @click="addTeam"
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
      <v-card>
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
          <v-btn
            variant="text"
            @click="cancelDelete"
          >
            {{ t('actions.cancel') }}
          </v-btn>
          <v-btn
            color="error"
            @click="confirmDelete"
          >
            {{ t('actions.confirm') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { SUPPORTED_LOCALES } from '@/plugins/i18n';

const { t, locale } = useI18n();

// Relative in production: the packaged app serves the SPA from the same Express
// instance that hosts the API, so the port needn't be baked into the bundle.
const API_BASE = import.meta.env.VITE_API_BASE_URL
  ?? (import.meta.env.DEV ? 'http://localhost:5000' : '');

const headers = computed(() => [
  { title: t('table.rank'), key: 'rank', sortable: false },
  { title: t('table.teamName'), key: 'name' },
  { title: t('table.shots'), key: 'counter' },
  { title: t('table.actions'), key: 'actions', sortable: false },
]);

const teams = ref([]);
const addTeamDialog = ref(false);
const confirmDeleteDialog = ref(false);
const newTeam = ref({ name: '' });
const pendingDeleteId = ref(null);
const editingTeamId = ref(null);
const editingOriginalName = ref('');
const loading = ref(false);
const submitting = ref(false);

const snackbar = ref(false);
const snackbarMessage = ref('');
const snackbarColor = ref('success');

function showSnackbar(message, color = 'success') {
  snackbarMessage.value = message;
  snackbarColor.value = color;
  snackbar.value = true;
}

const rankedTeams = computed(() => {
  return [...teams.value].sort((a, b) => b.counter - a.counter || a.id - b.id);
});

const pendingDeleteTeam = computed(() => teams.value.find((item) => item.id === pendingDeleteId.value));

const fetchTeams = async () => {
  loading.value = true;
  try {
    const res = await fetch(`${API_BASE}/api/teams`);
    if (!res.ok) throw new Error(await res.text());
    teams.value = await res.json();
  } catch (err) {
    console.error('Error fetching teams:', err);
    showSnackbar(t('feedback.loadFailed'), 'error');
  } finally {
    loading.value = false;
  }
};

const addTeam = async () => {
  if (!newTeam.value.name.trim()) {
    showSnackbar(t('feedback.nameRequired'), 'error');
    return;
  }
  if (submitting.value) return;
  submitting.value = true;
  try {
    const res = await fetch(`${API_BASE}/api/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newTeam.value.name }),
    });
    if (!res.ok) throw new Error(await res.text());
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

const startEditing = (team) => {
  editingTeamId.value = team.id;
  editingOriginalName.value = team.name;
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
    const res = await fetch(`${API_BASE}/api/teams/${pendingDeleteId.value}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(await res.text());
    showSnackbar(t('feedback.teamDeleted'));
    await fetchTeams();
  } catch (err) {
    console.error('Error deleting team:', err);
    showSnackbar(t('feedback.deleteFailed'), 'error');
  } finally {
    cancelDelete();
  }
};

async function adjustCounter(team, direction) {
  if (direction === 'decrement' && team.counter <= 0) return;
  try {
    const res = await fetch(`${API_BASE}/api/teams/${team.id}/${direction}`, { method: 'POST' });
    if (!res.ok) throw new Error(await res.text());
    const updated = await res.json();
    const idx = teams.value.findIndex((item) => item.id === team.id);
    if (idx !== -1) teams.value[idx].counter = updated.counter;
  } catch (err) {
    console.error(`Error running ${direction}:`, err);
    showSnackbar(t('feedback.counterFailed'), 'error');
  }
}

const saveTeamName = async (team) => {
  if (editingTeamId.value !== team.id) return;

  // Leave edit mode synchronously: @keyup.enter also triggers @blur, and
  // without this both would fire their own request.
  editingTeamId.value = null;

  const original = editingOriginalName.value;
  const name = team.name.trim();

  if (!name) {
    team.name = original;
    showSnackbar(t('feedback.nameEmpty'), 'error');
    return;
  }
  if (name === original) {
    team.name = original;
    return;
  }

  team.name = name;
  try {
    const res = await fetch(`${API_BASE}/api/teams/${team.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error(await res.text());
  } catch (err) {
    console.error('Error updating team name:', err);
    team.name = original;
    showSnackbar(t('feedback.renameFailed'), 'error');
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

onMounted(fetchTeams);
</script>

<style scoped>
/* design tokens */
:root {
  --gold: #ffd700;
  --gold-glow: rgba(255, 215, 0, 0.35);
  --gold-text: #7a5f00;
}

@keyframes sparkle {
  0%, 100% {
    filter: drop-shadow(0 0 8px var(--gold-glow));
  }
  50% {
    filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.6));
  }
}

.golden-glow {
  background-color: var(--gold);
  color: var(--gold-text);
  animation: sparkle 1.5s infinite ease-in-out;
}

@media (prefers-reduced-motion: reduce) {
  .golden-glow {
    animation: none;
  }

  .counter-bump-enter-active,
  .counter-bump-leave-active {
    transition: none;
  }
}

.score-card {
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
}

.actions-column {
  text-align: right;
}

.counter-column {
  text-align: right;
}

.counter-value {
  font-size: 1.5rem;
  font-weight: 600;
}

:deep(.v-data-table) {
  font-size: 1.6rem;
}

.card-title-heading {
  font-size: 3rem;
  font-weight: inherit;
  margin: 0;
}

.team-name__edit-icon {
  opacity: 0.5;
}

.team-name-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font: inherit;
  color: inherit;
  text-align: left;
}


.counter-bump-enter-active,
.counter-bump-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.counter-bump-enter-from {
  opacity: 0;
  transform: translateY(-4px);
}

.counter-bump-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>
