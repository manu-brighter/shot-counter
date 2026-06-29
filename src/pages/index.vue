<template>
  <v-container>
    <v-card
      class="mx-auto my-5 score-card"
    >
      <v-card-title>
        <h1 class="card-title-heading">
          SHÖTTLI-COUNTER
        </h1>
      </v-card-title>
      <v-card-text>
        <v-data-table
          :items="rankedTeams"
          :headers="headers"
          :loading="loading"
          :no-data-text="'Keine Teams vorhanden.'"
          class="elevation-1"
          density="compact"
          hide-default-footer
        >
          <template #body="{ items }">
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
                  @click="editingTeamId = team.id"
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
                  aria-label="Teamname bearbeiten"
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
                  aria-label="Treffer hinzufügen"
                  @click="incrementTeam(team)"
                >
                  <v-icon>$plus</v-icon>
                </v-btn>
                <v-btn
                  size="x-large"
                  icon
                  aria-label="Treffer entfernen"
                  @click="decrementTeam(team)"
                >
                  <v-icon>$minus</v-icon>
                </v-btn>
                <v-btn
                  size="small"
                  icon
                  color="error"
                  class="ml-4"
                  :aria-label="`Team ${team.name} löschen`"
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
          Team hinzufügen
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-dialog
      v-model="addTeamDialog"
      max-width="400"
    >
      <v-card>
        <v-card-title>Team Name eingeben</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newTeam.name"
            label="Teamname eingeben"
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
            Abbrechen
          </v-btn>
          <v-btn
            color="primary"
            :loading="submitting"
            :disabled="submitting"
            @click="addTeam"
          >
            Bestätigen
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="confirmDeleteDialog"
      max-width="400"
    >
      <v-card>
        <v-card-title>Team löschen?</v-card-title>
        <v-card-text>
          Möchtest du das Team <strong>{{ pendingDeleteTeam?.name }}</strong> wirklich löschen?
        </v-card-text>
        <v-card-actions>
          <v-btn
            variant="text"
            @click="cancelDelete"
          >
            Abbrechen
          </v-btn>
          <v-btn
            color="error"
            @click="confirmDelete"
          >
            Bestätigen
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
          Schliessen
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

const headers = [
  { title: 'Platz', key: 'rank', sortable: false },
  { title: 'Teamname', key: 'name' },
  { title: 'Treffer', key: 'counter' },
  { title: 'Aktionen', key: 'actions', sortable: false },
];

const teams = ref([]);
const addTeamDialog = ref(false);
const confirmDeleteDialog = ref(false);
const newTeam = ref({ name: '' });
const pendingDeleteId = ref(null);
const editingTeamId = ref(null);
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

const pendingDeleteTeam = computed(() => teams.value.find((t) => t.id === pendingDeleteId.value));

const fetchTeams = async () => {
  loading.value = true;
  try {
    const res = await fetch(`${API_BASE}/api/teams`);
    if (!res.ok) throw new Error(await res.text());
    teams.value = await res.json();
  } catch (err) {
    console.error('Error fetching teams:', err);
    showSnackbar('Fehler beim Laden der Teams.', 'error');
  } finally {
    loading.value = false;
  }
};

const addTeam = async () => {
  if (!newTeam.value.name.trim()) {
    showSnackbar('Bitte einen Teamnamen eingeben.', 'error');
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
    showSnackbar('Team hinzugefügt.');
  } catch (err) {
    console.error('Error adding team:', err);
    showSnackbar('Fehler beim Hinzufügen des Teams.', 'error');
  } finally {
    submitting.value = false;
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
    const res = await fetch(`${API_BASE}/api/teams/${pendingDeleteId.value}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(await res.text());
    showSnackbar('Team gelöscht.');
    await fetchTeams();
  } catch (err) {
    console.error('Error deleting team:', err);
    showSnackbar('Fehler beim Löschen des Teams.', 'error');
  } finally {
    cancelDelete();
  }
};

async function incrementTeam(team) {
  try {
    const res = await fetch(`${API_BASE}/api/teams/${team.id}/increment`, { method: 'POST' });
    if (!res.ok) throw new Error(await res.text());
    const updated = await res.json();
    const idx = teams.value.findIndex((t) => t.id === team.id);
    if (idx !== -1) teams.value[idx].counter = updated.counter;
  } catch (err) {
    console.error(err);
    showSnackbar('Fehler beim Aktualisieren des Zählers.', 'error');
  }
}

async function decrementTeam(team) {
  if (team.counter <= 0) return;
  try {
    const res = await fetch(`${API_BASE}/api/teams/${team.id}/decrement`, { method: 'POST' });
    if (!res.ok) throw new Error(await res.text());
    const updated = await res.json();
    const idx = teams.value.findIndex((t) => t.id === team.id);
    if (idx !== -1) teams.value[idx].counter = updated.counter;
  } catch (err) {
    console.error(err);
    showSnackbar('Fehler beim Aktualisieren des Zählers.', 'error');
  }
}

const saveTeamName = async (team) => {
  if (editingTeamId.value !== team.id) return;
  if (!team.name.trim()) {
    editingTeamId.value = null;
    showSnackbar('Teamname darf nicht leer sein.', 'error');
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/api/teams/${team.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: team.name }),
    });
    if (!res.ok) throw new Error(await res.text());
    editingTeamId.value = null;
  } catch (err) {
    console.error('Error updating team name:', err);
    showSnackbar('Fehler beim Speichern des Teamnamens.', 'error');
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

:deep(.v-card-title) {
  font-size: 3rem;
}

.team-name {
  cursor: pointer;
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

.card-title-heading {
  font-size: inherit;
  font-weight: inherit;
  margin: 0;
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
