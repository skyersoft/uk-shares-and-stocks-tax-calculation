import React, { useEffect, useState, useCallback } from 'react';
import { BlogIndex } from '../components/blog/BlogIndex';
import { BlogPost, BlogPostData } from '../components/blog/BlogPost';

const BlogPage: React.FC = () => {
  // Sample blog posts - in a real app, these would come from an API or CMS
  const samplePosts: BlogPostData[] = [
    {
      id: '1',
      title: 'Understanding UK Capital Gains Tax on Stocks and Shares',
      content: `
        <p>Capital Gains Tax (CGT) is a tax on the profit when you sell (or 'dispose of') something (an 'asset') that's increased in value. In the UK, this applies to stocks and shares when you sell them for more than you paid.</p>
        
        <h3>Key Points:</h3>
        <ul>
          <li>CGT only applies when you make a profit on the sale</li>
          <li>You have an annual CGT allowance (£6,000 for 2023-24)</li>
          <li>Different rates apply depending on your income level</li>
          <li>Record keeping is essential for accurate calculations</li>
        </ul>
        
        <p>Using a tax calculator can help you understand your potential liability and plan your investment strategy accordingly.</p>
      `,
      excerpt: 'Learn the basics of UK Capital Gains Tax on stocks and shares, including allowances, rates, and key considerations for investors.',
      author: 'Tax Calculator Team',
      publishedDate: '2024-01-15',
      tags: ['Tax', 'UK', 'Capital Gains', 'Stocks'],
      category: 'Tax Education',
      readingTime: 5
    },
    {
      id: '2',
      title: 'HMRC Reporting Requirements for Stock Transactions',
      content: `
        <p>When dealing with UK stocks and shares, it's important to understand HMRC's reporting requirements to ensure compliance with tax regulations.</p>
        
        <h3>What You Need to Report:</h3>
        <ul>
          <li>Capital gains exceeding the annual exempt amount</li>
          <li>Dividend income above the dividend allowance</li>
          <li>Foreign dividends and capital gains</li>
        </ul>
        
        <h3>Record Keeping Requirements:</h3>
        <ul>
          <li>Purchase dates and prices</li>
          <li>Sale dates and prices</li>
          <li>Transaction costs (broker fees, etc.)</li>
          <li>Corporate actions (stock splits, dividends)</li>
        </ul>
        
        <p>Proper documentation is crucial for accurate tax calculations and HMRC compliance.</p>
      `,
      excerpt: 'Essential guide to HMRC reporting requirements for stock and share transactions in the UK.',
      author: 'Compliance Expert',
      publishedDate: '2024-02-01',
      tags: ['HMRC', 'Reporting', 'Compliance', 'Documentation'],
      category: 'Compliance',
      readingTime: 7
    },
    {
      id: '3',
      title: 'Using Interactive Brokers Data for UK Tax Calculations',
      content: `
        <p>Interactive Brokers provides comprehensive trading data, but UK taxpayers need to understand how to use this information for accurate tax calculations.</p>
        
        <h3>Key Data Points:</h3>
        <ul>
          <li>Trade confirmations with exact prices</li>
          <li>Corporate action notifications</li>
          <li>Currency conversion records</li>
          <li>Dividend payment details</li>
        </ul>
        
        <h3>Common Challenges:</h3>
        <ul>
          <li>Multi-currency transactions</li>
          <li>Complex corporate actions</li>
          <li>Fractional shares</li>
          <li>Wash sale rules</li>
        </ul>
        
        <p>Our calculator helps process Interactive Brokers data automatically, handling these complexities for accurate UK tax calculations.</p>
      `,
      excerpt: 'Learn how to effectively use Interactive Brokers trading data for UK tax calculations and compliance.',
      author: 'Technical Team',
      publishedDate: '2024-02-15',
      tags: ['Interactive Brokers', 'Data Processing', 'Tax Calculation'],
      category: 'Technical Guide',
      readingTime: 6
    },
    {
      id: '4',
      title: 'Tax-Efficient Investment Strategies for UK Investors',
      content: `
        <p>Understanding tax-efficient investment strategies can help UK investors maximize their returns while minimizing their tax liability.</p>
        
        <h3>Key Strategies:</h3>
        <ul>
          <li>Utilize ISA allowances effectively</li>
          <li>Consider timing of gains and losses</li>
          <li>Understand bed and breakfasting rules</li>
          <li>Plan for annual CGT allowances</li>
        </ul>
        
        <h3>Investment Vehicles:</h3>
        <ul>
          <li>Stocks & Shares ISAs</li>
          <li>SIPPs (Self-Invested Personal Pensions)</li>
          <li>Investment bonds</li>
          <li>VCTs (Venture Capital Trusts)</li>
        </ul>
        
        <p>Always consult with a qualified tax advisor for personalized advice.</p>
      `,
      excerpt: 'Discover tax-efficient investment strategies to help UK investors maximize returns and minimize tax liability.',
      author: 'Investment Advisor',
      publishedDate: '2024-03-01',
      tags: ['Investment Strategy', 'Tax Efficiency', 'ISA', 'Planning'],
      category: 'Investment Planning',
      readingTime: 8
    }
  ];

  // State for selected post (detail view)
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const selectedPost = selectedPostId ? samplePosts.find(p => p.id === selectedPostId) || null : null;

  // Parse hash for deep-link (e.g., #blog/post/2)
  const parseHash = useCallback(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash; // patterns: #blog, #blog/post/2, #blog/2
    // Normalize removing leading '#'
    const path = hash.startsWith('#') ? hash.substring(1) : hash; // blog/post/2
    if (path === 'blog') {
      setSelectedPostId(null);
      return;
    }
    if (path.startsWith('blog/')) {
      const segments = path.split('/');
      // blog/post/2 => ['blog','post','2'] ; blog/2 => ['blog','2']
      let potentialId: string | undefined;
      if (segments.length === 3 && segments[1] === 'post') {
        potentialId = segments[2];
      } else if (segments.length === 2) {
        potentialId = segments[1];
      }
      if (potentialId && samplePosts.some(p => p.id === potentialId)) {
        setSelectedPostId(potentialId);
        return;
      }
    }
    // Fallback: no valid post -> list view
    setSelectedPostId(null);
  }, [samplePosts]);

  useEffect(() => {
    parseHash();
    const handler = () => parseHash();
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, [parseHash]);

  const navigateToPost = (postId: string) => {
    if (typeof window !== 'undefined') {
      window.location.hash = `blog/post/${postId}`;
    }
  };

  const handlePostClick = (post: BlogPostData) => {
    navigateToPost(post.id);
  };

  const handleBackToList = () => {
    if (typeof window !== 'undefined') {
      window.location.hash = 'blog';
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="row justify-content-center">
        <div className="col-12 col-xl-10">
          {!selectedPost && (
            <div className="mb-4">
              <h1 className="h2 text-primary mb-2">Tax Calculator Blog</h1>
              <p className="text-muted lead">
                Expert insights, guides, and updates on UK tax calculations for stocks and shares.
              </p>
            </div>
          )}

          {selectedPost ? (
            <div className="blog-post-detail">
              <div className="d-flex align-items-center mb-3">
                <button className="btn btn-sm btn-outline-secondary me-3" onClick={handleBackToList}>
                  <i className="bi bi-arrow-left me-1" /> Back to all posts
                </button>
                <span className="text-muted small">Post {selectedPost.id} of {samplePosts.length}</span>
              </div>
              <BlogPost post={selectedPost} />
              <div className="mt-4 d-flex justify-content-between">
                <button
                  className="btn btn-outline-primary btn-sm"
                  disabled={selectedPost.id === samplePosts[0].id}
                  onClick={() => {
                    const currentIndex = samplePosts.findIndex(p => p.id === selectedPost.id);
                    if (currentIndex > 0) navigateToPost(samplePosts[currentIndex - 1].id);
                  }}
                >
                  <i className="bi bi-chevron-left me-1" /> Previous
                </button>
                <button
                  className="btn btn-outline-primary btn-sm"
                  disabled={selectedPost.id === samplePosts[samplePosts.length - 1].id}
                  onClick={() => {
                    const currentIndex = samplePosts.findIndex(p => p.id === selectedPost.id);
                    if (currentIndex < samplePosts.length - 1) navigateToPost(samplePosts[currentIndex + 1].id);
                  }}
                >
                  Next <i className="bi bi-chevron-right ms-1" />
                </button>
              </div>
            </div>
          ) : (
            <BlogIndex 
              posts={samplePosts}
              onPostClick={handlePostClick}
              className="blog-page-index"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogPage;