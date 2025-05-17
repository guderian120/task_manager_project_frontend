<template>
  <div class="auth-container">
     <div class="project-header">
      <h1 class="project-name">Task Management System</h1>
      <p class="project-tagline">Break Project - Organize your work efficiently</p>
    </div>
    
    <h1 class="auth-title">Join Us</h1>
    
    <div v-if="message" class="message success-message">
      {{ message }}
    </div>
    
    <div v-if="error" class="message error-message">
      {{ error }}
    </div>
    
    <!-- Sign-up form (always visible) -->
    <form @submit.prevent="signUp" class="auth-form">
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
      
      <div class="input-group">
        <input 
          v-model="password" 
          type="password" 
          placeholder="Password" 
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
        Sign Up
      </button>
    </form>
    
    <div class="auth-footer">
      <router-link to="/" class="auth-link">
        Already have an account? Login
      </router-link>
    </div>
    
    <!-- OTP Verification Modal -->
    <div v-if="showOtpModal" class="modal-overlay" @click.self="closeModal">
      <div class="otp-modal">
        <button class="close-modal" @click="closeModal">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        
        <h2>Verify Your Email</h2>
        <p class="otp-instructions">We've sent a 6-digit code to <strong>{{ email }}</strong></p>
        
        <div class="otp-input-container">
          <input 
            v-for="n in 6" 
            :key="n"
            v-model="otp[n-1]"
            type="text"
            maxlength="1"
            class="otp-input"
            @input="focusNext(n, $event)"
            @keydown.delete="focusPrev(n, $event)"
            ref="otpInputs"
          >
        </div>
        
        <button @click="verifyOtp" class="auth-btn verify-btn">
          Verify Account
        </button>
        
        <p class="resend-text">
          Didn't receive code? 
          <a href="#" @click.prevent="resendOtp" class="resend-link">Resend</a>
          <span v-if="resendCooldown"> in {{ resendCooldown }}s</span>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { Auth } from 'aws-amplify'

export default {
  name: 'SignupView',
  data() {
    return {
      email: '',
      password: '',
      showOtpModal: false,
      otp: ['', '', '', '', '', ''],
      message: '',
      error: '',
      resendCooldown: 0,
      cooldownInterval: null
    }
  },
  methods: {
    async signUp() {
      this.resetFeedback()
      try {
        await Auth.signUp({
          username: this.email,
          password: this.password,
          attributes: { email: this.email }
        })
        this.message = 'Verification code sent to your email.'
        this.showOtpModal = true
        this.startResendCooldown()
      } catch (err) {
        this.error = err.message || 'Sign up failed. Please try again.'
      }
    },
    
    async verifyOtp() {
      const code = this.otp.join('')
      if (code.length !== 6) {
        this.error = 'Please enter the full 6-digit code'
        return
      }
      
      try {
        await Auth.confirmSignUp(this.email, code)
        this.message = 'Account verified successfully! You can now login.'
        this.showOtpModal = false
        this.resetOtp()
      } catch (err) {
        this.error = err.message || 'Verification failed. Please check the code.'
      }
    },
    
    async resendOtp() {
      if (this.resendCooldown > 0) return
      
      try {
        await Auth.resendSignUp(this.email)
        this.message = 'New verification code sent!'
        this.startResendCooldown()
        this.resetOtp()
        this.$nextTick(() => {
          this.$refs.otpInputs[0].focus()
        })
      } catch (err) {
        this.error = err.message || 'Failed to resend code.'
      }
    },
    
    focusNext(index, event) {
      if (event.target.value && index < 6) {
        this.$refs.otpInputs[index].focus()
      }
    },
    
    focusPrev(index, event) {
      if (!event.target.value && index > 1) {
        this.$refs.otpInputs[index-2].focus()
      }
    },
    
    startResendCooldown() {
      this.resendCooldown = 30
      this.cooldownInterval = setInterval(() => {
        if (this.resendCooldown > 0) {
          this.resendCooldown--
        } else {
          clearInterval(this.cooldownInterval)
        }
      }, 1000)
    },
    
    resetOtp() {
      this.otp = ['', '', '', '', '', '']
    },
    
    closeModal() {
      this.showOtpModal = false
      this.resetOtp()
    },
    
    resetFeedback() {
      this.message = ''
      this.error = ''
    }
  },
  beforeUnmount() {
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval)
    }
  }
}
</script>

<style scoped>
@import '../assets/css/auth-styles.css';

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

.otp-modal {
  background: white;
  padding: 2rem;
  border-radius: var(--border-radius);
  width: 100%;
  max-width: 400px;
  position: relative;
  animation: slideUp 0.3s ease-out;
}

.close-modal {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  cursor: pointer;
  color: #6c757d;
  transition: var(--transition);
}

.close-modal:hover {
  color: var(--error);
}

.otp-instructions {
  text-align: center;
  margin-bottom: 2rem;
  color: #6c757d;
}

.otp-input-container {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.otp-input {
  width: 45px;
  height: 60px;
  text-align: center;
  font-size: 1.5rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  transition: var(--transition);
}

.otp-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.2);
}

.verify-btn {
  width: 100%;
}

.resend-text {
  text-align: center;
  margin-top: 1.5rem;
  color: #6c757d;
}

.resend-link {
  color: var(--primary);
  text-decoration: none;
  font-weight: 500;
}

.resend-link:hover {
  text-decoration: underline;
}

/* Keyframes for animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}
</style>