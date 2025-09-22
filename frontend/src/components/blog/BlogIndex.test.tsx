import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BlogIndex } from './BlogIndex';
import { BlogPostData } from './BlogPost';

const mockPosts: BlogPostData[] = [
  {
    id: '1',
    title: 'Understanding Capital Gains Tax',
    content: 'Complete guide to UK capital gains tax.',
    excerpt: 'Learn about UK capital gains tax rules and calculations.',
    author: 'Tax Expert',
    publishedDate: '2024-09-15',
    tags: ['tax', 'capital-gains', 'uk'],
    category: 'Tax Guides',
    readingTime: 5
  },
  {
    id: '2',
    title: 'IBKR Portfolio Analysis',
    content: 'How to analyze your IBKR portfolio.',
    excerpt: 'Step-by-step guide to portfolio analysis.',
    author: 'Investment Advisor',
    publishedDate: '2024-09-10',
    tags: ['portfolio', 'analysis', 'ibkr'],
    category: 'Investment Guides',
    readingTime: 8
  },
  {
    id: '3',
    title: 'Section 104 Pools Explained',
    content: 'Understanding Section 104 pool calculations.',
    excerpt: 'Comprehensive guide to Section 104 pools.',
    author: 'Tax Expert',
    publishedDate: '2024-09-05',
    tags: ['tax', 'section-104', 'uk'],
    category: 'Tax Guides',
    readingTime: 12
  }
];

describe('BlogIndex', () => {
  it('renders blog index with all posts', () => {
    render(<BlogIndex posts={mockPosts} />);
    
    expect(screen.getByText('Understanding Capital Gains Tax')).toBeInTheDocument();
    expect(screen.getByText('IBKR Portfolio Analysis')).toBeInTheDocument();
    expect(screen.getByText('Section 104 Pools Explained')).toBeInTheDocument();
  });

  it('displays post excerpts and meta information', () => {
    render(<BlogIndex posts={mockPosts} />);
    
    expect(screen.getByText('Learn about UK capital gains tax rules and calculations.')).toBeInTheDocument();
    expect(screen.getAllByText(/Tax Expert/)).toHaveLength(2); // Two posts by Tax Expert
    expect(screen.getByText(/5 min read/)).toBeInTheDocument();
  });

  it('filters posts by category', async () => {
    const user = userEvent.setup();
    render(<BlogIndex posts={mockPosts} />);
    
    // Filter by Tax Guides category
    const categoryFilter = screen.getByDisplayValue('All Categories');
    await user.selectOptions(categoryFilter, 'Tax Guides');
    
    expect(screen.getByText('Understanding Capital Gains Tax')).toBeInTheDocument();
    expect(screen.getByText('Section 104 Pools Explained')).toBeInTheDocument();
    expect(screen.queryByText('IBKR Portfolio Analysis')).not.toBeInTheDocument();
  });

  it('filters posts by tag', async () => {
    const user = userEvent.setup();
    render(<BlogIndex posts={mockPosts} />);
    
    // Click on a tag
    const portfolioTag = screen.getByText('#portfolio');
    await user.click(portfolioTag);
    
    expect(screen.getByText('IBKR Portfolio Analysis')).toBeInTheDocument();
    expect(screen.queryByText('Understanding Capital Gains Tax')).not.toBeInTheDocument();
  });

  it('searches posts by title and content', async () => {
    const user = userEvent.setup();
    render(<BlogIndex posts={mockPosts} />);
    
    const searchInput = screen.getByPlaceholderText('Search blog posts...');
    await user.type(searchInput, 'portfolio');
    
    expect(screen.getByText('IBKR Portfolio Analysis')).toBeInTheDocument();
    expect(screen.queryByText('Understanding Capital Gains Tax')).not.toBeInTheDocument();
  });

  it('handles empty search results', async () => {
    const user = userEvent.setup();
    render(<BlogIndex posts={mockPosts} />);
    
    const searchInput = screen.getByPlaceholderText('Search blog posts...');
    await user.type(searchInput, 'nonexistent');
    
    expect(screen.getByText('No blog posts found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your search or filter criteria.')).toBeInTheDocument();
  });

  it('displays correct post count', () => {
    render(<BlogIndex posts={mockPosts} />);
    
    expect(screen.getByText('3 articles')).toBeInTheDocument();
  });

  it('handles empty posts array', () => {
    render(<BlogIndex posts={[]} />);
    
    expect(screen.getByText('No blog posts found')).toBeInTheDocument();
    expect(screen.getByText('0 articles')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<BlogIndex posts={mockPosts} className="custom-blog-index" />);
    
    expect(container.firstChild).toHaveClass('blog-index', 'custom-blog-index');
  });

  it('handles post click navigation', async () => {
    const user = userEvent.setup();
    const mockOnPostClick = jest.fn();
    render(<BlogIndex posts={mockPosts} onPostClick={mockOnPostClick} />);
    
    const firstPost = screen.getByText('Understanding Capital Gains Tax');
    await user.click(firstPost);
    
    expect(mockOnPostClick).toHaveBeenCalledWith(mockPosts[0]);
  });
});