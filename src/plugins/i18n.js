/**
 * plugins/i18n.js
 *
 * vue-i18n instance. It owns both the app's own strings and Vuetify's
 * component strings (the `$vuetify` key in each locale file), so there is a
 * single locale to switch at runtime — see plugins/vuetify.js.
 */

import { createI18n } from 'vue-i18n';
import { watch } from 'vue';

import en from '@/locales/en';
import de from '@/locales/de';

export const SUPPORTED_LOCALES = ['en', 'de'];
export const DEFAULT_LOCALE = 'en';

const STORAGE_KEY = 'shot-counter.locale';

// The language is chosen in-app rather than at install time: the portable
// build and the AppImage have no installer to ask, and the choice needs to be
// changeable while people are passing the app around.
function initialLocale() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (SUPPORTED_LOCALES.includes(stored)) return stored;
  } catch {
    // Storage blocked — fall through to the default.
  }
  return DEFAULT_LOCALE;
}

const i18n = createI18n({
  legacy: false, // Vuetify's locale adapter requires Composition API mode
  locale: initialLocale(),
  fallbackLocale: DEFAULT_LOCALE,
  messages: { en, de },
});

watch(i18n.global.locale, (locale) => {
  document.documentElement.setAttribute('lang', locale);
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Storage blocked — the choice just won't survive a restart.
  }
}, { immediate: true });

export default i18n;
