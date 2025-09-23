import matter from 'gray-matter';
import { marked } from 'marked';
import { BlogPost, BlogFrontmatter, validateFrontmatter, computeReadingTime } from '../types/blog';

// Dynamic import of markdown files (lazy by default). Vite provides the raw file content as string.
// We capture both path and loader function.
const markdownModules = import.meta.glob('/Users/myuser/development/ibkr-tax-calculator/frontend/content/blog/**/*.md', { as: 'raw' });

let cache: BlogPost[] | null = null;

function parseMarkdown(raw: string, path: string): BlogPost {
  const { content, data } = matter(raw);
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

export async function getAllPosts(force = false): Promise<BlogPost[]> {
  if (cache && !force) return cache;
  const entries = Object.entries(markdownModules);
  const posts: BlogPost[] = [];
  for (const [path, loader] of entries) {
    const raw = await (loader as () => Promise<string>)();
    const post = parseMarkdown(raw, path);
    posts.push(post);
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
  return posts;
}

export async function getPostBySlug(slug: string): Promise<BlogPost | undefined> {
  const posts = await getAllPosts();
  return posts.find(p => p.slug === slug);
}

export function clearBlogCache() {
  cache = null;
}
