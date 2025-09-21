import React from 'react';
import { CardProps } from '../../types';

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  subtitle,
  image,
  imageAlt = '',
  bordered = false,
  hoverable = false,
  variant = 'default',
  header,
  footer,
  actions,
  centered = false,
  ...props
}) => {
  const cardClasses = [
    'card',
    bordered && 'border',
    hoverable && 'card-hoverable',
    variant !== 'default' && `border-${variant}`,
    className
  ].filter(Boolean).join(' ');

  const bodyClasses = [
    'card-body',
    centered && 'text-center'
  ].filter(Boolean).join(' ');

  const hasHeader = title || header;
  const hasFooter = footer || actions;

  return (
    <div className={cardClasses} {...props}>
      {image && (
        <img src={image} alt={imageAlt} className="card-img-top" />
      )}
      
      {hasHeader && (
        <div className="card-header">
          {header || (
            <>
              {title && <h5 className="card-title">{title}</h5>}
              {subtitle && <h6 className="card-subtitle mb-2 text-muted">{subtitle}</h6>}
            </>
          )}
        </div>
      )}
      
      <div className={bodyClasses}>
        {children}
      </div>
      
      {hasFooter && (
        <div className="card-footer">
          {footer}
          {actions}
        </div>
      )}
    </div>
  );
};