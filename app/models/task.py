from app import db
from datetime import datetime, date

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    due_date = db.Column(db.Date, nullable=False, default=date.today)
    completed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    ai_guidance = db.Column(db.Text, nullable=True)
    incomplete_reason = db.Column(db.Text, nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    task_histories = db.relationship('TaskHistory', backref='task', lazy=True, cascade="all, delete-orphan")
    
    def __repr__(self):
        return f'<Task {self.title}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'completed': self.completed,
            'ai_guidance': self.ai_guidance,
            'incomplete_reason': self.incomplete_reason,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'user_id': self.user_id
        }

class TaskHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('task.id'), nullable=False)
    due_date = db.Column(db.Date, nullable=False)
    completed = db.Column(db.Boolean, default=False)
    completion_date = db.Column(db.DateTime, nullable=True)
    incomplete_reason = db.Column(db.Text, nullable=True)
    
    def __repr__(self):
        return f'<TaskHistory {self.task_id} - {self.due_date}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'task_id': self.task_id,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'completed': self.completed,
            'completion_date': self.completion_date.isoformat() if self.completion_date else None,
            'incomplete_reason': self.incomplete_reason
        } 