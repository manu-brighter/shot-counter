/**
 * plugins/vuetify.js
 *
 * Framework documentation: https://vuetifyjs.com
 */

// Styles
import 'vuetify/styles'

// Icon set — SVG only, no webfont
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'
import {
  mdiPlus,
  mdiMinus,
  mdiDelete,
  mdiDeleteSweep,
  mdiPencil,
  mdiQrcode,
  mdiRestart,
  mdiDotsVertical,
  mdiWifiOff,
  mdiFullscreen,
  mdiFullscreenExit,
  mdiViewHeadline,
  mdiViewAgendaOutline,
} from '@mdi/js'

// Composables
import { createVuetify } from 'vuetify'
import { createVueI18nAdapter } from 'vuetify/locale/adapters/vue-i18n'
import { useI18n } from 'vue-i18n'
import i18n from './i18n'

// Late-night bar scoreboard: warm near-black, amber as the single accent,
// warm cream text. Mirrors the --sc-* tokens in styles/app.scss.
const scoreboard = {
  dark: true,
  colors: {
    background: '#0E0B08',
    'on-background': '#F6EEDC',
    surface: '#1A140D',
    'on-surface': '#F6EEDC',
    'surface-bright': '#241B10',
    'surface-light': '#241B10',
    'surface-variant': '#2C2115',
    'on-surface-variant': '#CBBBA0',
    primary: '#FFB627',
    'on-primary': '#2A1B02',
    secondary: '#A89880',
    'on-secondary': '#181209',
    error: '#E5484D',
    'on-error': '#FFF6F6',
    success: '#86C67C',
    'on-success': '#0F1A0D',
    warning: '#FFB627',
    info: '#8AB8E8',
  },
  variables: {
    'border-color': '#F6EEDC',
    'border-opacity': 0.10,
    'medium-emphasis-opacity': 0.64,
  },
}

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  // Vuetify's own component strings come from the `$vuetify` key in the
  // vue-i18n messages, so switching the app locale switches both at once.
  locale: {
    adapter: createVueI18nAdapter({ i18n, useI18n }),
  },
  theme: {
    defaultTheme: 'scoreboard',
    themes: { scoreboard },
  },
  defaults: {
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary',
    },
  },
  icons: {
    defaultSet: 'mdi',
    aliases: {
      ...aliases,
      plus: mdiPlus,
      minus: mdiMinus,
      delete: mdiDelete,
      deleteSweep: mdiDeleteSweep,
      pencil: mdiPencil,
      qrcode: mdiQrcode,
      restart: mdiRestart,
      dotsVertical: mdiDotsVertical,
      wifiOff: mdiWifiOff,
      fullscreen: mdiFullscreen,
      fullscreenExit: mdiFullscreenExit,
      viewCompact: mdiViewHeadline,
      viewComfy: mdiViewAgendaOutline,
    },
    sets: { mdi },
  },
})
