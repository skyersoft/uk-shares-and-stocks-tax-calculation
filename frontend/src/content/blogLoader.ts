/// <reference types="vite/client" />
import { marked } from 'marked';
import { BlogPost, BlogFrontmatter, validateFrontmatter, computeReadingTime } from '../types/blog';

// Browser-compatible frontmatter parser (replaces gray-matter)
function parseFrontmatter(raw: string): { content: string; data: Record<string, any> } {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = raw.match(frontmatterRegex);
  
  if (!match) {
    return { content: raw, data: {} };
  }
  
  const [, frontmatterStr, content] = match;
  const data: Record<string, any> = {};
  
  // Parse YAML-like frontmatter
  frontmatterStr.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) return;
    
    const key = trimmed.slice(0, colonIndex).trim();
    let value = trimmed.slice(colonIndex + 1).trim();
    
    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    
    // Parse arrays [tag1, tag2, tag3]
    if (value.startsWith('[') && value.endsWith(']')) {
      const arrayContent = value.slice(1, -1);
      data[key] = arrayContent.split(',').map(item => 
        item.trim().replace(/^["']|["']$/g, '')
      ).filter(Boolean);
    } else {
      data[key] = value;
    }
  });
  
  return { content: content.trim(), data };
}

// Dynamic import of markdown files (lazy by default). Path is relative to this file location.
// Using a relative path keeps portability across environments.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - types provided via vite/client reference, but Jest may not recognize.
// NOTE: Blog markdown files moved under src/content/blog to avoid relying on traversing outside Vite root.
// Using the new Vite syntax for raw content loading.
// @ts-ignore
const markdownModules = import.meta.glob('./blog/**/*.md', { query: '?raw', import: 'default' });

let cache: BlogPost[] | null = null;

function parseMarkdown(raw: string, path: string): BlogPost {
  const { content, data } = parseFrontmatter(raw);
  console.log('[BlogLoader] Parsed frontmatter for', path, ':', data);
  const fm = data as Partial<BlogFrontmatter>;
  const errors = validateFrontmatter(fm);
  if (errors.length) {
    throw new Error(`Frontmatter validation failed for ${path}:\n - ${errors.join('\n - ')}`);
  }
  const { wordCount, readingTime } = computeReadingTime(content);
  const html = marked.parse(content) as string;
  const post: BlogPost = {
    title: fm.title!,
    slug: fm.slug!,
    author: fm.author!,
    date: fm.date!,
    category: fm.category!,
    tags: fm.tags!,
    excerpt: fm.excerpt!,
    readingTime: fm.readingTime ?? readingTime,
    content: html,
    wordCount,
  };
  return post;
}

// Test helper (not documented for production use)
export function __parseMarkdownForTest(raw: string, path = 'test.md') {
  return parseMarkdown(raw, path);
}

export async function getAllPosts(force = false): Promise<BlogPost[]> {
  if (cache && !force) return cache;
  const entries = Object.entries(markdownModules);
  
  // Debug logging to understand what's happening
  console.log('[BlogLoader] markdownModules keys:', Object.keys(markdownModules));
  console.log('[BlogLoader] entries length:', entries.length);
  
  if (entries.length === 0) {
    // Helpful diagnostic in case production build accidentally omits content.
    // (Will be stripped/minified; harmless in prod but useful in debugging.)
    // eslint-disable-next-line no-console
    console.warn('[BlogLoader] No markdown modules discovered by import.meta.glob.');
  }
  const posts: BlogPost[] = [];
  for (const [path, loader] of entries) {
    try {
      console.log('[BlogLoader] Loading path:', path);
      const raw = await (loader as () => Promise<string>)();
      console.log('[BlogLoader] Raw content length:', raw?.length || 0);
      const post = parseMarkdown(raw, path);
      posts.push(post);
    } catch (error) {
      console.error('[BlogLoader] Error processing', path, ':', error);
      throw error;
    }
  }
  // Sort by date descending
  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  // Ensure unique slugs
  const seen = new Set<string>();
  for (const p of posts) {
    if (seen.has(p.slug)) {
      throw new Error(`Duplicate slug detected: ${p.slug}`);
    }
    seen.add(p.slug);
  }
  cache = posts;
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.debug(`[BlogLoader] Loaded ${posts.length} blog posts.`);
  }
  return posts;
}

export async function getPostBySlug(slug: string): Promise<BlogPost | undefined> {
  const posts = await getAllPosts();
  return posts.find(p => p.slug === slug);
}

export function clearBlogCache() {
  cache = null;
}
