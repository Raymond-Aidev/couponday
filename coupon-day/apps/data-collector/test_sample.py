import requests

url = 'http://openapi.seoul.go.kr:8088/sample/xml/CardSubwayStatsNew/1/5/20220301'

try:
    response = requests.get(url)
    print(f"Status Code: {response.status_code}")
    print(response.content.decode('utf-8'))
except Exception as e:
    print(f"Error: {e}")
