import { createApp } from 'vue'
import './assets/styles/main.css'
import App from './App.vue'
import { vRipple } from './directives/vRipple'

const app = createApp(App)
app.directive('ripple', vRipple)
app.mount('#app')
