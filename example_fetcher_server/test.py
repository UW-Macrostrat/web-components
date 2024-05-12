import requests
import json

def main():
    result = requests.get("http://localhost:3001")
    print(result.json())

if __name__ == "__main__":
    main()