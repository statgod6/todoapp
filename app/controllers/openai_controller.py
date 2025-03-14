import openai
import os
from flask import current_app

class OpenAIController:
    def __init__(self):
        self.api_key = os.environ.get('OPENAI_API_KEY')
        if not self.api_key:
            current_app.logger.warning("OpenAI API key not set. AI features will not work.")
    
    def generate_task_guidance(self, task_title, task_description):
        """Generate step-by-step guidance for completing a task"""
        if not self.api_key:
            return "AI guidance not available. OpenAI API key not configured."
        
        try:
            prompt = f"""
            Please provide step-by-step guidance on how to efficiently complete the following task:
            
            Task: {task_title}
            Description: {task_description}
            
            Provide a detailed breakdown of steps, prioritizing efficiency and best practices.
            """
            
            response = openai.Completion.create(
                model="gpt-3.5-turbo-instruct",
                prompt=prompt,
                max_tokens=3000,
                temperature=0.5
            )
            
            return response.choices[0].text.strip()
        
        except Exception as e:
            current_app.logger.error(f"Error generating AI guidance: {str(e)}")
            return "AI guidance could not be generated at this time."
    
    def generate_incomplete_feedback(self, task_title, task_description, incomplete_reason):
        """Generate feedback for why a task was not completed"""
        if not self.api_key:
            return "AI feedback not available. OpenAI API key not configured."
        
        try:
            prompt = f"""
            The following task was not completed on time:
            
            Task: {task_title}
            Description: {task_description}
            User's reason for not completing: {incomplete_reason}
            
            Please provide constructive feedback and suggestions to help the user complete this task in the future. 
            Focus on addressing challenges mentioned in their reason and suggest practical steps to overcome them.
            """
            
            response = openai.Completion.create(
                model="gpt-3.5-turbo-instruct",
                prompt=prompt,
                max_tokens=3000,
                temperature=0.5
            )
            
            return response.choices[0].text.strip()
        
        except Exception as e:
            current_app.logger.error(f"Error generating AI feedback: {str(e)}")
            return "AI feedback could not be generated at this time." 