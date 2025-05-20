<template>
   <div class="fluid-not-found">
    <!-- Animated background bubbles -->
    <div class="bubbles">
      <div v-for="i in bubbleCount" :key="i" class="bubble" :style="bubbleStyle(i)"></div>
    </div>
    
    <!-- Main content -->
    <div class="content">
      <div class="glitch-container">
        <h1 class="glitch" data-text="404">404</h1>
        <h2 class="subtitle">Lost in the digital void</h2>
        <p class="description">The page you're seeking has either drifted into the cosmos or never existed.</p>
        
        <div class="cta-buttons">
          <button @click="goHome" class="neon-button">
            <span class="neon-text">Return Home</span>
          </button>
          <button @click="showLogin = true" class="neon-button alt">
            <span class="neon-text">Login Portal</span>
          </button>
        </div>
      </div>
    </div>
    
    <!-- Login Modal -->
    <transition name="fade">
      <div v-if="showLogin" class="login-modal">
        <div class="modal-content">
          <button class="close-btn" @click="showLogin = false">&times;</button>
          <h3>Access Portal</h3>
          <form @submit.prevent="signIn" class="auth-form">
            <div class="input-group">
                <input 
                    v-model="email" 
                    type="email" 
                    placeholder="Email" 
                    class="auth-input"
                    required
                    >
              <span class="input-highlight"></span>
            </div>
            <div class="input-group">
             <input 
                v-model="password" 
                type="password" 
                placeholder="Password" 
                class="auth-input"
                required
                >              <span class="input-highlight"></span>
            </div>
            <button type="submit" class="submit-btn">Enter</button>
          </form>
          <p class="signup-text">Don't have access? <a href="#" @click.prevent="goToSignup">Request credentials</a></p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { Auth } from 'aws-amplify'

export default {
  name: 'NotFound',
  data() {
    return {
      showLogin: false,
      username: '',
      password: '',
      bubbleSizes: Array.from({length: 20}, () => Math.random() * 30 + 10),
      bubblePositions: Array.from({length: 20}, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100
      })),
      bubbleSpeeds: Array.from({length: 20}, () => Math.random() * 2 + 0.5)
    }
  },

  methods: {
        async signIn() {
  this.error = ''
  try {
    const user = await Auth.signIn(this.email, this.password)
    console.log('Signed in user:', user)
    if (user.challengeName === 'NEW_PASSWORD_REQUIRED') {
          this.showNewPasswordModal = true
          this.userForNewPassword = user
          return
        }
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

    goHome() {
      this.$router.push('/dashboard-user');
    },
    
    goToSignup() {
      this.$router.push('/signup');
      this.showLogin = false;
    },
    bubbleStyle(i) {
      return {
        width: `${this.bubbleSizes[i]}px`,
        height: `${this.bubbleSizes[i]}px`,
        left: `${this.bubblePositions[i].x}%`,
        top: `${this.bubblePositions[i].y}%`,
        animationDuration: `${this.bubbleSpeeds[i]}s`,
        opacity: Math.random() * 0.4 + 0.1
      };
    },
    animateBubbles() {
      this.bubblePositions = this.bubblePositions.map(pos => ({
        x: (pos.x + Math.random() * 0.2 - 0.1) % 100,
        y: (pos.y + Math.random() * 0.2 - 0.1) % 100
      }));
      requestAnimationFrame(this.animateBubbles);
    }
  },
  mounted() {
    this.animateBubbles();
  }
};
</script>

<style scoped>
.fluid-not-found {
  position: relative;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
  color: white;
  font-family: 'Segoe UI', system-ui, sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
}

.bubbles {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.bubble {
  position: absolute;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  filter: blur(5px);
  animation: float infinite alternate ease-in-out;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) translateX(0);
  }
  50% {
    transform: translateY(-20px) translateX(10px);
  }
}

.content {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 2rem;
  max-width: 800px;
}

.glitch-container {
  position: relative;
}

.glitch {
  font-size: 8rem;
  font-weight: 800;
  position: relative;
  margin: 0;
  line-height: 1;
  color: #fff;
  animation: glitch-effect 3s infinite alternate;
}

.glitch::before, .glitch::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.glitch::before {
  left: 2px;
  text-shadow: -2px 0 #ff00c1;
  clip: rect(44px, 450px, 56px, 0);
  animation: glitch-anim-1 2s infinite linear alternate-reverse;
}

.glitch::after {
  left: -2px;
  text-shadow: -2px 0 #00fff9, 2px 2px #ff00c1;
  clip: rect(44px, 450px, 56px, 0);
  animation: glitch-anim-2 2s infinite linear alternate-reverse;
}

@keyframes glitch-effect {
  0%, 100% { transform: translate(0); }
  20% { transform: translate(-3px, 3px); }
  40% { transform: translate(-3px, -3px); }
  60% { transform: translate(3px, 3px); }
  80% { transform: translate(3px, -3px); }
}

.subtitle {
  font-size: 1.5rem;
  margin: 1rem 0;
  font-weight: 300;
  letter-spacing: 0.5px;
  color: rgba(255, 255, 255, 0.8);
}

.description {
  font-size: 1.1rem;
  margin-bottom: 2rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.7);
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.cta-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

.neon-button {
  position: relative;
  background: transparent;
  border: none;
  padding: 12px 24px;
  cursor: pointer;
  overflow: hidden;
  border-radius: 50px;
  transition: all 0.3s;
}

.neon-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, #ff00c1, #00fff9);
  z-index: -1;
  opacity: 0;
  transition: opacity 0.3s;
}

.neon-button:hover::before {
  opacity: 1;
}

.neon-button.alt::before {
  background: linear-gradient(45deg, #00fff9, #ff00c1);
}

.neon-text {
  position: relative;
  z-index: 1;
  color: white;
  font-weight: 500;
  letter-spacing: 1px;
}

.neon-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 255, 249, 0.3);
}

.neon-button.alt:hover {
  box-shadow: 0 5px 15px rgba(255, 0, 193, 0.3);
}

/* Login Modal Styles */
.login-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.modal-content {
  background: rgba(15, 12, 41, 0.9);
  padding: 2rem;
  border-radius: 10px;
  width: 90%;
  max-width: 400px;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.close-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  transition: color 0.3s;
}

.close-btn:hover {
  color: #ff00c1;
}

.modal-content h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  text-align: center;
  font-size: 1.5rem;
}

.input-group {
  position: relative;
  margin-bottom: 1.5rem;
}

.input-group input {
  width: 100%;
  padding: 12px 0;
  background: transparent;
  border: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 1rem;
  transition: all 0.3s;
}

.input-group input:focus {
  outline: none;
  border-bottom-color: #00fff9;
}

.input-highlight {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  width: 0;
  background: linear-gradient(90deg, #ff00c1, #00fff9);
  transition: width 0.4s;
}

.input-group input:focus ~ .input-highlight {
  width: 100%;
}

.submit-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(45deg, #ff00c1, #00fff9);
  border: none;
  border-radius: 50px;
  color: white;
  font-weight: 500;
  cursor: pointer;
  margin-top: 1rem;
  transition: transform 0.3s, box-shadow 0.3s;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 255, 249, 0.4);
}

.signup-text {
  margin-top: 1.5rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
}

.signup-text a {
  color: #00fff9;
  text-decoration: none;
  transition: color 0.3s;
}

.signup-text a:hover {
  color: #ff00c1;
}

/* Transition effects */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .glitch {
    font-size: 5rem;
  }
  
  .subtitle {
    font-size: 1.2rem;
  }
  
  .cta-buttons {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .neon-button {
    width: 100%;
  }
}
</style>