#!/usr/bin/env python3
"""
Quick debug test for the specific user message
"""

import sys
sys.path.insert(0, '/home/user/weaver-v1')

from app.v2.weaver_assistant.intent import intent_recognizer

# Test the exact message the user sent
message = "Check for available flights for me for tomorrow from Kampala to Nairobi"

print("Testing intent recognition...")
print(f"Message: {message}\n")

intent = intent_recognizer.recognize(message)

print(f"Intent Type: {intent.type}")
print(f"Confidence: {intent.confidence}")
print(f"Entities:")
for key, value in intent.entities.items():
    print(f"  {key}: {value}")
