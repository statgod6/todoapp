// API Service for interacting with the backend
class ApiService {
    constructor() {
        this.baseUrl = '/api';
        this.defaultTimeout = 15000; // 15 seconds default timeout
    }
    
    // Helper method to make requests
    async fetchData(endpoint, options = {}) {
        try {
            const url = `${this.baseUrl}${endpoint}`;
            
            // Default options
            const defaultOptions = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            
            // Merge options
            const fetchOptions = { ...defaultOptions, ...options };
            
            // If method is POST, PUT, DELETE and body is an object, stringify it
            if (['POST', 'PUT', 'DELETE'].includes(fetchOptions.method) && 
                fetchOptions.body && 
                typeof fetchOptions.body === 'object') {
                fetchOptions.body = JSON.stringify(fetchOptions.body);
            }
            
            const response = await fetch(url, fetchOptions);
            
            // Check if response is ok
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            
            // Parse JSON response
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
    
    // Task CRUD operations
    async getTasks(date) {
        // If date is undefined or null, don't include it in the URL to get all tasks
        if (!date) {
            return this.fetchData('/tasks/');
        }
        return this.fetchData(`/tasks/?date=${date}`);
    }
    
    async getTask(taskId) {
        return this.fetchData(`/tasks/${taskId}/`);
    }
    
    async createTask(taskData) {
        return this.fetchData('/tasks/', {
            method: 'POST',
            body: taskData
        });
    }
    
    async updateTask(taskId, taskData) {
        return this.fetchData(`/tasks/${taskId}/`, {
            method: 'PUT',
            body: taskData
        });
    }
    
    async deleteTask(taskId) {
        return this.fetchData(`/tasks/${taskId}/`, {
            method: 'DELETE'
        });
    }
    
    // AI suggestions
    async getAiSuggestions(description) {
        return this.fetchData(`/tasks/ai-suggestions/?description=${encodeURIComponent(description)}`);
    }
    
    // Task completion
    async completeTask(taskId) {
        return this.updateTask(taskId, { completed: true });
    }
    
    async uncompleteTask(taskId) {
        return this.updateTask(taskId, { completed: false });
    }
    
    // Incomplete reason
    async addIncompleteReason(taskId, reason) {
        return this.fetchData(`/tasks/${taskId}/incomplete-reason/`, {
            method: 'POST',
            body: { reason }
        });
    }
    
    // Rollover tasks
    async rolloverTasks() {
        return this.fetchData('/tasks/rollover/', {
            method: 'POST'
        });
    }
    
    // New methods for end-of-day review
    
    // Get tasks for today that are incomplete
    async getTodayIncompleteTasks() {
        const today = new Date().toISOString().split('T')[0];
        const response = await this.getTasks(today);
        return response.tasks.filter(task => !task.completed);
    }
    
    // Rollover a specific task to tomorrow
    async rolloverTask(taskId, reason) {
        return this.fetchData(`/tasks/${taskId}/rollover/`, {
            method: 'POST',
            body: { reason }
        });
    }
    
    // Process task reflection (rollover, complete, or delete)
    async processTaskReflection(taskId, action, reason) {
        return this.fetchData(`/tasks/${taskId}/reflection/`, {
            method: 'POST',
            body: { 
                action, // 'rollover', 'complete', or 'delete'
                reason 
            }
        });
    }
    
    // Get AI feedback for incomplete task
    async getAiFeedbackForIncomplete(taskId, reason) {
        return this.fetchData(`/tasks/${taskId}/ai-feedback/`, {
            method: 'POST',
            body: { reason }
        });
    }
}

// Create API service instance
const api = new ApiService(); 