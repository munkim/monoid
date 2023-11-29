import asyncio
from monoid_backend.monoid.action.action_config_model import APIActionParameters, APIActionParameter, FunctionCallConfig
from monoid_backend.monoid.action.api_action_config import run_action, parse_api_action

# Create a test for run_action
def test_run_api_action():

    user_message = "I want to book a flight from San Francisco to New York for 2 passengers in the first class"
    followup_prompt = "If the function was called successfully, please mention to the user that the flight was booked. And make sure to include the flight details in a structured format."
    action_name = "book_flight"
    action_description = "Book a flight from one airport to another"
    _headers = {}
    _query_parameters = {
        "origin": {
            "key": "origin",
            "value": "SFO",
            "description": "The origin airport",
            "data_type": "string",
            "is_required": True,
            "argument_provider": "agent",
        },
        "destination": {
            "key": "destination",
            "value": "JFK",
            "description": "The destination airport",
            "data_type": "string",
            "is_required": True,
            "argument_provider": "agent",
        }
    }
    _path_parameters = {}
    _body = {
        "num_passengers": {
            "key": "num_passengers",
            "value": 2,
            "description": "The number of passengers",
            "data_type": "number",
            "is_required": True,
            "argument_provider": "agent",
        },
        "flight_class": {
            "key": "flight_class",
            "value": "economy",
            "description": "The class of the flight",
            "data_type": "string",
            "argument_provider": "agent",
            "is_required": True,
        }
    }

    method = "POST"
    template_url = "http://127.0.0.1:8888/dummy/flights",
    headers = APIActionParameters(**_headers)
    query_parameters = APIActionParameters(**_query_parameters)
    path_parameters = APIActionParameters(**_path_parameters)
    body = APIActionParameters(**_body)

    # Basic 
    api_config, function_call_key_paths, function_call_config = asyncio.run(parse_api_action(
        action_name,
        action_description,
        method,
        template_url,
        headers,
        query_parameters,
        path_parameters,
        body
    ))

    language_response, new_messages = asyncio.run(run_action(
        user_message,
        followup_prompt,
        api_config,
        function_call_key_paths,
        function_call_config
    ))


if __name__ == "__main__":
    test_run_api_action()