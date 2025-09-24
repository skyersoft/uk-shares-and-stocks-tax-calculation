// Mock for blogLoader.ts to handle import.meta.glob in Jest
import { BlogPost } from '../../types/blog';

// Mock blog posts for testing
const mockBlogPosts: BlogPost[] = [
  {
    title: 'Understanding UK Capital Gains Tax',
    slug: 'understanding-uk-capital-gains-tax',
    author: 'Tax Expert',
    date: '2024-04-01',
    category: 'Tax Planning',
    tags: ['CGT', 'UK Tax', 'Investment'],
    excerpt: 'A comprehensive guide to understanding capital gains tax in the UK.',
    content: '<h1>Understanding UK Capital Gains Tax</h1><p>Capital gains tax is...</p>',
    readingTime: 5,
    wordCount: 1200
  },
  {
    title: 'HMRC Reporting Requirements',
    slug: 'hmrc-reporting-requirements',
    author: 'HMRC Specialist',
    date: '2024-03-15',
    category: 'Compliance',
    tags: ['HMRC', 'Reporting', 'Compliance'],
    excerpt: 'Everything you need to know about HMRC reporting requirements.',
    content: '<h1>HMRC Reporting Requirements</h1><p>When dealing with investments...</p>',
    readingTime: 7,
    wordCount: 1800
  },
  {
    title: 'Tax Efficient Investment Strategies',
    slug: 'tax-efficient-investment-strategies',
    author: 'Investment Advisor',
    date: '2024-02-20',
    category: 'Investment',
    tags: ['ISA', 'SIPP', 'Tax Efficiency'],
    excerpt: 'Learn about tax-efficient ways to invest your money.',
    content: '<h1>Tax Efficient Investment Strategies</h1><p>Maximizing your returns...</p>',
    readingTime: 6,
    wordCount: 1500
  },
  {
    title: 'Using Interactive Brokers Data',
    slug: 'using-interactive-brokers-data',
    author: 'Data Expert',
    date: '2024-01-10',
    category: 'Technology',
    tags: ['Interactive Brokers', 'Data', 'Import'],
    excerpt: 'How to effectively use and import Interactive Brokers transaction data.',
    content: '<h1>Using Interactive Brokers Data</h1><p>Interactive Brokers provides...</p>',
    readingTime: 4,
    wordCount: 1000
  }
];

let cache: BlogPost[] | null = null;
let forceError = false;

// Mock implementation of getAllPosts
export const getAllPosts = jest.fn(async (force = false): Promise<BlogPost[]> => {
  if (forceError) {
    throw new Error('Mocked blog loading error');
  }
  
  if (cache && !force) {
    return cache;
  }
  
  // Simulate async loading
  await new Promise(resolve => setTimeout(resolve, 10));
  
  cache = [...mockBlogPosts];
  return cache;
});

// Mock implementation for parsing markdown (for testing utilities)
export const __parseMarkdownForTest = jest.fn((raw: string, path: string): BlogPost => {
  // Simple mock parser - in real tests, you can make this more sophisticated
  // Use path for error messages
  const lines = raw.split('\n');
  let frontmatterEnd = -1;
  
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      frontmatterEnd = i;
      break;
    }
  }
  
  if (frontmatterEnd === -1) {
    throw new Error('Invalid frontmatter');
  }
  
  const frontmatter = lines.slice(1, frontmatterEnd).join('\n');
  const content = lines.slice(frontmatterEnd + 1).join('\n');
  
  // Parse frontmatter (simplified)
  const fm: any = {};
  frontmatter.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length > 0) {
      const value = valueParts.join(':').trim();
      // Parse arrays properly
      if (value.startsWith('[') && value.endsWith(']')) {
        try {
          // Replace square brackets and split by comma, then trim each item
          const arrayValue = value.slice(1, -1).split(',').map(item => item.trim().replace(/^["']|["']$/g, ''));
          fm[key.trim()] = arrayValue;
        } catch {
          fm[key.trim()] = value;
        }
      } else {
        fm[key.trim()] = value;
      }
    }
  });
  
  // Validate required fields
  const required = ['title', 'slug', 'author', 'date', 'category', 'tags', 'excerpt'];
  for (const field of required) {
    if (!fm[field]) {
      throw new Error(`Missing required field: ${field} in ${path}`);
    }
  }
  
  // Validate date format
  if (isNaN(Date.parse(fm.date))) {
    throw new Error(`Invalid date format in ${path}`);
  }
  
  return {
    title: fm.title,
    slug: fm.slug,
    author: fm.author,
    date: fm.date,
    category: fm.category,
    tags: fm.tags,
    excerpt: fm.excerpt,
    content: `<h1>${fm.title}</h1>${content}`,
    readingTime: fm.readingTime || Math.ceil(content.split(' ').length / 200),
    wordCount: content.split(' ').length
  };
});

// Mock cache management
export const clearBlogCache = jest.fn(() => {
  cache = null;
});

// Test utilities
export const __setMockError = (shouldError: boolean) => {
  forceError = shouldError;
};

export const __getMockPosts = () => [...mockBlogPosts];

export const __resetMocks = () => {
  getAllPosts.mockClear();
  __parseMarkdownForTest.mockClear();
  clearBlogCache.mockClear();
  cache = null;
  forceError = false;
};