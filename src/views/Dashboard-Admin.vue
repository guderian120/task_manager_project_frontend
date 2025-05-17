<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <h1>Task Management System - Admin Dashboard</h1>
      <div class="user-info">
        <span>{{ user.username }}</span>
        <button @click="signOut" class="logout-btn">Logout</button>
      </div>
    </div>

    <div class="dashboard-content">
      <!-- Statistics Overview -->
      <div class="stats-container">
        <div class="stat-card" v-for="stat in stats" :key="stat.title">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-title">{{ stat.title }}</div>
        </div>
      </div>

      <!-- Task Management Section -->
      <div class="dashboard-section">
        <div class="section-header">
          <h2>Task Management</h2>
          <button @click="showCreateTaskModal = true" class="primary-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Create Task
          </button>
        </div>

        <!-- Task Filters -->
        <div class="filters">
          <select v-model="statusFilter" class="filter-select">
            <option value="">All Statuses</option>
            <option v-for="status in taskStatuses" :value="status" :key="status">{{ status }}</option>
          </select>
          <select v-model="assigneeFilter" class="filter-select">
            <option value="">All Team Members</option>
            <option v-for="member in teamMembers" :value="member.id" :key="member.id">{{ member.name }}</option>
          </select>
          <input type="date" v-model="dateFilter" class="filter-select">
        </div>

        <!-- Tasks Table -->
        <div class="tasks-table">
          <table>
            <thead>
              <tr>
                <th>Task ID</th>
                <th>Title</th>
                <th>Description</th>
                <th>Assignee</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="task in filteredTasks" :key="task.id" :class="getTaskRowClass(task)">
                <td>{{ task.id.slice(0, 8) }}</td>
                <td>{{ task.title }}</td>
                <td class="description-cell">{{ task.description }}</td>
                <td>{{ getAssigneeName(task.assigneeId) }}</td>
                <td>
                  <select v-model="task.status" @change="updateTaskStatus(task)" class="status-select">
                    <option v-for="status in taskStatuses" :value="status" :key="status">{{ status }}</option>
                  </select>
                </td>
                <td :class="{ 'due-soon': isDueSoon(task.dueDate), 'overdue': isOverdue(task.dueDate) }">
                  {{ formatDate(task.dueDate) }}
                </td>
                <td>
                  <button @click="editTask(task)" class="icon-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                  <button @click="confirmDeleteTask(task)" class="icon-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Team Management Section -->
      <div class="dashboard-section">
        <div class="section-header">
          <h2>Team Management</h2>
          <button @click="showInviteModal = true" class="primary-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <line x1="20" y1="8" x2="20" y2="14"></line>
              <line x1="23" y1="11" x2="17" y2="11"></line>
            </svg>
            Invite Team Member
          </button>
        </div>

        <div class="team-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Tasks Assigned</th>
                <th>Last Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="member in teamMembers" :key="member.id">
                <td>{{ member.name }}</td>
                <td>{{ member.email }}</td>
                <td>{{ member.role }}</td>
                <td>{{ getTaskCount(member.id) }}</td>
                <td>{{ formatDate(member.lastActive) }}</td>
                <td>
                  <button @click="editTeamMember(member)" class="icon-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                  <button @click="confirmRemoveMember(member)" class="icon-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Create Task Modal -->
    <div v-if="showCreateTaskModal" class="modal-overlay" @click.self="showCreateTaskModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Create New Task</h3>
          <button @click="showCreateTaskModal = false" class="close-modal">
            &times;
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="createTask">
            <div class="form-group">
              <label>Title</label>
              <input v-model="newTask.title" type="text" required>
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea v-model="newTask.description" rows="3"></textarea>
            </div>
            <div class="form-group">
              <label>Assignee</label>
              <select v-model="newTask.assigneeId" required>
                <option v-for="member in teamMembers" :value="member.id" :key="member.id">
                  {{ member.name }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>Due Date</label>
              <input v-model="newTask.dueDate" type="date" required>
            </div>
            <div class="form-group">
              <label>Priority</label>
              <select v-model="newTask.priority" required>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div class="form-actions">
              <button type="button" @click="showCreateTaskModal = false" class="secondary-btn">
                Cancel
              </button>
              <button type="submit" class="primary-btn">
                Create Task
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Invite Team Member Modal -->
    <div v-if="showInviteModal" class="modal-overlay" @click.self="showInviteModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Invite Team Member</h3>
          <button @click="showInviteModal = false" class="close-modal">
            &times;
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="inviteTeamMember">
            <div class="form-group">
              <label>Email Address</label>
              <input v-model="inviteEmail" type="email" required>
            </div>
            <div class="form-group">
              <label>Name</label>
              <input v-model="inviteName" type="text" required>
            </div>
            <div class="form-group">
              <label>Role</label>
              <select v-model="inviteRole" required>
                <option value="Team Member">Team Member</option>
                <option value="Manager">Manager</option>
              </select>
            </div>
            <div class="form-actions">
              <button type="button" @click="showInviteModal = false" class="secondary-btn">
                Cancel
              </button>
              <button type="submit" class="primary-btn">
                Send Invitation
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <div v-if="showConfirmationModal" class="modal-overlay" @click.self="showConfirmationModal = false">
      <div class="confirmation-modal">
        <h3>{{ confirmationTitle }}</h3>
        <p>{{ confirmationMessage }}</p>
        <div class="confirmation-actions">
          <button @click="confirmAction(false)" class="secondary-btn">Cancel</button>
          <button @click="confirmAction(true)" class="primary-btn">{{ confirmButtonText }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Auth } from 'aws-amplify'

export default {
  name: 'AdminDashboard',
  data() {
    return {
      user: {
        username: '',
        email: '',
        role: 'Admin'
      },
      stats: [
        { title: 'Total Tasks', value: 0 },
        { title: 'Completed', value: 0 },
        { title: 'In Progress', value: 0 },
        { title: 'Overdue', value: 0 },
        { title: 'Team Members', value: 0 }
      ],
      tasks: [],
      teamMembers: [],
      taskStatuses: ['Not Started', 'In Progress', 'Completed', 'Blocked'],
      statusFilter: '',
      assigneeFilter: '',
      dateFilter: '',
      showCreateTaskModal: false,
      newTask: {
        title: '',
        description: '',
        assigneeId: '',
        dueDate: '',
        priority: 'Medium',
        status: 'Not Started'
      },
      showInviteModal: false,
      inviteEmail: '',
      inviteName: '',
      inviteRole: 'Team Member',
      showConfirmationModal: false,
      confirmationTitle: '',
      confirmationMessage: '',
      confirmButtonText: 'Confirm',
      currentAction: null,
      actionItem: null
    }
  },
  computed: {
    filteredTasks() {
      let filtered = this.tasks
      if (this.statusFilter) {
        filtered = filtered.filter(task => task.status === this.statusFilter)
      }
      if (this.assigneeFilter) {
        filtered = filtered.filter(task => task.assigneeId === this.assigneeFilter)
      }
      if (this.dateFilter) {
        filtered = filtered.filter(task => task.dueDate === this.dateFilter)
      }
      return filtered
    }
  },
  async created() {
    await this.fetchUserData()
    await this.fetchTasks()
    await this.fetchTeamMembers()
    this.updateStats()
  },
  methods: {
    async fetchUserData() {
      try {
        const user = await Auth.currentAuthenticatedUser()
        this.user.username = user.username
        this.user.email = user.attributes.email
      } catch (err) {
        console.error('Error fetching user data:', err)
      }
    },
    
    async fetchTasks() {
      try {
        // Replace with your actual API endpoint
        const response = await fetch('https://your-api-endpoint.com/tasks', {
          headers: {
            'Authorization': `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}`
          }
        })
        this.tasks = await response.json()
      } catch (err) {
        console.error('Error fetching tasks:', err)
      }
    },
    
    async fetchTeamMembers() {
      try {
        // Replace with your actual API endpoint
        const response = await fetch('https://your-api-endpoint.com/team-members', {
          headers: {
            'Authorization': `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}`
          }
        })
        this.teamMembers = await response.json()
      } catch (err) {
        console.error('Error fetching team members:', err)
      }
    },
    
    async createTask() {
      try {
        const response = await fetch('https://your-api-endpoint.com/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}`
          },
          body: JSON.stringify(this.newTask)
        })
        
        if (response.ok) {
          const newTask = await response.json()
          this.tasks.push(newTask)
          this.updateStats()
          this.showCreateTaskModal = false
          this.resetNewTask()
        } else {
          throw new Error('Failed to create task')
        }
      } catch (err) {
        console.error('Error creating task:', err)
      }
    },
    
    async updateTaskStatus(task) {
      try {
        const response = await fetch(`https://your-api-endpoint.com/tasks/${task.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}`
          },
          body: JSON.stringify({ status: task.status })
        })
        
        if (!response.ok) {
          throw new Error('Failed to update task status')
        }
        
        await this.fetchTasks()
        this.updateStats()
      } catch (err) {
        console.error('Error updating task status:', err)
      }
    },
    
    async deleteTask(task) {
      try {
        const response = await fetch(`https://your-api-endpoint.com/tasks/${task.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}`
          }
        })
        
        if (response.ok) {
          this.tasks = this.tasks.filter(t => t.id !== task.id)
          this.updateStats()
        } else {
          throw new Error('Failed to delete task')
        }
      } catch (err) {
        console.error('Error deleting task:', err)
      }
    },
    
    async inviteTeamMember() {
      try {
        const response = await fetch('https://your-api-endpoint.com/invitations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}`
          },
          body: JSON.stringify({
            email: this.inviteEmail,
            name: this.inviteName,
            role: this.inviteRole
          })
        })
        
        if (response.ok) {
          this.showInviteModal = false
          this.inviteEmail = ''
          this.inviteName = ''
          this.inviteRole = 'Team Member'
          await this.fetchTeamMembers()
          this.updateStats()
        } else {
          throw new Error('Failed to send invitation')
        }
      } catch (err) {
        console.error('Error inviting team member:', err)
      }
    },
    
    updateStats() {
      this.stats[0].value = this.tasks.length
      this.stats[1].value = this.tasks.filter(t => t.status === 'Completed').length
      this.stats[2].value = this.tasks.filter(t => t.status === 'In Progress').length
      this.stats[3].value = this.tasks.filter(t => this.isOverdue(t.dueDate)).length
      this.stats[4].value = this.teamMembers.length
    },
    
    // [Rest of the helper methods remain the same]
    getAssigneeName(assigneeId) {
      const member = this.teamMembers.find(m => m.id === assigneeId)
      return member ? member.name : 'Unassigned'
    },
    
    getTaskCount(memberId) {
      return this.tasks.filter(t => t.assigneeId === memberId).length
    },
    
    formatDate(dateString) {
      if (!dateString) return 'N/A'
      const options = { year: 'numeric', month: 'short', day: 'numeric' }
      return new Date(dateString).toLocaleDateString(undefined, options)
    },
    
    isDueSoon(dateString) {
      if (!dateString) return false
      const dueDate = new Date(dateString)
      const today = new Date()
      const diffTime = dueDate - today
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays <= 3 && diffDays >= 0
    },
    
    isOverdue(dateString) {
      if (!dateString) return false
      const dueDate = new Date(dateString)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return dueDate < today
    },
    
    getTaskRowClass(task) {
      if (task.status === 'Completed') return 'completed'
      if (this.isOverdue(task.dueDate)) return 'overdue'
      if (this.isDueSoon(task.dueDate)) return 'due-soon'
      return ''
    },
    
    resetNewTask() {
      this.newTask = {
        title: '',
        description: '',
        assigneeId: '',
        dueDate: '',
        priority: 'Medium',
        status: 'Not Started'
      }
    },
    
    editTask(task) {
      this.currentAction = 'editTask'
      this.actionItem = task
      this.newTask = { ...task }
      this.showCreateTaskModal = true
    },
    
    confirmDeleteTask(task) {
      this.currentAction = 'deleteTask'
      this.actionItem = task
      this.confirmationTitle = 'Delete Task'
      this.confirmationMessage = `Are you sure you want to delete the task "${task.title}"?`
      this.confirmButtonText = 'Delete'
      this.showConfirmationModal = true
    },
    
    editTeamMember(member) {
      this.currentAction = 'editMember'
      this.actionItem = member
      this.inviteEmail = member.email
      this.inviteName = member.name
      this.inviteRole = member.role
      this.showInviteModal = true
    },
    
    confirmRemoveMember(member) {
      this.currentAction = 'removeMember'
      this.actionItem = member
      this.confirmationTitle = 'Remove Team Member'
      this.confirmationMessage = `Are you sure you want to remove ${member.name} from the team?`
      this.confirmButtonText = 'Remove'
      this.showConfirmationModal = true
    },
    
    confirmAction(confirmed) {
      this.showConfirmationModal = false
      if (confirmed) {
        switch (this.currentAction) {
          case 'deleteTask':
            this.deleteTask(this.actionItem)
            break
          case 'removeMember':
            this.removeTeamMember(this.actionItem)
            break
        }
      }
      this.currentAction = null
      this.actionItem = null
    },
    
    async signOut() {
      try {
        await Auth.signOut()
        this.$router.push('/')
      } catch (err) {
        console.error('Error signing out:', err)
      }
    }
  }
}
</script>

<style scoped>

.dashboard-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eaeaea;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.logout-btn {
  background: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 5px 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: #e9ecef;
}

.stats-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 5px;
}

.stat-title {
  color: #6c757d;
  font-size: 14px;
}

.dashboard-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.primary-btn {
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.primary-btn:hover {
  background: var(--primary-dark);
}

.filters {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
}

.tasks-table, .team-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #eaeaea;
}

th {
  background: #f8f9fa;
  font-weight: 600;
}

tr:hover {
  background: #f8f9fa;
}

.status-select {
  padding: 5px;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  color: #6c757d;
  transition: all 0.2s;
}

.icon-btn:hover {
  color: var(--primary);
}

.completed {
  opacity: 0.7;
  background: #f0fff0;
}

.overdue {
  background: #fff0f0;
}

.due-soon {
  background: #fff9e6;
}

.due-soon td {
  color: #d48806;
}

.overdue td {
  color: #f5222d;
}

.description-cell {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #eaeaea;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-modal {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6c757d;
}

.modal-body {
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
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-group textarea {
  min-height: 80px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.secondary-btn {
  background: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.secondary-btn:hover {
  background: #e9ecef;
}

.confirmation-modal {
  background: white;
  border-radius: 8px;
  padding: 30px;
  text-align: center;
  max-width: 400px;
}

.confirmation-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 25px;
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .stats-container {
    grid-template-columns: 1fr 1fr;
  }
  
  .filters {
    flex-direction: column;
  }
}
</style>