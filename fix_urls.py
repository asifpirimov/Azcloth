import os, re

dir_path = r'c:\Users\Shocker\Projects\AzCloth_2\frontend\src'

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    # For single quoted strings
    content = re.sub(r"'http://127\.0\.0\.1:8000([^']+)'", r"`${import.meta.env.VITE_API_URL}\1`", content)
    # For double quoted strings
    content = re.sub(r'"http://127\.0\.0\.1:8000([^"]+)"', r"`${import.meta.env.VITE_API_URL}\1`", content)
    # For template literals
    content = re.sub(r'http://127\.0\.0\.1:8000', r'${import.meta.env.VITE_API_URL}', content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, _, files in os.walk(dir_path):
    for f in files:
        if f.endswith(('.ts', '.tsx')):
            process_file(os.path.join(root, f))
