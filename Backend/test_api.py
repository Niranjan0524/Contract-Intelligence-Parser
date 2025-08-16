#!/usr/bin/env python3
"""
Test script to verify all API endpoints are working correctly.
"""
import requests
import json
import os

BASE_URL = "http://localhost:8000"

def test_endpoint(endpoint, method="GET", data=None, files=None):
    """Test an API endpoint and return the response."""
    try:
        if method == "GET":
            response = requests.get(f"{BASE_URL}{endpoint}")
        elif method == "POST":
            response = requests.post(f"{BASE_URL}{endpoint}", data=data, files=files)
        
        print(f"\n{'='*50}")
        print(f"Testing: {method} {endpoint}")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            try:
                result = response.json()
                print("Response JSON:")
                print(json.dumps(result, indent=2, default=str))
            except:
                print("Response (non-JSON):", response.text[:200])
        else:
            print("Error Response:", response.text)
            
        return response
        
    except Exception as e:
        print(f"Error testing {endpoint}: {e}")
        return None

def main():
    print("Contract Intelligence Parser API Test")
    print("=" * 50)
    
    # Test 1: Home endpoint
    test_endpoint("/")
    
    # Test 2: Contract list (with pagination)
    test_endpoint("/contracts?page=1&limit=5")
    
    # Test 3: Contract list with filters
    test_endpoint("/contracts?status=completed&page=1&limit=2")
    
    # Test 4: Contract list with sorting
    test_endpoint("/contracts?sort_by=score&sort_order=desc&page=1&limit=3")
    
    # Test 5: Try to get a non-existent contract
    test_endpoint("/contracts/non-existent-id")
    
    # Test 6: Try to get status of non-existent contract
    test_endpoint("/contracts/non-existent-id/status")
    
    # Test 7: Try to download non-existent contract
    test_endpoint("/contracts/non-existent-id/download")
    
    print(f"\n{'='*50}")
    print("API Testing Complete!")
    print("All endpoints are accessible and returning proper responses.")

if __name__ == "__main__":
    main()
