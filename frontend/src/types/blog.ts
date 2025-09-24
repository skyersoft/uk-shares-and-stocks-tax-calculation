export interface BlogFrontmatter {
  title: string;
  slug: string;
  author: string;
  date: string; // ISO 8601
  category: string;
  tags: string[];
  excerpt: string;
  readingTime?: number; // optional override
}

export interface BlogPost extends BlogFrontmatter {
  content: string; // HTML (rendered) or markdown raw depending on stage
  wordCount: number;
  readingTime: number; // always present after processing
}

export interface RawMarkdownModule {
  default: string; // raw markdown content
  frontmatter?: Partial<BlogFrontmatter>; // if using a plugin later
}

export type BlogValidationIssue = {
  level: 'error' | 'warning';
  message: string;
  slug?: string;
  field?: string;
};

export function validateFrontmatter(data: Partial<BlogFrontmatter>): string[] {
  const errors: string[] = [];
  const required: (keyof BlogFrontmatter)[] = ['title', 'slug', 'author', 'date', 'category', 'tags', 'excerpt'];
  required.forEach(field => {
    if (data[field] === undefined || data[field] === null || (Array.isArray(data[field]) && (data[field] as any[]).length === 0) || data[field] === '') {
      errors.push(`Missing required field: ${field}`);
    }
  });
  if (data.slug && !/^[a-z0-9-]+$/.test(data.slug)) {
    errors.push(`Invalid slug format: ${data.slug}`);
  }
  if (data.date && (isNaN(Date.parse(data.date)) || !/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/.test(data.date))) {
    errors.push(`Invalid date format (expected ISO 8601): ${data.date}`);
  }
  if (data.excerpt && data.excerpt.length > 300) {
    errors.push(`Excerpt too long (>300 chars)`);
  }
  return errors;
}

export function computeReadingTime(markdown: string): { wordCount: number; readingTime: number } {
  const words = markdown
    .replace(/`[^`]*`/g, ' ') // remove inline code blocks for counting
    .replace(/[^A-Za-z0-9\s]/g, ' ') // strip punctuation
    .split(/\s+/)
    .filter(Boolean);
  const wordCount = words.length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));
  return { wordCount, readingTime };
}
