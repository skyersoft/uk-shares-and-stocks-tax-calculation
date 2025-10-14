# Blog Content Authoring Guide

This guide explains how to add and maintain blog posts for the UK CGT Tax Calculator site.

## Directory Structure
```
frontend/
  content/
    blog/
      2024/
        your-post-slug.md
```
Create a folder per year. Add new markdown files inside the current year.

## Frontmatter Specification
Each post must start with valid YAML frontmatter:
```yaml
---
title: "Descriptive Title"
slug: "descriptive-title"  # lowercase, a-z0-9- only
author: "Your Name"
date: 2024-04-15           # ISO 8601 (YYYY-MM-DD)
category: "Tax Education"  # or Compliance, Technical Guide, Investment Planning, etc.
tags: [tax, gains]
excerpt: "Short (<=300 chars) summary used in listing cards."
# readingTime: 5           # Optional override (minutes). If omitted, auto-computed.
---
```

Rules:
- `slug` must be unique across all years (build fails if duplicate).
- `excerpt` must be concise (<= 300 characters) and plain text (no markup).
- `tags` is a non-empty array of simple tokens (lowercase preferred).

## Markdown Content
After the frontmatter, write standard Markdown:
```markdown
# Optional Heading (H1 rendered automatically inside card header)

Intro paragraph.

## Section Heading
Details...
```
Supported features:
- Headings, paragraphs, emphasis, strong, lists
- Code snippets (inline and fenced)
- Blockquotes, tables (Markdown flavor)

The Markdown is converted to HTML at runtime and injected into the blog post component.

## Adding a New Post
1. Create a new file: `frontend/content/blog/2024/my-new-topic.md`.
2. Add frontmatter block and content.
3. Run validation:
   ```
   npm run validate:blog
   ```
4. Run the SPA locally and test deep link:
   - Start dev server (if configured): `npm run dev:spa`
   - Navigate to `#blog/post/my-new-topic`.
5. Commit and push.

## Renaming a Slug
Avoid changing slugs after publishing (breaks existing links). If a change is essential:
- Add a redirect mapping in `legacyIdToSlug` or implement a redirect layer (future enhancement).
- Communicate the change in release notes.

## Legacy Numeric Links
Old numeric IDs (1–4) auto-redirect to their new slugs. Do not reuse those numeric identifiers for new logic.

## Image / Media Support (Future)
Currently not inlined. To add images later we will:
- Store under `frontend/static/blog/<year>/image-name.ext` OR use a CDN.
- Reference via relative path and process through Vite.

## Quality Checklist Before Commit
- [ ] Frontmatter passes validation (no missing fields/errors)
- [ ] Slug is unique & descriptive
- [ ] Excerpt <= 300 chars and compelling
- [ ] Proper heading hierarchy (start at H2 inside body if you skip top H1)
- [ ] No trailing whitespace / obvious typos
- [ ] Tags are relevant and not duplicated

## Troubleshooting
| Issue | Cause | Fix |
|-------|-------|-----|
| Validation script fails with duplicate slug | Two posts share slug | Rename one slug and re-run validate script |
| Post not appearing | Missing required field or invalid date | Run `npm run validate:blog` and fix errors |
| Reading time looks off | Extremely short or long content | Optionally set `readingTime` manually |
| Deep link 404 (list view shows) | Hash mismatch or slug typo | Check `window.location.hash` and file slug |

## Automation
The build pipeline should run `npm run validate:blog` and fail fast on content errors.

---
Happy writing! 🚀
