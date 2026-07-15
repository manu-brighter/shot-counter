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

  table: {
    rank: 'Rank',
    teamName: 'Team name',
    shots: 'Shots',
    actions: 'Actions',
    noTeams: 'No teams yet.',
  },

  actions: {
    addTeam: 'Add team',
    cancel: 'Cancel',
    confirm: 'Confirm',
    close: 'Close',
    addShot: 'Add shot',
    removeShot: 'Remove shot',
    editTeamName: 'Edit team name',
    deleteTeam: 'Delete team {name}',
  },

  addDialog: {
    title: 'Enter team name',
    label: 'Team name',
  },

  deleteDialog: {
    title: 'Delete team?',
    text: 'Do you really want to delete the team {name}?',
  },

  feedback: {
    teamAdded: 'Team added.',
    teamDeleted: 'Team deleted.',
    nameRequired: 'Please enter a team name.',
    nameEmpty: 'The team name must not be empty.',
    loadFailed: 'Failed to load teams.',
    addFailed: 'Failed to add the team.',
    deleteFailed: 'Failed to delete the team.',
    counterFailed: 'Failed to update the counter.',
    renameFailed: 'Failed to save the team name.',
  },
};
