/**
 * locales/en.js
 *
 * English messages — the default locale. `$vuetify` carries Vuetify's own
 * component strings so the framework and the app share one locale source.
 */

import { en as vuetify } from 'vuetify/locale';

export default {
  $vuetify: vuetify,

  language: {
    label: 'Language',
    en: 'English',
    de: 'German',
  },

  stats: {
    totalShots: 'Total shots',
    reconnecting: 'Reconnecting …',
  },

  actions: {
    addTeam: 'Add team',
    cancel: 'Cancel',
    confirm: 'Confirm',
    close: 'Close',
    addShot: 'Add shot',
    removeShot: 'Remove shot',
    editTeamName: 'Edit team name',
    rename: 'Rename',
    delete: 'Delete',
    teamOptions: 'Options for {name}',
    join: 'Join',
    newRound: 'New round',
  },

  addDialog: {
    title: 'Add a team',
    label: 'Team name',
  },

  deleteDialog: {
    title: 'Delete team?',
    text: 'Do you really want to delete the team {name}?',
  },

  resetDialog: {
    title: 'Start a new round?',
    text: 'All counters go back to 0. The teams stay on the board.',
  },

  joinDialog: {
    title: 'Join on your phone',
    scanHint: 'Connect to the same Wi-Fi, then scan:',
    note: 'Anyone on this network can tap along — no login needed.',
    unavailable: 'No network address found. Make sure this device is connected to a Wi-Fi or LAN.',
  },

  empty: {
    title: 'No teams yet',
    hint: 'Add the first team and get the round started.',
  },

  feedback: {
    teamAdded: 'Team added.',
    teamDeleted: 'Team deleted.',
    roundReset: 'Counters reset.',
    nameRequired: 'Please enter a team name.',
    nameEmpty: 'The team name must not be empty.',
    loadFailed: 'Failed to load teams.',
    addFailed: 'Failed to add the team.',
    deleteFailed: 'Failed to delete the team.',
    counterFailed: 'Failed to update the counter.',
    renameFailed: 'Failed to save the team name.',
    resetFailed: 'Failed to reset the counters.',
  },
};
