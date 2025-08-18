import requests
import json

try:
    # Test basic endpoint first
    response = requests.get('http://localhost:8000/')
    print(f"Root endpoint - Status Code: {response.status_code}")
    
    # Test contracts endpoint with minimal parameters
    response = requests.get('http://localhost:8000/contracts?page=1&limit=10')
    print(f"Contracts endpoint - Status Code: {response.status_code}")
    if response.status_code == 200:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    else:
        print(f"Error Response: {response.text}")
        
except Exception as e:
    print(f"Error: {e}")
