/**
 * plugins/vuetify.js
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import 'vuetify/styles'

// Icon set — SVG only (3 icons used: plus, minus, delete)
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'
import { mdiPlus, mdiMinus, mdiDelete } from '@mdi/js'

// Composables
import { createVuetify } from 'vuetify'
import { createVueI18nAdapter } from 'vuetify/locale/adapters/vue-i18n'
import { useI18n } from 'vue-i18n'
import i18n from './i18n'

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  // Vuetify's own component strings come from the `$vuetify` key in the
  // vue-i18n messages, so switching the app locale switches both at once.
  locale: {
    adapter: createVueI18nAdapter({ i18n, useI18n }),
  },
  theme: {
    defaultTheme: 'dark',
  },
  icons: {
    defaultSet: 'mdi',
    aliases: {
      ...aliases,
      plus: mdiPlus,
      minus: mdiMinus,
      delete: mdiDelete,
    },
    sets: { mdi },
  },
})
