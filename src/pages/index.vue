<template>
  <v-container>
    <v-card
      class="mx-auto my-5"
      style="width: 80%;"
    >
      <v-card-title>SHÖTTLI-COUNTER</v-card-title>
      <v-card-text>
        <v-data-table
          :items="rankedTeams"
          :headers="headers"
          class="elevation-1"
          dense
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
                <span
                  v-if="editingTeamId !== team.id"
                  @click="editingTeamId = team.id"
                >{{ team.name }}</span>
                <v-text-field
                  v-else
                  v-model="team.name"
                  dense
                  autofocus
                  @blur="saveTeamName(team)"
                  @keyup.enter="saveTeamName(team)"
                />
              </td>
              <td class="counter-column">
                {{ team.counter }}
              </td>
              <td class="actions-column">
                <v-btn
                  small
                  icon
                  @click="incrementTeam(team)"
                >
                  <v-icon>$plus</v-icon>
                </v-btn>
                <v-btn
                  small
                  icon
                  @click="decrementTeam(team)"
                >
                  <v-icon>$minus</v-icon>
                </v-btn>
                <v-btn
                  small
                  icon
                  color="red"
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
            outlined
            @keyup.enter="addTeam"
          />
        </v-card-text>
        <v-card-actions>
          <v-btn
            text
            @click="closeDialog"
          >
            Abbrechen
          </v-btn>
          <v-btn
            color="primary"
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
          Möchtest du das Team wirklich löschen?
        </v-card-text>
        <v-card-actions>
          <v-btn
            text
            @click="cancelDelete"
          >
            Abbrechen
          </v-btn>
          <v-btn
            color="red"
            @click="confirmDelete"
          >
            Bestätigen
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';

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

const rankedTeams = computed(() => {
  return [...teams.value].sort((a, b) => b.counter - a.counter || a.id - b.id);
});

const fetchTeams = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/teams`);
    if (!res.ok) throw new Error(await res.text());
    teams.value = await res.json();
  } catch (err) {
    console.error('Error fetching teams:', err);
  }
};

const addTeam = async () => {
  if (!newTeam.value.name.trim()) {
    alert('Team name cannot be empty');
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/api/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTeam.value),
    });
    if (!res.ok) throw new Error(await res.text());
    await fetchTeams();
    closeDialog();
  } catch (err) {
    console.error('Error adding team:', err);
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
    await fetchTeams();
  } catch (err) {
    console.error('Error deleting team:', err);
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
  }
}

const saveTeamName = async (team) => {
  if (!team.name.trim()) {
    alert('Team name cannot be empty');
    return;
  }
  try {
    const updatePayload = { name: team.name, counter: team.counter };
    const res = await fetch(`${API_BASE}/api/teams/${team.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload),
    });
    if (!res.ok) throw new Error(await res.text());
    editingTeamId.value = null;
  } catch (err) {
    console.error('Error updating team name:', err);
  }
};

const openDialog = () => (addTeamDialog.value = true);
const closeDialog = () => {
  addTeamDialog.value = false;
  newTeam.value = { name: '' };
};

onMounted(fetchTeams);
</script>

<style scoped>
@keyframes sparkle {
  0%, 100% {
    box-shadow: 0 0 10px gold, 0 0 20px gold;
  }
  50% {
    box-shadow: 0 0 20px gold, 0 0 30px gold;
  }
}

.golden-glow {
  background-color: #8a7724;
  animation: sparkle 1.5s infinite;
}

.actions-column {
  text-align: right;
}

.counter-column {
  text-align: right;
  font-weight: bold;
}

.v-data-table {
  font-size: 160%;
}

.v-card-title {
  font-size: 300%;
}
</style>
