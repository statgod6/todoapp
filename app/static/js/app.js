// Main application initialization and coordination
class App {
    constructor() {
        this.initialized = false;
    }
    
    init() {
        if (this.initialized) return;
        
        try {
            // Initialize calendar if it exists
            if (window.calendar) {
                calendar.init();
            } else {
                console.warn('Calendar component not found');
            }
            
            // Initialize task manager if it exists
            if (window.taskManager) {
                taskManager.init();
            } else {
                console.warn('Task manager component not found');
            }
            
            // Add event listeners for global actions
            this.addGlobalEventListeners();
            
            console.log('App initialized successfully');
            this.initialized = true;
        } catch (error) {
            console.error('Error initializing app:', error);
        }
    }
    
    addGlobalEventListeners() {
        // Close modals when clicking outside content
        window.addEventListener('click', (event) => {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                if (event.target === modal) {
                    if (window.taskManager) {
                        taskManager.closeAllModals();
                    }
                }
            });
        });
        
        // Handle escape key to close modals
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                if (window.taskManager) {
                    taskManager.closeAllModals();
                }
            }
        });
    }
}

// Create app instance
const app = new App();

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize app directly for local use
    setTimeout(() => {
        app.init();
    }, 100); // Small delay to ensure all components are loaded
}); 