import React from 'react';
import { Card } from '../ui/Card';

export interface BlogPostData {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  author?: string;
  publishedDate: string;
  tags?: string[];
  category?: string;
  readingTime?: number;
}

interface BlogPostProps {
  post: BlogPostData;
  className?: string;
}

export const BlogPost: React.FC<BlogPostProps> = ({ 
  post, 
  className = '' 
}) => {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <article className={`blog-post ${className}`}>
      <Card className="blog-post-card">
        {/* Header */}
        <div className="blog-post-header mb-4">
          <h1 className="blog-post-title h2 mb-3 text-primary">
            {post.title}
          </h1>
          
          {/* Meta information */}
          <div className="blog-post-meta d-flex flex-wrap align-items-center text-muted small mb-3">
            {post.author && (
              <span className="me-3">
                <i className="fas fa-user me-1"></i>
                {post.author}
              </span>
            )}
            <span className="me-3">
              <i className="fas fa-calendar me-1"></i>
              {formatDate(post.publishedDate)}
            </span>
            {post.readingTime && (
              <span className="me-3">
                <i className="fas fa-clock me-1"></i>
                {post.readingTime} min read
              </span>
            )}
            {post.category && (
              <span className="badge bg-primary">
                {post.category}
              </span>
            )}
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="blog-post-tags mb-3">
              {post.tags.map((tag) => (
                <span 
                  key={tag} 
                  className="badge bg-light text-dark me-2 mb-1"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="blog-post-content">
          {/* Simple content rendering - will be enhanced with MDX later */}
          <div 
            className="prose"
            dangerouslySetInnerHTML={{ 
              __html: post.content
                // Remove newlines that are immediately after opening block-level tags or before closing block-level tags
                .replace(/(<\/?(ul|ol|li|div|p|h[1-6]|blockquote|pre|table|tr|td|th|thead|tbody)>)\s*\n+\s*/gi, '$1')
                // Remove standalone newlines between closing and opening tags
                .replace(/>\s*\n+\s*</g, '><')
                // Only convert remaining standalone newlines (not near HTML tags) to <br />
                .replace(/([^>])\n([^<])/g, '$1<br />$2')
            }}
          />
        </div>
      </Card>
    </article>
  );
};

BlogPost.displayName = 'BlogPost';