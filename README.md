# 🛠️ Full Beginner Guide: Vue + AWS Amplify Authentication with Cognito + S3 Frontend Hosting

This guide documents every step we took to build a Vue.js frontend integrated with AWS Cognito for authentication, hosted on S3. It is tailored for beginners and includes all CLI commands, code snippets, and configuration details.

---

## 📌 Goal

Build a cloud-native **Task Manager** app where users can:

* Sign up and confirm their email
* Log in using AWS Cognito (email/password auth)
* Protect authenticated routes (dashboard)
* Reset their password
* Host the frontend on AWS S3

---

## ✅ Prerequisites

* Node.js & npm installed
* AWS CLI configured (`aws configure`)
* Vue CLI installed:

```bash
npm install -g @vue/cli
```

---

## 1. 📦 Create a New Vue Project

```bash
vue create task-manager-frontend
```

* Choose Vue 3, Babel, Router, ESLint (optional)
* Use history mode for the router

Navigate to project folder:

```bash
cd task-manager-frontend
```

---

## 2. 🪣 Create S3 Bucket for Hosting

```bash
aws s3api create-bucket \
  --bucket my-task-frontend \
  --region eu-west-1 \
  --create-bucket-configuration LocationConstraint=eu-west-1
```

Make the bucket public (optional):

```bash
aws s3 website s3://my-task-frontend/ --index-document index.html
```

---

## 3. 🔐 Create Cognito User Pool

```bash
aws cognito-idp create-user-pool \
  --pool-name TaskManagerUserPool \
  --username-attributes email \
  --auto-verified-attributes email \
  --username-configuration CaseSensitive=false
```

Copy the returned **User Pool ID**.

---

## 4. 🔐 Create Cognito App Client

```bash
aws cognito-idp create-user-pool-client \
  --user-pool-id <USER_POOL_ID> \
  --client-name VueFrontendApp \
  --no-generate-secret \
  --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH
```

Copy the returned **Client ID**.

---

## 5. 📦 Downgrade Amplify to v5 (v6 breaks flat Auth config)

```bash
npm uninstall aws-amplify @aws-amplify/ui @aws-amplify/ui-vue
npm install aws-amplify@5 @aws-amplify/ui-vue@2 --legacy-peer-deps
```

---

## 6. ⚙️ Configure AWS Amplify in Vue

### `src/aws-exports.js`

```js
const awsconfig = {
  Auth: {
    region: 'eu-west-1',
    userPoolId: '<USER_POOL_ID>',
    userPoolWebClientId: '<CLIENT_ID>',
    authenticationFlowType: 'USER_PASSWORD_AUTH',
    mandatorySignIn: false
  }
}
export default awsconfig
```

### `src/main.js`

```js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { Amplify } from 'aws-amplify'
import awsconfig from './aws-exports'

Amplify.configure(awsconfig)

createApp(App).use(router).mount('#app')
```

---

## 7. 👥 Authentication Pages

### `Login.vue`

Handles login with `Auth.signIn()`.

### `Signup.vue`

Supports:

* Email/password signup
* Email confirmation code input
* Resend code functionality

### `ForgotPassword.vue`

Supports:

* Sending password reset code
* Submitting new password with the code

All forms use the Amplify Auth module:

```js
import { Auth } from 'aws-amplify'
```

---

## 8. 🔐 Protecting Routes

### `router/index.js`

```js
router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth) {
    try {
      await Auth.currentAuthenticatedUser()
      next()
    } catch {
      next({ path: '/' })
    }
  } else {
    next()
  }
})
```

---

## 9. 🚀 Hosting on S3

Run build:

```bash
npm run build
```

Deploy to S3:

```bash
aws s3 sync dist/ s3://my-task-frontend --delete
```

To access the site:

```bash
open https://my-task-frontend.s3.eu-west-1.amazonaws.com/index.html
```

Or configure S3 static website hosting.

---

## 🧪 Troubleshooting

* **CORS errors**: ensure you are online and not behind a blocked network
* **Amplify v6 issues**: use `aws-amplify@5` and flat Auth config
* **403 from S3**: ensure the bucket allows public read or configure CloudFront

---

## ✅ What You Now Have

* Secure Vue app with Amplify Auth (sign up, login, password reset)
* Protected routes (e.g. dashboard)
* Hosted frontend on S3

---

## 💬 Next Steps

* Add sign-out button
* Integrate backend via API Gateway + Lambda
* Deploy via CI/CD (e.g., GitHub Actions + Amplify Hosting)


