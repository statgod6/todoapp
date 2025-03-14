from flask import Blueprint, request, jsonify
from app import db
from app.models.task import Task, TaskHistory
from app.models.user import User
from datetime import datetime, date, timedelta
import openai
import os
import traceback

task_bp = Blueprint('task', __name__, url_prefix='/api/tasks')

# Configure OpenAI
openai.api_key = os.environ.get('OPENAI_API_KEY')

# Get default user (for local use)
def get_current_user():
    # Get or create a default user for local use
    user = User.query.first()
    if not user:
        user = User(email="local@example.com", name="Local User")
        db.session.add(user)
        db.session.commit()
    return user  # Make sure we return the user object

# Function to generate AI guidance for a task
def generate_ai_guidance(task_title, task_description):
    try:
        if not openai.api_key:
            return "AI guidance not available. OpenAI API key not configured."
        
        prompt = f"""
        Please provide step-by-step guidance on how to efficiently complete the following task:
        
        Task: {task_title}
        Description: {task_description}
        
        Important instructions:
        1. Provide a concise breakdown of steps, prioritizing efficiency and best practices.
        2. Your ENTIRE response MUST be under 1500 characters total (about 300 words).
        3. Ensure your response is complete with no cut-off sentences.
        4. Include 5-7 steps maximum.
        5. Each step should be 2-3 sentences maximum.
        6. Start each step with "Step X:" format.
        """
        
        response = openai.Completion.create(
            model="gpt-3.5-turbo-instruct",
            prompt=prompt,
            max_tokens=400,  # Limit to 400 tokens (about 1500 characters)
            temperature=0.7
        )
        
        guidance = response.choices[0].text.strip()
        
        # Ensure the guidance is not too long and is complete
        if len(guidance) > 1500:
            # Find the last complete step
            last_step_match = guidance[:1500].rfind("Step ")
            if last_step_match > 0:
                # Find the end of this step (next line break after the last complete sentence)
                last_period = guidance[last_step_match:1500].rfind(".")
                if last_period > 0:
                    cut_point = last_step_match + last_period + 1
                    guidance = guidance[:cut_point]
                else:
                    guidance = guidance[:1497] + "..."
            else:
                guidance = guidance[:1497] + "..."
            
        return guidance
    
    except Exception as e:
        print(f"Error generating AI guidance: {str(e)}")
        return "AI guidance could not be generated at this time."

# Function to get AI suggestions based on task description
def get_ai_suggestions(description):
    try:
        if not openai.api_key:
            return "AI suggestions not available. OpenAI API key not configured."
        
        prompt = f"""
        Based on the following task description, provide helpful suggestions for completing this task efficiently:
        
        Description: {description}
        
        Important instructions:
        1. Provide EXACTLY 4 practical suggestions that would help someone complete this task effectively.
        2. Format your response as bullet points starting with "•".
        3. Your ENTIRE response MUST be under 800 characters total (about 160 words).
        4. Each suggestion should be 1-2 sentences maximum.
        5. Ensure your response is complete with no cut-off sentences.
        """
        
        response = openai.Completion.create(
            model="gpt-3.5-turbo-instruct",
            prompt=prompt,
            max_tokens=200,  # Limit to 200 tokens (about 800 characters)
            temperature=0.7
        )
        
        suggestions = response.choices[0].text.strip()
        
        # Ensure the suggestions are not too long and are complete
        if len(suggestions) > 800:
            # Find the last complete bullet point
            last_bullet = suggestions[:800].rfind("\n•")
            if last_bullet > 0:
                # Find the end of this bullet (next period after the last complete sentence)
                last_period = suggestions[last_bullet:800].rfind(".")
                if last_period > 0:
                    cut_point = last_bullet + last_period + 1
                    suggestions = suggestions[:cut_point]
                else:
                    suggestions = suggestions[:797] + "..."
            else:
                suggestions = suggestions[:797] + "..."
            
        return suggestions
    
    except Exception as e:
        print(f"Error generating AI suggestions: {str(e)}")
        return "• Break this task into smaller, manageable steps\n• Set a specific time to work on this task\n• Consider what resources you need to complete it\n• Identify potential obstacles and plan for them"

# Function to get AI feedback on incomplete tasks
def get_ai_feedback_on_incomplete(task_title, task_description, incomplete_reason):
    try:
        if not openai.api_key:
            return "AI feedback not available. OpenAI API key not configured."
        
        prompt = f"""
        The following task was not completed on time:
        
        Task: {task_title}
        Description: {task_description}
        User's reason for not completing: {incomplete_reason}
        
        Important instructions:
        1. Provide constructive feedback and suggestions to help the user complete this task in the future.
        2. Focus on addressing challenges mentioned in their reason and suggest practical steps to overcome them.
        3. Your ENTIRE response MUST be under 1000 characters total (about 200 words).
        4. Provide 3-4 specific suggestions maximum.
        5. Ensure your response is complete with no cut-off sentences.
        """
        
        response = openai.Completion.create(
            model="gpt-3.5-turbo-instruct",
            prompt=prompt,
            max_tokens=250,  # Limit to 250 tokens (about 1000 characters)
            temperature=0.7
        )
        
        feedback = response.choices[0].text.strip()
        
        # Ensure the feedback is not too long and is complete
        if len(feedback) > 1000:
            # Find the last complete sentence
            last_period = feedback[:1000].rfind(".")
            if last_period > 0:
                feedback = feedback[:last_period + 1]
            else:
                feedback = feedback[:997] + "..."
            
        return feedback
    
    except Exception as e:
        print(f"Error generating AI feedback: {str(e)}")
        return "AI feedback could not be generated at this time."

@task_bp.route('/', methods=['GET'])
def get_tasks():
    try:
        user = get_current_user()
        
        # Filter tasks by date if provided
        date_str = request.args.get('date')
        if date_str:
            try:
                filter_date = datetime.strptime(date_str, '%Y-%m-%d').date()
                tasks = Task.query.filter_by(user_id=user.id, due_date=filter_date).all()
            except ValueError:
                return jsonify({'message': 'Invalid date format. Use YYYY-MM-DD'}), 400
        else:
            tasks = Task.query.filter_by(user_id=user.id).all()
        
        return jsonify({
            'tasks': [task.to_dict() for task in tasks]
        }), 200
    except Exception as e:
        print(f"Error in get_tasks: {str(e)}")
        traceback.print_exc()
        return jsonify({'message': f'Server error: {str(e)}'}), 500

@task_bp.route('/', methods=['POST'])
def create_task():
    try:
        user = get_current_user()
        
        data = request.json
        
        # Validate required fields
        if not data.get('title'):
            return jsonify({'message': 'Task title is required'}), 400
        
        # Parse due date
        try:
            due_date = datetime.strptime(data.get('due_date', datetime.now().strftime('%Y-%m-%d')), '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'message': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        # Generate AI guidance
        ai_guidance = generate_ai_guidance(data.get('title'), data.get('description', ''))
        
        # Create new task
        new_task = Task(
            title=data.get('title'),
            description=data.get('description', ''),
            due_date=due_date,
            ai_guidance=ai_guidance,
            user_id=user.id
        )
        
        db.session.add(new_task)
        db.session.commit()
        
        # Create initial task history entry
        task_history = TaskHistory(
            task_id=new_task.id,
            due_date=due_date,
            completed=False
        )
        
        db.session.add(task_history)
        db.session.commit()
        
        return jsonify({
            'message': 'Task created successfully',
            'task': new_task.to_dict()
        }), 201
    except Exception as e:
        print(f"Error in create_task: {str(e)}")
        traceback.print_exc()
        return jsonify({'message': f'Server error: {str(e)}'}), 500

@task_bp.route('/<int:task_id>/', methods=['GET'])
def get_task(task_id):
    try:
        user = get_current_user()
        
        task = Task.query.filter_by(id=task_id, user_id=user.id).first()
        if not task:
            return jsonify({'message': 'Task not found'}), 404
        
        task_data = task.to_dict()
        # Include task history
        task_data['history'] = [history.to_dict() for history in task.task_histories]
        
        return jsonify({'task': task_data}), 200
    except Exception as e:
        print(f"Error in get_task: {str(e)}")
        traceback.print_exc()
        return jsonify({'message': f'Server error: {str(e)}'}), 500

@task_bp.route('/<int:task_id>/', methods=['PUT'])
def update_task(task_id):
    try:
        user = get_current_user()
        
        task = Task.query.filter_by(id=task_id, user_id=user.id).first()
        if not task:
            return jsonify({'message': 'Task not found'}), 404
        
        data = request.json
        
        # Update task fields
        if 'title' in data:
            task.title = data['title']
        
        if 'description' in data:
            task.description = data['description']
            # Regenerate AI guidance if description changed significantly
            if task.description != data['description']:
                task.ai_guidance = generate_ai_guidance(task.title, data['description'])
        
        if 'due_date' in data:
            try:
                new_due_date = datetime.strptime(data['due_date'], '%Y-%m-%d').date()
                # Only create a new history entry if the due date changed
                if task.due_date != new_due_date:
                    task.due_date = new_due_date
                    
                    # Create new task history entry for the new due date
                    task_history = TaskHistory(
                        task_id=task.id,
                        due_date=new_due_date,
                        completed=task.completed
                    )
                    db.session.add(task_history)
            except ValueError:
                return jsonify({'message': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        if 'completed' in data:
            was_completed_before = task.completed
            task.completed = data['completed']
            
            # Update the current task history entry
            current_history = TaskHistory.query.filter_by(
                task_id=task.id, 
                due_date=task.due_date
            ).order_by(TaskHistory.id.desc()).first()
            
            if current_history:
                current_history.completed = data['completed']
                if data['completed'] and not was_completed_before:
                    current_history.completion_date = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Task updated successfully',
            'task': task.to_dict()
        }), 200
    except Exception as e:
        print(f"Error in update_task: {str(e)}")
        traceback.print_exc()
        return jsonify({'message': f'Server error: {str(e)}'}), 500

@task_bp.route('/<int:task_id>/', methods=['DELETE'])
def delete_task(task_id):
    try:
        user = get_current_user()
        
        task = Task.query.filter_by(id=task_id, user_id=user.id).first()
        if not task:
            return jsonify({'message': 'Task not found'}), 404
        
        # Delete all task histories first
        TaskHistory.query.filter_by(task_id=task_id).delete()
        
        # Then delete the task
        db.session.delete(task)
        db.session.commit()
        
        return jsonify({'message': 'Task deleted successfully'}), 200
    except Exception as e:
        print(f"Error in delete_task: {str(e)}")
        traceback.print_exc()
        return jsonify({'message': f'Server error: {str(e)}'}), 500

@task_bp.route('/<int:task_id>/incomplete-reason/', methods=['POST'])
def add_incomplete_reason(task_id):
    try:
        user = get_current_user()
        
        task = Task.query.filter_by(id=task_id, user_id=user.id).first()
        if not task:
            return jsonify({'message': 'Task not found'}), 404
        
        data = request.json
        reason = data.get('reason', '')
        
        if not reason:
            return jsonify({'message': 'Reason is required'}), 400
        
        # Update the task's incomplete reason
        task.incomplete_reason = reason
        
        # Update the task history entry
        current_history = TaskHistory.query.filter_by(
            task_id=task.id, 
            due_date=task.due_date
        ).order_by(TaskHistory.id.desc()).first()
        
        if current_history:
            current_history.incomplete_reason = reason
        
        db.session.commit()
        
        # Generate AI feedback
        ai_feedback = get_ai_feedback_on_incomplete(task.title, task.description, reason)
        
        return jsonify({
            'message': 'Incomplete reason added successfully',
            'ai_feedback': ai_feedback
        }), 200
    except Exception as e:
        print(f"Error in add_incomplete_reason: {str(e)}")
        traceback.print_exc()
        return jsonify({'message': f'Server error: {str(e)}'}), 500

@task_bp.route('/rollover/', methods=['POST'])
def rollover_tasks():
    try:
        user = get_current_user()
        
        # Get yesterday's date
        yesterday = date.today() - timedelta(days=1)
        
        # Find incomplete tasks from yesterday
        incomplete_tasks = Task.query.filter_by(
            user_id=user.id,
            due_date=yesterday,
            completed=False
        ).all()
        
        # Roll over each task to today
        for task in incomplete_tasks:
            # Update due date to today
            task.due_date = date.today()
            
            # Create new task history entry
            task_history = TaskHistory(
                task_id=task.id,
                due_date=date.today(),
                completed=False
            )
            db.session.add(task_history)
        
        db.session.commit()
        
        return jsonify({
            'message': f'Successfully rolled over {len(incomplete_tasks)} tasks',
            'count': len(incomplete_tasks)
        }), 200
    except Exception as e:
        print(f"Error in rollover_tasks: {str(e)}")
        traceback.print_exc()
        return jsonify({'message': f'Server error: {str(e)}'}), 500

@task_bp.route('/<int:task_id>/rollover/', methods=['POST'])
def rollover_single_task(task_id):
    try:
        user = get_current_user()
        
        # Find the task
        task = Task.query.filter_by(id=task_id, user_id=user.id).first()
        if not task:
            return jsonify({'message': 'Task not found'}), 404
        
        data = request.json
        reason = data.get('reason', '')
        
        # Update the task's incomplete reason if provided
        if reason:
            task.incomplete_reason = reason
            
            # Update the task history entry
            current_history = TaskHistory.query.filter_by(
                task_id=task.id, 
                due_date=task.due_date
            ).order_by(TaskHistory.id.desc()).first()
            
            if current_history:
                current_history.incomplete_reason = reason
        
        # Set the due date to tomorrow
        tomorrow = date.today() + timedelta(days=1)
        task.due_date = tomorrow
        
        # Create new task history entry
        task_history = TaskHistory(
            task_id=task.id,
            due_date=tomorrow,
            completed=False
        )
        db.session.add(task_history)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Task successfully rolled over to tomorrow',
            'task': task.to_dict()
        }), 200
    except Exception as e:
        print(f"Error in rollover_single_task: {str(e)}")
        traceback.print_exc()
        return jsonify({'message': f'Server error: {str(e)}'}), 500

@task_bp.route('/<int:task_id>/reflection/', methods=['POST'])
def process_task_reflection(task_id):
    try:
        user = get_current_user()
        
        # Find the task
        task = Task.query.filter_by(id=task_id, user_id=user.id).first()
        if not task:
            return jsonify({'message': 'Task not found'}), 404
        
        data = request.json
        action = data.get('action', '')
        reason = data.get('reason', '')
        
        if not action:
            return jsonify({'message': 'Action is required'}), 400
        
        # Update the task's incomplete reason if provided
        if reason:
            task.incomplete_reason = reason
            
            # Update the task history entry
            current_history = TaskHistory.query.filter_by(
                task_id=task.id, 
                due_date=task.due_date
            ).order_by(TaskHistory.id.desc()).first()
            
            if current_history:
                current_history.incomplete_reason = reason
        
        # Process the action
        if action == 'rollover':
            # Set the due date to tomorrow
            tomorrow = date.today() + timedelta(days=1)
            task.due_date = tomorrow
            
            # Create new task history entry
            task_history = TaskHistory(
                task_id=task.id,
                due_date=tomorrow,
                completed=False
            )
            db.session.add(task_history)
            
            message = 'Task rolled over to tomorrow'
            
        elif action == 'complete':
            # Mark the task as completed
            task.completed = True
            task.completion_date = datetime.now()
            
            # Update the task history entry
            if current_history:
                current_history.completed = True
                current_history.completion_date = datetime.now()
                
            message = 'Task marked as completed'
            
        elif action == 'delete':
            # Delete the task
            db.session.delete(task)
            message = 'Task deleted'
            
        else:
            return jsonify({'message': 'Invalid action'}), 400
        
        db.session.commit()
        
        # Generate AI feedback if reason was provided
        ai_feedback = None
        if reason:
            ai_feedback = get_ai_feedback_on_incomplete(task.title, task.description, reason)
        
        return jsonify({
            'message': message,
            'ai_feedback': ai_feedback
        }), 200
    except Exception as e:
        print(f"Error in process_task_reflection: {str(e)}")
        traceback.print_exc()
        return jsonify({'message': f'Server error: {str(e)}'}), 500

@task_bp.route('/<int:task_id>/ai-feedback/', methods=['POST'])
def get_ai_feedback(task_id):
    try:
        user = get_current_user()
        
        # Find the task
        task = Task.query.filter_by(id=task_id, user_id=user.id).first()
        if not task:
            return jsonify({'message': 'Task not found'}), 404
        
        data = request.json
        reason = data.get('reason', '')
        
        if not reason:
            return jsonify({'message': 'Reason is required'}), 400
        
        # Generate AI feedback
        ai_feedback = get_ai_feedback_on_incomplete(task.title, task.description, reason)
        
        return jsonify({
            'ai_feedback': ai_feedback
        }), 200
    except Exception as e:
        print(f"Error in get_ai_feedback: {str(e)}")
        traceback.print_exc()
        return jsonify({'message': f'Server error: {str(e)}'}), 500

@task_bp.route('/ai-suggestions/', methods=['POST'])
def ai_suggestions():
    try:
        data = request.json
        description = data.get('description', '')
        
        if not description or len(description) < 5:
            return jsonify({
                'suggestions': '• Please provide a more detailed description for better suggestions\n• Consider what you want to accomplish with this task\n• Think about any deadlines or constraints'
            }), 200
        
        # Generate AI suggestions
        suggestions = get_ai_suggestions(description)
        
        return jsonify({
            'suggestions': suggestions
        }), 200 
    except Exception as e:
        print(f"Error in ai_suggestions: {str(e)}")
        traceback.print_exc()
        return jsonify({'message': f'Server error: {str(e)}'}), 500 