from app import db
from app.models.user import User
from app.models.task import Task, TaskHistory

# Drop all tables
db.drop_all()

# Create all tables
db.create_all()

# Create a default user
default_user = User(email="local@example.com", name="Local User")
db.session.add(default_user)
db.session.commit()

print("Database initialized successfully with a default user.") 