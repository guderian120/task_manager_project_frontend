import { createRouter, createWebHistory } from 'vue-router';
import { Auth } from 'aws-amplify';

import Login from '../views/Login-view.vue';
import ForgotPassword from '../views/Forgot-password.vue';
import DashboardAdmin from '../views/Dashboard-Admin.vue';
import DashboardUser from '../views/Dashboard-User.vue';
import NotFound from '../views/Not-Found.vue';

const routes = [
  { path: '/', name: 'Login', component: Login },
  { path: '/signup', name: 'Signup', component: Login },
  { path: '/forgot-password', name: 'ForgotPassword', component: ForgotPassword },
  {
    path: '/dashboard-admin',
    name: 'DashboardAdmin',
    component: DashboardAdmin,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/dashboard-user',
    name: 'DashboardUser',
    component: DashboardUser,
    meta: { requiresAuth: true, requiresUser: true }
  },
  // ❗️Keep this LAST to catch all unmatched routes
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 🔐 Route Guard
router.beforeEach(async (to, from, next) => {
  const publicPaths = ['/', '/signup', '/forgot-password'];

  // ✅ Allow public routes
  if (publicPaths.includes(to.path)) return next();

  // ✅ Allow unmatched routes to go to NotFound
  if (!to.matched.length) return next();

  // ✅ For matched protected routes, check authentication
  try {
    const user = await Auth.currentAuthenticatedUser();
    const groups = user.signInUserSession.idToken.payload['cognito:groups'] || [];
    const isAdmin = groups.includes('Admin');

    // Restrict based on role
    if (to.meta.requiresAdmin && !isAdmin) return next('/dashboard-user');
    if (to.meta.requiresUser && isAdmin) return next('/dashboard-admin');

    return next();
  } catch (err) {
    console.warn('Auth check failed:', err);
    return next('/'); // Redirect to login ONLY if the route is valid and protected
  }
});

export default router;
