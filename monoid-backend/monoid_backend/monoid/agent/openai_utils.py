import re
import json
import time
import openai
from typing import Dict, List, Any, Optional, Union
from pydantic import BaseModel
from sentry_sdk import capture_exception

from monoid_backend.db_models.chat_session import ChatMessage

# Convert all messages to a list of dictionaries for OpenAI Chat Completion API
def convert_monoid_message_to_openai_message(message: ChatMessage) -> Dict[str, Any]:
    if message.message_type in set(["system", "user", "assistant"]):
        message_json = {
            "role": message.message_type,
            "content": message.content
        }
    elif message.message_type == "language_response":
        message_json = {
            "role": "assistant",
            "content": message.content
        }
    elif message.message_type == "action_call":
        message_json = {
            "role": "assistant",
            "content": message.content
        }
    elif message.message_type == "api_response":
        api_response_json = json.loads(message.content)["response"]
        if not isinstance(api_response_json, str):
            api_response_json = json.dumps(api_response_json)
        message_json = {
            "role": "function",
            "name": message.action_name,
            "content": api_response_json
        }
    else: 
        capture_exception(Exception(f"Unknown message type: {message.message_type}. \nMessage: \"{message.content}\" ({message.content_length}). \nThis message has been ignored."))
        message_json = {}

    return message_json