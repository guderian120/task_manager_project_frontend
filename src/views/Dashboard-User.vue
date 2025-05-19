<template>
  <div class="user-dashboard">
    <!-- Header Section -->
    <header class="dashboard-header">
      <div class="header-content">
        <h1>Welcome, {{ currentUser.name }}!</h1>
        <div class="user-actions">
          <button @click="refreshData" class="refresh-btn">
            <i class="fas fa-sync-alt"></i> Refresh
          </button>
          <button @click="signOut" class="logout-btn">
            <i class="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </div>
    </header>
  <!-- Notification Toast -->
    <div v-if="notification.show" class="notification-toast" :class="notification.type" id="global-notification">
      <i class="fas" :class="{
        'fa-check-circle': notification.type === 'success',
        'fa-exclamation-circle': notification.type === 'error'
      }"></i>
      {{ notification.message }}
    </div>
    <!-- Main Content -->
    <main class="dashboard-content">
      <!-- Goals Section -->
      <section class="goals-section">
        <div class="section-header">
          <h2><i class="fas fa-bullseye"></i> My Goals</h2>
          <button @click="showGoalForm = true" class="add-goal-btn">
            <i class="fas fa-plus"></i> Add Goal
          </button>
        </div>

        <div v-if="isLoadingGoals" class="loading-indicator">
          <i class="fas fa-spinner fa-spin"></i> Loading your goals...
        </div>

        <div v-else-if="userGoals.length === 0" class="empty-state">
          <i class="fas fa-bullseye"></i>
          <p>You haven't set any goals yet</p>
          <button @click="showGoalForm = true" class="btn-primary">
            Create Your First Goal
          </button>
        </div>

        <div v-else class="goals-grid">
          <div v-for="goal in userGoals" :key="goal.id" class="goal-card" 
               :class="getGoalStatusClass(goal)">
            <div class="goal-header">
              <h3>{{ goal.title }}</h3>
              <div class="goal-actions">
                <button @click.stop="editGoal(goal)" class="icon-btn">
                  <i class="fas fa-edit"></i>
                </button>
                <button @click.stop="deleteGoal(goal.id)" class="icon-btn">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
            <p class="goal-description">{{ goal.description }}</p>
            
            <div class="goal-progress">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: goal.progress + '%' }"></div>
              </div>
              <span class="progress-text">{{ goal.progress }}% complete</span>
            </div>
            
            <div class="goal-meta">
              <span><i class="fas fa-calendar-alt"></i> Due: {{ formatDate(goal.dueDate) }}</span>
              <span><i class="fas fa-tasks"></i> {{ goal.completedTasks }}/{{ goal.totalTasks }} tasks</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Tasks Section -->
      <section class="tasks-section">
        <div class="section-header">
          <h2><i class="fas fa-tasks"></i> My Tasks</h2>
          <div class="task-filters">
            <select v-model="taskFilter" class="filter-select">
              <option value="all">All Tasks</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>

        <div v-if="isLoadingTasks" class="loading-indicator">
          <i class="fas fa-spinner fa-spin"></i> Loading your tasks...
        </div>

        <div v-else-if="filteredTasks.length === 0" class="empty-state">
          <i class="fas fa-check-circle"></i>
          <p>No tasks match your current filter</p>
        </div>

        <div v-else class="task-list">
          <div v-for="task in filteredTasks" :key="task.taskId" 
               class="task-card" :class="getTaskStatusClass(task)"
               @click="openTaskDetail(task)">
            <div class="task-header">
              <h3>{{ task.title }}</h3>
              <span class="task-status">{{ task.status }}</span>
            </div>
            <p class="task-description">{{ task.description }}</p>
            
            <div class="task-footer">
              <div class="task-deadline" :class="{ 'urgent': isUrgent(task.deadline, task.status) }">
                <i class="fas fa-calendar-alt"></i> deadline: {{ formatDate(task.deadline) }}
              </div>
              <div class="task-actions">
                <button v-if="task.status !== 'completed'" 
                        @click.stop="markTaskComplete(task.taskId)" 
                        class="complete-btn">
                  <i class="fas fa-check"></i> Complete
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Goal Form Modal -->
    <div v-if="showGoalForm" class="modal-overlay" @click.self="closeGoalForm">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ editingGoal ? 'Edit Goal' : 'Create New Goal' }}</h2>
          <button @click="closeGoalForm" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <form @submit.prevent="saveGoal" class="goal-form">
          <div class="form-group">
            <label>Goal Title*</label>
            <input v-model="goalForm.title" required placeholder="What do you want to achieve?">
          </div>
          
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="goalForm.description" placeholder="Details about your goal..."></textarea>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Due Date</label>
              <input v-model="goalForm.dueDate" type="date">
            </div>
            
            <div class="form-group">
              <label>Progress (%)</label>
              <input v-model="goalForm.progress" type="number" min="0" max="100">
            </div>
          </div>
          <div class="form-group">
            <label>Link to Task (optional)</label>
            <select v-model="goalForm.taskId">
              <option disabled value="">-- Select a Task --</option>
              <option v-for="task in userTasks" :key="task.taskId" :value="task.taskId">
                {{ task.title }}
              </option>
            </select>
          </div>
          <div class="form-actions">
            <button type="button" @click="closeGoalForm" class="btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn-primary">
              {{ editingGoal ? 'Update Goal' : 'Create Goal' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Task Detail Modal -->
    <div v-if="selectedTask" class="modal-overlay" @click.self="selectedTask = null">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ selectedTask.title }}</h2>
          <button @click="selectedTask = null" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="task-detail-content">
          <div class="detail-section">
            <h3><i class="fas fa-align-left"></i> Description</h3>
            <p>{{ selectedTask.description }}</p>
          </div>
          
          <div class="detail-section">
            <h3><i class="fas fa-info-circle"></i> Details</h3>
            <div class="task-details-grid">
              <div>
                <strong>Status:</strong>
                <span :class="getTaskStatusClass(selectedTask)">{{ selectedTask.status }}</span>
              </div>
              <div>
               <button class="refresh-btn" @click.stop="cycleTaskStatus(selectedTask.taskId, selectedTask.status)">
                  <i class="fas fa-sync-alt"></i> Update Status
            </button>
              </div>
              
              <div>
                <strong>Deadline:</strong>
               <span :class="{ 'urgent': isUrgent(selectedTask.deadline, selectedTask.status) }">
                {{ formatDate(selectedTask.deadline) }}
              </span>
              </div>
              <div>
                <strong>Priority:</strong>
                <span>{{ selectedTask.priority || 'Normal' }}</span>
              </div>
            </div>
          </div>
          
          <div class="detail-section">
            <h3><i class="fas fa-comments"></i> Updates</h3>
            <div class="updates-section">
              <div v-for="update in selectedTask.updates" :key="update.timestamp" class="update-item">
                <div class="update-header">
                  <span class="update-author">{{ update.author }}</span>
                  <span class="update-date">{{ formatDateTime(update.timestamp) }}</span>
                </div>
                <p class="update-text">{{ update.text }}</p>
              </div>
              
              <div class="add-update">
                <textarea v-model="newUpdateText" placeholder="Add your update..."></textarea>
                <button @click="addTaskUpdate" class="btn-primary">
                  <i class="fas fa-paper-plane"></i> Post Update
                </button>
                 
                
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Auth } from 'aws-amplify';

export default {
  name: 'DashboardUser',
  data() {
    return {
      currentUser: { name: 'User', email: '' },
      userGoals: [],
      userTasks: [],
      isLoadingGoals: false,
      isLoadingTasks: false,
      taskFilter: 'all',
      showGoalForm: false,
      editingGoal: null,
      selectedTask: null,
      newUpdateText: '',
      goalForm: {
        title: '',
        description: '',
        dueDate: '',
        progress: 0,
        taskId:''
      },
       notification: {
      show: false,
      message: '',
      type: '' // 'success' or 'error'
    }
    };
  },
  computed: {
    filteredTasks() {
      if (this.taskFilter === 'all') return this.userTasks;
      return this.userTasks.filter(task => task.status === this.taskFilter);
    }
  },


  
  async created() {
  // Check for pending notification on page load
  const pendingNotification = localStorage.getItem('pendingNotification');
  if (pendingNotification) {
    const notification = JSON.parse(pendingNotification);
    
    // Only show if notification is recent (less than 5 seconds old)
    if (new Date().getTime() - notification.timestamp < 5000) {
      this.notification = {
        show: true,
        message: notification.message,
        type: notification.type
      };
      
      // Clear after 3 seconds
      setTimeout(() => {
        this.notification.show = false;
      }, 3000);
    }
    
    // Clear the stored notification
    localStorage.removeItem('pendingNotification');
  }
  
  // Your existing created hook code...
  await this.getCurrentUser();
  await this.fetchUserGoals();
  await this.fetchUserTasks();
},

  
  methods: {
  showNotification(message, type) {
  // Store notification in localStorage before showing
  localStorage.setItem('pendingNotification', JSON.stringify({
    message,
    type,
    timestamp: new Date().getTime()
  }));
  
  this.notification = {
    show: true,
    message,
    type
  };
  
  // Clear after 3 seconds (if not reloading)
  setTimeout(() => {
    this.notification.show = false;
  }, 3000);
},


async cycleTaskStatus(taskId, currentStatus) {
  const statuses = ['pending', 'in-progress', 'completed'];
  const nextStatus = statuses[(statuses.indexOf(currentStatus) + 1) % statuses.length];

  try {
    const session = await Auth.currentSession();
    const idToken = session.getIdToken().getJwtToken();
    
    await fetch(`https://3c0x6315c2.execute-api.eu-west-1.amazonaws.com/prod/tasks/${taskId}/status`, {
      method: 'PUT',
      mode: 'cors',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: nextStatus })
    });

    // Show success notification
    this.showNotification('Task status updated successfully! Reloading...', 'success');
    
    // Reload the page after 1.5 seconds (enough time to see the toast)
    setTimeout(() => {
      window.location.reload();
    }, 1500);
    
  } catch (error) {
    console.error('Error updating task status:', error);
    this.showNotification('Failed to update task status', 'error');
  }
},
    async getCurrentUser() {
      try {
        const user = await Auth.currentAuthenticatedUser();
        this.currentUser = {
          name: user.attributes?.name || user.username,
          email: user.attributes?.email
        };
      } catch (err) {
        console.error('Error getting current user:', err);
      }
    },
    
    async fetchUserGoals() {
      this.isLoadingGoals = true;
      try {
        const session = await Auth.currentSession();
        const idToken = session.getIdToken().getJwtToken();
        
        const response = await fetch('https://3c0x6315c2.execute-api.eu-west-1.amazonaws.com/prod/goals', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('Fetched Goals:', result);
          this.userGoals = result || [];
        } else {
          throw new Error('Failed to fetch goals');
        }
      } catch (err) {
        console.error('Error fetching goals:', err);
      } finally {
        this.isLoadingGoals = false;
      }
    },
    
    async fetchUserTasks() {
      this.isLoadingTasks = true;
      try {
        const session = await Auth.currentSession();
        const idToken = session.getIdToken().getJwtToken();
        
        const response = await fetch('https://3c0x6315c2.execute-api.eu-west-1.amazonaws.com/prod/tasks', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          this.userTasks = result.tasks || [];
        } else {
          throw new Error('Failed to fetch tasks');
        }
      } catch (err) {
        console.error('Error fetching tasks:', err);
      } finally {
        this.isLoadingTasks = false;
      }
    },
    
    async refreshData() {
      await Promise.all([this.fetchUserGoals(), this.fetchUserTasks()]);
    },
    
    openGoalForm() {
      this.showGoalForm = true;
    },
    
   editGoal(goal) {
  this.goalForm = {
    title: goal.title,
    description: goal.description,
    dueDate: goal.dueDate,
    progress: goal.progress,
    taskId: goal.taskId || ''  // Include existing task linkage
  };
  this.editingGoal = goal;
  this.showGoalForm = true;
},
    
    closeGoalForm() {
      this.showGoalForm = false;
      this.editingGoal = null;
      this.goalForm = {
        title: '',
        description: '',
        dueDate: '',
        progress: 0
      };
    },
    
  async saveGoal() {
  try {
    const session = await Auth.currentSession();
    const idToken = session.getIdToken().getJwtToken();

    // Prepare goal payload
    const goalData = {
      ...this.goalForm,
      dueDate: this.goalForm.dueDate 
        ? new Date(this.goalForm.dueDate).toISOString() 
        : null,
      action: this.editingGoal ? "update" : "create",
    };

    // If updating, include goalId
    if (this.editingGoal && this.editingGoal.id) {
      goalData.goalId = this.editingGoal.id;
    }
    console.log('Goal Data:', goalData);
    const response = await fetch('https://3c0x6315c2.execute-api.eu-west-1.amazonaws.com/prod/goals', {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(goalData),
    });

    if (response.ok) {
      await this.fetchUserGoals();
      this.closeGoalForm();
    } else {
      const errMsg = await response.text();
      throw new Error(`Failed to save goal: ${errMsg}`);
    }
  } catch (err) {
    console.error('Error saving goal:', err);
    alert('Failed to save goal. Please try again.');
  }
},
    
    async deleteGoal(goalId) {
      if (!confirm('Are you sure you want to delete this goal?')) return;
      
      try {
        const session = await Auth.currentSession();
        const idToken = session.getIdToken().getJwtToken();
        
        const response = await fetch(`https://3c0x6315c2.execute-api.eu-west-1.amazonaws.com/prod/goals/${goalId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          await this.fetchUserGoals();
        } else {
          throw new Error('Failed to delete goal');
        }
      } catch (err) {
        console.error('Error deleting goal:', err);
        alert('Failed to delete goal. Please try again.');
      }
    },
    
    openTaskDetail(task) {
      console.log('Task clicked:', task);
      this.selectedTask = task;
  
      this.newUpdateText = '';
    },
    
    async markTaskComplete(taskId) {
      try {
        const session = await Auth.currentSession();
        const idToken = session.getIdToken().getJwtToken();
        
        const response = await fetch(`https://3c0x6315c2.execute-api.eu-west-1.amazonaws.com/prod/tasks/${taskId}/complete`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          await this.fetchUserTasks();
          if (this.selectedTask && this.selectedTask.taskId === taskId) {
            this.selectedTask.status = 'completed';
          }
        } else {
          throw new Error('Failed to complete task');
        }
      } catch (err) {
        console.error('Error completing task:', err);
        alert('Failed to mark task as complete. Please try again.');
      }
    },
    
    async addTaskUpdate() {
      if (!this.newUpdateText.trim()) return;
      
      try {
        const session = await Auth.currentSession();
        const idToken = session.getIdToken().getJwtToken();
        
        const update = {
          text: this.newUpdateText,
          author: this.currentUser.name,
          timestamp: new Date().toISOString()
        };
        
        const response = await fetch(`https://3c0x6315c2.execute-api.eu-west-1.amazonaws.com/prod/tasks/${this.selectedTask.taskId}/updates`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(update)
        });
        
        if (response.ok) {
          if (!this.selectedTask.updates) {
            this.selectedTask.updates = [];
          }
          this.selectedTask.updates.unshift(update);
          this.newUpdateText = '';
        } else {
          throw new Error('Failed to add update');
        }
      } catch (err) {
        console.error('Error adding task update:', err);
        alert('Failed to add update. Please try again.');
      }
    },
    
    formatDate(dateString) {
      if (!dateString) return 'No date set';
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    },
    
    formatDateTime(dateString) {
      if (!dateString) return '';
      return new Date(dateString).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    
    getGoalStatusClass(goal) {
      const dueDate = goal.dueDate ? new Date(goal.dueDate) : null;
      const now = new Date();
      
      if (goal.progress === 100) return 'completed';
      if (dueDate && dueDate < now) return 'overdue';
      if (goal.progress > 0) return 'in-progress';
      return 'pending';
    },
    
    getTaskStatusClass(task) {
      return {
        'completed': task.status === 'completed',
        'in-progress': task.status === 'in-progress',
        'overdue': task.status === 'overdue',
        'pending': task.status === 'pending'
      }[task.status] || '';
    },
    
    isUrgent(deadline, status = '') {
      if (!deadline || status === 'completed') return false;
      const due = new Date(deadline);
      const now = new Date();
      const hoursLeft = (due - now) / (1000 * 60 * 60);
      return hoursLeft < 48;
},
    
    async signOut() {
      try {
        await Auth.signOut();
        this.$router.push('/');
      } catch (err) {
        console.error('Error signing out:', err);
      }
    }
  }
};
</script>

<style scoped>
.user-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.dashboard-header h1 {
  margin: 0;
  color: #2c3e50;
}

.user-actions {
  display: flex;
  gap: 10px;
}

.refresh-btn, .logout-btn {
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.refresh-btn {
  background-color: #f5f7fa;
  border: 1px solid #ddd;
  color: #4a89dc;
}

.logout-btn {
  background-color: #e74c3c;
  border: none;
  color: white;
}

.dashboard-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 30px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #2c3e50;
}

.add-goal-btn {
  background-color: #4a89dc;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.goals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.goal-card {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s;
}

.goal-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.goal-card.completed {
  border-left: 5px solid #2ecc71;
}

.goal-card.in-progress {
  border-left: 5px solid #f39c12;
}

.goal-card.overdue {
  border-left: 5px solid #e74c3c;
}

.goal-card.pending {
  border-left: 5px solid #95a5a6;
}
.notification-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 15px 20px;
  border-radius: 4px;
  color: white;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 1001;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease-out;
}

.notification-toast.success {
  background-color: #2ecc71;
}

.notification-toast.error {
  background-color: #e74c3c;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
.goal-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.goal-header h3 {
  margin: 0;
  color: #2c3e50;
}

.goal-actions {
  display: flex;
  gap: 5px;
}

.icon-btn {
  background: none;
  border: none;
  color: #7f8c8d;
  cursor: pointer;
  padding: 5px;
}

.icon-btn:hover {
  color: #4a89dc;
}

.goal-description {
  color: #7f8c8d;
  margin-bottom: 15px;
}

.progress-bar {
  height: 8px;
  background-color: #ecf0f1;
  border-radius: 4px;
  margin-bottom: 5px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #4a89dc;
  transition: width 0.3s ease;
}

.goal-card.completed .progress-fill {
  background-color: #2ecc71;
}

.goal-card.overdue .progress-fill {
  background-color: #e74c3c;
}

.progress-text {
  font-size: 12px;
  color: #7f8c8d;
}

.goal-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #7f8c8d;
  margin-top: 15px;
}

.task-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 15px;
}

.task-card {
  background-color: white;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: transform 0.2s;
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.task-card.completed {
  border-left: 5px solid #2ecc71;
}

.task-card.in-progress {
  border-left: 5px solid #f39c12;
}

.task-card.overdue {
  border-left: 5px solid #e74c3c;
}

.task-card.pending {
  border-left: 5px solid #95a5a6;
}

.task-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.task-header h3 {
  margin: 0;
  color: #2c3e50;
}

.task-status {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.task-card.completed .task-status {
  background-color: #d5f5e3;
  color: #27ae60;
}

.task-card.in-progress .task-status {
  background-color: #fef9e7;
  color: #f39c12;
}

.task-card.overdue .task-status {
  background-color: #fadbd8;
  color: #e74c3c;
}

.task-card.pending .task-status {
  background-color: #ebf5fb;
  color: #3498db;
}

.task-description {
  color: #7f8c8d;
  margin-bottom: 15px;
}

.task-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-deadline {
  font-size: 13px;
  color: #7f8c8d;
  display: flex;
  align-items: center;
  gap: 5px;
}

.task-deadline.urgent {
  color: #e74c3c;
  font-weight: 500;
}

.complete-btn {
  background-color: #2ecc71;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.empty-state i {
  font-size: 40px;
  color: #bdc3c7;
  margin-bottom: 15px;
}

.empty-state p {
  color: #7f8c8d;
  margin-bottom: 20px;
}

.btn-primary {
  background-color: #4a89dc;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-primary:hover {
  background-color: #3a70c2;
}

.btn-secondary {
  background-color: #ecf0f1;
  color: #7f8c8d;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-secondary:hover {
  background-color: #d5dbdb;
}

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
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 5px 30px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #7f8c8d;
}

.goal-form {
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
}

.form-group textarea {
  min-height: 100px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.task-detail-content {
  padding: 20px;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-section h3 {
  margin-top: 0;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #2c3e50;
}

.task-details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.task-details-grid div {
  margin-bottom: 8px;
}

.task-details-grid strong {
  display: inline-block;
  width: 80px;
  color: #7f8c8d;
}

.updates-section {
  max-height: 300px;
  overflow-y: auto;
}

.update-item {
  padding: 10px;
  margin-bottom: 10px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.update-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.update-author {
  font-weight: 500;
}

.update-date {
  font-size: 12px;
  color: #7f8c8d;
}

.update-text {
  margin: 0;
  font-size: 14px;
}

.add-update {
  margin-top: 20px;
}

.add-update textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 10px;
  min-height: 80px;
}

.loading-indicator {
  text-align: center;
  padding: 20px;
  color: #7f8c8d;
}

.loading-indicator i {
  margin-right: 10px;
}

.filter-select {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

@media (max-width: 768px) {
  .dashboard-content {
    grid-template-columns: 1fr;
  }
  
  .goals-grid {
    grid-template-columns: 1fr;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .task-details-grid {
    grid-template-columns: 1fr;
  }
}
</style>