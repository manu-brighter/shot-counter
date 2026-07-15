/**
 * plugins/index.js
 *
 * Automatically included in `./src/main.js`
 */

// Plugins
import i18n from './i18n'
import vuetify from './vuetify'
import router from '@/router'

export function registerPlugins (app) {
  app
    .use(i18n) // before vuetify — its locale adapter reads this instance
    .use(vuetify)
    .use(router)
}
