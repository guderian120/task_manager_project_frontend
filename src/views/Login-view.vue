<template>
  <div class="auth-container">
    <div class="project-header">
      <h1 class="project-name">Task Management System</h1>
      <p class="project-tagline">Break Project - Organize your work efficiently</p>
    </div>
    
    <h1 class="auth-title">Welcome Back</h1>
    
    <div v-if="error" class="message error-message">
      {{ error }}
    </div>
    
    <form @submit.prevent="signIn" class="auth-form">
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
        Login
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12h14"></path>
          <path d="M12 5l7 7-7 7"></path>
        </svg>
      </button>
      
      <div class="auth-links">
        <router-link to="/forgot-password" class="auth-link">
          Forgot password?
        </router-link>
        <span class="link-separator">•</span>
        <a href="#" @click.prevent="showResendVerification" class="auth-link">
          Resend verification
        </a>
      </div>
    </form>
    
    <div class="auth-footer">
      <p>Don't have an account? <router-link to="/signup" class="auth-link">Sign up</router-link></p>
    </div>
    
    <!-- Verification Modal -->
    <div v-if="showVerificationModal" class="modal-overlay">
      <div class="otp-modal">
        <button class="close-modal" @click="closeVerificationModal">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        
        <div class="verification-header">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <h2>Verify Your Email</h2>
          <p class="otp-instructions">Task Management System requires email verification</p>
        </div>
        
        <p class="otp-subtext">We've sent a 6-digit verification code to <strong>{{ email }}</strong></p>
        
        <div class="otp-input-container">
          <input 
            v-for="n in 6" 
            :key="n"
            v-model="otp[n-1]"
            type="text"
            maxlength="1"
            class="otp-input"
            @input="handleOtpInput(n, $event)"
            @keydown.delete="handleOtpDelete(n, $event)"
            ref="otpInputs"
          >
        </div>
        
    <button @click="verifyOtp" class="auth-btn verify-btn" :disabled="isVerifying">
    <span v-if="!isVerifying">Verify Email</span>
    <span v-else class="verifying-text">
      <svg class="spinner" viewBox="0 0 50 50">
        <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
      </svg>
      Verifying...
    </span>
  </button>

  <!-- Add this success/error message below the verify button -->
      <div v-if="verificationMessage" class="message" :class="{
        'success-message': verificationStatus === 'success',
        'error-message': verificationStatus === 'error'
      }">
        {{ verificationMessage }}
      </div>
        
        <p class="resend-text">
          Didn't receive code? 
          <a href="#" @click.prevent="resendVerification" class="resend-link" :class="{ disabled: resendCooldown > 0 }">
            Resend {{ resendCooldown > 0 ? `(${resendCooldown}s)` : '' }}
          </a>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { Auth } from 'aws-amplify'

export default {
  name: 'LoginView',
  data() {
    return {
      email: '',
      password: '',
      error: '',
      showVerificationModal: false,
      otp: Array(6).fill(''),
      resendCooldown: 0,
      cooldownInterval: null,
       isVerifying: false,
      verificationMessage: '',
      verificationStatus: '', // 'success' or 'error'
    }
  },
  methods: {
    
    async signIn() {
  this.error = ''
  try {
    const user = await Auth.signIn(this.email, this.password)
    console.log('Signed in user:', user)

    // Get group info from token
    const groups = user.signInUserSession.accessToken.payload['cognito:groups']
    console.log('User groups:', groups)

    if (groups && groups.includes('Admin')) {
      this.$router.push('/dashboard-admin')
    } else {
      this.$router.push('/dashboard-user')
    }

  } catch (err) {
    this.error = err.message || 'Login failed'
    console.error('Auth error:', err)
  }
},
    
    async showResendVerification() {
      if (!this.email) {
        this.error = 'Please enter your email first'
        return
      }
      
      try {
        await this.showVerificationFlow()
      } catch (err) {
        this.error = 'Failed to send verification. Please try again.'
      }
    },
    
    async showVerificationFlow() {
      try {
        await Auth.resendSignUp(this.email)
        this.showVerificationModal = true
        this.startResendCooldown()
        this.$nextTick(() => {
          this.$refs.otpInputs[0]?.focus()
        })
      } catch (err) {
        this.error = err.message || 'Failed to send verification code'
        throw err
      }
    },
    
    async verifyOtp() {
      const code = this.otp.join('')
      if (code.length !== 6) {
        this.showVerificationFeedback('Please enter the complete 6-digit code', 'error')
        return
      }

      this.isVerifying = true
      this.verificationMessage = ''
      
      try {
        await Auth.confirmSignUp(this.email, code)
        this.showVerificationFeedback('Verification successful! Logging you in...', 'success')
        
        // Automatically login after successful verification
        setTimeout(async () => {
          try {
            await Auth.signIn(this.email, this.password)
            this.$router.push('/dashboard')
          } catch (loginErr) {
            this.showVerificationFeedback('Login failed after verification. Please try logging in again.', 'error')
          }
        }, 1500)
      } catch (err) {
        let message = 'Verification failed. Please check the code and try again.'
        if (err.code === 'CodeMismatchException') {
          message = 'Incorrect verification code. Please try again.'
        } else if (err.code === 'ExpiredCodeException') {
          message = 'This code has expired. Please request a new one.'
        }
        this.showVerificationFeedback(message, 'error')
      } finally {
        this.isVerifying = false
      }
    },

    showVerificationFeedback(message, status) {
      this.verificationMessage = message
      this.verificationStatus = status
      
      // Clear success message after 5 seconds
      if (status === 'success') {
        setTimeout(() => {
          if (this.verificationStatus === 'success') {
            this.verificationMessage = ''
          }
        }, 5000)
      }
    },
    
    async resendVerification() {
      if (this.resendCooldown > 0) return
      
      try {
        await Auth.resendSignUp(this.email)
        this.startResendCooldown()
        this.otp = Array(6).fill('')
        this.$nextTick(() => {
          this.$refs.otpInputs[0].focus()
        })
      } catch (err) {
        this.error = 'Failed to resend verification code'
      }
    },
    
    handleOtpInput(index, event) {
      if (event.target.value && index < 6) {
        this.$refs.otpInputs[index].focus()
      }
    },
    
    handleOtpDelete(index, event) {
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
    
    closeVerificationModal() {
      this.showVerificationModal = false
      this.otp = Array(6).fill('')
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

verifying-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.spinner {
  animation: rotate 1.5s linear infinite;
  height: 20px;
  width: 20px;
}

.path {
  stroke: white;
  stroke-linecap: round;
  animation: dash 1.5s ease-in-out infinite;
}

@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}.auth-links {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 1rem;
  gap: 0.5rem;
}

.link-separator {
  color: #adb5bd;
}

.verification-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.verification-header svg {
  margin-bottom: 1rem;
}

.otp-instructions {
  text-align: center;
  color: #6c757d;
  margin-bottom: 0.5rem;
}

.otp-subtext {
  text-align: center;
  margin-bottom: 2rem;
  color: #6c757d;
}

.otp-input-container {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2rem;
  gap: 0.5rem;
}

.otp-input {
  width: 100%;
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

.resend-link:hover:not(.disabled) {
  text-decoration: underline;
}

.disabled {
  color: #adb5bd;
  cursor: not-allowed;
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
  max-width: 420px;
  position: relative;
  animation: slideUp 0.3s ease-out;
}

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