from django.shortcuts import render
from django.http import JsonResponse
import json
from .llm import generate_medical_response

def chat_interface(request):
    """Render the main chat UI."""
    return render(request, 'index.html')

def api_chat(request):
    """API endpoint to receive messages and return the MedGemma AI response."""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            messages = data.get('messages', [])
            
            # Call the Custom LLM wrapper
            response_text = generate_medical_response(messages)
            
            return JsonResponse({'status': 'success', 'response': response_text})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    return JsonResponse({'status': 'invalid method'}, status=405)
