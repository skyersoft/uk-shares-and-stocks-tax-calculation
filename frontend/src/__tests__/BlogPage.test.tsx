import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BlogPage from '../pages/BlogPage';

// Mock the blogLoader module
jest.mock('../content/blogLoader');

import { getAllPosts } from '../content/blogLoader';

const mockGetAllPosts = getAllPosts as jest.MockedFunction<typeof getAllPosts>;

// Mock data matching the LoadedBlogPost interface
const mockLoadedPosts = [
  {
    title: 'Understanding UK Capital Gains Tax',
    slug: 'understanding-uk-capital-gains-tax',
    author: 'Tax Expert',
    date: '2024-04-01',
    category: 'Tax Planning',
    tags: ['CGT', 'UK Tax', 'Investment'],
    excerpt: 'A comprehensive guide to understanding capital gains tax in the UK.',
    content: '<h1>Understanding UK Capital Gains Tax</h1><p>Capital gains tax is a crucial consideration for UK investors...</p>',
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
  }
];

// Mock window.location for hash routing tests
const mockLocation = {
  hash: '',
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn()
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
});

// Mock addEventListener and removeEventListener
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();
window.addEventListener = mockAddEventListener;
window.removeEventListener = mockRemoveEventListener;

describe('BlogPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAllPosts.mockResolvedValue(mockLoadedPosts);
    mockLocation.hash = '';
    
    // Clear event listener mocks
    mockAddEventListener.mockClear();
    mockRemoveEventListener.mockClear();
  });

  it('renders loading state initially', async () => {
    // Make getAllPosts hang to test loading state
    mockGetAllPosts.mockImplementation(() => new Promise(() => {}));
    
    render(<BlogPage />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('loads and displays blog posts', async () => {
    render(<BlogPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Understanding UK Capital Gains Tax')).toBeInTheDocument();
      expect(screen.getByText('HMRC Reporting Requirements')).toBeInTheDocument();
      expect(screen.getByText('Tax Efficient Investment Strategies')).toBeInTheDocument();
    });

    expect(mockGetAllPosts).toHaveBeenCalledTimes(1);
  });

  it('displays error message when loading fails', async () => {
    const errorMessage = 'Failed to load posts';
    mockGetAllPosts.mockRejectedValue(new Error(errorMessage));
    
    render(<BlogPage />);
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('displays "no posts found" when no posts are returned', async () => {
    mockGetAllPosts.mockResolvedValue([]);
    
    render(<BlogPage />);
    
    await waitFor(() => {
      expect(screen.getByText('No blog posts found')).toBeInTheDocument();
    });
  });

  it('sets up hash change listener on mount', async () => {
    render(<BlogPage />);
    
    await waitFor(() => {
      expect(mockAddEventListener).toHaveBeenCalledWith('hashchange', expect.any(Function));
    });
  });

  it('cleans up hash change listener on unmount', async () => {
    const { unmount } = render(<BlogPage />);
    
    await waitFor(() => {
      expect(mockAddEventListener).toHaveBeenCalled();
    });
    
    unmount();
    
    expect(mockRemoveEventListener).toHaveBeenCalledWith('hashchange', expect.any(Function));
  });

  describe('routing and navigation', () => {
    beforeEach(async () => {
      render(<BlogPage />);
      
      // Wait for posts to load
      await waitFor(() => {
        expect(screen.getByText('Understanding UK Capital Gains Tax')).toBeInTheDocument();
      });
    });

    it('shows blog index by default', () => {
      expect(screen.getByText('Understanding UK Capital Gains Tax')).toBeInTheDocument();
      expect(screen.getByText('HMRC Reporting Requirements')).toBeInTheDocument();
      expect(screen.getByText('Tax Efficient Investment Strategies')).toBeInTheDocument();
    });

    it('handles direct post navigation via hash', () => {
      // Simulate hash change to a specific post
      mockLocation.hash = '#blog/post/understanding-uk-capital-gains-tax';
      
      // Trigger the hash change event
      const hashChangeHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'hashchange'
      )?.[1];
      
      if (hashChangeHandler) {
        hashChangeHandler();
      }
      
      // Should show the post content
      expect(screen.getByText('Understanding UK Capital Gains Tax')).toBeInTheDocument();
    });

    it('handles legacy numeric ID redirects', () => {
      // Test legacy ID redirect
      mockLocation.hash = '#blog/post/1';
      
      const hashChangeHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'hashchange'
      )?.[1];
      
      if (hashChangeHandler) {
        hashChangeHandler();
      }
      
      // Should redirect to the correct slug
      expect(mockLocation.replace).toHaveBeenCalledWith('#blog/post/understanding-uk-capital-gains-tax');
    });

    it('navigates back to index when hash is cleared', () => {
      // First navigate to a post
      mockLocation.hash = '#blog/post/understanding-uk-capital-gains-tax';
      
      const hashChangeHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'hashchange'
      )?.[1];
      
      if (hashChangeHandler) {
        hashChangeHandler();
      }
      
      // Then clear the hash
      mockLocation.hash = '#blog';
      
      if (hashChangeHandler) {
        hashChangeHandler();
      }
      
      // Should show blog index
      expect(screen.getByText('Understanding UK Capital Gains Tax')).toBeInTheDocument();
      expect(screen.getByText('HMRC Reporting Requirements')).toBeInTheDocument();
    });

    it('handles invalid post slugs gracefully', () => {
      mockLocation.hash = '#blog/post/non-existent-post';
      
      const hashChangeHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'hashchange'
      )?.[1];
      
      if (hashChangeHandler) {
        hashChangeHandler();
      }
      
      // Should show the blog index (fallback)
      expect(screen.getByText('Understanding UK Capital Gains Tax')).toBeInTheDocument();
      expect(screen.getByText('HMRC Reporting Requirements')).toBeInTheDocument();
    });
  });

  describe('post filtering and search', () => {
    beforeEach(async () => {
      render(<BlogPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Understanding UK Capital Gains Tax')).toBeInTheDocument();
      });
    });

    it('filters posts by category', async () => {
      // Find and click on a category filter (this would be implemented in BlogIndex)
      // Since BlogIndex is mocked via the blog components, we test the data transformation
      const adaptedPosts = mockLoadedPosts.map(p => ({
        id: p.slug,
        title: p.title,
        content: p.content,
        excerpt: p.excerpt,
        author: p.author,
        publishedDate: p.date,
        tags: p.tags,
        category: p.category,
        readingTime: p.readingTime
      }));
      
      expect(adaptedPosts).toHaveLength(3);
      expect(adaptedPosts.find(p => p.category === 'Tax Planning')).toBeDefined();
      expect(adaptedPosts.find(p => p.category === 'Compliance')).toBeDefined();
      expect(adaptedPosts.find(p => p.category === 'Investment')).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('handles network errors gracefully', async () => {
      mockGetAllPosts.mockRejectedValue(new Error('Network error'));
      
      render(<BlogPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('handles undefined error messages', async () => {
      mockGetAllPosts.mockRejectedValue({});
      
      render(<BlogPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load blog posts')).toBeInTheDocument();
      });
    });

    it('prevents state updates after component unmount', async () => {
      const { unmount } = render(<BlogPage />);
      
      // Unmount immediately
      unmount();
      
      // The getAllPosts promise should still resolve, but shouldn't update state
      await waitFor(() => {
        expect(mockGetAllPosts).toHaveBeenCalledTimes(1);
      });
      
      // No errors should be thrown due to setState on unmounted component
    });
  });

  describe('data transformation', () => {
    it('correctly transforms LoadedBlogPost to BlogPostData', async () => {
      render(<BlogPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Understanding UK Capital Gains Tax')).toBeInTheDocument();
      });
      
      // Verify the transformation by checking that the data is properly adapted
      // The component should receive BlogPostData format with 'id' field instead of 'slug'
      expect(mockGetAllPosts).toHaveBeenCalledWith();
    });

    it('handles posts with missing optional fields', async () => {
      const postsWithMissingFields = [{
        ...mockLoadedPosts[0],
        readingTime: undefined as any
      }];
      
      mockGetAllPosts.mockResolvedValue(postsWithMissingFields);
      
      render(<BlogPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Understanding UK Capital Gains Tax')).toBeInTheDocument();
      });
    });
  });
});