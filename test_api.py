import urllib.request
import json
import sys

print("====================================================")
print("Gemini API List Models Diagnostic Tool")
print("====================================================")

api_key = input("Please paste your Gemini API key: ").strip()
if not api_key:
    print("Error: API Key cannot be empty.")
    sys.exit(1)

# List models endpoint
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"

print("\nFetching list of available models for your API key...")
try:
    req = urllib.request.Request(url, method='GET')
    with urllib.request.urlopen(req) as response:
        status_code = response.status
        body = response.read().decode('utf-8')
        data = json.loads(body)
        
        print(f"\nSuccess! Status Code: {status_code}")
        print("Available Models:")
        models = data.get("models", [])
        if not models:
            print("No models returned.")
        else:
            for model in models:
                name = model.get("name", "")
                display_name = model.get("displayName", "")
                methods = model.get("supportedGenerationMethods", [])
                print(f" - {name} ({display_name})")
                print(f"   Supported methods: {methods}")
                
except urllib.error.HTTPError as e:
    print(f"\nAPI Error! Status Code: {e.code}")
    try:
        error_body = e.read().decode('utf-8')
        parsed = json.loads(error_body)
        print("Error Details:")
        print(json.dumps(parsed, indent=2))
    except Exception:
        print("Error Body (raw):")
        print(e.read())
except Exception as e:
    print(f"\nNetwork Error: {e}")

print("====================================================")
