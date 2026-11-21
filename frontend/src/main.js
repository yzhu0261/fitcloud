import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Amplify } from 'aws-amplify'
import { Hub } from 'aws-amplify/utils'

import App from './App.vue'
import router from './router'
import { COGNITO_CONFIG } from './config/appConfig'

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: COGNITO_CONFIG.userPoolId,
      userPoolClientId: COGNITO_CONFIG.userPoolClientId,
    },
  },
})

Hub.listen('auth', ({ payload }) => {
  if (payload.event === 'signedIn' || payload.event === 'signedOut') {
    sessionStorage.removeItem('repvelta-profile-badge')
  }
})

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
