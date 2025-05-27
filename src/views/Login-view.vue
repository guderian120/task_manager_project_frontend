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
    
    <!-- <div class="auth-footer">
      <p>Don't have an account? <router-link to="/signup"   class="auth-link">Sign up</router-link></p>
    </div> -->
    
    <!-- Verification Modal -->
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
        <div v-if="message" class="message success-message">
      {{ message }}
        </div>
        
        <div v-if="error" class="message error-message">
          {{ error }}
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
    <!-- New Password Modal -->
<div v-if="showNewPasswordModal" class="modal-overlay">
  <div class="otp-modal">
    <button class="close-modal" @click="closeNewPasswordModal">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
    <h2>Set a New Password</h2>
    <p class="otp-subtext">Please create a new password to activate your account.</p>
    <div class="otp-input-container">
    <input
      v-model="newPassword"
      type="password"
      placeholder="New password"
      class="auth-input"
      required
    />
    
</div>
    <button class="auth-btn verify-btn" @click="submitNewPassword" :disabled="isSettingPassword">
      <span v-if="!isSettingPassword">Update Password</span>
      <span v-else class="verifying-text">
        <svg class="spinner" viewBox="0 0 50 50">
          <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
        </svg>
        Updating...
      </span>
    </button>

    <div v-if="passwordError" class="message error-message">{{ passwordError }}</div>
  </div>
</div>


  </div>
</template>

<script>
import { Auth } from 'aws-amplify';

export default {
  name: 'LoginView',
  data() {
    return {
      email: '',
      password: '',
      error: '',
      showNewPasswordModal: false,
      newPassword: '',
      isSettingPassword: false,
      passwordError: '',
      message: '',
      showOtpModal: false,
      otp: Array(6).fill(''),
      resendCooldown: 0,
      cooldownInterval: null,
      isVerifying: false,
      verificationMessage: '',
      verificationStatus: '', // 'success' or 'error'
      userForNewPassword: null,
      currentAuthenticatedUser: null
    }
  },
  methods: {
    async closeNewPasswordModal() {
      this.showNewPasswordModal = false;
      this.newPassword = '';
      this.passwordError = '';
    },
 async showResendVerification() {
      if (!this.email) {
        this.error = 'Please enter your email first'
        return
      }
      
      try {
        await this.showVerificationFlow()
      } catch (err) {
        this.error = 'Failed to send verification. User May already be verified.'
      }
    },

    
    async signIn() {
      this.error = '';
      this.message = '';
      console.log('Signing in with email:', this.email);
      try {
        const user = await Auth.signIn(this.email, this.password);
        this.currentAuthenticatedUser = user;

        // Handle NEW_PASSWORD_REQUIRED challenge
        if (user.challengeName === 'NEW_PASSWORD_REQUIRED') {
          this.showNewPasswordModal = true;
          this.userForNewPassword = user;
          return;
        }

        // Check email verification status
        try {
          const currentSession = await Auth.currentSession();
          const emailVerified = currentSession.getIdToken().payload['email_verified'];
          
          if (!emailVerified) {
            this.message = 'Your email is not verified. We\'ve sent a verification code.';
            await this.showVerificationFlow();
            this.startResendCooldown();
            return;
          }

          // Proceed with normal login
          await this.handleSuccessfulLogin(user);
        } catch (sessionError) {
          console.error('Session error:', sessionError);
          // Fallback to attributes check
          if (user.attributes && !user.attributes.email_verified) {
            this.message = 'Your email is not verified. We\'ve sent a verification code.';
            await this.showVerificationFlow();
            this.startResendCooldown();
            return;
          }
          await this.handleSuccessfulLogin(user);
        }

      } catch (err) {
        console.error('Auth error:', err);
        if (err.code === 'UserNotConfirmedException') {
          await this.handleUnconfirmedUser();
        } else if (err.code === 'PasswordResetRequiredException') {
          this.error = 'Password reset required. Please check your email.';
        } else {
          this.error = err.message || 'Login failed';
        }
      }
    },

    async handleUnconfirmedUser() {
      try {
        // Try resending code for unconfirmed user
        await Auth.resendSignUp(this.email);
        this.message = 'Your account is not confirmed. We\'ve resent the verification code.';
        this.showOtpModal = true;
        this.startResendCooldown();
      } catch (resendError) {
        if (resendError.code === 'InvalidParameterException' && 
            resendError.message.includes('already confirmed')) {
          // User is confirmed but email might not be verified
          this.message = 'We\'ve sent a verification code to your email.';
          await this.showVerificationFlow();
          this.startResendCooldown();
        } else {
          this.error = 'Failed to send verification. Please try again.';
        }
      }
    },
    
    async handleSuccessfulLogin(user) {
      const groups = user.signInUserSession?.accessToken?.payload['cognito:groups'] || [];
      const currentSession = await Auth.currentSession();
          const emailVerified = currentSession.getIdToken().payload['email_verified'];
          
          if (!emailVerified) {
            this.message = 'Your email is not verified. We\'ve sent a verification code.';
            await this.showVerificationFlow();
            this.startResendCooldown();
            return;
          }
      if (groups.includes('Admin')) {
        this.$router.push('/dashboard-admin');
      } else {
        this.$router.push('/dashboard-user');
      }
    },

    async submitNewPassword() {
      this.isSettingPassword = true;
      this.passwordError = '';

      try {
        const completedUser = await Auth.completeNewPassword(
          this.userForNewPassword,
          this.newPassword
        );
        this.currentAuthenticatedUser = completedUser;
        this.showNewPasswordModal = false;
        await this.handleSuccessfulLogin(completedUser);
      } catch (err) {
        this.passwordError = err.message || 'Failed to set new password';
        console.error('Password error:', err);
      } finally {
        this.isSettingPassword = false;
      }
    },

    async showVerificationFlow() {
      try {
        if (this.currentAuthenticatedUser) {
          // For authenticated but unverified users
          await Auth.verifyCurrentUserAttribute('email');
        } else {
          // For unconfirmed users (new sign-ups)
          await Auth.resendSignUp(this.email);
        }
        this.showOtpModal = true;
        this.startResendCooldown();
        this.$nextTick(() => {
          if (this.$refs.otpInputs && this.$refs.otpInputs[0]) {
            this.$refs.otpInputs[0].focus();
          }
        });
      } catch (err) {
        console.error('Verification flow error:', err);
        this.error = err.message || 'Failed to send verification code';
        throw err;
      }
    },

    async verifyOtp() {
      const code = this.otp.join('');
      if (code.length !== 6) {
        this.error='Please enter the complete 6-digit code', 'error'
        return;
      }

      this.isVerifying = true;
      this.verificationMessage = '';
      console.log("Verifying opt now")
      
      try {
        console.log("in the try block")
        if (this.currentAuthenticatedUser) {
          console.log('first if')
          // Verify email attribute for logged-in users
          await Auth.verifyCurrentUserAttributeSubmit('email', code);
          console.log('waiting ffor data')
          // Refresh user attributes
          const user = await Auth.currentAuthenticatedUser();
          console.log('user got')
          await Auth.updateUserAttributes(user, {});
        } else {
          // Confirm sign up for new users
          await Auth.confirmSignUp(this.email, code);
        }

        this.message = 'Verification successful!', 'success'
        
        // If we have a logged in user, refresh their session
        if (this.currentAuthenticatedUser) {
          setTimeout(async () => {
            try {
              const user = await Auth.signIn(this.email, this.password);
              await this.handleSuccessfulLogin(user);
            } catch (loginErr) {
              this.error = 'Please login again', 'error'
            }
          }, 1500);
        } else {
          // For new users, prompt them to login
          setTimeout(() => {
            this.closeVerificationModal();
            this.message = 'Email verified successfully. Please login.';
          }, 1500);
        }
      } catch (err) {
        console.log('in the error ')
        let message = 'Verification failed. Please check the code and try again.';

        if (err.code === 'CodeMismatchException') {
          message = 'Incorrect verification code. Please try again.';
        } else if (err.code === 'ExpiredCodeException') {
          message = 'This code has expired. Please request a new one.';
        } else if (err.code === 'NotAuthorizedException') {
          message = 'Your account is already verified. Please login.';
        } else {
          message = 'Ensure you have entered a valid username and password'
        }
        console.log('error message', message)
        this.error = message, 'error'
      } finally {
        console.log("in the final block")
        this.isVerifying = false;
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