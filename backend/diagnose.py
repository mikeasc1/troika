import urllib.request
import urllib.error
import json

def test_endpoint(url, method="GET", data=None):
    print(f"\nTesting: {url} [{method}]")
    try:
        req = urllib.request.Request(url, method=method)
        if data:
            req.add_header('Content-Type', 'application/json')
            req.data = json.dumps(data).encode('utf-8')
            
        with urllib.request.urlopen(req) as response:
            print(f"Status: {response.status}")
            body = response.read().decode('utf-8')
            print(f"Body: {body}")
            return body
            
    except urllib.error.HTTPError as e:
        print(f"❌ FAILED: {e.code} {e.reason}")
        body = e.read().decode('utf-8')
        print(f"Body: {body}")
        return body
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return str(e)

# 1. Health
test_endpoint("http://localhost:8000/health")

# 2. Database
test_endpoint("http://localhost:8000/debug_db")

# 3. Protected Route (Expect 401)
test_endpoint("http://localhost:8000/api/v1/campaigns/")

# 4. Register (Expect 201 or 400 if exists)
test_endpoint("http://localhost:8000/api/v1/auth/register", method="POST", data={
    "email": "test_diagnose@example.com",
    "password": "password123",
    "full_name": "Test Diagnose",
    "twitter_username": "test_diag"
})
