import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import DashboardView from '../views/DashboardView.vue'
import { getCurrentUser } from 'aws-amplify/auth'
import WorkoutView from '../views/WorkoutView.vue'
import ProgressView from '../views/ProgressView.vue'
import AccountView from '../views/AccountView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/workout',
      name: 'workout',
      component: WorkoutView,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/nutrition',
      name: 'nutrition',
      component: () => import('../views/NutritionView.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/progress',
      name: 'progress',
      component: ProgressView,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/account',
      name: 'account',
      component: AccountView,
      meta: {
        requiresAuth: true,
      },
    },
  ],
})

router.beforeEach(async (to) => {
  if (to.meta.requiresAuth) {
    try {
      await getCurrentUser()
    } catch {
      return '/login'
    }
  }
})

export default router
