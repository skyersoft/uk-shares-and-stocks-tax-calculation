import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BlogNavigation } from './BlogNavigation';

const mockCategories = ['Tax Guides', 'Investment Guides', 'Portfolio Analysis'];
const mockTags = ['tax', 'capital-gains', 'portfolio', 'analysis', 'uk', 'ibkr'];

describe('BlogNavigation', () => {
  it('renders navigation menu with categories', () => {
    render(<BlogNavigation categories={mockCategories} tags={mockTags} />);
    
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Tax Guides')).toBeInTheDocument();
    expect(screen.getByText('Investment Guides')).toBeInTheDocument();
    expect(screen.getByText('Portfolio Analysis')).toBeInTheDocument();
  });

  it('renders popular tags section', () => {
    render(<BlogNavigation categories={mockCategories} tags={mockTags} />);
    
    expect(screen.getByText('Popular Tags')).toBeInTheDocument();
    expect(screen.getByText('#tax')).toBeInTheDocument();
    expect(screen.getByText('#portfolio')).toBeInTheDocument();
  });

  it('calls onCategoryClick when category is clicked', async () => {
    const user = userEvent.setup();
    const mockOnCategoryClick = jest.fn();
    
    render(
      <BlogNavigation 
        categories={mockCategories} 
        tags={mockTags}
        onCategoryClick={mockOnCategoryClick}
      />
    );
    
    const taxGuidesLink = screen.getByText('Tax Guides');
    await user.click(taxGuidesLink);
    
    expect(mockOnCategoryClick).toHaveBeenCalledWith('Tax Guides');
  });

  it('calls onTagClick when tag is clicked', async () => {
    const user = userEvent.setup();
    const mockOnTagClick = jest.fn();
    
    render(
      <BlogNavigation 
        categories={mockCategories} 
        tags={mockTags}
        onTagClick={mockOnTagClick}
      />
    );
    
    const taxTag = screen.getByText('#tax');
    await user.click(taxTag);
    
    expect(mockOnTagClick).toHaveBeenCalledWith('tax');
  });

  it('highlights active category', () => {
    render(
      <BlogNavigation 
        categories={mockCategories} 
        tags={mockTags}
        activeCategory="Tax Guides"
      />
    );
    
    const activeCategoryLink = screen.getByText('Tax Guides');
    expect(activeCategoryLink.closest('a')).toHaveClass('active');
  });

  it('highlights active tag', () => {
    render(
      <BlogNavigation 
        categories={mockCategories} 
        tags={mockTags}
        activeTag="tax"
      />
    );
    
    const activeTagButton = screen.getByText('#tax');
    expect(activeTagButton).toHaveClass('btn-primary');
  });

  it('renders recent posts section when provided', () => {
    const recentPosts = [
      { id: '1', title: 'Recent Post 1' },
      { id: '2', title: 'Recent Post 2' }
    ];
    
    render(
      <BlogNavigation 
        categories={mockCategories} 
        tags={mockTags}
        recentPosts={recentPosts}
      />
    );
    
    expect(screen.getByText('Recent Posts')).toBeInTheDocument();
    expect(screen.getByText('Recent Post 1')).toBeInTheDocument();
    expect(screen.getByText('Recent Post 2')).toBeInTheDocument();
  });

  it('calls onRecentPostClick when recent post is clicked', async () => {
    const user = userEvent.setup();
    const mockOnRecentPostClick = jest.fn();
    const recentPosts = [
      { id: '1', title: 'Recent Post 1' }
    ];
    
    render(
      <BlogNavigation 
        categories={mockCategories} 
        tags={mockTags}
        recentPosts={recentPosts}
        onRecentPostClick={mockOnRecentPostClick}
      />
    );
    
    const recentPostLink = screen.getByText('Recent Post 1');
    await user.click(recentPostLink);
    
    expect(mockOnRecentPostClick).toHaveBeenCalledWith('1');
  });

  it('limits tags display to maxTags prop', () => {
    render(
      <BlogNavigation 
        categories={mockCategories} 
        tags={mockTags}
        maxTags={3}
      />
    );
    
    // Should only show first 3 tags
    const tagButtons = screen.getAllByRole('button');
    const tagButtonsWithHash = tagButtons.filter(button => 
      button.textContent?.startsWith('#')
    );
    
    expect(tagButtonsWithHash).toHaveLength(3);
  });

  it('applies custom className', () => {
    const { container } = render(
      <BlogNavigation 
        categories={mockCategories} 
        tags={mockTags}
        className="custom-nav"
      />
    );
    
    expect(container.firstChild).toHaveClass('blog-navigation', 'custom-nav');
  });

  it('renders archive section when enabled', () => {
    render(
      <BlogNavigation 
        categories={mockCategories} 
        tags={mockTags}
        showArchive={true}
      />
    );
    
    expect(screen.getByText('Archive')).toBeInTheDocument();
  });
});