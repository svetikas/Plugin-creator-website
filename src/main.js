//import './assets/main.css'
import './assets/theme.css'
import 'primeicons/primeicons.css'

import { createApp } from 'vue'
import App from './App.vue'
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import { definePreset } from '@primevue/themes';
import ToastService from 'primevue/toastservice';

const AppTheme = definePreset(Aura, {
    semantic: {
        primary: {
            50: '{sky.50}',
            100: '{sky.100}',
            200: '{sky.200}',
            300: '{sky.300}',
            400: '{sky.400}',
            500: '#0f6fde',
            600: '#0b5fc2',
            700: '#0a4fa1',
            800: '#0b407f',
            900: '#0c3564',
            950: '#081f3d'
        }
    }
});

createApp(App)
    .use(PrimeVue, {
        theme: {
            preset: AppTheme,
            options: {
                prefix: 'p',
                // A manually-toggled class instead of 'system', so the site's
                // own dark mode switch is what decides the
                // color scheme rather.
                darkModeSelector: '.app-dark',
                cssLayer: false
            }
        }
    })
    .use(ToastService)
    .mount('#app')