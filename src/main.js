/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

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
