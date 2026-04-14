import os
import glob

# Files to update
html_files = glob.glob('*.html')
all_files = html_files

replacements = {
    # Logo extension swap
    "images/Logo.webp": "images/Logo.jpg"
}

for file in all_files:
    if os.path.exists(file):
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        orig = content
        for old, new in replacements.items():
            content = content.replace(old, new)
            
        if content != orig:
            with open(file, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated {file}")
