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
        >
          <template #body="{ items }">
            <tr v-for="team in items" :key="team.id">
              <td>{{ team.id }}</td>
              <td>{{ team.name }}</td>
              <td>{{ team.counter }}</td>
              <td>
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
          <v-text-field label="Name" v-model="newTeam.name" outlined></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-btn text @click="closeDialog">Abbrechen</v-btn>
          <v-btn color="primary" @click="addTeam">Bestätigen</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";

const headers = [
  { text: "ID", value: "id" },
  { text: "Name", value: "name" },
  { text: "Counter", value: "counter" },
  { text: "Actions", value: "actions", sortable: false },
];

const teams = ref([]);
const dialog = ref(false);
const newTeam = ref({ name: "", counter: 0 });

const fetchTeams = async () => {
  try {
    const response = await axios.get("http://localhost:5000/api/teams");
    teams.value = response.data;
  } catch (error) {
    console.error("Error fetching teams:", error);
  }
};

const addTeam = async () => {
  if (!newTeam.value.name.trim()) {
    alert("Name can't be empty");
    return;
  }
  try {
    await axios.post("http://localhost:5000/api/teams", newTeam.value);
    fetchTeams();
    closeDialog();
  } catch (error) {
    console.error("Error adding team:", error);
  }
};

const deleteTeam = async (id) => {
  try {
    await axios.delete(`http://localhost:5000/api/teams/${id}`);
    fetchTeams();
  } catch (error) {
    console.error("Error deleting team:", error);
  }
};

const incrementCounter = async (id) => {
  try {
    const team = teams.value.find((team) => team.id === id);
    await axios.put(`http://localhost:5000/api/teams/${id}`, {
      ...team,
      counter: team.counter + 1,
    });
    fetchTeams();
  } catch (error) {
    console.error("Error incrementing counter:", error);
  }
};

const decrementCounter = async (id) => {
  try {
    const team = teams.value.find((team) => team.id === id);
    await axios.put(`http://localhost:5000/api/teams/${id}`, {
      ...team,
      counter: Math.max(team.counter - 1, 0),
    });
    fetchTeams();
  } catch (error) {
    console.error("Error decrementing counter:", error);
  }
};

const openDialog = () => (dialog.value = true);
const closeDialog = () => {
  dialog.value = false;
  newTeam.value = { name: "", counter: 0 };
};

onMounted(fetchTeams);
</script>
