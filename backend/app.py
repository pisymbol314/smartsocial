from flask import Flask, request, jsonify
from dotenv import load_dotenv
import os
import requests
from flask_cors import CORS
import json

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"

@app.route('/suggest-comment', methods=['POST'])
def suggest_comment():
    data = request.get_json()
    post_content = data.get('post_content')
    style = data.get('style', '').strip().lower()

    if not post_content:
        return jsonify({"error": "Post content is required."}), 400

    try:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {DEEPSEEK_API_KEY}"
        }

        base_prompt = f"Here is a LinkedIn post:\n\n{post_content}\n\n"
        if style:
            base_prompt += f"Write a short, {style} comment I could post in response."
        else:
            base_prompt += "Write a short, engaging comment I could post in response."

        payload = {
            "model": "deepseek-chat",
            "messages": [
                {
                    "role": "user",
                    "content": base_prompt
                }
            ],
            "temperature": 0.7,
            "max_tokens": 100
        }

        print("Sending request to DeepSeek API...")
        response = requests.post(DEEPSEEK_API_URL, json=payload, headers=headers)

        print(f"API Response Status: {response.status_code}")
        print(f"API Response Body: {response.text}")

        response_data = response.json()

        if response.status_code != 200:
            error_msg = response_data.get('error', {}).get('message', 'Unknown API error')
            print(f"API Error: {error_msg}")
            return jsonify({
                "error": "Couldn't generate comment",
                "details": error_msg
            }), 500

        suggestion = response_data['choices'][0]['message']['content'].strip()
        return jsonify({"suggested_comment": suggestion})

    except json.JSONDecodeError as e:
        print(f"JSON Decode Error: {e}")
        return jsonify({
            "error": "Couldn't generate comment",
            "details": "Invalid response from API"
        }), 500
    except KeyError as e:
        print(f"Key Error in response: {e}")
        return jsonify({
            "error": "Couldn't generate comment",
            "details": "Unexpected API response format"
        }), 500
    except Exception as e:
        print(f"Unexpected Error: {e}")
        return jsonify({
            "error": "Couldn't generate comment",
            "details": str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True)
