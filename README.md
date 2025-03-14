# Smart Task Manager

An AI-powered to-do application that helps you manage tasks more efficiently with OpenAI-generated guidance and feedback.

## Features

- **Calendar-based Task Management**: Add and manage tasks with an intuitive calendar interface
- **AI-powered Task Guidance**: Get step-by-step instructions on how to complete your tasks efficiently
- **Task History Tracking**: Maintain a history of tasks, categorized by date and completion status
- **Automatic Task Rollover**: Incomplete tasks automatically transfer to the next day
- **AI Feedback on Incomplete Tasks**: Get personalized feedback on why tasks weren't completed
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Firebase Authentication**: Secure user accounts and data

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript with a responsive design
- **Backend**: Flask with SQLAlchemy
- **Database**: SQLite (development) / PostgreSQL (production)
- **AI Integration**: OpenAI API
- **Authentication**: Firebase Authentication

## Setup Instructions

### Prerequisites

- Python 3.8+
- Node.js and npm (for Firebase CLI if needed)
- Firebase account
- OpenAI API key

### Environment Setup

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/smart-task-manager.git
   cd smart-task-manager
   ```

2. Create and activate a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the root directory with the following variables:
   ```
   FLASK_APP=app.py
   FLASK_ENV=development
   SECRET_KEY=your_secret_key
   OPENAI_API_KEY=your_openai_api_key
   ```

5. Configure Firebase:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication with Email/Password
   - Download the Firebase Service Account key JSON file
   - Save it as `firebase-service-account.json` in the root directory or set the content as environment variable

6. Update Firebase configuration:
   - Edit `app/static/js/firebase-config.js` with your Firebase project settings

### Database Setup

1. Initialize the database:
   ```
   flask db init
   flask db migrate -m "Initial migration"
   flask db upgrade
   ```

### Running the Application

1. Start the Flask development server:
   ```
   flask run
   ```

2. Access the application in your browser at:
   ```
   http://localhost:5000
   ```

## Using the Application

1. **Sign Up / Login**: Create an account or login with your credentials
2. **Add Tasks**: Click the "Add Task" button to create a new task
3. **Set Task Details**: Enter a title, description, and select a due date
4. **View AI Guidance**: Each task includes AI-generated guidance on how to complete it efficiently
5. **Mark as Complete**: Click on a task and mark it as complete when finished
6. **Review History**: See your task history and track your productivity over time

## Deployment

### Heroku Deployment

1. Create a Heroku account and install the Heroku CLI
2. Login to Heroku:
   ```
   heroku login
   ```
3. Create a new Heroku app:
   ```
   heroku create your-app-name
   ```
4. Add PostgreSQL addon:
   ```
   heroku addons:create heroku-postgresql:hobby-dev
   ```
5. Configure environment variables:
   ```
   heroku config:set SECRET_KEY=your_secret_key
   heroku config:set OPENAI_API_KEY=your_openai_api_key
   heroku config:set FIREBASE_CONFIG='{"type": "service_account", ...}'
   ```
6. Deploy to Heroku:
   ```
   git push heroku main
   ```
7. Run migrations:
   ```
   heroku run flask db upgrade
   ```

## License

This project is licensed under the MIT License - see the LICENSE file for details. 