import React, { useEffect, useState, useCallback, useRef } from 'react';
import { BlogIndex } from '../components/blog/BlogIndex';
import { BlogPost as BlogPostComponent, BlogPostData } from '../components/blog/BlogPost';
import { getAllPosts } from '../content/blogLoader';
import { BlogPost as LoadedBlogPost } from '../types/blog';
import { AffiliateGrid, searchAffiliateProducts } from '../components/affiliate';

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

  const selectedPost = selectedSlug ? posts.find(p => p.id === selectedSlug) || null : null;

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

  // Load posts once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const loaded = await getAllPosts(); // LoadedBlogPost[]
        if (!cancelled) {
          // Adapt loader BlogPost -> component BlogPostData shape
          const adapted: BlogPostData[] = loaded.map((p: LoadedBlogPost) => ({
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

  // Parse hash for deep-link (e.g., #blog/post/slug or legacy #blog/post/2)
  const parseHash = useCallback(() => {
    if (typeof window === 'undefined') return;
    const rawHash = window.location.hash;
    const path = rawHash.startsWith('#') ? rawHash.substring(1) : rawHash; // blog/post/...
    if (path === 'blog') {
      setSelectedSlug(null);
      return;
    }
    if (path.startsWith('blog/')) {
      const segments = path.split('/');
      // Accept patterns: blog/slug OR blog/post/slug OR legacy numeric blog/post/2
      let potential = '';
      if (segments.length === 2) {
        potential = segments[1];
      } else if (segments.length === 3 && segments[1] === 'post') {
        potential = segments[2];
      }
      if (potential) {
        // If legacy numeric, translate to slug and rewrite hash exactly once.
        if (/^\d+$/.test(potential) && legacyIdToSlug[potential]) {
          const slug = legacyIdToSlug[potential];
            if (!hasRedirectedRef.current) {
              hasRedirectedRef.current = true;
              window.location.replace(`#blog/post/${slug}`);
              return; // parsing will happen again after hash change
            }
        }
        setSelectedSlug(potential);
        return;
      }
    }
    setSelectedSlug(null);
  }, []);

  useEffect(() => {
    parseHash();
    const handler = () => parseHash();
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, [parseHash]);

  const navigateToPost = (slug: string) => {
    if (typeof window !== 'undefined') {
      window.location.hash = `blog/post/${slug}`;
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
              posts={posts}
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