import os
from dotenv import load_dotenv
load_dotenv()  # Load .env

import requests
from groq import Groq
from fastapi import HTTPException

# Load API key
api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    raise ValueError("GROQ_API_KEY environment variable not set.")

client = Groq(api_key=api_key)

def read_prompt_file(path: str = "travel_prompt.txt") -> str:
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read().strip()
    except Exception:
        return "You are a travel assistant."


def travel_plan_api(user_message: str, system_prompt_override: str = None) -> str:
    system_prompt = system_prompt_override or read_prompt_file()
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_message}
            ],
            temperature=0.7,
            max_tokens=1500
        )
        return completion.choices[0].message.content
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))