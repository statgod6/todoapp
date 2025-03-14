# Todo App

An AI-powered todo application built with Flask and modern web technologies.

## Features

- Create, read, update, and delete tasks
- AI-generated guidance for completing tasks
- Task history tracking
- Roll over incomplete tasks
- AI feedback on incomplete tasks
- Mobile-friendly interface

## Technologies Used

- Backend: Flask, SQLAlchemy, SQLite
- Frontend: HTML, CSS, JavaScript, Tailwind CSS
- AI Integration: OpenAI API

## Setup and Installation

1. Clone the repository:
   ```
   git clone https://github.com/statgod6/todoapp.git
   cd todoapp
   ```

2. Create a virtual environment and install dependencies:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following:
   ```
   FLASK_APP=app.py
   FLASK_ENV=development
   SECRET_KEY=your_secret_key
   OPENAI_API_KEY=your_openai_api_key
   ```

4. Initialize the database:
   ```
   python create_db.py
   ```

5. Run the application:
   ```
   python app.py
   ```

6. Access the application at `http://localhost:5000`

## Project Structure

- `app.py`: Main application entry point
- `app/`: Application package
  - `__init__.py`: Application initialization
  - `models/`: Database models
  - `routes/`: API routes
  - `static/`: Static files (CSS, JS)
  - `templates/`: HTML templates
- `migrations/`: Database migration files

## License

This project is licensed under the MIT License - see the LICENSE file for details. 