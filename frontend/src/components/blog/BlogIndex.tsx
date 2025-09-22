import React, { useState, useMemo } from 'react';
import { BlogPostData } from './BlogPost';

interface BlogIndexProps {
  posts: BlogPostData[];
  className?: string;
  onPostClick?: (post: BlogPostData) => void;
}

export const BlogIndex: React.FC<BlogIndexProps> = ({ 
  posts, 
  className = '', 
  onPostClick 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedTag, setSelectedTag] = useState('');

  // Get unique categories and tags
  const categories = useMemo(() => {
    const cats = ['All Categories', ...new Set(posts.map(post => post.category))];
    return cats;
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

  const handleTagClick = (tag: string) => {
    setSelectedTag(selectedTag === tag ? '' : tag);
  };

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
      {/* Search and Filter Controls */}
      <div className="blog-controls mb-4">
        <div className="row g-3">
          <div className="col-md-6">
            <input
              type="text"
              className="form-control"
              placeholder="Search blog posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <select
              className="form-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <div className="d-flex justify-content-between align-items-center">
              <span className="text-muted small">
                {filteredPosts.length} articles
              </span>
              {selectedTag && (
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setSelectedTag('')}
                >
                  Clear tag filter
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tags Filter */}
      {allTags.length > 0 && (
        <div className="blog-tags mb-4">
          <div className="d-flex flex-wrap gap-2">
            {allTags.map(tag => (
              <button
                key={tag}
                className={`btn btn-sm ${
                  selectedTag === tag ? 'btn-primary' : 'btn-outline-primary'
                }`}
                onClick={() => handleTagClick(tag)}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Blog Posts */}
      <div className="blog-posts">
        {filteredPosts.length > 0 ? (
          <div className="row g-4">
            {filteredPosts.map(post => (
              <div key={post.id} className="col-md-6 col-lg-4">
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
            {(searchTerm || selectedCategory !== 'All Categories' || selectedTag) && (
              <button
                className="btn btn-outline-primary"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('All Categories');
                  setSelectedTag('');
                }}
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogIndex;