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

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
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
