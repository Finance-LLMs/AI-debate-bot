#!/usr/bin/env python
# Clean TTS helper script that filters debug output and model thinking tags

import sys
import os
import time
import re

# Add the directory containing this script to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def clean_text_for_tts(text):
    """
    Clean the text to remove debugging info and model thinking
    """
    # Check if we have the special response markers
    start = text.find("--- RESPONSE BEGIN ---") + len("--- RESPONSE BEGIN ---")
    end = text.find("--- RESPONSE END ---")
    if start > 0 and end > start:
        response_text = text[start:end].strip()
        
        # Remove any thinking blocks within the response
        response_text = re.sub(r'<think>[\s\S]*?</think>', '', response_text, flags=re.DOTALL)
        
        # Replace any problematic Unicode characters
        response_text = response_text.replace('\ufffd', '-')
        
        # Clean up other potential problematic characters
        response_text = ''.join(char if ord(char) < 65536 else '-' for char in response_text)
        
        # # Split into paragraphs and get the last non-empty one
        # paragraphs = [p for p in re.split(r'\n\s*\n', response_text) if p.strip()]
        # if paragraphs:
        #     # Get the last paragraph
        #     final_paragraph = paragraphs[-1].strip()
        #     return final_paragraph
        
        return response_text.strip()
    

