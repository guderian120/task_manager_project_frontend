import { createApp } from 'vue'
import '@fortawesome/fontawesome-free/css/all.min.css'
import App from './App.vue'
import router from './router'

import { Amplify } from 'aws-amplify'  // ✅ Correct for v5
import awsconfig from './aws-exports'

Amplify.configure(awsconfig)

createApp(App).use(router).mount('#app')
