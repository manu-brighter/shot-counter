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

  stats: {
    totalShots: 'Shots gesamt',
    reconnecting: 'Verbinde neu …',
  },

  actions: {
    addTeam: 'Team hinzufügen',
    cancel: 'Abbrechen',
    confirm: 'Bestätigen',
    close: 'Schliessen',
    addShot: 'Shot hinzufügen',
    removeShot: 'Shot entfernen',
    editTeamName: 'Teamname bearbeiten',
    rename: 'Umbenennen',
    delete: 'Löschen',
    deleteAll: 'Alle Teams löschen',
    teamOptions: 'Optionen für {name}',
    join: 'Mitmachen',
    newRound: 'Neue Runde',
    fullscreen: 'Vollbild',
    exitFullscreen: 'Vollbild beenden',
    setCount: 'Anzahl direkt setzen',
  },

  board: {
    density: 'Kartengrösse',
  },

  addDialog: {
    title: 'Team hinzufügen',
    label: 'Teamname',
  },

  deleteDialog: {
    title: 'Team löschen?',
    text: 'Möchtest du das Team {name} wirklich löschen?',
  },

  deleteAllDialog: {
    title: 'Alle Teams löschen?',
    text: 'Alle Teams und ihre Shots werden endgültig entfernt. Das lässt sich nicht rückgängig machen.',
  },

  resetDialog: {
    title: 'Neue Runde starten?',
    text: 'Alle Zähler gehen zurück auf 0. Die Teams bleiben bestehen.',
  },

  joinDialog: {
    title: 'Auf dem Handy mitmachen',
    scanHint: 'Mit demselben WLAN verbinden, dann scannen:',
    note: 'Alle im Netzwerk können mitzählen — ohne Login.',
    unavailable: 'Keine Netzwerkadresse gefunden. Stelle sicher, dass dieses Gerät mit einem WLAN oder LAN verbunden ist.',
  },

  empty: {
    title: 'Noch keine Teams',
    hint: 'Füge das erste Team hinzu und starte die Runde.',
  },

  feedback: {
    teamAdded: 'Team hinzugefügt.',
    teamDeleted: 'Team gelöscht.',
    allTeamsDeleted: 'Alle Teams gelöscht.',
    roundReset: 'Zähler zurückgesetzt.',
    nameRequired: 'Bitte einen Teamnamen eingeben.',
    nameEmpty: 'Teamname darf nicht leer sein.',
    loadFailed: 'Fehler beim Laden der Teams.',
    addFailed: 'Fehler beim Hinzufügen des Teams.',
    deleteFailed: 'Fehler beim Löschen des Teams.',
    deleteAllFailed: 'Fehler beim Löschen aller Teams.',
    counterFailed: 'Fehler beim Aktualisieren des Zählers.',
    renameFailed: 'Fehler beim Speichern des Teamnamens.',
    resetFailed: 'Fehler beim Zurücksetzen der Zähler.',
    countInvalid: 'Bitte eine gültige Zahl eingeben.',
  },

  footer: {
    credit: 'Entwickelt von',
    github: 'Gratis auf GitHub',
  },
};
