import glob
import os

for filepath in glob.glob("*.html"):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    if '<script src="api.js"></script>' not in content and '<script src="main.js"></script>' in content:
        content = content.replace('<script src="main.js"></script>', '<script src="api.js"></script>\n<script src="main.js"></script>')
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
