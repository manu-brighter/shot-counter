/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Fonts — self-hosted so they work offline and without CSP exceptions
import '@fontsource/anton'
import '@fontsource/barlow/400.css'
import '@fontsource/barlow/500.css'
import '@fontsource/barlow/600.css'
import '@fontsource/barlow/700.css'

// Global design tokens + overrides for teleported Vuetify components
import '@/styles/app.scss'

// Plugins
import { registerPlugins } from '@/plugins'

// Components
import App from './App.vue'

// Composables
import { createApp } from 'vue'

const app = createApp(App)

app.config.errorHandler = (err, vm, info) => {
  console.error('Vue error:', err, info)
}

registerPlugins(app)

app.mount('#app')
