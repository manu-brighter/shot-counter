/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Fonts — self-hosted so they work offline and without CSP exceptions
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'

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
