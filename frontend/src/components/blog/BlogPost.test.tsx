import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BlogPost } from './BlogPost';

const mockPost = {
  id: '1',
  title: 'Understanding Capital Gains Tax',
  content: '# Capital Gains Tax Guide\n\nThis is a comprehensive guide to UK capital gains tax.',
  excerpt: 'Learn about UK capital gains tax rules and calculations.',
  author: 'Tax Expert',
  publishedDate: '2024-09-15',
  tags: ['tax', 'capital-gains', 'uk'],
  category: 'Tax Guides',
  readingTime: 5
};

describe('BlogPost', () => {
  it('renders blog post with all content', () => {
    render(<BlogPost post={mockPost} />);
    
    expect(screen.getByText('Understanding Capital Gains Tax')).toBeInTheDocument();
    expect(screen.getByText('Tax Expert')).toBeInTheDocument();
    expect(screen.getByText(/September 15, 2024/)).toBeInTheDocument();
    expect(screen.getByText('5 min read')).toBeInTheDocument();
    expect(screen.getByText('Tax Guides')).toBeInTheDocument();
  });

  it('renders tags correctly', () => {
    render(<BlogPost post={mockPost} />);
    
    expect(screen.getByText('#tax')).toBeInTheDocument();
    expect(screen.getByText('#capital-gains')).toBeInTheDocument();
    expect(screen.getByText('#uk')).toBeInTheDocument();
  });

  it('renders markdown content properly', () => {
    render(<BlogPost post={mockPost} />);
    
    // Check that content is rendered (simplified without actual markdown parsing)
    expect(screen.getByText(/Capital Gains Tax Guide/)).toBeInTheDocument();
    expect(screen.getByText(/comprehensive guide to UK capital gains tax/)).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<BlogPost post={mockPost} className="custom-blog" />);
    
    expect(container.firstChild).toHaveClass('blog-post', 'custom-blog');
  });

  it('handles missing optional fields gracefully', () => {
    const minimalPost = {
      id: '2',
      title: 'Minimal Post',
      content: 'Basic content',
      publishedDate: '2024-09-15'
    };

    render(<BlogPost post={minimalPost} />);
    
    expect(screen.getByText('Minimal Post')).toBeInTheDocument();
    expect(screen.getByText('Basic content')).toBeInTheDocument();
  });

  it('formats date correctly', () => {
    render(<BlogPost post={mockPost} />);
    
    const formattedDate = screen.getByText(/September 15, 2024/);
    expect(formattedDate).toBeInTheDocument();
  });
});