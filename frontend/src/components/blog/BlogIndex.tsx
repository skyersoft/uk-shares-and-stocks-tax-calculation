import React from 'react';
import { BlogPostData } from './BlogPost';

interface BlogIndexProps {
  posts: BlogPostData[];
  className?: string;
  onPostClick?: (post: BlogPostData) => void;
  searchTerm: string;
  setSearchTerm: (t: string) => void;
}

export const BlogIndex: React.FC<BlogIndexProps> = ({
  posts,
  className = '',
  onPostClick,
  searchTerm,
  setSearchTerm
}) => {
  const handlePostClick = (post: BlogPostData) => {
    if (onPostClick) {
      onPostClick(post);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className={`blog-index ${className}`}>
      {/* Search Controls */}
      <div className="blog-controls mb-4">
        <div className="row g-3">
          <div className="col-12">
            <input
              type="text"
              className="form-control"
              placeholder="Search blog posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Blog Posts */}
      <div className="blog-posts">
        {posts.length > 0 ? (
          <div className="row g-4">
            {posts.map(post => (
              <div key={post.id} className="col-md-6">
                <div
                  className="card h-100 blog-post-card"
                  style={{ cursor: onPostClick ? 'pointer' : 'default' }}
                  onClick={() => handlePostClick(post)}
                >
                  <div className="card-body d-flex flex-column">
                    <div className="mb-2">
                      <span className="badge bg-secondary mb-2">
                        {post.category}
                      </span>
                    </div>

                    <h5 className="card-title">{post.title}</h5>

                    <p className="card-text flex-grow-1">{post.excerpt}</p>

                    <div className="blog-post-meta mt-auto">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <small className="text-muted">
                          By {post.author}
                        </small>
                        <small className="text-muted">
                          {post.readingTime} min read
                        </small>
                      </div>

                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          {formatDate(post.publishedDate)}
                        </small>
                        <div className="blog-post-tags">
                          {post.tags && post.tags.slice(0, 2).map(tag => (
                            <span
                              key={tag}
                              className="badge bg-light text-dark me-1"
                              style={{ fontSize: '0.7em' }}
                            >
                              {tag}
                            </span>
                          ))}
                          {post.tags && post.tags.length > 2 && (
                            <span
                              className="badge bg-light text-dark"
                              style={{ fontSize: '0.7em' }}
                            >
                              +{post.tags.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-5">
            <div className="mb-3">
              <i className="bi bi-search" style={{ fontSize: '3rem', color: '#6c757d' }}></i>
            </div>
            <h4 className="text-muted">No blog posts found</h4>
            <p className="text-muted">
              Try adjusting your search or filter criteria.
            </p>
            {searchTerm && (
              <button
                className="btn btn-outline-primary"
                onClick={() => setSearchTerm('')}
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogIndex;