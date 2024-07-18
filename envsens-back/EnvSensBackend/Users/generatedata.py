import json
import random
import datetime
import time
import requests

# Function to generate random data
def generate_data(gwid, device_id):
    longitude = round(random.uniform(-180, 180), 3)
    latitude = round(random.uniform(-90, 90), 3)
    
    device_longitude = round(random.uniform(-180, 180), 3)
    device_latitude = round(random.uniform(-90, 90), 3)
    timestamp = datetime.datetime.now().isoformat()
    
    pollutant_id = random.randint(2, 7)  # Example: random pollutant id
    value = round(random.uniform(0, 100), 1)
    
    data = [{
        "gwid": gwid,
        "longitude": longitude,
        "latitude": latitude,
        "data": [
            {
                "device_id": device_id,
                "longitude": device_longitude,
                "latitude": device_latitude,
                "timestamp": timestamp,
                "data": [
                    {
                        "pollutantId": pollutant_id,
                        "value": value
                    }
                ]
            }
        ]
    }]
    
    return data

# Function to get authentication token
def get_auth_token(base_url, username, password):
    login_url = f"{base_url}/users/login/"
    login_data = {
        "username": username,
        "password": password
    }
    
    response = requests.post(login_url, json=login_data)
    print(f"{datetime.datetime.now().time()} Response data: {response.json()}")
    response.raise_for_status()  # Raises a HTTPError for bad responses
    return response.json()['token']["access"]

# Function to send data to the server
def send_data(base_url, token, data):
    url = f"{base_url}/pollutant-records/create/"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    response = requests.post(url, headers=headers, json=data) 
    print(f"{datetime.datetime.now().time()} Response data: {response.json()}")
    response.raise_for_status()  # Raises a HTTPError for bad responses
    

# Main function to generate and send data each second
def main():
    base_url = "http://localhost:8000"  # Change this to your base URL
    username = "james"
    password = "james"
    token = get_auth_token(base_url, username, password)
    
    while True:
        gwid = random.randint(1, 3)
        device_id = random.randint(1, 3)
        data = generate_data(gwid, device_id)
        send_data(base_url, token, data)
        
        # Increment identifiers for the next iteration
        gwid += 1
        device_id += 1
        
        time.sleep(2)

if __name__ == "__main__":
    main()
