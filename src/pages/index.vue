<template>
  <v-container>
    <v-card class="mx-auto my-5" style="width: 80%;">
      <v-card-title>SHÖTTLI-COUNTER</v-card-title>

      <v-card-text>
        <v-data-table
          :items="sortedRows"
          :headers="headers"
          class="elevation-1"
          dense
          hide-default-footer
        >
          <template #body="{ items }">
            <tr
              v-for="(row, index) in items"
              :key="row.name"
              :style="rowStyles(index)"
            >
              <!-- Rank -->
              <td><span style="font-size: 2em;">{{ index + 1 }}</span></td>

              <!-- Ascend/Descend Indicator -->
              <td>
                <v-icon
                  v-if="row.indicator === 'up'"
                  color="green"
                  style="font-size: 2em;"
                >
                  mdi-arrow-up
                </v-icon>
                <v-icon
                  v-else-if="row.indicator === 'down'"
                  color="red"
                  style="font-size: 2em;"
                >
                  mdi-arrow-down
                </v-icon>
              </td>

              <!-- Editable Name -->
              <td>
                <v-text-field
                  v-if="editingRow === index"
                  v-model="row.name"
                  dense
                  outlined
                  @blur="saveName(index)"
                  @keyup.enter="saveName(index)"
                  style="font-size: 2em;"
                ></v-text-field>
                <span
                  v-else
                  @click="editingRow = index"
                  style="font-size: 2em; cursor: pointer;"
                >
                  {{ row.name }}
                </span>
              </td>

              <!-- Counter -->
              <td><span style="font-size: 2em;">{{ row.counter }}</span></td>

              <!-- Actions -->
              <td class="text-right">
                <v-btn small icon @click="incrementCounter(row)">
                  <v-icon>mdi-plus</v-icon>
                </v-btn>
                <v-btn small icon @click="decrementCounter(row)">
                  <v-icon>mdi-minus</v-icon>
                </v-btn>
                <v-btn small icon color="red" @click="confirmDelete(row)">
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
          <v-text-field label="Name" v-model="newRowName" outlined></v-text-field>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="addRow">bestätigen</v-btn>
          <v-btn text @click="closeDialog">abbrechen</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>Team Löschen</v-card-title>

        <v-card-text>
          Bist du sicher, dass du "{{ deleteRowName }}" löschen möchtest?
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="red" text @click="deleteRow">löschen</v-btn>
          <v-btn text @click="closeDeleteDialog">abbrechen</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue';

const headers = [
  { text: '#', value: 'rank', sortable: false },
  { text: '', value: 'indicator', sortable: false },
  { text: 'Name', value: 'name' },
  { text: 'Counter', value: 'counter' },
  { text: 'Actions', value: 'actions', sortable: false },
];

const rows = ref([
  { name: 'Jogge di Balla', counter: 3, indicator: '' },
  { name: 'Wamser', counter: 5, indicator: '' },
  { name: 'Elon Musk', counter: 1, indicator: '' },
]);

const dialog = ref(false);
const deleteDialog = ref(false);
const newRowName = ref('');
const deleteRowName = ref('');
const deleteRowIndex = ref(null);
const editingRow = ref(null);
const previousRanks = ref([]);

// Computed property to calculate sorted rows and set indicators
const sortedRows = computed(() => {
  const sorted = [...rows.value].sort((a, b) => b.counter - a.counter);

  sorted.forEach((row, index) => {
    const previousRank = previousRanks.value.findIndex((r) => r.name === row.name);

    if (previousRank === -1) {
      row.indicator = ''; // New row, no change
    } else if (previousRank > index) {
      row.indicator = 'up'; // Ascended
    } else if (previousRank < index) {
      row.indicator = 'down'; // Descended
    } else {
      row.indicator = ''; // No change
    }
  });

  previousRanks.value = sorted.map((row) => ({ name: row.name }));
  return sorted;
});

// Row styles (sparkle effect for top rank)
const rowStyles = (index) => {
  return index === 0 ? { backgroundColor: '#8a7724', animation: 'sparkle 1.5s infinite' } : {};
};

// Open dialog for adding a team
const openDialog = () => {
  dialog.value = true;
};

// Close dialog
const closeDialog = () => {
  dialog.value = false;
  newRowName.value = '';
};

// Add a new row
const addRow = () => {
  if (newRowName.value.trim()) {
    rows.value.push({ name: newRowName.value, counter: 0, indicator: '' });
    closeDialog();
  } else {
    alert("Name can't be empty");
  }
};

// Save changes to a name
const saveName = (index) => {
  const row = rows.value[index];
  if (!row.name.trim()) {
    alert("Name can't be empty");
    return;
  }
  editingRow.value = null; // Exit edit mode
};

// Increment counter
const incrementCounter = (row) => {
  row.counter++;
};

// Decrement counter
const decrementCounter = (row) => {
  if (row.counter > 0) {
    row.counter--;
  }
};

// Confirm delete dialog
const confirmDelete = (row) => {
  deleteRowName.value = row.name;
  deleteRowIndex.value = rows.value.indexOf(row);
  deleteDialog.value = true;
};

// Close delete dialog
const closeDeleteDialog = () => {
  deleteDialog.value = false;
  deleteRowIndex.value = null;
  deleteRowName.value = '';
};

// Delete a row
const deleteRow = () => {
  rows.value.splice(deleteRowIndex.value, 1);
  closeDeleteDialog();
};
</script>

<style>
@keyframes sparkle {
  0%, 100% {
    box-shadow: 0 0 10px gold, 0 0 20px gold;
  }
  50% {
    box-shadow: 0 0 20px gold, 0 0 30px gold;
  }
}
</style>
