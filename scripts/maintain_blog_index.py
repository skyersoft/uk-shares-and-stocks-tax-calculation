#!/usr/bin/env python3
"""
Blog Index Maintainer
=====================

Scans the frontend/public/blog/posts directory for Markdown files,
parses their frontmatter, and generates a unified index.json file
in frontend/public/blog/index.json.

This allows the frontend to load the list of blogs without building
them into the bundle, and enables adding new blogs by simply uploading
files to S3 and updating the index.
"""

import os
import json
import re
import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional

# Configuration
PROJECT_ROOT = Path(__file__).parent.parent
BLOG_POSTS_DIR = PROJECT_ROOT / 'frontend' / 'public' / 'blog' / 'posts'
OUTPUT_INDEX_FILE = PROJECT_ROOT / 'frontend' / 'public' / 'blog' / 'index.json'

# Helper to estimate reading time
def estimate_reading_time(content: str) -> int:
    words = len(content.split())
    # Average reading speed: 200 words/minute
    return max(1, round(words / 200))

# Frontmatter parser
def parse_frontmatter(file_path: Path) -> Optional[Dict[str, Any]]:
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Regex to find YAML frontmatter between --- lines
        match = re.match(r'^---\s*\n(.*?)\n---\s*\n(.*)$', content, re.DOTALL)
        
        if not match:
            print(f"Skipping {file_path.name}: No frontmatter found")
            return None

        frontmatter_str = match.group(1)
        markdown_body = match.group(2)

        # Simple YAML parsing (avoiding PyYAML dependency to keep it lightweight if possible,
        # otherwise we can use strict parsing. Current frontmatter is simple key: value)
        data = {}
        for line in frontmatter_str.split('\n'):
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            
            if ':' in line:
                key, value = line.split(':', 1)
                key = key.strip()
                value = value.strip()
                
                # Handle arrays [tag1, tag2]
                if value.startswith('[') and value.endswith(']'):
                    value = [v.strip().strip("'").strip('"') for v in value[1:-1].split(',') if v.strip()]
                # Handle quoted strings
                elif (value.startswith('"') and value.endswith('"')) or (value.startswith("'") and value.endswith("'")):
                    value = value[1:-1]
                
                data[key] = value

        # Metadata validation
        if 'title' not in data or 'date' not in data:
            print(f"Skipping {file_path.name}: Missing required metadata (title, date)")
            return None
            
        # Add derived fields
        # Path relative to public/blog/posts/ for fetching
        # If file is nested: 2024/post.md -> relative_path = 2024/post.md
        # Fetched URL will be /blog/posts/2024/post.md
        relative_path = file_path.relative_to(BLOG_POSTS_DIR).as_posix()
        
        # Determine slug. Prefer explicit slug in frontmatter, else filename stem.
        slug = data.get('slug', file_path.stem)
        
        return {
            "id": slug,
            "slug": slug,
            "title": data.get('title'),
            "author": data.get('author', 'Admin'),
            "date": data.get('date'),
            "category": data.get('category', 'General'),
            "tags": data.get('tags', []),
            "excerpt": data.get('excerpt', ''),
            "readingTime": data.get('readingTime', estimate_reading_time(markdown_body)),
            "path": relative_path  # We store the relative path to fetch the content
        }

    except Exception as e:
        print(f"Error parsing {file_path}: {e}")
        return None

def main():
    if not BLOG_POSTS_DIR.exists():
        print(f"Error: Blog posts directory not found at {BLOG_POSTS_DIR}")
        return

    print(f"Scanning {BLOG_POSTS_DIR}...")
    posts = []
    
    # Recursively find .md files
    for file_path in BLOG_POSTS_DIR.rglob('*.md'):
        post_data = parse_frontmatter(file_path)
        if post_data:
            posts.append(post_data)

    # Sort by date descending
    posts.sort(key=lambda x: x['date'], reverse=True)

    # Write index.json
    OUTPUT_INDEX_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_INDEX_FILE, 'w', encoding='utf-8') as f:
        json.dump(posts, f, indent=2)

    print(f"Successfully generated index with {len(posts)} posts at {OUTPUT_INDEX_FILE}")

if __name__ == '__main__':
    main()
