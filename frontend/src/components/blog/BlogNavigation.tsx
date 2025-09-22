import React from 'react';

interface RecentPost {
  id: string;
  title: string;
}

interface BlogNavigationProps {
  categories: string[];
  tags: string[];
  activeCategory?: string;
  activeTag?: string;
  recentPosts?: RecentPost[];
  maxTags?: number;
  showArchive?: boolean;
  className?: string;
  onCategoryClick?: (category: string) => void;
  onTagClick?: (tag: string) => void;
  onRecentPostClick?: (postId: string) => void;
}

export const BlogNavigation: React.FC<BlogNavigationProps> = ({
  categories,
  tags,
  activeCategory,
  activeTag,
  recentPosts,
  maxTags = 10,
  showArchive = false,
  className = '',
  onCategoryClick,
  onTagClick,
  onRecentPostClick
}) => {
  const displayTags = tags.slice(0, maxTags);

  const handleCategoryClick = (category: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (onCategoryClick) {
      onCategoryClick(category);
    }
  };

  const handleTagClick = (tag: string) => {
    if (onTagClick) {
      onTagClick(tag);
    }
  };

  const handleRecentPostClick = (postId: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (onRecentPostClick) {
      onRecentPostClick(postId);
    }
  };

  return (
    <nav className={`blog-navigation ${className}`}>
      {/* Categories Section */}
      <div className="navigation-section mb-4">
        <h5 className="navigation-title">Categories</h5>
        <div className="list-group list-group-flush">
          {categories.map(category => (
            <a
              key={category}
              href="#"
              className={`list-group-item list-group-item-action ${
                activeCategory === category ? 'active' : ''
              }`}
              onClick={(e) => handleCategoryClick(category, e)}
            >
              {category}
            </a>
          ))}
        </div>
      </div>

      {/* Popular Tags Section */}
      <div className="navigation-section mb-4">
        <h5 className="navigation-title">Popular Tags</h5>
        <div className="d-flex flex-wrap gap-2">
          {displayTags.map(tag => (
            <button
              key={tag}
              className={`btn btn-sm ${
                activeTag === tag ? 'btn-primary' : 'btn-outline-primary'
              }`}
              onClick={() => handleTagClick(tag)}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Recent Posts Section */}
      {recentPosts && recentPosts.length > 0 && (
        <div className="navigation-section mb-4">
          <h5 className="navigation-title">Recent Posts</h5>
          <div className="list-group list-group-flush">
            {recentPosts.map(post => (
              <a
                key={post.id}
                href="#"
                className="list-group-item list-group-item-action"
                onClick={(e) => handleRecentPostClick(post.id, e)}
              >
                <div className="d-flex w-100 justify-content-between">
                  <p className="mb-1 small">{post.title}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Archive Section */}
      {showArchive && (
        <div className="navigation-section mb-4">
          <h5 className="navigation-title">Archive</h5>
          <div className="list-group list-group-flush">
            <a href="#" className="list-group-item list-group-item-action">
              December 2024
            </a>
            <a href="#" className="list-group-item list-group-item-action">
              November 2024
            </a>
            <a href="#" className="list-group-item list-group-item-action">
              October 2024
            </a>
            <a href="#" className="list-group-item list-group-item-action">
              September 2024
            </a>
          </div>
        </div>
      )}

      {/* Quick Links Section */}
      <div className="navigation-section">
        <h5 className="navigation-title">Quick Links</h5>
        <div className="list-group list-group-flush">
          <a href="#" className="list-group-item list-group-item-action">
            <i className="bi bi-calculator me-2"></i>
            Tax Calculator
          </a>
          <a href="#" className="list-group-item list-group-item-action">
            <i className="bi bi-question-circle me-2"></i>
            Help & Support
          </a>
          <a href="#" className="list-group-item list-group-item-action">
            <i className="bi bi-info-circle me-2"></i>
            About
          </a>
          <a href="#" className="list-group-item list-group-item-action">
            <i className="bi bi-envelope me-2"></i>
            Contact
          </a>
        </div>
      </div>
    </nav>
  );
};

export default BlogNavigation;