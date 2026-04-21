import os
import requests
from dotenv import load_dotenv

load_dotenv()

# AI Studio Settings
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "your_api_key_here")
MODEL_ID = os.getenv("MODEL_ID", "gemini-3-flash-preview") # Using Gemini 2.0 Flash as MedGemma isn't on AI Studio

# Strict doctor persona with medical disclaimers and guardrails
SYSTEM_PROMPT = """You are an experienced clinical assistant AI. 
Your role is to act as a diagnostic assistant using short-term memory to iteratively investigate symptoms.

IMPORTANT GUARDRAILS & INSTRUCTIONS:
1. Iterative Diagnostics: DO NOT jump to conclusions or provide a long list of potential diagnoses immediately. Ask 1 to 2 targeted, clarifying questions at a time to organically narrow down what might be happening, leveraging your short-term memory of the conversation.
2. Soft Language: When discussing potential conditions, use phrases like "These symptoms are often associated with..." or "This could potentially indicate...". Avoid delivering definitive diagnoses.
3. Disclaimer: ALWAYS append the following exact disclaimer to the very end of EVERY response you generate: "I am an AI, not a doctor. Please consult a healthcare professional for medical advice." """

def generate_medical_response(history_dicts):
    """
    history_dicts: list of dicts like [{'role': 'user', 'content': '...'}, {'role': 'model', 'content': '...'}]
    Uses REST POST request to Google AI Studio.
    """
    
    # Format for AI Studio / Gemini API
    system_instruction = {"role": "user", "parts": [{"text": SYSTEM_PROMPT}]}
    
    contents = []
    for msg in history_dicts:
        role = 'user' if msg.get('role') == 'user' else 'model'
        contents.append({
            "role": role,
            "parts": [{"text": msg.get('content', '')}]
        })
        
    # Standard AI Studio endpoint
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL_ID}:generateContent?key={GEMINI_API_KEY}"
    
    headers = {
        "Content-Type": "application/json"
    }
    
    payload = {
        "systemInstruction": system_instruction,
        "contents": contents,
        "generationConfig": {
            "temperature": 0.2, 
            "maxOutputTokens": 8192
        }
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        res_json = response.json()
        
        candidates = res_json.get("candidates", [])
        if candidates:
            return candidates[0]["content"]["parts"][0]["text"]
            
        return "I apologize, but I could not interpret the context effectively. Please try again."
        
    except Exception as e:
        print(f"Error accessing AI Studio API: {e}")
        try:
            err_msg = response.text
        except:
            err_msg = ""
        return f"Error connecting to AI Studio: {str(e)} {err_msg}"
