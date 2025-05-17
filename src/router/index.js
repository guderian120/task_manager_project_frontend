import { createRouter, createWebHistory } from 'vue-router'
import { Auth } from 'aws-amplify'

import Login from '../views/Login-view.vue'
import Signup from '../views/Signup-view.vue'
import ForgotPassword from '../views/Forgot-password.vue'
import DashboardAdmin from '../views/Dashboard-Admin.vue'
import DashboardUser from '../views/Dashboard-User.vue'

const routes = [
  { path: '/', name: 'Login', component: Login },
  { path: '/signup', name: 'Signup', component: Signup },
  { path: '/forgot-password', name: 'ForgotPassword', component: ForgotPassword },
  { path: '/dashboard-admin', name: 'DashboardAdmin', component: DashboardAdmin, meta: { requiresAuth: true } },
  { path: '/dashboard-user', name: 'DashboardUser', component: DashboardUser, meta: { requiresAuth: true } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 🔐 Global navigation guard
router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth) {
    try {
      await Auth.currentAuthenticatedUser()
      next()
    } catch (err) {
      console.log('Not authenticated:', err)
      next({ path: '/' })
    }
  } else {
    next()
  }
})

export default router
