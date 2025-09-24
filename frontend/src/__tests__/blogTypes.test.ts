import { validateFrontmatter, computeReadingTime, BlogFrontmatter } from '../types/blog';

describe('Blog Type Utilities', () => {
  describe('validateFrontmatter', () => {
    const validFrontmatter: BlogFrontmatter = {
      title: 'Test Post',
      slug: 'test-post',
      author: 'Test Author',
      date: '2024-04-01',
      category: 'Test Category',
      tags: ['test', 'blog'],
      excerpt: 'This is a test excerpt for the blog post.'
    };

    it('validates complete valid frontmatter', () => {
      const errors = validateFrontmatter(validFrontmatter);
      expect(errors).toHaveLength(0);
    });

    it('detects missing required fields', () => {
      const testCases = [
        { field: 'title', data: { ...validFrontmatter, title: undefined } },
        { field: 'slug', data: { ...validFrontmatter, slug: '' } },
        { field: 'author', data: { ...validFrontmatter, author: null } },
        { field: 'date', data: { ...validFrontmatter, date: '' } },
        { field: 'category', data: { ...validFrontmatter, category: undefined } },
        { field: 'tags', data: { ...validFrontmatter, tags: [] } },
        { field: 'excerpt', data: { ...validFrontmatter, excerpt: '' } }
      ];

      testCases.forEach(({ field, data }) => {
        const errors = validateFrontmatter(data as Partial<BlogFrontmatter>);
        expect(errors).toContain(`Missing required field: ${field}`);
      });
    });

    it('validates slug format', () => {
      const invalidSlugs = [
        'Invalid Slug With Spaces',
        'slug_with_underscores',
        'slug.with.dots',
        'UPPERCASE-SLUG',
        'slug/with/slashes',
        'slug@with@symbols',
        'slug-with-åccénts'
      ];

      invalidSlugs.forEach(slug => {
        const errors = validateFrontmatter({ ...validFrontmatter, slug });
        expect(errors).toContain(`Invalid slug format: ${slug}`);
      });
    });

    it('accepts valid slug formats', () => {
      const validSlugs = [
        'valid-slug',
        'slug-with-numbers-123',
        'single',
        'multiple-words-with-dashes',
        'a1b2c3'
      ];

      validSlugs.forEach(slug => {
        const errors = validateFrontmatter({ ...validFrontmatter, slug });
        const slugErrors = errors.filter(error => error.includes('Invalid slug format'));
        expect(slugErrors).toHaveLength(0);
      });
    });

    it('validates date format', () => {
      const invalidDates = [
        'not-a-date',
        '2024/04/01',
        '04-01-2024',
        'April 1, 2024',
        '2024-13-01',
        '2024-04-32',
        ''
      ];

      invalidDates.forEach(date => {
        const data = { ...validFrontmatter, date };
        if (date === '') {
          // Empty date should trigger missing field error
          const errors = validateFrontmatter(data);
          expect(errors).toContain('Missing required field: date');
        } else {
          const errors = validateFrontmatter(data);
          expect(errors).toContain(`Invalid date format (expected ISO 8601): ${date}`);
        }
      });
    });

    it('accepts valid date formats', () => {
      const validDates = [
        '2024-04-01',
        '2024-12-31',
        '2020-02-29', // leap year
        '2024-04-01T10:30:00Z',
        '2024-04-01T10:30:00.000Z'
      ];

      validDates.forEach(date => {
        const errors = validateFrontmatter({ ...validFrontmatter, date });
        const dateErrors = errors.filter(error => error.includes('Invalid date format'));
        expect(dateErrors).toHaveLength(0);
      });
    });

    it('validates excerpt length', () => {
      const longExcerpt = 'A'.repeat(301); // 301 characters
      const errors = validateFrontmatter({ ...validFrontmatter, excerpt: longExcerpt });
      expect(errors).toContain('Excerpt too long (>300 chars)');
    });

    it('accepts excerpts within length limit', () => {
      const validExcerpts = [
        'Short excerpt',
        'A'.repeat(300), // exactly 300 characters
        'Medium length excerpt that provides good context without being too long.',
        ''
      ];

      validExcerpts.forEach(excerpt => {
        if (excerpt === '') {
          // Empty excerpt should trigger missing field error
          const errors = validateFrontmatter({ ...validFrontmatter, excerpt });
          expect(errors).toContain('Missing required field: excerpt');
        } else {
          const errors = validateFrontmatter({ ...validFrontmatter, excerpt });
          const excerptErrors = errors.filter(error => error.includes('Excerpt too long'));
          expect(excerptErrors).toHaveLength(0);
        }
      });
    });

    it('handles multiple validation errors', () => {
      const invalidData = {
        title: '',
        slug: 'Invalid Slug',
        date: 'not-a-date',
        excerpt: 'A'.repeat(301)
      };

      const errors = validateFrontmatter(invalidData);
      expect(errors.length).toBeGreaterThan(3);
      expect(errors).toContain('Missing required field: title');
      expect(errors).toContain('Invalid slug format: Invalid Slug');
      expect(errors).toContain('Invalid date format (expected ISO 8601): not-a-date');
      expect(errors).toContain('Excerpt too long (>300 chars)');
    });
  });

  describe('computeReadingTime', () => {
    it('calculates reading time for short text', () => {
      const shortText = 'This is a short text with only a few words.';
      const result = computeReadingTime(shortText);
      
      expect(result.wordCount).toBe(10);
      expect(result.readingTime).toBe(1); // minimum 1 minute
    });

    it('calculates reading time for medium text', () => {
      // Create text with approximately 400 words
      const mediumText = 'word '.repeat(400).trim();
      const result = computeReadingTime(mediumText);
      
      expect(result.wordCount).toBe(400);
      expect(result.readingTime).toBe(2); // 400 words / 200 wpm = 2 minutes
    });

    it('calculates reading time for long text', () => {
      // Create text with approximately 1000 words
      const longText = 'word '.repeat(1000).trim();
      const result = computeReadingTime(longText);
      
      expect(result.wordCount).toBe(1000);
      expect(result.readingTime).toBe(5); // 1000 words / 200 wpm = 5 minutes
    });

    it('handles empty text', () => {
      const result = computeReadingTime('');
      
      expect(result.wordCount).toBe(0);
      expect(result.readingTime).toBe(1); // minimum 1 minute
    });

    it('handles text with only whitespace', () => {
      const result = computeReadingTime('   \n\t   ');
      
      expect(result.wordCount).toBe(0);
      expect(result.readingTime).toBe(1); // minimum 1 minute
    });

    it('excludes inline code blocks from word count', () => {
      const textWithCode = 'This has `some code` and `more.code.here` in it.';
      const result = computeReadingTime(textWithCode);
      
      // Should count: "This", "has", "and", "in", "it" = 5 words
      expect(result.wordCount).toBe(5);
      expect(result.readingTime).toBe(1);
    });

    it('strips punctuation correctly', () => {
      const textWithPunctuation = 'Hello, world! How are you? I\'m fine... Thanks!';
      const result = computeReadingTime(textWithPunctuation);
      
      // Should count: "Hello", "world", "How", "are", "you", "I", "m", "fine", "Thanks" = 9 words
      expect(result.wordCount).toBe(9);
      expect(result.readingTime).toBe(1);
    });

    it('handles markdown-style text', () => {
      const markdownText = `
        # Heading
        This is a **bold** word and *italic* text.
        
        - List item 1
        - List item 2
        
        \`inline code\` should be excluded.
        
        [Link text](http://example.com) counts as words.
      `;
      
      const result = computeReadingTime(markdownText);
      
      // Should count words but exclude inline code
      expect(result.wordCount).toBeGreaterThan(10);
      expect(result.readingTime).toBeGreaterThanOrEqual(1);
    });

    it('handles numbers and mixed content', () => {
      const mixedText = 'There are 123 items in the list. Each costs $45.99.';
      const result = computeReadingTime(mixedText);
      
      // Should count: "There", "are", "123", "items", "in", "the", "list", "Each", "costs", "45", "99" = 11 words
      // Punctuation is stripped but numbers are preserved
      expect(result.wordCount).toBe(11);
      expect(result.readingTime).toBe(1);
    });

    it('ensures minimum reading time of 1 minute', () => {
      const veryShortText = 'Hi';
      const result = computeReadingTime(veryShortText);
      
      expect(result.wordCount).toBe(1);
      expect(result.readingTime).toBe(1); // minimum 1 minute even for very short text
    });

    it('rounds up reading time', () => {
      // 250 words should round up to 2 minutes (250/200 = 1.25, rounded up to 2)
      const text = 'word '.repeat(250).trim();
      const result = computeReadingTime(text);
      
      expect(result.wordCount).toBe(250);
      expect(result.readingTime).toBe(2);
    });
  });
});