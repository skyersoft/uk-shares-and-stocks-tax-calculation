import json

with open('/Users/myuser/development/ibkr-tax-calculator/versions.json', 'r') as f:
    data = json.load(f)

delete_list = []
if 'Versions' in data:
    for version in data['Versions']:
        delete_list.append({'Key': version['Key'], 'VersionId': version['VersionId']})

if 'DeleteMarkers' in data:
    for marker in data['DeleteMarkers']:
        delete_list.append({'Key': marker['Key'], 'VersionId': marker['VersionId']})

delete_json = {'Objects': delete_list, 'Quiet': True}

with open('/Users/myuser/development/ibkr-tax-calculator/delete.json', 'w') as f:
    json.dump(delete_json, f)
