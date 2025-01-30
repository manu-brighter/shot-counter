<template>
  <v-container>
    <v-card class="mx-auto my-5" style="width: 80%;">
      <v-card-title>SHÖTTLI-COUNTER</v-card-title>
      <v-card-text>
        <v-data-table
          :items="teams"
          :headers="headers"
          class="elevation-1"
          dense
          hide-default-footer
          :hide-default-header="false"
        >
          <template #body="{ items }">
            <tr v-for="team in items" :key="team.id" :class="{ 'golden-glow': team.rank === 1 }">
              <td>{{ team.rank }}</td>
              <td>
                <span v-if="!team.editing" @click="team.editing = true">{{ team.name }}</span>
                <v-text-field
                  v-else
                  v-model="team.name"
                  @blur="saveTeamName(team)"
                  @keyup.enter="saveTeamName(team)"
                  dense
                  autofocus
                ></v-text-field>
              </td>
              <td class="counter-column">{{ team.counter }}</td>
              <td class="actions-column">
                <v-btn small icon @click="incrementCounter(team.id)">
                  <v-icon>mdi-plus</v-icon>
                </v-btn>
                <v-btn small icon @click="decrementCounter(team.id)">
                  <v-icon>mdi-minus</v-icon>
                </v-btn>
                <v-btn small icon color="red" @click="deleteTeam(team.id)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </td>
            </tr>
          </template>
        </v-data-table>
      </v-card-text>
      <v-card-actions>
        <v-btn color="primary" @click="openDialog">Team hinzufügen</v-btn>
      </v-card-actions>
    </v-card>

    <v-dialog v-model="dialog" max-width="400">
      <v-card>
        <v-card-title>Team Name eingeben</v-card-title>
        <v-card-text>
          <v-text-field
            label="Name"
            v-model="newTeam.name"
            outlined
            @keyup.enter="addTeam"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-btn text @click="closeDialog">Abbrechen</v-btn>
          <v-btn color="primary" @click="addTeam">Bestätigen</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="confirmDeleteDialog" max-width="400">
      <v-card>
        <v-card-title>Team löschen?</v-card-title>
        <v-card-text>
          Möchten Sie das Team wirklich löschen?
        </v-card-text>
        <v-card-actions>
          <v-btn text @click="confirmDeleteDialog = false">Abbrechen</v-btn>
          <v-btn color="red" @click="confirmDelete">Bestätigen</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";

const headers = [
  { text: "Rank", value: "rank" },
  { text: "Name", value: "name" },
  { text: "Counter", value: "counter" },
  { text: "Actions", value: "actions", sortable: false },
];

const teams = ref([]);
const dialog = ref(false);
const confirmDeleteDialog = ref(false);
const newTeam = ref({ name: "", counter: 0 });
let teamToDelete = null;

const fetchTeams = async () => {
  try {
    const response = await axios.get("http://localhost:5000/api/teams");
    const sortedTeams = response.data.sort((a, b) => b.counter - a.counter);
    teams.value = sortedTeams.map((team, index) => ({
      ...team,
      rank: index + 1,
      editing: false,
    }));
  } catch (error) {
    console.error("Error fetching teams:", error);
  }
};

const addTeam = async () => {
  if (!newTeam.value.name.trim()) {
    alert("Team name cannot be empty");
    return;
  }
  try {
    await axios.post("http://localhost:5000/api/teams", newTeam.value);
    await fetchTeams();
    closeDialog();
  } catch (error) {
    console.error("Error adding team:", error);
  }
};

const deleteTeam = (id) => {
  teamToDelete = id;
  confirmDeleteDialog.value = true;
};

const confirmDelete = async () => {
  try {
    await axios.delete(`http://localhost:5000/api/teams/${teamToDelete}`);
    await fetchTeams();
  } catch (error) {
    console.error("Error deleting team:", error);
  } finally {
    confirmDeleteDialog.value = false;
  }
};

const incrementCounter = async (id) => {
  try {
    const team = teams.value.find((team) => team.id === id);
    const updatedTeam = { ...team, counter: team.counter + 1 };
    await axios.put(`http://localhost:5000/api/teams/${id}`, updatedTeam);
    team.counter += 1;
    teams.value = teams.value.sort((a, b) => b.counter - a.counter);
    teams.value = teams.value.map((team, index) => ({
      ...team,
      rank: index + 1,
    }));
  } catch (error) {
    console.error("Error incrementing counter:", error);
  }
};

const decrementCounter = async (id) => {
  try {
    const team = teams.value.find((team) => team.id === id);
    const updatedTeam = { ...team, counter: Math.max(team.counter - 1, 0) };
    await axios.put(`http://localhost:5000/api/teams/${id}`, updatedTeam);
    team.counter = Math.max(team.counter - 1, 0);
    teams.value = teams.value.sort((a, b) => b.counter - a.counter);
    teams.value = teams.value.map((team, index) => ({
      ...team,
      rank: index + 1,
    }));
  } catch (error) {
    console.error("Error decrementing counter:", error);
  }
};

const saveTeamName = async (team) => {
  if (!team.name.trim()) {
    alert("Team name cannot be empty");
    return;
  }
  try {
    await axios.put(`http://localhost:5000/api/teams/${team.id}`, {
      ...team,
      counter: team.counter,
    });
    team.editing = false;
  } catch (error) {
    console.error("Error updating team name:", error);
  }
};

const openDialog = () => (dialog.value = true);
const closeDialog = () => {
  dialog.value = false;
  newTeam.value = { name: "", counter: 0 };
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
  font-size: 200%;
}
</style>
