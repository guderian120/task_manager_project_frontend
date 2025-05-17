<template>
  <div class="auth-container">
     <div class="project-header">
      <h1 class="project-name">Task Management System</h1>
      <p class="project-tagline">Break Project - Organize your work efficiently</p>
    </div>
    
    <h1 class="auth-title">Reset Password</h1>
    
    <div v-if="message" class="message success-message">
      {{ message }}
    </div>
    
    <div v-if="error" class="message error-message">
      {{ error }}
    </div>
    
    <!-- Initial request form -->
    <form @submit.prevent="sendResetCode" class="auth-form" v-if="!codeSent">
      <p style="text-align: center; margin-bottom: 1rem;">
        Enter your email to receive a password reset link
      </p>
      
      <div class="input-group">
        <input 
          v-model="email" 
          type="email" 
          placeholder="Email" 
          class="auth-input"
          required
        >
        <span class="input-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
        </span>
      </div>
      
      <button type="submit" class="auth-btn">
        Send Reset Link
      </button>
    </form>
    
    <!-- Password reset form -->
    <form @submit.prevent="resetPassword" class="auth-form" v-else>
      <div class="input-group">
        <input 
          v-model="code" 
          placeholder="Verification Code" 
          class="auth-input"
          required
        >
        <span class="input-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 11 12 14 23 3"></polyline>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
          </svg>
        </span>
      </div>
      
      <div class="input-group">
        <input 
          v-model="newPassword" 
          type="password" 
          placeholder="New Password" 
          class="auth-input"
          required
        >
        <span class="input-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </span>
      </div>
      
      <button type="submit" class="auth-btn">
        Reset Password
      </button>
      
      <p style="text-align: center; margin-top: 1rem;">
        <a href="#" @click.prevent="codeSent = false" class="auth-link">
          Use a different email
        </a>
      </p>
    </form>
    
    <div class="auth-footer">
      <router-link to="/" class="auth-link">
        ← Back to Login
      </router-link>
    </div>
  </div>
</template>

<script>
import { Auth } from 'aws-amplify'

export default {
  name: 'ForgotPassword',
  data() {
    return {
      email: '',
      code: '',
      newPassword: '',
      codeSent: false,
      message: '',
      error: ''
    }
  },
  methods: {
    async sendResetCode() {
      this.resetFeedback()
      try {
        await Auth.forgotPassword(this.email)
        this.codeSent = true
        this.message = `Reset code sent to ${this.email}`
      } catch (err) {
        this.error = err.message || 'Failed to send reset code'
      }
    },
    async resetPassword() {
      this.resetFeedback()
      try {
        await Auth.forgotPasswordSubmit(
          this.email,
          this.code,
          this.newPassword
        )
        this.message = 'Password reset successfully! You can now login.'
        setTimeout(() => {
          this.$router.push('/')
        }, 2000)
      } catch (err) {
        this.error = err.message || 'Password reset failed'
      }
    },
    resetFeedback() {
      this.message = ''
      this.error = ''
    }
  }
}
</script>

<style scoped>
@import '../assets/css/auth-styles.css';
</style>