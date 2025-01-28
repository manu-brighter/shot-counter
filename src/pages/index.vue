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
              <td><span style="font-size: 2em;">{{ index + 1 }}</span></td>
              <td>
                <v-icon :color="row.indicator === 'up' ? 'green' : row.indicator === 'down' ? 'red' : ''" style="font-size: 2em;">
                  {{ row.indicator === 'up' ? 'mdi-arrow-up' : row.indicator === 'down' ? 'mdi-arrow-down' : '' }}
                </v-icon>
              </td>
              <td>
                <v-text-field
                  v-if="editingRow === index"
                  v-model="row.name"
                  dense
                  outlined
                  @blur="saveName(row, index)"
                  @keyup.enter="saveName(row, index)"
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
              <td><span style="font-size: 2em;">{{ row.counter }}</span></td>
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

const sortedRows = computed(() => {
  const sorted = [...rows.value].sort((a, b) => b.counter - a.counter);
  sorted.forEach((row, index) => {
    const previousRank = previousRanks.value.findIndex((r) => r.name === row.name);
    if (previousRank > -1) {
      row.indicator = previousRank > index ? 'up' : previousRank < index ? 'down' : '';
    }
  });
  previousRanks.value = [...sorted];
  return sorted;
});

const rowStyles = (index) => {
  return index === 0 ? { backgroundColor: '#8a7724', animation: 'sparkle 1.5s infinite' } : {};
};

const openDialog = () => {
  dialog.value = true;
};

const closeDialog = () => {
  dialog.value = false;
  newRowName.value = '';
};

const addRow = () => {
  if (newRowName.value.trim()) {
    rows.value.push({ name: newRowName.value, counter: 0, indicator: '' });
    closeDialog();
  } else {
    alert("Name can't be empty");
  }
};

const saveName = (row, index) => {
  if (!row.name.trim()) {
    alert("Name can't be empty");
    editingRow.value = null;
  } else {
    editingRow.value = null;
  }
};

const incrementCounter = (row) => {
  row.counter++;
};

const decrementCounter = (row) => {
  if (row.counter > 0) {
    row.counter--;
  }
};

const confirmDelete = (row) => {
  deleteRowName.value = row.name;
  deleteRowIndex.value = rows.value.indexOf(row);
  deleteDialog.value = true;
};

const closeDeleteDialog = () => {
  deleteDialog.value = false;
  deleteRowIndex.value = null;
  deleteRowName.value = '';
};

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
