import React from 'react';
import { renderWithProviders } from '../../__tests__/utils/test-utils';
import userEvent from '@testing-library/user-event';
import { Card } from './Card';

// Test utils
describe('Test Utils', () => {
  it('should export render function', () => {
    expect(renderWithProviders).toBeDefined();
  });

  it('should export userEvent', () => {
    expect(userEvent).toBeDefined();
  });
});

describe('Card Component', () => {
  describe('Basic Rendering', () => {
    it('renders card with basic content', () => {
      const { getByText } = renderWithProviders(<Card>Test content</Card>);
      
      const card = getByText('Test content');
      expect(card).toBeInTheDocument();
      expect(card.closest('.card')).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      const { getByText } = renderWithProviders(<Card className="custom-class">Content</Card>);
      
      const card = getByText('Content').closest('.card');
      expect(card).toHaveClass('custom-class');
    });

    it('renders with data-testid', () => {
      const { getByTestId } = renderWithProviders(<Card data-testid="test-card">Content</Card>);
      
      expect(getByTestId('test-card')).toBeInTheDocument();
    });

    it('renders empty card gracefully', () => {
      const { container } = renderWithProviders(<Card />);
      
      const card = container.querySelector('.card');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Card Structure', () => {
    it('renders card with title in header', () => {
      const { getByText } = renderWithProviders(<Card title="Test Title">Content</Card>);
      
      expect(getByText('Test Title')).toBeInTheDocument();
      expect(getByText('Test Title').closest('.card-header')).toBeInTheDocument();
    });

    it('renders card with subtitle', () => {
      const { getByText } = renderWithProviders(<Card title="Title" subtitle="Test Subtitle">Content</Card>);
      
      expect(getByText('Test Subtitle')).toBeInTheDocument();
      expect(getByText('Test Subtitle')).toHaveClass('card-subtitle');
    });

    it('renders card with footer content', () => {
      const footerContent = <div data-testid="custom-footer">Footer Content</div>;
      const { getByTestId } = renderWithProviders(<Card footer={footerContent}>Content</Card>);
      
      expect(getByTestId('custom-footer')).toBeInTheDocument();
      expect(getByTestId('custom-footer').closest('.card-footer')).toBeInTheDocument();
    });

    it('renders card body with content', () => {
      const { getByText } = renderWithProviders(<Card>Body content</Card>);
      
      const bodyContent = getByText('Body content');
      expect(bodyContent.closest('.card-body')).toBeInTheDocument();
    });
  });

  describe('Card Image', () => {
    it('renders card with image', () => {
      const { getByAltText } = renderWithProviders(
        <Card image="/test-image.jpg" imageAlt="Test image">
          Content
        </Card>
      );
      
      const image = getByAltText('Test image');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', '/test-image.jpg');
      expect(image).toHaveClass('card-img-top');
    });

    it('renders card without image when not provided', () => {
      const { queryByRole } = renderWithProviders(<Card>Content</Card>);
      
      expect(queryByRole('img')).not.toBeInTheDocument();
    });
  });

  describe('Bootstrap Styling', () => {
    it('applies default card styling', () => {
      const { getByText } = renderWithProviders(<Card>Content</Card>);
      
      const card = getByText('Content').closest('.card');
      expect(card).toHaveClass('card');
    });

    it('applies bordered styling when enabled', () => {
      const { getByText } = renderWithProviders(<Card bordered>Content</Card>);
      
      const card = getByText('Content').closest('.card');
      expect(card).toHaveClass('border');
    });

    it('applies hover effect when enabled', () => {
      const { getByText } = renderWithProviders(<Card hoverable>Content</Card>);
      
      const card = getByText('Content').closest('.card');
      expect(card).toHaveClass('card-hoverable');
    });

    it('applies variant styling correctly', () => {
      const { getByText } = renderWithProviders(<Card variant="success">Content</Card>);
      
      const card = getByText('Content').closest('.card');
      expect(card).toHaveClass('border-success');
    });

    it('applies centered content styling when enabled', () => {
      const { getByText } = renderWithProviders(<Card centered>Content</Card>);
      
      const cardBody = getByText('Content').closest('.card-body');
      expect(cardBody).toHaveClass('text-center');
    });
  });

  describe('Card Actions', () => {
    it('renders card with actions in footer', () => {
      const actions = (
        <div data-testid="card-actions">
          <button>Action 1</button>
          <button>Action 2</button>
        </div>
      );
      
      const { getByTestId } = renderWithProviders(<Card actions={actions}>Content</Card>);
      
      expect(getByTestId('card-actions')).toBeInTheDocument();
      expect(getByTestId('card-actions').closest('.card-footer')).toBeInTheDocument();
    });

    it('renders card without actions section when not provided', () => {
      const { container } = renderWithProviders(<Card>Content</Card>);
      
      expect(container.querySelector('.card-footer')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper card structure for screen readers', () => {
      const { container } = renderWithProviders(
        <Card title="Card Title">
          Card content
        </Card>
      );
      
      const card = container.querySelector('.card');
      const header = container.querySelector('.card-header');
      const body = container.querySelector('.card-body');
      
      expect(card).toBeInTheDocument();
      expect(header).toBeInTheDocument();
      expect(body).toBeInTheDocument();
    });

    it('supports ARIA attributes', () => {
      const { getByLabelText } = renderWithProviders(
        <Card aria-label="Test card" role="region">
          Content
        </Card>
      );
      
      const card = getByLabelText('Test card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveAttribute('role', 'region');
    });

    it('has proper heading structure when title provided', () => {
      const { getByText } = renderWithProviders(<Card title="Card Title">Content</Card>);
      
      const title = getByText('Card Title');
      expect(title.tagName).toBe('H5'); // Bootstrap card-title default
      expect(title).toHaveClass('card-title');
    });
  });

  describe('Edge Cases', () => {
    it('handles null children gracefully', () => {
      const { getByText, container } = renderWithProviders(<Card title="Empty Card">{null}</Card>);
      
      expect(getByText('Empty Card')).toBeInTheDocument();
      const cardBody = container.querySelector('.card-body');
      expect(cardBody).toBeInTheDocument();
    });

    it('forwards HTML attributes correctly', () => {
      const { container } = renderWithProviders(
        <Card 
          id="test-card" 
          role="article"
          aria-labelledby="card-title"
        >
          Content
        </Card>
      );
      
      const card = container.querySelector('#test-card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveAttribute('role', 'article');
      expect(card).toHaveAttribute('aria-labelledby', 'card-title');
    });

    it('renders financial data card example', () => {
      const { getByText } = renderWithProviders(
        <Card
          title="Portfolio Summary"
          variant="success"
          bordered
          hoverable
          footer={<small className="text-muted">Last updated: 2 minutes ago</small>}
        >
          <div>
            <p className="mb-2">Total Value: £12,345.67</p>
            <p className="mb-0 text-success">Gain: +£2,345.67 (+23.45%)</p>
          </div>
        </Card>
      );
      
      expect(getByText('Portfolio Summary')).toBeInTheDocument();
      expect(getByText('Total Value: £12,345.67')).toBeInTheDocument();
      expect(getByText('Gain: +£2,345.67 (+23.45%)')).toBeInTheDocument();
      expect(getByText('Last updated: 2 minutes ago')).toBeInTheDocument();
      
      const card = getByText('Portfolio Summary').closest('.card');
      expect(card).toHaveClass('border-success', 'card-hoverable');
    });
  });
});