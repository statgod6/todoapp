// Task management functionality
class TaskManager {
    constructor() {
        this.tasks = [];
        this.upcomingTasks = [];
        this.currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        
        // DOM elements
        this.tasksContainer = document.getElementById('tasks-container');
        this.selectedDateElement = document.getElementById('selected-date');
        this.upcomingTasksList = document.getElementById('upcoming-tasks-list');
        
        // Task form elements
        this.taskModal = document.getElementById('task-modal');
        this.taskForm = document.getElementById('task-form');
        this.taskIdInput = document.getElementById('task-id');
        this.taskTitleInput = document.getElementById('task-title');
        this.taskDescriptionInput = document.getElementById('task-description');
        this.taskDueDateInput = document.getElementById('task-due-date');
        this.taskModalTitle = document.getElementById('task-modal-title');
        
        // AI suggestions elements
        this.aiSuggestionsContainer = document.getElementById('ai-suggestions-container');
        this.aiSuggestionsContent = document.getElementById('ai-suggestions');
        
        // Task detail elements
        this.taskDetailsModal = document.getElementById('task-details-modal');
        this.taskDetailsTitle = document.getElementById('task-details-title');
        this.taskDetailsDescription = document.getElementById('task-details-description');
        this.taskDetailsDueDate = document.getElementById('task-details-due-date');
        this.taskDetailsStatus = document.getElementById('task-details-status');
        this.aiGuidanceContainer = document.getElementById('ai-guidance-container');
        this.aiGuidanceElement = document.getElementById('ai-guidance');
        this.completeTaskBtn = document.getElementById('complete-task-btn');
        this.completeBtnText = document.getElementById('complete-btn-text');
        this.editTaskBtn = document.getElementById('edit-task-btn');
        this.deleteTaskBtn = document.getElementById('delete-task-btn');
        
        // Incomplete reason modal
        this.incompleteReasonModal = document.getElementById('incomplete-reason-modal');
        this.incompleteReasonForm = document.getElementById('incomplete-reason-form');
        this.incompleteReasonInput = document.getElementById('incomplete-reason');
        this.aiFeedbackContainer = document.getElementById('ai-feedback-container');
        this.aiFeedbackElement = document.getElementById('ai-feedback');
        
        // End of Day Review Modal
        this.eodReviewModal = document.getElementById('eod-review-modal');
        this.eodTasksList = document.getElementById('eod-tasks-list');
        this.eodLoading = document.getElementById('eod-loading');
        this.eodEmpty = document.getElementById('eod-empty');
        this.eodRolloverAllBtn = document.getElementById('eod-rollover-all-btn');
        this.eodCompleteReviewBtn = document.getElementById('eod-complete-review-btn');
        
        // Task Reflection Modal
        this.taskReflectionModal = document.getElementById('task-reflection-modal');
        this.reflectionTaskTitle = document.getElementById('reflection-task-title');
        this.reflectionTaskDescription = document.getElementById('reflection-task-description');
        this.reflectionTaskId = document.getElementById('reflection-task-id');
        this.reflectionReason = document.getElementById('reflection-reason');
        this.reflectionForm = document.getElementById('task-reflection-form');
        this.reflectionFeedbackContainer = document.getElementById('reflection-feedback-container');
        this.reflectionFeedback = document.getElementById('reflection-feedback');
        this.reflectionContinueBtn = document.getElementById('reflection-continue-btn');
        
        // Buttons
        this.addTaskBtn = document.getElementById('add-task-btn');
        
        // Task reflection queue
        this.reflectionQueue = [];
        this.currentReflectionIndex = 0;
        
        // Initialize date picker for task form
        this.initDatePicker();
        
        // Add event listeners
        this.initEventListeners();
        
        // Set up end-of-day check timer
        this.setupEodCheck();
    }
    
    init() {
        // Load tasks for the current date
        this.loadTasks(this.currentDate);
        
        // Load upcoming tasks
        this.loadUpcomingTasks();
        
        // Update selected date display
        this.updateSelectedDateDisplay(this.currentDate);
        
        // Set calendar callback
        if (window.calendar) {
        calendar.setOnDateSelectCallback((dateStr) => {
            this.currentDate = dateStr;
            this.loadTasks(dateStr);
            this.updateSelectedDateDisplay(dateStr);
        });
        }
        
        // Check for incomplete tasks from previous day
        this.checkIncompleteTasksFromYesterday();
    }
    
    initDatePicker() {
        // Initialize flatpickr for the due date input
        this.dueDatePicker = flatpickr(this.taskDueDateInput, {
            dateFormat: 'Y-m-d',
            defaultDate: this.currentDate,
            minDate: 'today'
        });
    }
    
    initEventListeners() {
        // Add task button
        this.addTaskBtn.addEventListener('click', () => this.showAddTaskModal());
        
        // Task form submission
        this.taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTask();
        });
        
        // Close modal buttons
        document.querySelectorAll('.close-modal, .close-form-modal').forEach(button => {
            button.addEventListener('click', () => {
                this.closeAllModals();
            });
        });
        
        // Task complete button
        this.completeTaskBtn.addEventListener('click', () => {
            const taskId = this.completeTaskBtn.dataset.taskId;
            const isCompleted = this.completeTaskBtn.dataset.completed === 'true';
            this.toggleTaskComplete(taskId, !isCompleted);
        });
        
        // Task edit button
        this.editTaskBtn.addEventListener('click', () => {
            const taskId = this.editTaskBtn.dataset.taskId;
            this.showEditTaskModal(taskId);
        });
        
        // Task delete button
        this.deleteTaskBtn.addEventListener('click', () => {
            const taskId = this.deleteTaskBtn.dataset.taskId;
            if (confirm('Are you sure you want to delete this task?')) {
                this.deleteTask(taskId);
            }
        });
        
        // Incomplete reason form submission
        this.incompleteReasonForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitIncompleteReason();
        });
        
        // Listen for task description changes to generate AI suggestions
        this.taskDescriptionInput.addEventListener('input', this.debounce(() => {
            this.generateAiSuggestions();
        }, 500));
        
        // End of Day Review buttons
        this.eodRolloverAllBtn.addEventListener('click', () => {
            this.rolloverAllTasks();
        });
        
        this.eodCompleteReviewBtn.addEventListener('click', () => {
            this.startTaskReflection();
        });
        
        // Task Reflection form submission
        this.reflectionForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitTaskReflection();
        });
        
        // Reflection continue button
        this.reflectionContinueBtn.addEventListener('click', () => {
            this.processNextReflection();
        });
    }
    
    // Debounce function to limit how often a function is called
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Generate AI suggestions based on task description
    async generateAiSuggestions() {
        const description = this.taskDescriptionInput.value.trim();
        
        if (description.length < 10) {
            this.aiSuggestionsContainer.style.display = 'none';
            return;
        }
        
        // Show the suggestions container with loading state
        this.aiSuggestionsContainer.style.display = 'block';
        this.aiSuggestionsContent.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading suggestions...</div>';
        
        // Add a timeout to ensure we don't wait forever
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timed out')), 10000)
        );
        
        try {
            // Get AI suggestions from the server with a timeout
            const response = await Promise.race([
                api.getAiSuggestions(description),
                timeoutPromise
            ]);
            
            // Format the suggestions with proper bullet points
            let formattedSuggestions = response.suggestions;
            
            // Check if the suggestions are complete (should have multiple bullet points)
            if (!formattedSuggestions.includes('•') || formattedSuggestions.split('•').length < 3) {
                // If suggestions seem incomplete, use fallback
                formattedSuggestions = this.getFallbackSuggestions(description);
            }
            
            // Convert text bullet points to HTML for better formatting
            formattedSuggestions = formattedSuggestions.replace(/•\s*(.*?)(?=(?:•|$))/gs, '<li>$1</li>');
            this.aiSuggestionsContent.innerHTML = `<ul class="suggestions-list">${formattedSuggestions}</ul>`;
            
            // Add styles for the suggestions list if not already in the stylesheet
            if (!document.getElementById('suggestions-list-styles')) {
                const style = document.createElement('style');
                style.id = 'suggestions-list-styles';
                style.textContent = `
                    .suggestions-list {
                        padding-left: 20px;
                        margin: 0;
                    }
                    .suggestions-list li {
                        margin-bottom: 8px;
                    }
                    .loading-spinner {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        color: var(--color-primary);
                    }
                `;
                document.head.appendChild(style);
            }
        } catch (error) {
            console.error('Error getting AI suggestions:', error);
            
            // Use fallback suggestions
            const fallbackSuggestions = this.getFallbackSuggestions(description);
            
            // Convert text bullet points to HTML for better formatting
            const formattedSuggestions = fallbackSuggestions.replace(/•\s*(.*?)(?=(?:•|$))/gs, '<li>$1</li>');
            this.aiSuggestionsContent.innerHTML = `<ul class="suggestions-list">${formattedSuggestions}</ul>`;
        }
    }
    
    // Get fallback suggestions based on task description
    getFallbackSuggestions(description) {
        let suggestions = '';
        const lowerDesc = description.toLowerCase();
        
        if (lowerDesc.includes('meeting')) {
            suggestions += '• Prepare an agenda before the meeting\n';
            suggestions += '• Set a clear objective for the meeting\n';
            suggestions += '• Consider sending pre-reading materials\n';
            suggestions += '• Schedule follow-up actions after the meeting';
        } else if (lowerDesc.includes('report') || lowerDesc.includes('document')) {
            suggestions += '• Outline the document structure first\n';
            suggestions += '• Set aside uninterrupted time for writing\n';
            suggestions += '• Consider using templates if available\n';
            suggestions += '• Plan time for review and revisions';
        } else if (lowerDesc.includes('email') || lowerDesc.includes('message')) {
            suggestions += '• Be clear and concise in your communication\n';
            suggestions += '• Consider the tone appropriate for your audience\n';
            suggestions += '• Proofread before sending\n';
            suggestions += '• Use bullet points for multiple items';
        } else if (lowerDesc.includes('call') || lowerDesc.includes('phone')) {
            suggestions += '• Prepare talking points before the call\n';
            suggestions += '• Find a quiet location for the call\n';
            suggestions += '• Take notes during the conversation\n';
            suggestions += '• Send a follow-up summary if needed';
        } else if (lowerDesc.includes('presentation')) {
            suggestions += '• Structure your presentation with a clear beginning, middle, and end\n';
            suggestions += '• Use visuals to enhance understanding\n';
            suggestions += '• Practice your delivery multiple times\n';
            suggestions += '• Prepare for potential questions';
        } else if (lowerDesc.includes('research')) {
            suggestions += '• Define your research questions clearly\n';
            suggestions += '• Identify reliable sources before starting\n';
            suggestions += '• Take organized notes as you research\n';
            suggestions += '• Set time limits to avoid going down rabbit holes';
        } else {
            suggestions += '• Break this task into smaller, manageable steps\n';
            suggestions += '• Set a specific time to work on this task\n';
            suggestions += '• Consider what resources you need to complete it\n';
            suggestions += '• Identify potential obstacles and plan for them';
        }
        
        return suggestions;
    }
    
    async loadTasks(dateString) {
        try {
            const response = await api.getTasks(dateString);
            this.tasks = response.tasks;
            
            // Update UI
            this.renderTasks();
            this.updateStats();
            
            // Update calendar task map
            this.fetchAllTasksForCalendar();
            
        } catch (error) {
            console.error('Error loading tasks:', error);
            this.showError('Failed to load tasks. Please try again later.');
        }
    }
    
    async loadUpcomingTasks() {
        try {
            // Show loading state
            if (this.upcomingTasksList) {
                this.upcomingTasksList.innerHTML = '<div class="loading-indicator">Loading upcoming tasks...</div>';
            }
            
            // Get all tasks - we need to fetch tasks without a date filter to get ALL tasks
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayStr = today.toISOString().split('T')[0];
            
            // Fetch all tasks by not specifying a date
            const response = await api.getTasks(); // No date parameter to get all tasks
            const allTasks = response.tasks;
            
            // Filter for upcoming tasks (future dates, not including today)
            this.upcomingTasks = allTasks.filter(task => {
                const taskDate = new Date(task.due_date);
                taskDate.setHours(0, 0, 0, 0);
                return taskDate > today && !task.completed;
            });
            
            // Sort by due date (closest first)
            this.upcomingTasks.sort((a, b) => {
                return new Date(a.due_date) - new Date(b.due_date);
            });
            
            // Limit to next 10 tasks
            this.upcomingTasks = this.upcomingTasks.slice(0, 10);
            
            // Render upcoming tasks
            this.renderUpcomingTasks();
            
            console.log('Upcoming tasks loaded:', this.upcomingTasks.length);
            
        } catch (error) {
            console.error('Error loading upcoming tasks:', error);
            if (this.upcomingTasksList) {
                this.upcomingTasksList.innerHTML = '<div class="error-message">Failed to load upcoming tasks</div>';
            }
        }
    }
    
    renderTasks() {
        // Clear existing tasks
        if (this.tasksContainer) {
            this.tasksContainer.innerHTML = '';
        } else {
            console.error('Tasks container not found');
            return;
        }
        
        // Show empty state if no tasks
        if (!this.tasks || this.tasks.length === 0) {
            // Create empty state
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.innerHTML = `
                <i class="fas fa-clipboard-list"></i>
                <p>No tasks for this day</p>
                <button id="empty-add-task" class="primary-button add-button">
                    <i class="fas fa-plus"></i>
                </button>
            `;
            
            // Add to container
            this.tasksContainer.appendChild(emptyState);
            
            // Add event listener to the empty state add task button
            const emptyAddTaskBtn = emptyState.querySelector('#empty-add-task');
            if (emptyAddTaskBtn) {
                emptyAddTaskBtn.addEventListener('click', () => {
                    this.showAddTaskModal();
                });
            }
        } else {
            // Render each task
            this.tasks.forEach((task, index) => {
                const taskElement = this.createTaskElement(task, index);
                this.tasksContainer.appendChild(taskElement);
            });
        }
    }
    
    createTaskElement(task, index) {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-item';
        taskElement.dataset.taskId = task.id;
        
        // Add color classes based on task properties
        if (task.completed) {
            taskElement.classList.add('completed', 'task-color-green');
        } else {
            // Check if task is overdue
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const taskDate = new Date(task.due_date);
            taskDate.setHours(0, 0, 0, 0);
            
            if (taskDate < today) {
                taskElement.classList.add('overdue', 'task-color-red');
            } else if (taskDate.getTime() === today.getTime()) {
                // For today's tasks, use rotating colors
                const colorClasses = ['task-color-yellow', 'task-color-blue', 'task-color-purple', 'task-color-orange', 'task-color-teal', 'task-color-pink'];
                const colorClass = colorClasses[index % colorClasses.length];
                taskElement.classList.add('today', colorClass);
            } else {
                // Rotate through colors for future tasks
                const daysDiff = Math.floor((taskDate - today) / (1000 * 60 * 60 * 24));
                const colorClasses = ['task-color-blue', 'task-color-purple', 'task-color-orange', 'task-color-teal', 'task-color-pink'];
                const colorClass = colorClasses[daysDiff % colorClasses.length];
                taskElement.classList.add('future', colorClass);
            }
        }
        
        // Add status badge
        let statusText = task.completed ? 'Completed' : 'Pending';
        let statusClass = task.completed ? 'status-completed' : 'status-pending';
        
        // Check if task is overdue
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const taskDate = new Date(task.due_date);
        taskDate.setHours(0, 0, 0, 0);
        
        if (!task.completed && taskDate < today) {
            statusText = 'Overdue';
            statusClass = 'status-overdue';
        }
        
        taskElement.innerHTML = `
            <div class="task-item-title">${task.title}</div>
            <div class="task-item-meta">
                <span class="task-status ${statusClass}">${statusText}</span>
            </div>
        `;
        
        taskElement.addEventListener('click', () => {
            this.showTaskDetails(task.id);
        });
        
        return taskElement;
    }
    
    updateStats() {
        // Skip if elements don't exist
        if (!this.totalTasksElement || !this.completedTasksElement || !this.pendingTasksElement) {
            return;
        }
        
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(task => task.completed).length;
        const pendingTasks = totalTasks - completedTasks;
        
        this.totalTasksElement.textContent = totalTasks;
        this.completedTasksElement.textContent = completedTasks;
        this.pendingTasksElement.textContent = pendingTasks;
    }
    
    updateSelectedDateDisplay(dateString) {
        const date = new Date(dateString);
        const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
        const formattedDate = date.toLocaleDateString('en-US', options);
        
        // Check if it's today, tomorrow or yesterday
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const taskDate = new Date(date);
        taskDate.setHours(0, 0, 0, 0);
        
        let displayText = formattedDate;
        
        if (taskDate.getTime() === today.getTime()) {
            displayText = "Today's Tasks";
        } else if (taskDate.getTime() === tomorrow.getTime()) {
            displayText = "Tomorrow's Tasks";
        } else if (taskDate.getTime() === yesterday.getTime()) {
            displayText = "Yesterday's Tasks";
        }
        
        this.selectedDateElement.textContent = displayText;
    }
    
    async showTaskDetails(taskId) {
        try {
            // Find task in the current tasks array
            const task = this.tasks.find(t => t.id == taskId);
            
            if (!task) {
                this.showError('Task not found. It may have been deleted or moved.');
                return;
            }
            
            // Populate task details modal
            this.taskDetailsTitle.textContent = task.title;
            this.taskDetailsDescription.textContent = task.description || 'No description provided';
            
            // Format dates
            const dueDate = new Date(task.due_date);
            this.taskDetailsDueDate.textContent = dueDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
            
            const createdAt = new Date(task.created_at || new Date());
            this.taskDetailsStatus.textContent = createdAt.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // Generate AI guidance based on task content
            this.generateAiGuidance(task);
            
            // Set up action buttons
            this.completeTaskBtn.dataset.taskId = task.id;
            this.completeTaskBtn.dataset.completed = task.completed.toString();
            this.editTaskBtn.dataset.taskId = task.id;
            this.deleteTaskBtn.dataset.taskId = task.id;
            
            if (task.completed) {
                this.completeTaskBtn.innerHTML = '<i class="fas fa-times"></i> Mark Incomplete';
                this.completeTaskBtn.classList.remove('success-button');
                this.completeTaskBtn.classList.add('secondary-button');
            } else {
                this.completeTaskBtn.innerHTML = '<i class="fas fa-check"></i> Mark Complete';
                this.completeTaskBtn.classList.remove('secondary-button');
                this.completeTaskBtn.classList.add('success-button');
            }
            
            // Show modal
            this.taskDetailsModal.style.display = 'block';
            
        } catch (error) {
            console.error('Error loading task details:', error);
            this.showError('Failed to load task details. Please try again later.');
        }
    }
    
    // Generate AI guidance based on task content
    generateAiGuidance(task) {
        if (!task) return;
        
        // Show loading state first
        this.aiGuidanceElement.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading guidance...</div>';
        
        // Use the AI guidance from the server if available
        if (task.ai_guidance) {
            // Format the guidance with proper line breaks and styling
            let formattedGuidance = task.ai_guidance
                .replace(/\n\n/g, '</p><p>')
                .replace(/\n([^•])/g, '<br>$1')
                .replace(/•\s*(.*?)(?=(?:\n•|\n\n|$))/gs, '<li>$1</li>');
            
            // Wrap bullet points in ul tags
            if (formattedGuidance.includes('<li>')) {
                formattedGuidance = formattedGuidance.replace(/<li>(.*?)<\/li>/gs, function(match) {
                    return '<ul class="guidance-list">' + match + '</ul>';
                });
                // Fix nested lists
                formattedGuidance = formattedGuidance.replace(/<\/ul><ul class="guidance-list">/g, '');
            }
            
            // Wrap in paragraphs if not already
            if (!formattedGuidance.startsWith('<p>')) {
                formattedGuidance = '<p>' + formattedGuidance + '</p>';
            }
            
            this.aiGuidanceElement.innerHTML = formattedGuidance;
            
            // Add styles for the guidance if not already in the stylesheet
            if (!document.getElementById('guidance-styles')) {
                const style = document.createElement('style');
                style.id = 'guidance-styles';
                style.textContent = `
                    #ai-guidance {
                        line-height: 1.5;
                        color: var(--color-text);
                    }
                    #ai-guidance p {
                        margin-bottom: 12px;
                    }
                    .guidance-list {
                        padding-left: 20px;
                        margin: 8px 0;
                    }
                    .guidance-list li {
                        margin-bottom: 6px;
                    }
                    .loading-spinner {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        color: var(--color-primary);
                        margin: 10px 0;
                    }
                `;
                document.head.appendChild(style);
            }
            
            return;
        }
        
        // Otherwise, generate client-side guidance
        let guidance = '';
        const title = task.title.toLowerCase();
        const description = (task.description || '').toLowerCase();
        const dueDate = new Date(task.due_date);
        const today = new Date();
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        
        // Time-based guidance
        if (daysUntilDue < 0) {
            guidance += '<p>⚠️ This task is overdue. Consider rescheduling or prioritizing it immediately.</p>';
        } else if (daysUntilDue === 0) {
            guidance += '<p>⏰ This task is due today. Make sure to allocate time to complete it.</p>';
        } else if (daysUntilDue === 1) {
            guidance += '<p>📅 This task is due tomorrow. Plan your time accordingly.</p>';
        } else if (daysUntilDue <= 3) {
            guidance += '<p>🔔 This task is due soon. Start working on it to avoid last-minute pressure.</p>';
        }
        
        // Content-based guidance
        if (title.includes('meeting') || description.includes('meeting')) {
            guidance += '<p>📋 <strong>Meeting Preparation Tips:</strong></p>';
            guidance += '<ul class="guidance-list">';
            guidance += '<li>Create an agenda and share it with participants</li>';
            guidance += '<li>Prepare any necessary materials or presentations</li>';
            guidance += '<li>Set clear objectives for the meeting</li>';
            guidance += '<li>Follow up with action items after the meeting</li>';
            guidance += '</ul>';
        }
        
        if (title.includes('report') || description.includes('report') || 
            title.includes('document') || description.includes('document')) {
            guidance += '<p>📝 <strong>Document Creation Tips:</strong></p>';
            guidance += '<ul class="guidance-list">';
            guidance += '<li>Start with an outline to organize your thoughts</li>';
            guidance += '<li>Use clear headings and subheadings</li>';
            guidance += '<li>Include visual elements where appropriate</li>';
            guidance += '<li>Allow time for editing and proofreading</li>';
            guidance += '</ul>';
        }
        
        if (title.includes('presentation') || description.includes('presentation')) {
            guidance += '<p>🎯 <strong>Presentation Tips:</strong></p>';
            guidance += '<ul class="guidance-list">';
            guidance += '<li>Keep slides simple and focused on key points</li>';
            guidance += '<li>Practice your delivery multiple times</li>';
            guidance += '<li>Prepare for potential questions</li>';
            guidance += '<li>Test all technology before the presentation</li>';
            guidance += '</ul>';
        }
        
        if (title.includes('email') || description.includes('email') ||
            title.includes('message') || description.includes('message')) {
            guidance += '<p>✉️ <strong>Communication Tips:</strong></p>';
            guidance += '<ul class="guidance-list">';
            guidance += '<li>Be clear and concise in your message</li>';
            guidance += '<li>Use an appropriate tone for your audience</li>';
            guidance += '<li>Proofread before sending</li>';
            guidance += '<li>Consider timing when sending important messages</li>';
            guidance += '</ul>';
        }
        
        // Default guidance if nothing specific was generated
        if (!guidance) {
            guidance = '<p>Here are some general tips for completing this task:</p>';
            guidance += '<ul class="guidance-list">';
            guidance += '<li>Break the task into smaller, manageable steps</li>';
            guidance += '<li>Set aside dedicated time to work on it without distractions</li>';
            guidance += '<li>If you get stuck, take a short break and return with fresh perspective</li>';
            guidance += '<li>Consider what resources or help you might need to complete it efficiently</li>';
            guidance += '</ul>';
        }
        
        this.aiGuidanceElement.innerHTML = guidance;
        
        // Add styles for the guidance if not already in the stylesheet
        if (!document.getElementById('guidance-styles')) {
            const style = document.createElement('style');
            style.id = 'guidance-styles';
            style.textContent = `
                #ai-guidance {
                    line-height: 1.5;
                    color: var(--color-text);
                }
                #ai-guidance p {
                    margin-bottom: 12px;
                }
                .guidance-list {
                    padding-left: 20px;
                    margin: 8px 0;
                }
                .guidance-list li {
                    margin-bottom: 6px;
                }
                .loading-spinner {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: var(--color-primary);
                    margin: 10px 0;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    showAddTaskModal() {
        // Reset form
        this.taskForm.reset();
        this.taskIdInput.value = '';
        
        // Hide AI suggestions initially
        this.aiSuggestionsContainer.style.display = 'none';
        
        // Set due date to current selected date
        this.dueDatePicker.setDate(this.currentDate);
        
        // Update modal title
        document.getElementById('task-modal-title').textContent = 'Add New Task';
        
        // Show modal
        this.taskModal.style.display = 'block';
    }
    
    showEditTaskModal(taskId) {
        // Find task
        const task = this.tasks.find(t => t.id == taskId);
        if (!task) {
            this.showError('Task not found. It may have been deleted or moved.');
            return;
        }
        
        // Close other modals
        this.closeAllModals();
        
        // Populate form
        this.taskIdInput.value = task.id;
        this.taskTitleInput.value = task.title;
        this.taskDescriptionInput.value = task.description || '';
        this.dueDatePicker.setDate(task.due_date);
        
        // Generate AI suggestions based on the description
        this.generateAiSuggestions();
        
        // Update modal title
        document.getElementById('task-modal-title').textContent = 'Edit Task';
        
        // Show modal
        this.taskModal.style.display = 'block';
    }
    
    async saveTask() {
        const taskData = {
            title: this.taskTitleInput.value.trim(),
            description: this.taskDescriptionInput.value.trim(),
            due_date: this.taskDueDateInput.value
        };
        
        // Validate
        if (!taskData.title) {
            this.showError('Task title is required');
            return;
        }
        
        try {
            // Show loading indicator
            const saveButton = document.querySelector('#task-form button[type="submit"]');
            if (!saveButton) {
                console.error('Save button not found');
            }
            const originalText = saveButton ? saveButton.innerHTML : 'Save';
            if (saveButton) {
                saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
                saveButton.disabled = true;
            }
            
            // Add a loading overlay to the modal
            const loadingOverlay = document.createElement('div');
            loadingOverlay.className = 'loading-overlay';
            loadingOverlay.innerHTML = `
                <div class="loading-spinner-container">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Saving task...</p>
                </div>
            `;
            
            // Add styles for the loading overlay if not already in the stylesheet
            if (!document.getElementById('loading-overlay-styles')) {
                const style = document.createElement('style');
                style.id = 'loading-overlay-styles';
                style.textContent = `
                    .loading-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background-color: rgba(0, 0, 0, 0.5);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        z-index: 2000;
                    }
                    .loading-spinner-container {
                        background-color: white;
                        padding: 20px;
                        border-radius: 8px;
                        box-shadow: var(--shadow-md);
                        text-align: center;
                    }
                    .loading-spinner-container i {
                        font-size: 24px;
                        color: var(--color-primary);
                        margin-bottom: 10px;
                    }
                `;
                document.head.appendChild(style);
            }
            
            document.body.appendChild(loadingOverlay);
            
            let response;
            const taskId = this.taskIdInput.value;
            
            if (taskId) {
                // Update existing task
                response = await api.updateTask(taskId, taskData);
                
                // Update the task in the current tasks array to avoid a full reload
                const taskIndex = this.tasks.findIndex(t => t.id == taskId);
                if (taskIndex !== -1) {
                    this.tasks[taskIndex] = { ...this.tasks[taskIndex], ...taskData };
                    // If the task is in the current view, update it
                    const taskElement = this.tasksContainer.querySelector(`[data-task-id="${taskId}"]`);
                    if (taskElement) {
                        const updatedTaskElement = this.createTaskElement(this.tasks[taskIndex]);
                        taskElement.replaceWith(updatedTaskElement);
                    }
                }
            } else {
                // Create new task
                response = await api.createTask(taskData);
                
                // Add the new task to the current tasks array if it's for the current date
                if (taskData.due_date === this.currentDate) {
                    this.tasks.push(response.task);
                    // If we're currently showing an empty state, remove it
                    if (this.tasksContainer.contains(this.emptyState)) {
                        this.tasksContainer.innerHTML = '';
                    }
                    // Add the new task to the UI
                    const newTaskElement = this.createTaskElement(response.task);
                    this.tasksContainer.appendChild(newTaskElement);
                }
            }
            
            // Remove loading overlay
            if (document.body.contains(loadingOverlay)) {
                document.body.removeChild(loadingOverlay);
            }
            
            // Close modal
            this.closeAllModals();
            
            // Show success message
            this.showSuccess(taskId ? 'Task updated successfully' : 'Task created successfully');
            
            // Only reload tasks if the date is different from the current date
            if (taskData.due_date !== this.currentDate) {
            this.loadTasks(this.currentDate);
            } else {
                // Just update the stats
                this.updateStats();
                // Update calendar task map
                this.fetchAllTasksForCalendar();
            }
            
            // After successful save, update upcoming tasks
            this.loadUpcomingTasks();
            
        } catch (error) {
            console.error('Error saving task:', error);
            const errorMessage = error.message || 'Failed to save task. Please try again later.';
            this.showError(errorMessage);
            
            // Remove loading overlay if it exists
            const loadingOverlay = document.querySelector('.loading-overlay');
            if (loadingOverlay && document.body.contains(loadingOverlay)) {
                document.body.removeChild(loadingOverlay);
            }
            
            // Reset save button
            const saveButton = document.querySelector('#task-form button[type="submit"]');
            if (saveButton) {
                saveButton.innerHTML = originalText;
                saveButton.disabled = false;
            }
        }
    }
    
    async toggleTaskComplete(taskId, completed) {
        try {
            await api.updateTask(taskId, { completed });
            
            // Close modal
            this.closeAllModals();
            
            // Refresh tasks
            this.loadTasks(this.currentDate);
            
            // Update upcoming tasks if a task was completed
            if (completed) {
                this.loadUpcomingTasks();
            }
            
        } catch (error) {
            console.error('Error updating task status:', error);
            this.showError('Failed to update task status. Please try again later.');
        }
    }
    
    async deleteTask(taskId) {
        try {
            console.log('Deleting task with ID:', taskId);
            await api.deleteTask(taskId);
            
            // Close modal
            this.closeAllModals();
            
            // Refresh tasks
            this.loadTasks(this.currentDate);
            
            // Update upcoming tasks
            this.loadUpcomingTasks();
            
        } catch (error) {
            console.error('Error deleting task:', error);
            this.showError('Failed to delete task. Please try again later.');
        }
    }
    
    showIncompleteReasonModal(taskId) {
        // Reset form
        this.incompleteReasonForm.reset();
        this.incompleteReasonInput.value = '';
        
        // Hide AI feedback
        this.aiFeedbackContainer.style.display = 'none';
        
        // Show modal
        this.incompleteReasonModal.style.display = 'block';
    }
    
    async submitIncompleteReason() {
        const reason = this.incompleteReasonInput.value.trim();
        
        if (!reason) {
            this.showError('Please provide a reason');
            return;
        }
        
        try {
            const response = await api.addIncompleteReason(this.taskIdInput.value, reason);
            
            // Show AI feedback
            if (response.ai_feedback) {
                this.aiFeedbackElement.textContent = response.ai_feedback;
                this.aiFeedbackContainer.style.display = 'block';
                
                // Don't close modal yet - let user see the feedback
            } else {
                // Close modal if no feedback
                this.closeAllModals();
            }
            
        } catch (error) {
            console.error('Error submitting incomplete reason:', error);
            this.showError('Failed to submit reason. Please try again later.');
        }
    }
    
    async checkIncompleteTasksFromYesterday() {
        try {
            // Get yesterday's date
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayString = yesterday.toISOString().split('T')[0];
            
            // Get tasks from yesterday
            const response = await api.getTasks(yesterdayString);
            const incompleteTasks = response.tasks.filter(task => !task.completed);
            
            if (incompleteTasks.length > 0) {
                // Store tasks for reflection
                this.reflectionQueue = [...incompleteTasks];
                this.currentReflectionIndex = 0;
                
                // Show custom modal instead of browser confirm
                this.eodReviewModal.style.display = 'block';
                
                // Render tasks
                this.renderEodTasks(incompleteTasks);
            }
        } catch (error) {
            console.error('Error checking for incomplete tasks:', error);
        }
    }
    
    closeAllModals() {
        this.taskModal.style.display = 'none';
        this.taskDetailsModal.style.display = 'none';
        this.incompleteReasonModal.style.display = 'none';
        this.eodReviewModal.style.display = 'none';
        this.taskReflectionModal.style.display = 'none';
    }
    
    showError(message) {
        // Create an error toast
        const toast = document.createElement('div');
        toast.className = 'toast error-toast';
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-exclamation-circle"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Show the toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        // Hide the toast after 5 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 5000);
    }
    
    showSuccess(message) {
        // Create a success toast
        const toast = document.createElement('div');
        toast.className = 'toast success-toast';
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-check-circle"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Show the toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        // Hide the toast after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
    
    async fetchAllTasksForCalendar() {
        try {
            // Fetch all tasks for calendar indicators
            // Use empty string instead of undefined to get all tasks
            const response = await fetch('/api/tasks/');
            if (!response.ok) {
                throw new Error('Failed to fetch tasks for calendar');
            }
            const data = await response.json();
            
            if (window.calendar) {
                calendar.updateTaskMap(data.tasks);
            }
        } catch (error) {
            console.error('Error loading tasks for calendar:', error);
        }
    }
    
    renderUpcomingTasks() {
        if (!this.upcomingTasksList) {
            console.error('Upcoming tasks list container not found');
            return;
        }
        
        // Clear existing content
        this.upcomingTasksList.innerHTML = '';
        
        // Show empty state if no upcoming tasks
        if (!this.upcomingTasks || this.upcomingTasks.length === 0) {
            this.upcomingTasksList.innerHTML = `
                <div class="empty-state" style="padding: 1rem; text-align: center;">
                    <i class="fas fa-calendar-check"></i>
                    <p>No upcoming tasks</p>
                </div>
            `;
            return;
        }
        
        // Render each upcoming task
        this.upcomingTasks.forEach((task, index) => {
            const taskElement = document.createElement('div');
            taskElement.className = 'upcoming-task-item';
            
            // Add color classes based on position (rotating colors)
            const colorClasses = ['task-color-yellow', 'task-color-green', 'task-color-blue', 'task-color-purple', 'task-color-orange'];
            const colorClass = colorClasses[index % colorClasses.length];
            taskElement.classList.add(colorClass);
            
            taskElement.dataset.taskId = task.id;
            taskElement.dataset.taskDate = task.due_date;
            
            // Format date as "Day, Month Date"
            const dueDate = new Date(task.due_date);
            const formattedDate = dueDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });
            
            taskElement.innerHTML = `
                <div class="upcoming-task-title">${task.title}</div>
                <div class="upcoming-task-date">
                    <i class="fas fa-calendar-alt"></i> ${formattedDate}
                </div>
            `;
            
            // Add click event to show task details or navigate to that date
            taskElement.addEventListener('click', () => {
                // Navigate to the task's date and then show its details
                if (window.calendar) {
                    calendar.setDate(task.due_date);
                    this.currentDate = task.due_date;
                    this.loadTasks(task.due_date);
                    this.updateSelectedDateDisplay(task.due_date);
                    
                    // Show task details after a short delay to allow the tasks to load
                    setTimeout(() => {
                        this.showTaskDetails(task.id);
                    }, 300);
                } else {
                    // If calendar is not available, just show the task details
                    this.showTaskDetails(task.id);
                }
            });
            
            this.upcomingTasksList.appendChild(taskElement);
        });
    }
    
    // Add these new methods for end-of-day review
    
    setupEodCheck() {
        // Check for end of day every minute
        setInterval(() => this.checkForEndOfDay(), 60000);
        
        // Also check on page load if it's after 9 PM
        this.checkForEndOfDay();
    }
    
    checkForEndOfDay() {
        const now = new Date();
        const hours = now.getHours();
        
        // For testing purposes, always show EOD review if there are incomplete tasks
        // In production, you would use: if (hours >= 21) {
        const forceCheck = true; // Set to false in production
        
        if (forceCheck || hours >= 21) {
            // Check if we've already shown the EOD review today
            const lastEodReview = localStorage.getItem('lastEodReview');
            const today = now.toISOString().split('T')[0];
            
            if (lastEodReview !== today) {
                this.showEndOfDayReview();
            }
        }
    }
    
    async showEndOfDayReview() {
        try {
            // Show the modal
            this.eodReviewModal.style.display = 'block';
            
            // Show loading state
            this.eodLoading.style.display = 'block';
            this.eodTasksList.innerHTML = '';
            this.eodEmpty.style.display = 'none';
            
            // Get incomplete tasks for today
            const today = new Date().toISOString().split('T')[0];
            const response = await api.getTasks(today);
            const incompleteTasks = response.tasks.filter(task => !task.completed);
            
            // Hide loading state
            this.eodLoading.style.display = 'none';
            
            if (incompleteTasks.length === 0) {
                // Show empty state
                this.eodEmpty.style.display = 'block';
                return;
            }
            
            // Store tasks for reflection
            this.reflectionQueue = [...incompleteTasks];
            this.currentReflectionIndex = 0;
            
            // Render tasks
            this.renderEodTasks(incompleteTasks);
            
            // Mark that we've shown the EOD review today
            localStorage.setItem('lastEodReview', today);
            
            console.log('End of day review shown with', incompleteTasks.length, 'incomplete tasks');
        } catch (error) {
            console.error('Error showing end of day review:', error);
            this.showError('Failed to load incomplete tasks. Please try again later.');
        }
    }
    
    renderEodTasks(tasks) {
        this.eodTasksList.innerHTML = '';
        
        tasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = 'eod-task-item';
            taskElement.dataset.taskId = task.id;
            
            const taskHeader = document.createElement('div');
            taskHeader.className = 'eod-task-header';
            
            const taskTitle = document.createElement('h4');
            taskTitle.className = 'eod-task-title';
            taskTitle.textContent = task.title;
            
            const taskStatus = document.createElement('span');
            taskStatus.className = 'task-status task-status-pending';
            taskStatus.textContent = 'Pending';
            
            taskHeader.appendChild(taskTitle);
            taskHeader.appendChild(taskStatus);
            
            const taskDescription = document.createElement('p');
            taskDescription.className = 'eod-task-description';
            taskDescription.textContent = task.description || 'No description';
            
            const taskActions = document.createElement('div');
            taskActions.className = 'eod-task-actions';
            
            const reflectBtn = document.createElement('button');
            reflectBtn.className = 'secondary-button';
            reflectBtn.innerHTML = '<i class="fas fa-comment"></i> Reflect';
            reflectBtn.addEventListener('click', () => {
                this.showTaskReflection(task);
            });
            
            const rolloverBtn = document.createElement('button');
            rolloverBtn.className = 'primary-button';
            rolloverBtn.innerHTML = '<i class="fas fa-calendar-plus"></i> Roll Over';
            rolloverBtn.addEventListener('click', () => {
                this.rolloverTask(task.id);
            });
            
            const completeBtn = document.createElement('button');
            completeBtn.className = 'success-button';
            completeBtn.innerHTML = '<i class="fas fa-check"></i> Complete';
            completeBtn.addEventListener('click', () => {
                this.completeTask(task.id);
            });
            
            taskActions.appendChild(reflectBtn);
            taskActions.appendChild(rolloverBtn);
            taskActions.appendChild(completeBtn);
            
            taskElement.appendChild(taskHeader);
            taskElement.appendChild(taskDescription);
            taskElement.appendChild(taskActions);
            
            this.eodTasksList.appendChild(taskElement);
        });
    }
    
    async rolloverAllTasks() {
        try {
            await api.rolloverTasks();
            
            // Close the modal
            this.closeAllModals();
            
            // Refresh tasks
            this.loadTasks(this.currentDate);
            this.loadUpcomingTasks();
            
            // Show success message
            this.showSuccess('All tasks rolled over to tomorrow');
        } catch (error) {
            console.error('Error rolling over tasks:', error);
            this.showError('Failed to roll over tasks. Please try again later.');
        }
    }
    
    showTaskReflection(task) {
        // Set task details
        this.reflectionTaskTitle.textContent = task.title;
        this.reflectionTaskDescription.textContent = task.description || 'No description';
        this.reflectionTaskId.value = task.id;
        
        // Reset form
        this.reflectionForm.reset();
        this.reflectionReason.value = '';
        
        // Hide feedback
        this.reflectionFeedbackContainer.style.display = 'none';
        
        // Show form
        this.reflectionForm.style.display = 'block';
        
        // Show modal
        this.closeAllModals();
        this.taskReflectionModal.style.display = 'block';
    }
    
    async submitTaskReflection() {
        const taskId = this.reflectionTaskId.value;
        const reason = this.reflectionReason.value.trim();
        const action = document.querySelector('input[name="reflection-action"]:checked').value;
        
        if (!reason) {
            this.showError('Please provide a reason');
            return;
        }
        
        try {
            // Hide form
            this.reflectionForm.style.display = 'none';
            
            // Show loading in feedback container
            this.reflectionFeedbackContainer.style.display = 'block';
            this.reflectionFeedback.innerHTML = '<div class="spinner"></div><p>Getting AI feedback...</p>';
            
            // Process the reflection
            const response = await api.processTaskReflection(taskId, action, reason);
            
            // Show AI feedback
            if (response.ai_feedback) {
                // Format the AI feedback with better styling
                const formattedFeedback = this.formatAiFeedback(response.ai_feedback);
                this.reflectionFeedback.innerHTML = formattedFeedback;
            } else {
                this.reflectionFeedback.innerHTML = 'No AI feedback available.';
            }
            
            // Remove the task from the EOD list
            const taskElement = this.eodTasksList.querySelector(`[data-task-id="${taskId}"]`);
            if (taskElement) {
                taskElement.remove();
            }
            
            // Remove the task from the reflection queue
            this.reflectionQueue = this.reflectionQueue.filter(task => task.id !== parseInt(taskId));
            
            // Refresh tasks
            this.loadTasks(this.currentDate);
            this.loadUpcomingTasks();
            
        } catch (error) {
            console.error('Error submitting task reflection:', error);
            this.showError('Failed to submit reflection. Please try again later.');
        }
    }
    
    // Helper method to format AI feedback with better styling
    formatAiFeedback(feedback) {
        // Split feedback into paragraphs
        const paragraphs = feedback.split('\n').filter(p => p.trim().length > 0);
        
        let formattedHtml = '';
        
        // Format each paragraph
        paragraphs.forEach(paragraph => {
            // Check if it's a suggestion (starts with number or bullet)
            if (/^(\d+[\.\)]|\•|\-|\*)\s/.test(paragraph)) {
                formattedHtml += `<div class="ai-suggestion"><i class="fas fa-lightbulb"></i>${paragraph}</div>`;
            } else {
                formattedHtml += `<p>${paragraph}</p>`;
            }
        });
        
        return formattedHtml;
    }
    
    startTaskReflection() {
        // Close EOD modal
        this.eodReviewModal.style.display = 'none';
        
        // Start with the first task
        this.currentReflectionIndex = 0;
        
        // Show the first task reflection
        if (this.reflectionQueue.length > 0) {
            this.showTaskReflection(this.reflectionQueue[0]);
        } else {
            this.showSuccess('No tasks to reflect on');
        }
    }
    
    processNextReflection() {
        // Move to the next task
        this.currentReflectionIndex++;
        
        // Check if we have more tasks
        if (this.currentReflectionIndex < this.reflectionQueue.length) {
            // Show the next task reflection
            this.showTaskReflection(this.reflectionQueue[this.currentReflectionIndex]);
        } else {
            // We're done with all tasks
            this.closeAllModals();
            this.showSuccess('Task review completed');
        }
    }
    
    async rolloverTask(taskId) {
        try {
            await api.rolloverTask(taskId);
            
            // Remove the task from the EOD list
            const taskElement = this.eodTasksList.querySelector(`[data-task-id="${taskId}"]`);
            if (taskElement) {
                taskElement.remove();
            }
            
            // Remove the task from the reflection queue
            this.reflectionQueue = this.reflectionQueue.filter(task => task.id !== parseInt(taskId));
            
            // Refresh tasks
            this.loadTasks(this.currentDate);
            this.loadUpcomingTasks();
            
            // Show success message
            this.showSuccess('Task rolled over to tomorrow');
        } catch (error) {
            console.error('Error rolling over task:', error);
            this.showError('Failed to roll over task. Please try again later.');
        }
    }
    
    async completeTask(taskId) {
        try {
            await api.completeTask(taskId);
            
            // Remove the task from the EOD list
            const taskElement = this.eodTasksList.querySelector(`[data-task-id="${taskId}"]`);
            if (taskElement) {
                taskElement.remove();
            }
            
            // Remove the task from the reflection queue
            this.reflectionQueue = this.reflectionQueue.filter(task => task.id !== parseInt(taskId));
            
            // Refresh tasks
            this.loadTasks(this.currentDate);
            this.loadUpcomingTasks();
            
            // Show success message
            this.showSuccess('Task marked as completed');
        } catch (error) {
            console.error('Error completing task:', error);
            this.showError('Failed to complete task. Please try again later.');
        }
    }
}

// Create task manager instance
const taskManager = new TaskManager(); 

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    taskManager.init();
}); 