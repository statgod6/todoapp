# This file makes the app directory a Python package 

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize Flask app
app = Flask(__name__, 
    static_folder="static",
    template_folder="templates"
)

# Configure the app
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-key-for-todoapp')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///todo.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Enable CORS with specific configuration
CORS(app, resources={r"/*": {"origins": "*", "supports_credentials": True}})

# Initialize database
db = SQLAlchemy(app)
migrate = Migrate(app, db)

# Import models and routes after db initialization to avoid circular imports
from app.models.user import User
from app.models.task import Task

# Register routes
from app.routes.task_routes import task_bp

app.register_blueprint(task_bp)

@app.route('/')
def index():
    from flask import render_template
    return render_template('index.html') 