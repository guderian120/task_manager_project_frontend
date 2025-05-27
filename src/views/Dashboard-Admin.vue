<template>
  <div class="dashboard-container">
    <!-- Header Section -->
    <header class="dashboard-header">
      <div class="header-content">
        <h1>Task Management Dashboard</h1>
        <div class="user-info">
          <span class="welcome">Welcome, {{ currentUser.name }}!</span>
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
      <!-- Stats Overview -->
      <div class="stats-grid">
        <div class="stat-card" v-for="stat in stats" :key="stat.title">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-title">{{ stat.title }}</div>
          <div class="stat-icon" :class="stat.iconClass">
            <i :class="stat.icon"></i>
          </div>
        </div>
      </div>

      <!-- Task Creation Panel -->
      <div class="task-creation-panel">
        <h2 class="panel-title">
          <i class="fas fa-plus-circle"></i> Create New Task
        </h2>
        <form @submit.prevent="createTask" class="task-form">
          <div class="form-group">
            <label>Task Title*</label>
            <input v-model="title" placeholder="e.g., Implement user authentication" required />
          </div>
          
          <div class="form-group">
            <label>Description*</label>
            <textarea v-model="description" placeholder="Detailed task description..." required></textarea>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Assign To*</label>
              <div class="multi-select-container">
                <div class="selected-members">
                  <span v-for="(member, index) in selectedMembers" :key="index" class="member-chip">
                    {{ formatMemberDisplay(member) }}
                    <button type="button" @click="removeMember(index)" class="remove-chip">
                      <i class="fas fa-times"></i>
                    </button>
                  </span>
                  <input
                    v-model="emailInput"
                    type="text"
                    placeholder="Add team members by email"
                    @keydown.enter.prevent="addEmail"
                    @keydown.delete="handleBackspace"
                    @blur="addEmail"
                    @focus="showDropdown = true"
                  />
                </div>
                
                <div v-if="showDropdown" class="member-dropdown">
                  <div 
                    v-for="member in filteredTeamMembers" 
                    :key="member.email"
                    @click="selectMember(member)"
                    class="dropdown-item"
                  >
                    {{ formatMemberDisplay(member) }}
                  </div>
                </div>
              </div>
            </div>
            
            <div class="form-group">
              <label>Deadline</label>
              <input v-model="deadline" type="datetime-local" />
            </div>
          </div>
          
          <button type="submit" class="create-btn" :disabled="isCreating || selectedMembers.length === 0">
            <span v-if="!isCreating">
              <i class="fas fa-tasks"></i> Create Task
            </span>
            <span v-else>
              <i class="fas fa-spinner fa-spin"></i> Creating...
            </span>
          </button>
          
          <div v-if="message" class="message" :class="{ 'success': isSuccess, 'error': !isSuccess }">
            <i :class="isSuccess ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'"></i>
            {{ message }}
          </div>
        </form>
      </div>

      <!-- Recent Tasks -->
      <div class="recent-tasks">
        <h2 class="panel-title">
          <i class="fas fa-history"></i> Recent Tasks
        </h2>
        <div class="task-list">
          <div 
            v-for="task in recentTasks" 
            :key="task.taskId" 
            class="task-card"
            @click="openTaskDetail(task)"
          >
            <div class="task-header">
              <h3>{{ task.title }}</h3>
              <span class="task-status" :class="getStatusClass(task.status)">
                {{ task.status }}
              </span>
            </div>
            <p class="task-description">{{ task.description }}</p>
            <div class="task-footer">
              <div class="task-assignee">
                <i class="fas fa-users"></i>
                <div class="assignee-emails">
                  <div v-for="(assignee, index) in task.assignedTo" :key="index" class="assignee-email">
                    <a :href="'mailto:' + assignee.email" target="_blank">{{ assignee.email }}</a>
                  </div>
                </div>
              </div>
              <div class="task-deadline" :class="{ 'urgent': isUrgent(task.deadline) }">
                <i class="fas fa-calendar-alt"></i> {{ formatDateOnly(task.deadline) }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- Task Detail Modal -->
      <div v-if="selectedTask" class="task-detail-modal" @click.self="selectedTask = null">
        <div class="modal-content">
          <div class="modal-header">
            <h2>{{ selectedTask.title }}</h2>
            <button class="close-btn" @click="selectedTask = null" aria-label="Close">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="task-header-actions">
            <span class="task-status" :class="getStatusClass(selectedTask.status)">
              {{ selectedTask.status }}
            </span>
            <button @click="cycleTaskStatus(selectedTask.taskId,selectedTask.status)" class="status-update-btn">
              <i class="fas fa-sync-alt"></i> Update Status
            </button>
          </div>
          
          <div class="task-detail-grid">
            <!-- Left Column - Task Info -->
            <div class="task-info">
              <div class="detail-section">
                <h3><i class="fas fa-align-left"></i> Description</h3>
                <p>{{ selectedTask.description }}</p>
              </div>
              
             
              
              <div class="detail-section" v-if="selectedTask.goals && selectedTask.goals.length">
                <h3><i class="fas fa-bullseye"></i> Goals Progress</h3>
                <div class="goals-progress">
              <div v-for="(goal, index) in selectedTask.goals" :key="index" class="goal-item">
              <div class="goal-header">
                <div class="goal-title-wrapper">
                  <span class="goal-title">{{ goal.title || goal.name }}</span>
                  <span class="goal-percentage">{{ goal.progress }}%</span>
                </div>
                <div class="goal-meta">
                  <span v-if="goal.dueDate" class="goal-deadline">
                    <i class="fas fa-calendar-alt"></i> Due: {{ formatDate(goal.dueDate) }}
                    <span class="days-remaining" :class="getDeadlineClass(goal.dueDate)">
                      ({{ calculateDaysRemaining(goal.dueDate) }})
                    </span>
                  </span>
                  <span v-if="goal.assignee" class="goal-assignee">
                  <i class="fas fa-user"></i> {{ formatAssigneeDisplay(goal.assignee) }}
                </span>
              </div>
            </div>
            
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: goal.progress + '%' }"
                :class="getProgressClass(goal.progress)"
              ></div>
            </div>
            
            <div class="goal-details">
              <div v-if="goal.description" class="goal-description">
                <p>{{ goal.description }}</p>
              </div>
              
              <div class="goal-stats">
                <span v-if="goal.completed !== undefined" class="goal-stat">
                  <i class="fas fa-check-circle"></i> {{ goal.completed }}/{{ goal.total }} completed
                </span>
                <span v-if="goal.priority" class="goal-stat">
                  <i class="fas fa-flag"></i> Priority: 
                  <span :class="'priority-' + goal.priority.toLowerCase()">
                    {{ goal.priority }}
                  </span>
                </span>
                <span v-if="goal.createdAt" class="goal-stat">
                  <i class="fas fa-clock"></i> Created: {{ formatDateShort(goal.createdAt) }}
                </span>
              </div>
              
              <div v-if="goal.tags && goal.tags.length" class="goal-tags">
                <span v-for="(tag, tagIndex) in goal.tags" :key="tagIndex" class="tag">
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>
                </div>
              </div>
              
          
            </div>
            
            <!-- Right Column - Assignee Metrics -->
            <div class="assignee-metrics">
             <div class="detail-section">
              <h3><i class="fas fa-users"></i> Assignees</h3>
              <div class="assignee-list">
                <div v-for="assignee in assigneesWithProgress" :key="assignee.email" class="assignee-card">
                  <div class="assignee-avatar" :style="{ backgroundColor: stringToColor(assignee.name || assignee.email) }">
                    {{ getInitials(assignee.name || assignee.email) }}
                  </div>
                  <div class="assignee-info">
                    <div class="assignee-name">{{ formatAssigneeDisplay(assignee.email) }}</div>
                    <div class="assignee-role">{{ assignee.role || 'Team Member' }}</div>
                    <div class="assignee-goal-count">
                      <i class="fas fa-bullseye"></i> {{ assignee.goalCount }} goals
                    </div>
                  </div>
                <div class="assignee-progress">
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    :style="{ width: assignee.progress + '%' }"
                    :class="getProgressClass(assignee.progress)"
                  ></div>
                </div>
                <div class="progress-text">
                  {{ assignee.progress }}% complete ({{ assignee.goalCount }} goals)
                </div>
                    
                    <!-- Show assigned goals breakdown -->
                    <div class="assignee-goals-breakdown" v-if="getAssigneeGoals(assignee).length">
                    <div v-for="goal in getAssigneeGoals(assignee)" :key="goal.name" class="goal-breakdown">
                      <span class="goal-breakdown-name">{{ goal.title }}</span>
                      <span class="goal-breakdown-progress">{{ goal.progress }}%</span>
                    </div>
                  </div>
                  </div>
                </div>
              </div>
            </div>
              
          <div class="detail-section">
            <h3><i class="fas fa-chart-line"></i> Performance Metrics</h3>
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-value">{{ calculateGoalsCompletion() }}%</div>
                <div class="metric-label">Goals Completion</div>
                <div class="metric-trend" :class="getCompletionTrendClass()">
                  <i :class="getCompletionTrendIcon()"></i>
                  {{ getCompletionTrendText() }}
                </div>
              </div>
              <div class="metric-card">
                <div class="metric-value">{{ getAverageGoalProgress() }}%</div>
                <div class="metric-label">Avg. Goal Progress</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">{{ countUrgentGoals() }}</div>
                <div class="metric-label">Urgent Goals</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">{{ getGoalsBehindSchedule() }}</div>
                <div class="metric-label">Behind Schedule</div>
              </div>
            </div>
            
            <div class="progress-chart" v-if="selectedTask.goals && selectedTask.goals.length">
              <h4>Goals Progress</h4>
              <div class="chart-bars">
                <div v-for="(goal, index) in selectedTask.goals" :key="index" class="chart-bar-container">
                  <div class="chart-bar" :style="{ height: goal.progress + '%' }"></div>
                  <div class="chart-label">{{ goal.title?.substring(0, 3) || 'G' + index }}</div>
                </div>
              </div>
            </div>
          </div>
              
         
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import { Auth } from 'aws-amplify';

export default {
  name: 'DashboardAdmin',
  data() {
    return {
      title: '',
      description: '',
      deadline: '',
      message: '',
      isCreating: false,
      isSuccess: false,
      isLoadingTasks: false,
      emailInput: '',
      showDropdown: false,
      selectedMembers: [],
      newComment: '',
      newSubtask: '',
      selectedTask: null,
      currentUser: { name: 'Admin', email: 'admin@example.com' },
      commentFiles: [],
      stats: [
        { title: 'Total Tasks', value: 0, icon: 'fas fa-tasks', iconClass: 'blue' },
        { title: 'Completed', value: 0, icon: 'fas fa-check-circle', iconClass: 'green' },
        { title: 'In Progress', value: 0, icon: 'fas fa-spinner', iconClass: 'yellow' },
        { title: 'Overdue', value: 0, icon: 'fas fa-exclamation-triangle', iconClass: 'red' }
      ],
      
      notification: {
            show: false,
            message: '',
            type: '' // 'success' or 'error'
          },

      
    }
  },
computed: {
 assigneesWithProgress() {
    if (!this.selectedTask?.assignedTo || !this.selectedTask?.goals) {
      return [];
    }
    console.log("selected Task:", this.selectedTask.assignedTo);
    return this.selectedTask.assignedTo.map(assignee => {
      // Extract email - handle both nested and flat structures
      const assigneeEmail = assignee.email?.email || assignee.email;
      const assigneeName = assignee.name?.name || assignee.name || assigneeEmail;
      // Generate all possible matching identifiers
      const assigneeIdentifiers = [
        assigneeEmail,
        assigneeName,
        ...(assigneeEmail ? [assigneeEmail.split('@')[0]] : []),
      ].filter(Boolean)
       .map(id => this.normalizeAssigneeIdentifier(id));

      console.log('Assignee:', assigneeEmail, 'Identifiers:', assigneeIdentifiers);
      console.log('goals:', this.selectedTask.goals);
      // Find matching goals
      const assignedGoals = this.selectedTask.goals.filter(goal => {
        if (!goal.assignee) return false;
        
        // Normalize goal's assignee field
        const goalAssignee = this.normalizeAssigneeIdentifier(goal.assignee);
        console.log(`Goal "${goal.title}" assignee:`, goalAssignee);
        
        // Check if any identifier matches
        return assigneeIdentifiers.some(id => id === goalAssignee);
      });

      console.log('Matched goals:', assignedGoals);

      // Calculate progress
      const progress = assignedGoals.length > 0
        ? Math.round(assignedGoals.reduce((sum, goal) => sum + (goal.progress || 0), 0) / assignedGoals.length)
        : 0;

      return {
        ...assignee,
        email: assigneeEmail,
        name: assigneeName,
        progress,
        goalCount: assignedGoals.length,
        assignedGoals // for debugging
      };
    });
  },
  filteredTeamMembers() {
    return this.teamMembers.filter(member => 
      !this.selectedMembers.some(selected => selected.email === member.email) &&
      member.email.toLowerCase().includes(this.emailInput.toLowerCase())
    );
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
    await this.fetchTeamMembers();
    await this.fetchTasks();
    await this.getCurrentUser();
    
  },
  mounted() {
    window.addEventListener('keydown', this.handleKeydown);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeydown);
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
getDeepProperty(obj, path) {
    return path.split('.').reduce((o, p) => o?.[p], obj);
  },
  
  // Extract username from email
  extractUsername(email) {
    return email.split('@')[0];
  },
  
  // Normalize any assignee identifier format
 normalizeAssigneeIdentifier(assignee) {
    if (!assignee) return '';
    
    // If assignee is an object with email or name
    if (typeof assignee === 'object') {
      return this.normalizeAssigneeIdentifier(assignee.email || assignee.name || '');
    }
    
    // Handle string case
    const str = String(assignee).toLowerCase().trim();
    
    // Clean common formats
    return str.replace(/^.*</, '').replace(/>.*$/, ''); // removes "Name <email>" format
  },
    calculateGoalsCompletion() {
      if (!this.selectedTask.goals || this.selectedTask.goals.length === 0) return 0;
      const completedGoals = this.selectedTask.goals.filter(goal => goal.progress === 100).length;
      return Math.round((completedGoals / this.selectedTask.goals.length) * 100);
    },
    getAverageGoalProgress() {
      if (!this.selectedTask.goals || this.selectedTask.goals.length === 0) return 0;
      const totalProgress = this.selectedTask.goals.reduce((sum, goal) => sum + goal.progress, 0);
      return Math.round(totalProgress / this.selectedTask.goals.length);
    },
    countUrgentGoals() {
      if (!this.selectedTask.goals) return 0;
      const now = new Date();
      return this.selectedTask.goals.filter(goal => {
        if (!goal.dueDate) return false;
        const dueDate = new Date(goal.dueDate);
        const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
        return diffDays <= 3 || diffDays < 0;
      }).length;
    },
    getGoalsBehindSchedule() {
      if (!this.selectedTask.goals) return 0;
      const now = new Date();
      return this.selectedTask.goals.filter(goal => {
        if (!goal.dueDate || !goal.createdAt) return false;
        
        const createdDate = new Date(goal.createdAt);
        const dueDate = new Date(goal.dueDate);
        const totalDays = Math.ceil((dueDate - createdDate) / (1000 * 60 * 60 * 24));
        const daysPassed = Math.ceil((now - createdDate) / (1000 * 60 * 60 * 24));
        
        if (daysPassed <= 0) return false;
        if (totalDays <= 0) return true;
        
        const expectedProgress = Math.min(100, Math.round((daysPassed / totalDays) * 100));
        return goal.progress < expectedProgress;
      }).length;
    },
    getCompletionTrendClass() {
      const completion = this.calculateGoalsCompletion();
      if (completion >= 80) return 'high';
      if (completion >= 50) return 'medium';
      return 'low';
    },
    getCompletionTrendIcon() {
      const behind = this.getGoalsBehindSchedule();
      if (behind === 0) return 'fas fa-arrow-up trend-up';
      return 'fas fa-arrow-down trend-down';
    },
    getCompletionTrendText() {
      const behind = this.getGoalsBehindSchedule();
      if (behind === 0) return 'On track';
      return `${behind} behind`;
    },
    calculateDaysRemaining(dueDate) {
      if (!dueDate) return '';
      const deadline = new Date(dueDate);
      const today = new Date();
      const diffTime = deadline - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Tomorrow';
      if (diffDays === -1) return 'Yesterday';
      if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
      return `${diffDays} days left`;
    },
    getDeadlineClass(dueDate) {
      if (!dueDate) return '';
      const deadline = new Date(dueDate);
      const today = new Date();
      const diffTime = deadline - today;
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      
      if (diffDays < 0) return 'overdue';
      if (diffDays <= 3) return 'urgent';
      if (diffDays <= 7) return 'warning';
      return 'normal';
    },
    calculateTaskCompletion() {
      if (!this.selectedTask) return 0;
      const completed = this.selectedTask.subtasks.filter(s => s.completed).length;
      return Math.round((completed / this.selectedTask.subtasks.length) * 100);
    },
    daysUntilDeadline() {
      if (!this.selectedTask.deadline) return 'N/A';
      const deadline = new Date(this.selectedTask.deadline);
      const today = new Date();
      const diffTime = deadline - today;
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },
    getAssigneeGoals(assignee) {
      if (!this.selectedTask.goals) return [];
      const assigneeId = this.normalizeAssigneeIdentifier(assignee);
      
      return this.selectedTask.goals.filter(goal => {
        const goalAssigneeId = this.normalizeAssigneeIdentifier(goal.assignee);
        return goalAssigneeId === assigneeId;
      });
    },
    formatMemberDisplay(member) {
      if (member.name && member.name !== member.email) {
        return `${member.name} (${member.email})`;
      }
      return member.email;
    },
    formatAssigneeDisplay(assignee) {
      if (typeof assignee === 'string') {
        return assignee;
      }
      if (assignee.name && assignee.name !== assignee.email) {
        return assignee.name;
      }
      return assignee.email;
    },
    async fetchTasks() {
      this.isLoadingTasks = true;
      try {
        const session = await Auth.currentSession();
        const idToken = session.getIdToken().getJwtToken();
        
        const response = await fetch('https://3c0x6315c2.execute-api.eu-west-1.amazonaws.com/prod/tasks', {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch tasks');
        const result = await response.json();

        const tasks = result.tasks || [];
        this.recentTasks = tasks.slice(0, 10).map(task => ({
          ...task,
          assignedTo: Array.isArray(task.assignedTo) 
            ? task.assignedTo.map(email => ({
                email,
                name: this.teamMembers.find(m => m.email === email)?.name || email
              }))
            : [{
                email: task.assignedTo,
                name: this.teamMembers.find(m => m.email === task.assignedTo)?.name || task.assignedTo
              }]
        }));
        this.updateStatistics(tasks);
        
      } catch (err) {
        console.error('Fetch tasks error:', err);
        this.message = 'Failed to load tasks';
      } finally {
        this.isLoadingTasks = false;
      }
    },
    async fetchTeamMembers() {
      this.teamMembers = [
        
      ];
    },
    async getCurrentUser() {
      try {
        const user = await Auth.currentAuthenticatedUser();
        this.currentUser = {
          name: user.attributes?.name || user.username || 'User',
          email: user.attributes?.email || 'unknown@example.com'
        };
      } catch (err) {
        console.error('Error getting current user:', err);
        this.currentUser = {
          name: 'User',
          email: 'unknown@example.com'
        };
      }
    },
    updateStatistics(tasks) {
      const now = new Date();
      
      this.stats = [
        { 
          title: 'Total Tasks', 
          value: tasks.length, 
          icon: 'fas fa-tasks', 
          iconClass: 'blue' 
        },
        { 
          title: 'Completed', 
          value: tasks.filter(t => t.status === 'completed').length,
          icon: 'fas fa-check-circle', 
          iconClass: 'green' 
        },
        { 
          title: 'In Progress', 
          value: tasks.filter(t => t.status === 'in-progress').length,
          icon: 'fas fa-spinner', 
          iconClass: 'yellow' 
        },
        { 
          title: 'Overdue', 
          value: tasks.filter(t => {
            if (!t.deadline || t.status === 'completed') return false;
            return new Date(t.deadline) < now;
          }).length,
          icon: 'fas fa-exclamation-triangle', 
          iconClass: 'red' 
        }
      ];
    },
    async createTask() {
      if (this.selectedMembers.length === 0) {
        this.message = 'Please select at least one team member';
        this.isSuccess = false;
        return;
      }

      this.isCreating = true;
      this.message = '';
      
      try {
        const session = await Auth.currentSession();
        const idToken = session.getIdToken().getJwtToken();

        const response = await fetch('https://3c0x6315c2.execute-api.eu-west-1.amazonaws.com/prod/tasks', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: this.title,
            description: this.description,
            assignedTo: this.selectedMembers.map(m => m.email),
            deadline: this.deadline ? new Date(this.deadline).toISOString() : null
          }),
          mode: 'cors'
        });

        const result = await response.json();

        if (response.ok) {
          this.isSuccess = true;
          this.message = 'Task created successfully!';
          await this.fetchTasks();
          this.resetForm();
        } else {
          throw new Error(result.error || 'Failed to create task');
        }
      } catch (err) {
        this.isSuccess = false;
        this.message = err.message;
        console.error('Create task error:', err);
      } finally {
        this.isCreating = false;
      }
    },
    resetForm() {
      this.title = '';
      this.description = '';
      this.deadline = '';
      this.selectedMembers = [];
      this.emailInput = '';
    },
    selectMember(member) {
      if (!this.selectedMembers.some(m => m.email === member.email)) {
        this.selectedMembers.push(member);
      }
      this.emailInput = '';
      this.showDropdown = false;
    },
    addEmail() {
      if (this.emailInput.trim() && this.isValidEmail(this.emailInput)) {
        if (!this.selectedMembers.some(m => m.email === this.emailInput.trim())) {
          this.selectedMembers.push({
            email: this.emailInput.trim(),
            name: this.emailInput.trim()
          });
        }
        this.emailInput = '';
      }
      this.showDropdown = false;
    },
    removeMember(index) {
      this.selectedMembers.splice(index, 1);
    },
    handleBackspace() {
      if (this.emailInput === '' && this.selectedMembers.length > 0) {
        this.removeMember(this.selectedMembers.length - 1);
      }
    },
    isValidEmail(email) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email);
    },
    async openTaskDetail(task) {
      try {
        const baseTask = {
          ...this.sampleTaskDetail,
          ...task,
          assignedTo: [],
          comments: [],
          subtasks: [],
          goals: []
        };

        if (Array.isArray(task.assignedTo)) {
          baseTask.assignedTo = task.assignedTo.map(email => ({
            email,
            name: this.teamMembers.find(m => m.email === email)?.name || email,
            progress: Math.floor(Math.random() * 100),
            role: this.teamMembers.find(m => m.email === email)?.role || 'Team Member'
          }));
        } else if (task.assignedTo) {
          baseTask.assignedTo = [{
            email: task.assignedTo,
            name: this.teamMembers.find(m => m.email === task.assignedTo)?.name || task.assignedTo,
            progress: Math.floor(Math.random() * 100),
            role: this.teamMembers.find(m => m.email === task.assignedTo)?.role || 'Team Member'
          }];
        }
        const session = await Auth.currentSession();
        const idToken = session.getIdToken().getJwtToken();

        const res = await fetch(`https://3c0x6315c2.execute-api.eu-west-1.amazonaws.com/prod/tasks/${task.taskId}/goals-progress`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${idToken}`,
              'Content-Type': 'application/json'
            },
            mode: 'cors'
          })
        if (!res.ok) throw new Error('Failed to fetch goals progress');
        const data = await res.json();
        console.log(data)
        baseTask.goals = data.goals || [];

        this.selectedTask = baseTask;
      } catch (err) {
        console.error('Error opening task detail:', err);
        this.message = 'Failed to load task details';
      }
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
    addComment() {
      if (!this.newComment?.trim()) return;
      
      const comment = {
        id: Date.now(),
        author: this.currentUser.name,
        text: this.newComment.trim(),
        date: new Date().toISOString()
      };
      
      if (!this.selectedTask.comments) {
        this.selectedTask.comments = [];
      }
      
      this.selectedTask.comments.unshift(comment);
      this.newComment = '';
    },
    handleCommentFileUpload(event) {
      this.commentFiles = Array.from(event.target.files);
    },
    addSubtask() {
      if (!this.newSubtask.trim()) return;
      
      this.selectedTask.subtasks.push({
        title: this.newSubtask,
        completed: false
      });
      
      this.newSubtask = '';
    },
    updateSubtask(subtask) {
      const action = subtask.completed ? 'completed' : 'marked incomplete';
      this.selectedTask.timeline.push({
        date: new Date().toISOString(),
        action: `Subtask "${subtask.title}" ${action}`
      });
    },
    getInitials(name) {
      if (!name || typeof name !== 'string') return '?';
      const parts = name.trim().split(' ');
      if (parts.length === 0) return '?';
      return parts.map(part => part[0]?.toUpperCase() || '').join('').slice(0, 2);
    },
    stringToColor(str) {
      if (!str || typeof str !== 'string') return '#4a89dc';
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      const hue = Math.abs(hash % 360);
      return `hsl(${hue}, 70%, 60%)`;
    },
    getProgressClass(progress) {
      if (progress >= 80) return 'high';
      if (progress >= 50) return 'medium';
      return 'low';
    },
    formatDate(dateString) {
      if (!dateString) return 'No deadline';
      const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      return new Date(dateString).toLocaleDateString(undefined, options);
    },
    formatDateShort(dateString) {
      if (!dateString) return '';
      const options = { month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    },


formatDateOnly(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(); // or your preferred date formatting
    // Alternatively for specific format:
    // return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  },



    formatDateTime(dateString) {
      if (!dateString) return '';
      const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      return new Date(dateString).toLocaleDateString(undefined, options);
    },
    getStatusClass(status) {
      return {
        'completed': status === 'completed',
        'in-progress': status === 'in-progress',
        'overdue': status === 'overdue',
        'pending': status === 'pending'
      }[status] || '';
    },
    isUrgent(deadline) {
      if (!deadline) return false;
      const dueDate = new Date(deadline);
      const now = new Date();
      const diffHours = (dueDate - now) / (1000 * 60 * 60);
      return diffHours < 48;
    },
    handleKeydown(e) {
      if (e.key === 'Escape' && this.selectedTask) {
        this.selectedTask = null;
      }
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
}
</script>
<style scoped>
@import '../assets/css/dashboard.css';
</style>