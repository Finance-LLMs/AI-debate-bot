#!/usr/bin/env python
# Helper script to run debate response generation

import sys
import os
import json

# Add the directory containing this script to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from streamlit_debator__2 import get_agent_response

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Error: Missing required arguments")
        sys.exit(1)
    try:
        user_input = sys.argv[1]
        print(f"Received user input of length: {len(user_input)}")
        
        # Parse history as JSON
        history_json = sys.argv[2]
        history = json.loads(history_json) if history_json != "[]" else None
        print(f"Parsed history with {len(history) if history else 0} entries")
        
        debate_side = sys.argv[3]
        debate_round = int(sys.argv[4]) if len(sys.argv) > 4 else 1
        print(f"Debate side: {debate_side}, round: {debate_round}")
          # Verify Ollama connection before proceeding
        # from langchain_ollama import OllamaLLM
        # print("Creating OllamaLLM instance...")
        # llm = OllamaLLM(model="qwen2:1.5b", temperature=0.7)
        
        print("Generating debate response...")
        topic = "AI in healthcare, allowing AI to override human decisions in healthcare."
        response_length = max(500,len(user_input.split()))
    
        system_prompt = (
        f"You are an expert human debater arguing {debate_side.upper()} the proposition: '{topic}'\n"
        f"Give a speech, arguing {debate_side.upper()} "
        f"the following proposition: '{topic}'. "
        f"You have to give me a single response to my argument, getting straight to the point and do not give me any type of informal talk. "
        f"I am your opponent and I just made a very important argument: {user_input}\n\n"
        f"Respond to my argument. "
        f"Try to keep your response in approximately {response_length} words by elaborating on the topics. It's fine if you deviate from the topic "
        f"Sound like a confident professional in a debate.\n\n"
        f"It is very very important that you keep your response to {response_length} words. If not then it's still okay. Just elaborate on all the points\n\n"
        f"Your response: \n"
        )
        response = get_agent_response(
            system_prompt
        )
        
        # Only output the final response without debug logs
        print(f"--- RESPONSE BEGIN ---")
        print(response)
        print(f"--- RESPONSE END ---")
    except Exception as e:
        import traceback
        print(f"Error generating debate response: {str(e)}")
        print(traceback.format_exc())
        print(f"Error generating debate response: {str(e)}")
        sys.exit(1)
