import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Amplify } from 'aws-amplify'

import App from './App.vue'
import router from './router'

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'ap-southeast-2_7RlVyqR3g',
      userPoolClientId: '661p99brp1i82o1aa2ovagud0l',
    },
  },
})

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')