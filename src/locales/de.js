/**
 * locales/de.js
 *
 * German messages. Keys mirror locales/en.js exactly.
 */

import { de as vuetify } from 'vuetify/locale';

export default {
  $vuetify: vuetify,

  language: {
    label: 'Sprache',
    en: 'Englisch',
    de: 'Deutsch',
  },

  table: {
    rank: 'Platz',
    teamName: 'Teamname',
    shots: 'Treffer',
    actions: 'Aktionen',
    noTeams: 'Keine Teams vorhanden.',
  },

  actions: {
    addTeam: 'Team hinzufügen',
    cancel: 'Abbrechen',
    confirm: 'Bestätigen',
    close: 'Schliessen',
    addShot: 'Treffer hinzufügen',
    removeShot: 'Treffer entfernen',
    editTeamName: 'Teamname bearbeiten',
    deleteTeam: 'Team {name} löschen',
  },

  addDialog: {
    title: 'Team Name eingeben',
    label: 'Teamname eingeben',
  },

  deleteDialog: {
    title: 'Team löschen?',
    text: 'Möchtest du das Team {name} wirklich löschen?',
  },

  feedback: {
    teamAdded: 'Team hinzugefügt.',
    teamDeleted: 'Team gelöscht.',
    nameRequired: 'Bitte einen Teamnamen eingeben.',
    nameEmpty: 'Teamname darf nicht leer sein.',
    loadFailed: 'Fehler beim Laden der Teams.',
    addFailed: 'Fehler beim Hinzufügen des Teams.',
    deleteFailed: 'Fehler beim Löschen des Teams.',
    counterFailed: 'Fehler beim Aktualisieren des Zählers.',
    renameFailed: 'Fehler beim Speichern des Teamnamens.',
  },
};
