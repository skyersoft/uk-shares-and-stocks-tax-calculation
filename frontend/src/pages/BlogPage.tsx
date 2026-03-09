import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BlogIndex } from '../components/blog/BlogIndex';
import { BlogPost as BlogPostComponent, BlogPostData } from '../components/blog/BlogPost';
import { getAllPosts } from '../content/blogLoader';
import { BlogPost as LoadedBlogPost } from '../types/blog';
import { AffiliateGrid, searchAffiliateProducts } from '../components/affiliate';
import SEOHead from '../components/seo/SEOHead';

// Map legacy numeric IDs (original hardcoded sample posts) to new slugs.
// This allows previously shared links like #blog/post/2 to redirect.
const legacyIdToSlug: Record<string, string> = {
  '1': 'understanding-uk-capital-gains-tax',
  '2': 'hmrc-reporting-requirements',
  '3': 'using-interactive-brokers-data',
  '4': 'tax-efficient-investment-strategies'
};

const BlogPage: React.FC = () => {
  // Dynamic content state
  const [posts, setPosts] = useState<BlogPostData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const hasRedirectedRef = useRef(false);

  // Filter states lifted from BlogIndex
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedTag, setSelectedTag] = useState('');

  const selectedPost = selectedSlug ? posts.find(p => p.id === selectedSlug) || null : null;

  // Compute categories and tags based on all posts
  const categories = useMemo(() => {
    return ['All Categories', ...new Set(posts.map(post => post.category))];
  }, [posts]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    posts.forEach(post => {
      if (post.tags) {
        post.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, [posts]);

  // Filter posts based on search term, category, and tag
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const matchesSearch = searchTerm === '' ||
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (post.excerpt && post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = selectedCategory === 'All Categories' ||
        post.category === selectedCategory;

      const matchesTag = selectedTag === '' ||
        (post.tags && post.tags.includes(selectedTag));

      return matchesSearch && matchesCategory && matchesTag;
    });
  }, [posts, searchTerm, selectedCategory, selectedTag]);

  // Get relevant books based on blog post content
  const getRelevantBooks = useCallback((post: BlogPostData) => {
    const searchTerms = [
      ...(post.tags || []),
      post.category,
      ...(post.title.toLowerCase().includes('tax') ? ['tax'] : []),
      ...(post.title.toLowerCase().includes('trading') ? ['trading'] : []),
      ...(post.title.toLowerCase().includes('investment') ? ['investing'] : []),
      ...(post.title.toLowerCase().includes('capital gains') ? ['tax'] : [])
    ].filter(Boolean);

    // Search for books matching the content
    const relevantBooks = searchAffiliateProducts(searchTerms.join(' '));
    return relevantBooks.slice(0, 3); // Limit to 3 books
  }, []);

  // Load posts index once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const loaded = await getAllPosts(); // LoadedBlogPost[] (content might be empty)
        if (!cancelled) {
          // Adapt loader BlogPost -> component BlogPostData shape
          const adapted: BlogPostData[] = loaded.map((p: LoadedBlogPost) => ({
            id: p.slug,
            title: p.title,
            content: p.content, // Initially empty for fresh loads
            excerpt: p.excerpt,
            author: p.author,
            publishedDate: p.date,
            tags: p.tags,
            category: p.category,
            readingTime: p.readingTime
          }));
          setPosts(adapted);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load blog posts');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Fetch full content when a slug is selected
  useEffect(() => {
    if (!selectedSlug) return;

    // Check if we already have content
    const currentPost = posts.find(p => p.id === selectedSlug);
    if (!currentPost || (currentPost.content && currentPost.content.length > 0)) {
      return;
    }

    // Fetch content
    (async () => {
      try {
        const fullPost = await import('../content/blogLoader').then(m => m.getPostBySlug(selectedSlug));
        if (fullPost && fullPost.content) {
          setPosts(prevPosts => prevPosts.map(p =>
            p.id === selectedSlug ? { ...p, content: fullPost.content, readingTime: fullPost.readingTime } : p
          ));
        }
      } catch (err) {
        console.error("Failed to load post content", err);
      }
    })();
  }, [selectedSlug, posts]);

  const location = useLocation();
  const navigate = useNavigate();

  // Parse path for deep-link (e.g., /blog/post/slug or legacy #blog/post/2)
  const parseRoute = useCallback(() => {
    const rawHash = location.hash;
    const hashPath = rawHash.startsWith('#') ? rawHash.substring(1) : rawHash;

    // Legacy hash checking
    if (hashPath.startsWith('blog/')) {
      const segments = hashPath.split('/');
      let potential = '';
      if (segments.length === 2) {
        potential = segments[1];
      } else if (segments.length === 3 && segments[1] === 'post') {
        potential = segments[2];
      }

      if (potential && /^\\d+$/.test(potential) && legacyIdToSlug[potential]) {
        const slug = legacyIdToSlug[potential];
        if (!hasRedirectedRef.current) {
          hasRedirectedRef.current = true;
          navigate(`/blog/post/${slug}`, { replace: true });
          return;
        }
      } else if (potential) {
        // Standard legacy hash redirect to pure path
        if (!hasRedirectedRef.current) {
          hasRedirectedRef.current = true;
          navigate(`/blog/post/${potential}`, { replace: true });
          return;
        }
      }
    }

    // Modern path parsing
    const pathname = location.pathname;
    if (pathname === '/blog' || pathname === '/blog/') {
      setSelectedSlug(null);
      return;
    }

    if (pathname.startsWith('/blog/')) {
      const segments = pathname.split('/').filter(Boolean);
      // expect segments: ['blog', 'post', 'slug'] or ['blog', 'slug']
      let potential = '';
      if (segments.length === 2 && segments[0] === 'blog') {
        potential = segments[1];
      } else if (segments.length === 3 && segments[0] === 'blog' && segments[1] === 'post') {
        potential = segments[2];
      }

      if (potential) {
        setSelectedSlug(potential);
        return;
      }
    }

    setSelectedSlug(null);
  }, [location, navigate]);

  useEffect(() => {
    parseRoute();
  }, [parseRoute]);

  const navigateToPost = (slug: string) => {
    navigate(`/blog/post/${slug}`);
  };

  const handlePostClick = (post: BlogPostData) => {
    navigateToPost(post.id);
  };

  const handleBackToList = () => {
    setSelectedSlug(null);
    navigate('/blog');
  };

  const handleTagClick = (tag: string) => {
    setSelectedTag(selectedTag === tag ? '' : tag);
    if (selectedPost) {
      handleBackToList();
    }
  };

  return (
    <div className="container py-4">
      {selectedPost ? (
        <SEOHead
          title={selectedPost.title}
          description={selectedPost.excerpt || ''}
          keywords={selectedPost.tags}
          canonical={`https://cgttaxtool.uk/blog/post/${selectedPost.id}`}
          ogType="article"
          articleAuthor={selectedPost.author}
          articlePublishedTime={selectedPost.publishedDate}
          articleTags={selectedPost.tags}
          articleSection={selectedPost.category}
        />
      ) : (
        <SEOHead
          title="UK Tax & Investment Blog - IBKR Tax Calculator"
          description="Expert insights, guides, and updates on UK tax calculations for stocks and shares. Stay informed about CGT rules and investment strategies."
          canonical="https://cgttaxtool.uk/blog"
        />
      )}
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="card shadow">
            <div className="card-body">
              {!selectedPost && (
                <div className="mb-4">
                  <h1 className="card-title">Tax Calculator Blog</h1>
                  <p className="lead">
                    Expert insights, guides, and updates on UK tax calculations for stocks and shares.
                  </p>
                </div>
              )}

              <div className="row">
                <div className="col-lg-8">
                  {loading && (
                    <div className="text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  )}
                  {!loading && error && (
                    <div className="alert alert-danger" role="alert">
                      {error}
                    </div>
                  )}
                  {!loading && !error && selectedPost ? (
                    <div className="blog-post-detail">
                      <div className="d-flex align-items-center mb-3">
                        <button className="btn btn-sm btn-outline-secondary me-3" onClick={handleBackToList}>
                          <i className="bi bi-arrow-left me-1" /> Back to all posts
                        </button>
                        <span className="text-muted small">Post {posts.findIndex(p => p.id === selectedPost.id) + 1} of {posts.length}</span>
                      </div>
                      <BlogPostComponent post={selectedPost} />

                      {/* Related Resources Section */}
                      <div className="mt-5 mb-4">
                        <div className="border-top pt-4">
                          <h4 className="h5 mb-3">
                            📚 Related Resources
                          </h4>
                          <p className="text-muted mb-3">
                            Deepen your understanding with these expert-recommended books
                          </p>

                          <AffiliateGrid
                            products={getRelevantBooks(selectedPost)}
                            columns={{ xs: 1, sm: 2, md: 3 }}
                            showRatings={true}
                            showCategories={true}
                            layout="vertical"
                            emptyStateMessage="No related books found for this topic"
                          />
                        </div>
                      </div>

                      <div className="mt-4 d-flex justify-content-between">
                        <button
                          className="btn btn-outline-primary btn-sm"
                          disabled={posts.length === 0 || selectedPost.id === posts[0].id}
                          onClick={() => {
                            const currentIndex = posts.findIndex(p => p.id === selectedPost.id);
                            if (currentIndex > 0) navigateToPost(posts[currentIndex - 1].id);
                          }}
                        >
                          <i className="bi bi-chevron-left me-1" /> Previous
                        </button>
                        <button
                          className="btn btn-outline-primary btn-sm"
                          disabled={posts.length === 0 || selectedPost.id === posts[posts.length - 1].id}
                          onClick={() => {
                            const currentIndex = posts.findIndex(p => p.id === selectedPost.id);
                            if (currentIndex < posts.length - 1) navigateToPost(posts[currentIndex + 1].id);
                          }}
                        >
                          Next <i className="bi bi-chevron-right ms-1" />
                        </button>
                      </div>
                    </div>
                  ) : null}
                  {!loading && !error && !selectedPost && (
                    <BlogIndex
                      posts={filteredPosts}
                      onPostClick={handlePostClick}
                      className="blog-page-index"
                      searchTerm={searchTerm}
                      setSearchTerm={setSearchTerm}
                    />
                  )}
                </div>

                {/* Sidebar */}
                <div className="col-lg-4">
                  <div className="sticky-top" style={{ top: '20px' }}>
                    <div className="card bg-light mb-4">
                      <div className="card-header">
                        <h6 className="mb-0">Quick Links</h6>
                      </div>
                      <div className="card-body">
                        <ul className="list-unstyled mb-0">
                          <li className="mb-2"><a href="/calculator" className="text-decoration-none">🧮 Use Calculator</a></li>
                          <li className="mb-2"><a href="/guide" className="text-decoration-none">📖 CGT Guide</a></li>
                          <li><a href="/help" className="text-decoration-none">❓ Get Help</a></li>
                        </ul>
                      </div>
                    </div>

                    <div className="card bg-light mb-4">
                      <div className="card-header d-flex justify-content-between align-items-center">
                        <h6 className="mb-0">Categories</h6>
                        {selectedCategory !== 'All Categories' && (
                          <button className="btn btn-sm text-primary p-0" onClick={() => setSelectedCategory('All Categories')}>
                            Clear
                          </button>
                        )}
                      </div>
                      <div className="card-body">
                        <select
                          className="form-select form-select-sm"
                          value={selectedCategory}
                          onChange={(e) => {
                            setSelectedCategory(e.target.value);
                            if (selectedPost) handleBackToList();
                          }}
                        >
                          {categories.map(category => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {allTags.length > 0 && (
                      <div className="card bg-light">
                        <div className="card-header d-flex justify-content-between align-items-center">
                          <h6 className="mb-0">Tags</h6>
                          {selectedTag && (
                            <button className="btn btn-sm text-primary p-0" onClick={() => setSelectedTag('')}>
                              Clear
                            </button>
                          )}
                        </div>
                        <div className="card-body">
                          <div className="d-flex flex-wrap gap-2">
                            {allTags.map(tag => (
                              <button
                                key={tag}
                                className={`btn btn-sm ${selectedTag === tag ? 'btn-primary' : 'btn-outline-primary'
                                  }`}
                                onClick={() => handleTagClick(tag)}
                                style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                              >
                                #{tag}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPage;