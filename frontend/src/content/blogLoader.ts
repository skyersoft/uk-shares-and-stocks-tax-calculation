/// <reference types="vite/client" />
import { marked } from 'marked';
import { BlogPost, computeReadingTime } from '../types/blog';

// Custom YouTube embed extension for marked
// Converts {{youtube:VIDEO_ID}} syntax to responsive iframe embeds
const youtubeExtension = {
  name: 'youtube',
  level: 'block' as const,
  start(src: string) {
    return src.match(/\{\{youtube:/)?.index;
  },
  tokenizer(src: string) {
    const rule = /^\{\{youtube:([a-zA-Z0-9_-]+)\}\}/;
    const match = rule.exec(src);
    if (match) {
      return {
        type: 'youtube',
        raw: match[0],
        videoId: match[1],
      };
    }
    return undefined;
  },
  renderer(token: { videoId: string }) {
    return `<div class="youtube-embed-container"><iframe src="https://www.youtube.com/embed/${token.videoId}" title="YouTube video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>`;
  },
};

// Register the YouTube extension with marked
marked.use({ extensions: [youtubeExtension] });

// In-memory cache
let postsCache: BlogPost[] | null = null;
let contentCache: Record<string, string> = {};

interface IndexEntry {
  id: string;
  slug: string;
  title: string;
  author: string;
  date: string;
  category: string;
  tags: string[];
  excerpt: string;
  readingTime: number;
  path: string; // Relative path to fetch content, e.g. "2024/post.md"
}

// Fetch the index.json
async function fetchIndex(): Promise<IndexEntry[]> {
  try {
    const response = await fetch('/blog/index.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch blog index: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('[BlogLoader] Error fetching index:', error);
    return [];
  }
}

// Fetch individual markdown content
async function fetchMarkdown(relativePath: string): Promise<string> {
  if (contentCache[relativePath]) {
    return contentCache[relativePath];
  }

  // Construct URL: /blog/posts/2024/post.md
  // We handle leading slashes carefully
  const cleanPath = relativePath.replace(/^\//, '');
  const url = `/blog/posts/${cleanPath}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch post content at ${url}: ${response.statusText}`);
    }
    const text = await response.text();
    contentCache[relativePath] = text;
    return text;
  } catch (error) {
    console.error(`[BlogLoader] Error fetching markdown ${url}:`, error);
    throw error;
  }
}

// Parse raw markdown to separate frontmatter from content
// Note: We already have metadata from index.json, but we need to strip frontmatter 
// from the body before passing to marked.
function parseContent(raw: string): string {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = raw.match(frontmatterRegex);
  if (match) {
    return match[2].trim();
  }
  return raw.trim();
}

export async function getAllPosts(force = false): Promise<BlogPost[]> {
  if (postsCache && !force) return postsCache;

  const indexEntries = await fetchIndex();

  // Convert IndexEntry to BlogPost.
  // Note: We don't fetch full content for the listing, usually.
  // But the BlogPost type definition expects 'content'.
  // If the listing page needs excerpts, we have them in index.
  // If the listing page needs full HTML, we would have to fetch all.
  // Looking at BlogPage.tsx: it mostly uses title, excerpt, tags, date for the list.
  // But it loads ALL posts and maps them. 
  // It passes 'content' to 'BlogPostData'.
  // We can lazy-load content or pass empty content string for the list.
  // However, the current signature returns `Promise<BlogPost[]>`.
  // To keep it compatible without breaking the call site immediately, 
  // we will populate `content` with an empty string or the excerpt.
  // THE COMPONENT `BlogPostComponent` renders `post.content`.
  // So when a user CLICKS a post, we definitely need the content.
  // But `getAllPosts` implies getting everything.

  // STRATEGY: 
  // 1. `getAllPosts` returns the list from index.json (fast). `content` field will be empty or placeholder.
  // 2. We add `getPostContent(slug)` or ensure `getPostBySlug` fetches the content.

  const posts: BlogPost[] = indexEntries.map(entry => ({
    title: entry.title,
    slug: entry.slug,
    author: entry.author,
    date: entry.date,
    category: entry.category,
    tags: entry.tags,
    excerpt: entry.excerpt,
    readingTime: entry.readingTime,
    content: '', // Content loaded on demand
    wordCount: 0, // Not strictly needed for list
    // We store the fetch path as a custom property if needed, but BlogPost interface might block it.
    // We can rely on slug matching or keep a lookup map.
    // For now, let's attach the path relative to a hidden property or lookup.
  }));

  // Determine ordering (index.json is already sorted by script, but we ensure it)
  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  postsCache = posts;

  // Store the path mapping so we can fetch content later
  // We can modify the return type or export a helper.
  // Let's modify the cache to store the 'path' as well, we might need to extend the type locally or cast.
  // Actually, let's keep a map of slug -> path
  indexEntries.forEach(e => {
    slugToPathMap[e.slug] = e.path;
  });

  return posts;
}

const slugToPathMap: Record<string, string> = {};

export async function getPostBySlug(slug: string): Promise<BlogPost | undefined> {
  // Ensure we have the index
  if (!postsCache) {
    await getAllPosts();
  }

  const post = postsCache?.find(p => p.slug === slug);
  if (!post) return undefined;

  // If we haven't loaded content yet, fetch it
  if (!post.content) {
    const path = slugToPathMap[slug];
    if (path) {
      try {
        const raw = await fetchMarkdown(path);
        const mdContent = parseContent(raw);
        post.content = marked.parse(mdContent) as string;

        // Update word count if needed
        const { wordCount } = computeReadingTime(mdContent);
        post.wordCount = wordCount;
      } catch (err) {
        console.error(`Failed to load content for ${slug}`, err);
        return undefined; // Or return post with error message in content?
      }
    }
  }

  return post;
}

export function clearBlogCache() {
  postsCache = null;
  contentCache = {};
}

