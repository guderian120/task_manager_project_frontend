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
                <span v-for="(assignee, index) in task.assignedTo" :key="index">
                  {{ formatAssigneeDisplay(assignee) }}{{ index < task.assignedTo.length - 1 ? ', ' : '' }}
                </span>
              </div>
              <div class="task-deadline" :class="{ 'urgent': isUrgent(task.deadline) }">
                <i class="fas fa-calendar-alt"></i> {{ formatDate(task.deadline) }}
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
            <button @click="updateTaskStatus" class="status-update-btn">
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
              
              <div class="detail-section">
                <h3><i class="fas fa-stream"></i> Subtasks</h3>
                <div class="subtasks-list">
                  <div v-for="(subtask, index) in selectedTask.subtasks" :key="index" class="subtask-item">
                    <input 
                      type="checkbox" 
                      :id="'subtask-' + index"
                      v-model="subtask.completed"
                      @change="updateSubtask(subtask)"
                    >
                    <label :for="'subtask-' + index" :class="{ 'completed': subtask.completed }">
                      {{ subtask.title }}
                    </label>
                    <span class="subtask-status">
                      {{ subtask.completed ? 'Completed' : 'Pending' }}
                    </span>
                  </div>
                  <div class="add-subtask">
                    <input 
                      v-model="newSubtask" 
                      placeholder="Add new subtask"
                      @keyup.enter="addSubtask"
                    >
                    <button @click="addSubtask" class="add-subtask-btn">
                      <i class="fas fa-plus"></i> Add
                    </button>
                  </div>
                </div>
              </div>
              
              <div class="detail-section">
                <h3><i class="fas fa-history"></i> Timeline</h3>
                <div class="timeline">
                  <div class="timeline-item" v-for="(event, index) in selectedTask.timeline" :key="index">
                    <div class="timeline-date">{{ formatDateShort(event.date) }}</div>
                    <div class="timeline-dot" :class="'dot-' + index"></div>
                    <div class="timeline-content">{{ event.action }}</div>
                  </div>
                </div>
              </div>
              
              <div class="detail-section">
                <h3><i class="fas fa-paperclip"></i> Attachments</h3>
                <div class="attachments">
                  <div v-for="file in selectedTask.attachments" :key="file.name" class="file-item">
                    <i :class="'fas fa-file-' + getFileIcon(file.name)"></i> 
                    <div class="file-info">
                      <span class="file-name">{{ file.name }}</span>
                      <span class="file-size">{{ file.size }}</span>
                    </div>
                    <a :href="file.url" target="_blank" class="download-btn">
                      <i class="fas fa-download"></i>
                    </a>
                  </div>
                  <div class="upload-area">
                    <input 
                      type="file" 
                      id="file-upload"
                      @change="handleFileUpload"
                      multiple
                    >
                    <label for="file-upload" class="upload-btn">
                      <i class="fas fa-cloud-upload-alt"></i> Upload Files
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Right Column - Assignee Metrics -->
            <div class="assignee-metrics">
              <div class="detail-section">
                <h3><i class="fas fa-users"></i> Assignees</h3>
                <div class="assignee-list">
                  <div v-for="assignee in selectedTask.assignedTo" :key="assignee.email" class="assignee-card">
                    <div class="assignee-avatar" :style="{ backgroundColor: stringToColor(assignee.name || assignee.email) }">
                      {{ getInitials(assignee.name || assignee.email) }}
                    </div>
                    <div class="assignee-info">
                      <div class="assignee-name">{{ formatAssigneeDisplay(assignee.email) }}</div>
                      <div class="assignee-email">{{ formatAssigneeDisplay(assignee.name) }}</div>
                      <div class="assignee-role">{{ assignee.role || 'Team Member' }}</div>
                    </div>
                    <div class="assignee-progress">
                      <div class="progress-bar">
                        <div 
                          class="progress-fill" 
                          :style="{ width: assignee.progress + '%' }"
                          :class="getProgressClass(assignee.progress)"
                        ></div>
                      </div>
                      <div class="progress-text">{{ assignee.progress }}% complete</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="detail-section">
                <h3><i class="fas fa-chart-line"></i> Performance Metrics</h3>
                <div class="metrics-grid">
                  <div class="metric-card">
                    <div class="metric-value">{{ selectedTask.completionRate }}%</div>
                    <div class="metric-label">Overall Completion</div>
                    <div class="metric-trend" :class="selectedTask.completionTrend >= 0 ? 'up' : 'down'">
                      <i :class="selectedTask.completionTrend >= 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down'"></i>
                      {{ Math.abs(selectedTask.completionTrend) }}%
                    </div>
                  </div>
                  <div class="metric-card">
                    <div class="metric-value">{{ selectedTask.daysRemaining }}</div>
                    <div class="metric-label">Days Remaining</div>
                    <div class="metric-trend" :class="selectedTask.daysTrend > 0 ? 'good' : 'bad'">
                      {{ selectedTask.daysTrend > 0 ? 'Ahead' : 'Behind' }}
                    </div>
                  </div>
                  <div class="metric-card">
                    <div class="metric-value">{{ selectedTask.hoursLogged }}</div>
                    <div class="metric-label">Hours Logged</div>
                    <div class="metric-trend">
                      {{ selectedTask.hoursPerDay }}h/day
                    </div>
                  </div>
                  <div class="metric-card">
                    <div class="metric-value">{{ selectedTask.checklistCompleted }}/{{ selectedTask.checklistTotal }}</div>
                    <div class="metric-label">Checklist Items</div>
                    <div class="metric-trend">
                      {{ Math.round((selectedTask.checklistCompleted / selectedTask.checklistTotal) * 100) }}%
                    </div>
                  </div>
                </div>
                
                <div class="progress-chart">
                  <h4>Completion Progress</h4>
                  <div class="chart-bars">
                    <div v-for="(day, index) in selectedTask.progressHistory" :key="index" class="chart-bar-container">
                      <div class="chart-bar" :style="{ height: day.completion + '%' }"></div>
                      <div class="chart-label">{{ day.day }}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="detail-section">
                <h3><i class="fas fa-comments"></i> Comments</h3>
                <div class="comments-section">
                  <div v-for="comment in selectedTask.comments" :key="comment.id" class="comment">
                    <div class="comment-avatar" :style="{ backgroundColor: stringToColor(comment.author) }">
                      {{ getInitials(comment.author) }}
                    </div>
                    <div class="comment-content">
                      <div class="comment-header">
                        <span class="comment-author">{{ comment.author }}</span>
                        <span class="comment-date">{{ formatDateTime(comment.date) }}</span>
                      </div>
                      <div class="comment-text">{{ comment.text }}</div>
                      <div v-if="comment.attachments" class="comment-attachments">
                        <a 
                          v-for="file in comment.attachments" 
                          :key="file.name" 
                          :href="file.url" 
                          target="_blank"
                          class="comment-file"
                        >
                          <i :class="'fas fa-file-' + getFileIcon(file.name)"></i> {{ file.name }}
                        </a>
                      </div>
                    </div>
                  </div>
                  <div class="add-comment">
                    <div class="comment-avatar" :style="{ backgroundColor: stringToColor(currentUser.name) }">
                      {{ getInitials(currentUser.name) }}
                    </div>
                    <div class="comment-input">
                      <textarea 
                        v-model="newComment" 
                        placeholder="Add a comment..."
                        @keyup.enter="addComment"
                      ></textarea>
                      <div class="comment-actions">
                        <label for="comment-file-upload" class="attach-btn">
                          <i class="fas fa-paperclip"></i>
                          <input 
                            type="file" 
                            id="comment-file-upload"
                            @change="handleCommentFileUpload"
                            multiple
                            hidden
                          >
                        </label>
                        <button @click="addComment" class="comment-btn">
                          <i class="fas fa-paper-plane"></i> Post
                        </button>
                      </div>
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
      teamMembers: [
        { name: 'Alex Johnson', email: 'alex@example.com', role: 'Frontend Developer' },
        { name: 'Maria Garcia', email: 'maria@example.com', role: 'Backend Developer' },
        { name: 'James Wilson', email: 'james@example.com', role: 'UI/UX Designer' },
        { name: 'Sarah Chen', email: 'sarah@example.com', role: 'QA Engineer' }
      ],
      recentTasks: [],
      sampleTaskDetail: {
        taskId: 'task-123',
        title: 'Implement User Authentication',
        description: 'Develop a secure authentication system with JWT tokens, role-based access control, and password recovery features.',
        status: 'in-progress',
        assignedTo: [
          { email: 'alex@example.com', name: 'Alex Johnson', progress: 75, role: 'Frontend Developer' },
          { email: 'maria@example.com', name: 'Maria Garcia', progress: 40, role: 'Backend Developer' }
        ],
        subtasks: [
          { title: 'Design login UI', completed: true },
          { title: 'Implement JWT token generation', completed: true },
          { title: 'Create password recovery flow', completed: false },
          { title: 'Set up role-based permissions', completed: false }
        ],
        timeline: [
          { date: '2023-06-01T00:00:00Z', action: 'Task created' },
          { date: '2023-06-03T00:00:00Z', action: 'Assigned to team' },
          { date: '2023-06-05T00:00:00Z', action: 'Frontend components completed' },
          { date: '2023-06-07T00:00:00Z', action: 'Backend API implemented' }
        ],
        attachments: [
          { name: 'AuthRequirements.pdf', url: '#', size: '2.4 MB' },
          { name: 'UIMockup.fig', url: '#', size: '3.1 MB' },
          { name: 'APIDocumentation.md', url: '#', size: '0.5 MB' }
        ],
        comments: [
          { 
            id: 1, 
            author: 'Alex Johnson', 
            text: 'I\'ve completed the login and registration UI components. Please review the mockups attached.', 
            date: '2023-06-02T14:30:00Z',
            attachments: [
              { name: 'LoginMockup.png', url: '#' },
              { name: 'RegisterMockup.png', url: '#' }
            ]
          },
          { 
            id: 2, 
            author: 'Maria Garcia', 
            text: 'The JWT token generation is now working. I\'ve pushed the code to the development branch.', 
            date: '2023-06-04T10:15:00Z' 
          },
          { 
            id: 3, 
            author: 'James Wilson', 
            text: 'I\'ve reviewed the UI and have some suggestions for improvement. Let me know when we can discuss.', 
            date: '2023-06-05T16:45:00Z' 
          }
        ],
        completionRate: 58,
        completionTrend: 12,
        daysRemaining: 7,
        daysTrend: -2,
        hoursLogged: 24,
        hoursPerDay: 3.4,
        checklistCompleted: 2,
        checklistTotal: 4,
        progressHistory: [
          { day: 'Mon', completion: 10 },
          { day: 'Tue', completion: 15 },
          { day: 'Wed', completion: 25 },
          { day: 'Thu', completion: 40 },
          { day: 'Fri', completion: 58 }
        ],
        deadline: '2023-06-15T00:00:00Z'
      }
    }
  },
  computed: {
    filteredTeamMembers() {
      return this.teamMembers.filter(member => 
        !this.selectedMembers.some(selected => selected.email === member.email) &&
        member.email.toLowerCase().includes(this.emailInput.toLowerCase())
      );
    }
  },
  async created() {
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
    formatMemberDisplay(member) {
      if (member.name && member.name !== member.email) {
        return `${member.name} (${member.email})`;
      }
      return member.email;
    },
    
    formatAssigneeDisplay(assignee) {
      // Handle both string (email) and object formats
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
        this.recentTasks = tasks.slice(0, 5).map(task => ({
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
      // In a real app, you would fetch this from your API
      // Using mock data for demonstration
      this.teamMembers = [
        { name: 'Alex Johnson', email: 'alex@example.com', role: 'Frontend Developer' },
        { name: 'Maria Garcia', email: 'maria@example.com', role: 'Backend Developer' },
        { name: 'James Wilson', email: 'james@example.com', role: 'UI/UX Designer' },
        { name: 'Sarah Chen', email: 'sarah@example.com', role: 'QA Engineer' }
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
          attachments: [],
          subtasks: []
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
        
        this.selectedTask = baseTask;
      } catch (err) {
        console.error('Error opening task detail:', err);
        this.message = 'Failed to load task details';
      }
    },
    
    async updateTaskStatus() {
      const statuses = ['pending', 'in-progress', 'completed', 'overdue'];
      const currentIndex = statuses.indexOf(this.selectedTask.status);
      const nextIndex = (currentIndex + 1) % statuses.length;
      this.selectedTask.status = statuses[nextIndex];
      
      this.selectedTask.timeline.push({
        date: new Date().toISOString(),
        action: `Status changed to ${this.selectedTask.status}`
      });
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
    
    handleFileUpload(event) {
      const files = Array.from(event.target.files);
      files.forEach(file => {
        this.selectedTask.attachments.push({
          name: file.name,
          size: this.formatFileSize(file.size),
          url: URL.createObjectURL(file)
        });
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
    
    getFileIcon(filename) {
      if (!filename || typeof filename !== 'string') return '';
      const extension = filename.split('.').pop().toLowerCase();
      switch(extension) {
        case 'pdf': return 'pdf';
        case 'doc': case 'docx': return 'word';
        case 'xls': case 'xlsx': return 'excel';
        case 'ppt': case 'pptx': return 'powerpoint';
        case 'jpg': case 'jpeg': case 'png': case 'gif': return 'image';
        case 'zip': case 'rar': return 'archive';
        default: return '';
      }
    },
    
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
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
/* Previous styles remain the same, with these additions: */

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 15px;
  margin-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.close-btn {
  background: #f5f5f5;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
}

.close-btn:hover {
  background: #e0e0e0;
}

.close-btn i {
  font-size: 18px;
  color: #666;
}

/* Rest of the styles remain unchanged */
/* Base Styles */
.dashboard-container {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #333;
  line-height: 1.6;
}

.dashboard-header {
  background-color: #2c3e50;
  color: white;
  padding: 15px 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.logout-btn {
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.logout-btn:hover {
  background-color: #c0392b;
}

.dashboard-content {
  max-width: 1200px;
  margin: 30px auto;
  padding: 0 20px;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-title {
  color: #7f8c8d;
  font-size: 14px;
}

.stat-icon {
  position: absolute;
  right: 20px;
  top: 20px;
  font-size: 40px;
  opacity: 0.2;
}

.stat-icon.blue { color: #3498db; }
.stat-icon.green { color: #2ecc71; }
.stat-icon.yellow { color: #f1c40f; }
.stat-icon.red { color: #e74c3c; }

/* Task Creation Panel */
.task-creation-panel {
  background-color: white;
  border-radius: 8px;
  padding: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  margin-bottom: 30px;
}

.panel-title {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 20px;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 10px;
}

.task-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 500;
  color: #2c3e50;
}

.form-group input,
.form-group textarea,
.form-group select {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group textarea {
  min-height: 100px;
  resize: vertical;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.create-btn {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-top: 10px;
}

.create-btn:hover:not(:disabled) {
  background-color: #2980b9;
}

.create-btn:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

.message {
  padding: 10px;
  border-radius: 4px;
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.message.success {
  background-color: #d5f5e3;
  color: #27ae60;
}

.message.error {
  background-color: #fadbd8;
  color: #e74c3c;
}

/* Multi-Select Component */
.multi-select-container {
  position: relative;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px;
  background: white;
  min-height: 42px;
}

.selected-members {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.member-chip {
  background-color: #e0e0e0;
  padding: 4px 8px 4px 12px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  font-size: 14px;
}

.remove-chip {
  background: none;
  border: none;
  margin-left: 6px;
  cursor: pointer;
  color: #666;
  padding: 0;
  font-size: 12px;
}

.multi-select-container input {
  border: none;
  outline: none;
  padding: 8px;
  flex-grow: 1;
  min-width: 150px;
  background: transparent;
}

.member-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-top: none;
  border-radius: 0 0 4px 4px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
}

.dropdown-item {
  padding: 8px 12px;
  cursor: pointer;
}

.dropdown-item:hover {
  background-color: #f5f5f5;
}

/* Recent Tasks */
.recent-tasks {
  background-color: white;
  border-radius: 8px;
  padding: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.task-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.task-card {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.task-header h3 {
  margin: 0;
  font-size: 16px;
  color: #2c3e50;
}

.task-status {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.task-status.completed {
  background-color: #d5f5e3;
  color: #27ae60;
}

.task-status.in-progress {
  background-color: #fef9e7;
  color: #f39c12;
}

.task-status.overdue {
  background-color: #fadbd8;
  color: #e74c3c;
}

.task-status.pending {
  background-color: #ebf5fb;
  color: #3498db;
}

.task-description {
  color: #7f8c8d;
  font-size: 14px;
  margin-bottom: 15px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.task-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #7f8c8d;
}

.task-assignee {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
}

.task-deadline {
  display: flex;
  align-items: center;
  gap: 5px;
}

.task-deadline.urgent {
  color: #e74c3c;
  font-weight: 500;
}

/* Task Detail Modal */
.task-detail-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 1200px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 30px;
  position: relative;
  box-shadow: 0 5px 30px rgba(0, 0, 0, 0.3);
}

.close-modal {
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #666;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.close-modal:hover {
  background-color: #f5f5f5;
}

.task-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.task-detail-header h2 {
  margin: 0;
  font-size: 24px;
  color: #2c3e50;
}

.task-header-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.status-update-btn {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-update-btn:hover {
  background-color: #2980b9;
}

.task-detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

.detail-section {
  margin-bottom: 25px;
}

.detail-section h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 18px;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Timeline styles */
.timeline {
  position: relative;
  padding-left: 20px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 7px;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: #e0e0e0;
}

.timeline-item {
  position: relative;
  margin-bottom: 15px;
  display: flex;
  align-items: flex-start;
}

.timeline-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: #4a89dc;
  position: absolute;
  left: -23px;
  top: 2px;
}

.timeline-date {
  width: 80px;
  font-size: 13px;
  color: #7f8c8d;
  flex-shrink: 0;
}

.timeline-content {
  flex: 1;
  padding-left: 10px;
  font-size: 14px;
}

/* Subtasks styles */
.subtasks-list {
  border: 1px solid #eee;
  border-radius: 6px;
  overflow: hidden;
}

.subtask-item {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  border-bottom: 1px solid #eee;
  background-color: #f9f9f9;
}

.subtask-item:last-child {
  border-bottom: none;
}

.subtask-item input[type="checkbox"] {
  margin-right: 12px;
}

.subtask-item label {
  flex: 1;
  font-size: 14px;
}

.subtask-item label.completed {
  text-decoration: line-through;
  color: #7f8c8d;
}

.subtask-status {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  background-color: #ebf5fb;
  color: #3498db;
}

.subtask-item.completed .subtask-status {
  background-color: #d5f5e3;
  color: #27ae60;
}

.add-subtask {
  display: flex;
  padding: 10px;
  background-color: white;
}

.add-subtask input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px 0 0 4px;
  outline: none;
}

.add-subtask-btn {
  background-color: #4a89dc;
  color: white;
  border: none;
  padding: 0 15px;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
  transition: background-color 0.3s;
}

.add-subtask-btn:hover {
  background-color: #3a70c2;
}

/* Attachments styles */
.attachments {
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 10px;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 10px;
  margin-bottom: 8px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.file-item i {
  font-size: 20px;
  margin-right: 12px;
  color: #7f8c8d;
}

.file-info {
  flex: 1;
}

.file-name {
  display: block;
  font-size: 14px;
  margin-bottom: 2px;
}

.file-size {
  font-size: 12px;
  color: #7f8c8d;
}

.download-btn {
  color: #4a89dc;
  text-decoration: none;
  margin-left: 10px;
  padding: 5px 10px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.download-btn:hover {
  background-color: #ebf5fb;
}

.upload-area {
  margin-top: 15px;
}

#file-upload {
  display: none;
}

.upload-btn {
  display: inline-block;
  background-color: #f5f7fa;
  color: #4a89dc;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  font-size: 14px;
}

.upload-btn:hover {
  background-color: #e0e8f0;
}

/* Assignee styles */
.assignee-list {
  border: 1px solid #eee;
  border-radius: 6px;
  overflow: hidden;
}

.assignee-card {
  display: flex;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #eee;
  background-color: #f9f9f9;
}

.assignee-card:last-child {
  border-bottom: none;
}

.assignee-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 15px;
  flex-shrink: 0;
  font-size: 14px;
}

.assignee-info {
  flex: 1;
  min-width: 0;
}

.assignee-name {
  font-weight: 500;
  margin-bottom: 2px;
}

.assignee-email {
  font-size: 12px;
  color: #7f8c8d;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.assignee-role {
  font-size: 12px;
  color: #3498db;
  font-weight: 500;
}

.assignee-progress {
  width: 150px;
  flex-shrink: 0;
}

.progress-bar {
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 4px;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.progress-fill.high { background-color: #4CAF50; }
.progress-fill.medium { background-color: #FFC107; }
.progress-fill.low { background-color: #F44336; }

.progress-text {
  font-size: 12px;
  text-align: right;
  color: #666;
}

/* Metrics grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.metric-card {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 6px;
  text-align: center;
  position: relative;
}

.metric-value {
  font-size: 24px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 5px;
}

.metric-label {
  font-size: 13px;
  color: #7f8c8d;
  margin-bottom: 5px;
}

.metric-trend {
  font-size: 12px;
  font-weight: 500;
}

.metric-trend.up {
  color: #4CAF50;
}

.metric-trend.down {
  color: #F44336;
}

.metric-trend.good {
  color: #4CAF50;
}

.metric-trend.bad {
  color: #F44336;
}

/* Progress chart */
.progress-chart {
  background-color: white;
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 15px;
  margin-top: 20px;
}

.progress-chart h4 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 15px;
  color: #2c3e50;
}

.chart-bars {
  display: flex;
  height: 150px;
  align-items: flex-end;
  gap: 10px;
  padding-top: 20px;
}

.chart-bar-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.chart-bar {
  width: 30px;
  background-color: #4a89dc;
  border-radius: 4px 4px 0 0;
  transition: height 0.5s ease;
}

.chart-label {
  margin-top: 8px;
  font-size: 12px;
  color: #7f8c8d;
}

/* Comments section */
.comments-section {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 10px;
}

.comment {
  display: flex;
  gap: 15px;
  padding: 15px;
  margin-bottom: 15px;
  background-color: white;
  border: 1px solid #eee;
  border-radius: 8px;
}

.comment-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
  font-size: 14px;
}

.comment-content {
  flex: 1;
  min-width: 0;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.comment-author {
  font-weight: 500;
  color: #2c3e50;
}

.comment-date {
  font-size: 12px;
  color: #7f8c8d;
}

.comment-text {
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 10px;
}

.comment-attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.comment-file {
  font-size: 12px;
  color: #4a89dc;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  background-color: #ebf5fb;
  border-radius: 4px;
}

.comment-file:hover {
  text-decoration: underline;
}

.add-comment {
  display: flex;
  gap: 15px;
  padding: 15px;
  background-color: white;
  border: 1px solid #eee;
  border-radius: 8px;
  margin-top: 20px;
}

.comment-input {
  flex: 1;
}

.comment-input textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  resize: vertical;
  min-height: 80px;
  margin-bottom: 10px;
  font-family: inherit;
  font-size: 14px;
}

.comment-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.attach-btn {
  color: #7f8c8d;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.attach-btn:hover {
  background-color: #f5f5f5;
}

.comment-btn {
  background-color: #4a89dc;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.comment-btn:hover {
  background-color: #3a70c2;
}

/* Responsive adjustments */
@media (max-width: 992px) {
  .task-detail-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 10px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .task-list {
    grid-template-columns: 1fr;
  }
  
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
</style>