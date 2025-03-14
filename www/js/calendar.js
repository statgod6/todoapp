// Calendar functionality
class Calendar {
    constructor() {
        this.calendarElement = document.getElementById('calendar');
        this.selectedDate = new Date();
        this.taskDateMap = {}; // Stores tasks by date for highlighting
        
        // DOM elements for navigation
        this.prevMonthBtn = document.getElementById('prev-month');
        this.nextMonthBtn = document.getElementById('next-month');
        this.currentMonthElement = document.getElementById('current-month');
        
        // Event listeners
        this.onDateSelect = null;
    }
    
    init() {
        // Initialize flatpickr for the calendar
        this.flatpickr = flatpickr(this.calendarElement, {
            inline: true,
            dateFormat: 'Y-m-d',
            defaultDate: this.selectedDate,
            static: true,
            showMonths: 1,
            disableMobile: true,
            prevArrow: '',  // Remove default arrows
            nextArrow: '',  // Remove default arrows
            onChange: (selectedDates, dateStr) => {
                this.selectedDate = selectedDates[0];
                if (this.onDateSelect) {
                    this.onDateSelect(dateStr);
                }
            },
            onMonthChange: (selectedDates, dateStr, instance) => {
                // When month changes, we might need to update task indicators
                this.updateTaskIndicators();
                this.updateMonthDisplay(instance.currentYear, instance.currentMonth);
            },
            onReady: (selectedDates, dateStr, instance) => {
                // When calendar is ready, add custom class for styling
                this.calendarContainer = instance.calendarContainer;
                this.calendarContainer.classList.add('task-calendar');
                
                // Update month display
                this.updateMonthDisplay(instance.currentYear, instance.currentMonth);
                
                // Initialize task indicators
                this.updateTaskIndicators();
                
                // Force a resize to ensure proper layout
                setTimeout(() => {
                    window.dispatchEvent(new Event('resize'));
                }, 100);
            }
        });
        
        // Create custom styling
        this.createCustomStyling();
        
        // Add event listeners for custom navigation
        this.initNavigation();
    }
    
    initNavigation() {
        // Previous month button
        if (this.prevMonthBtn) {
            this.prevMonthBtn.addEventListener('click', () => {
                this.flatpickr.changeMonth(-1);
            });
        }
        
        // Next month button
        if (this.nextMonthBtn) {
            this.nextMonthBtn.addEventListener('click', () => {
                this.flatpickr.changeMonth(1);
            });
        }
    }
    
    updateMonthDisplay(year, monthIndex) {
        if (this.currentMonthElement) {
            const date = new Date(year, monthIndex);
            const monthName = date.toLocaleString('default', { month: 'long' });
            this.currentMonthElement.textContent = `${monthName} ${year}`;
        }
    }
    
    createCustomStyling() {
        // Add custom CSS for task indicators
        const style = document.createElement('style');
        style.textContent = `
            .task-date-indicator {
                position: relative;
            }
            
            .task-date-indicator::after {
                content: '';
                display: block;
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background-color: var(--primary-color);
                position: absolute;
                bottom: 2px;
                left: 50%;
                transform: translateX(-50%);
            }
            
            .task-date-indicator.has-completed-tasks::after {
                background-color: var(--success-color);
            }
            
            .task-date-indicator.has-incomplete-tasks::after {
                background-color: var(--warning-color);
            }
            
            /* Fix for calendar sizing */
            .flatpickr-calendar.inline {
                width: 100% !important;
                box-sizing: border-box !important;
            }
            
            .flatpickr-rContainer,
            .flatpickr-days,
            .dayContainer {
                width: 100% !important;
                min-width: 100% !important;
                max-width: 100% !important;
            }
            
            .flatpickr-day {
                max-width: none !important;
                width: calc(100% / 7 - 2px) !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Update the task indicators when task data changes
    updateTaskMap(tasks) {
        this.taskDateMap = {};
        
        // Group tasks by due date
        tasks.forEach(task => {
            const dateKey = task.due_date.split('T')[0]; // Remove time portion if exists
            
            if (!this.taskDateMap[dateKey]) {
                this.taskDateMap[dateKey] = {
                    tasks: [],
                    hasCompletedTasks: false,
                    hasIncompleteTasks: false
                };
            }
            
            this.taskDateMap[dateKey].tasks.push(task);
            
            if (task.completed) {
                this.taskDateMap[dateKey].hasCompletedTasks = true;
            } else {
                this.taskDateMap[dateKey].hasIncompleteTasks = true;
            }
        });
        
        this.updateTaskIndicators();
    }
    
    updateTaskIndicators() {
        if (!this.calendarContainer) return;
        
        // Get all date elements
        const dateElements = this.calendarContainer.querySelectorAll('.flatpickr-day');
        
        // Remove existing indicators
        dateElements.forEach(dateEl => {
            dateEl.classList.remove('task-date-indicator', 'has-completed-tasks', 'has-incomplete-tasks');
        });
        
        // Add new indicators
        dateElements.forEach(dateEl => {
            const dateAttr = dateEl.getAttribute('aria-label');
            if (!dateAttr) return;
            
            // Format date to match our taskDateMap keys (YYYY-MM-DD)
            const date = new Date(dateAttr);
            const dateKey = date.toISOString().split('T')[0];
            
            if (this.taskDateMap[dateKey]) {
                dateEl.classList.add('task-date-indicator');
                
                if (this.taskDateMap[dateKey].hasCompletedTasks) {
                    dateEl.classList.add('has-completed-tasks');
                }
                
                if (this.taskDateMap[dateKey].hasIncompleteTasks) {
                    dateEl.classList.add('has-incomplete-tasks');
                }
            }
        });
    }
    
    // Set the currently selected date
    setDate(dateString) {
        const date = new Date(dateString);
        this.selectedDate = date;
        this.flatpickr.setDate(date);
    }
    
    // Get the currently selected date as YYYY-MM-DD
    getSelectedDateString() {
        return this.selectedDate.toISOString().split('T')[0];
    }
    
    // Set callback for date selection
    setOnDateSelectCallback(callback) {
        this.onDateSelect = callback;
    }
}

// Create calendar instance
const calendar = new Calendar(); 