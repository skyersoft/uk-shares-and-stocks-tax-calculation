import React from 'react';
import { renderWithProviders } from '../../__tests__/utils/test-utils';
import userEvent from '@testing-library/user-event';
import { Accordion } from './Accordion';

// Test utils
describe('Test Utils', () => {
  it('should export render function', () => {
    expect(renderWithProviders).toBeDefined();
  });

  it('should export userEvent', () => {
    expect(userEvent).toBeDefined();
  });
});

describe('Accordion Component', () => {
  const mockItems = [
    {
      id: 'item1',
      header: 'First Item',
      content: 'First item content'
    },
    {
      id: 'item2', 
      header: 'Second Item',
      content: 'Second item content'
    },
    {
      id: 'item3',
      header: 'Third Item',
      content: 'Third item content',
      disabled: true
    }
  ];

  describe('Basic Rendering', () => {
    it('renders accordion with items', () => {
      const { getByText } = renderWithProviders(<Accordion items={mockItems} />);
      
      expect(getByText('First Item')).toBeInTheDocument();
      expect(getByText('Second Item')).toBeInTheDocument();
      expect(getByText('Third Item')).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      const { container } = renderWithProviders(
        <Accordion items={mockItems} className="custom-accordion" />
      );
      
      const accordion = container.querySelector('.accordion');
      expect(accordion).toHaveClass('custom-accordion');
    });

    it('renders with data-testid', () => {
      const { getByTestId } = renderWithProviders(
        <Accordion items={mockItems} data-testid="test-accordion" />
      );
      
      expect(getByTestId('test-accordion')).toBeInTheDocument();
    });

    it('renders empty accordion gracefully', () => {
      const { container } = renderWithProviders(<Accordion items={[]} />);
      
      const accordion = container.querySelector('.accordion');
      expect(accordion).toBeInTheDocument();
      expect(accordion?.children).toHaveLength(0);
    });
  });

  describe('Bootstrap Styling', () => {
    it('applies default accordion styling', () => {
      const { container } = renderWithProviders(<Accordion items={mockItems} />);
      
      const accordion = container.querySelector('.accordion');
      expect(accordion).toHaveClass('accordion');
    });

    it('applies bordered styling when enabled', () => {
      const { container } = renderWithProviders(
        <Accordion items={mockItems} bordered />
      );
      
      const accordion = container.querySelector('.accordion');
      expect(accordion).toHaveClass('accordion-bordered');
    });

    it('applies flush styling when enabled', () => {
      const { container } = renderWithProviders(
        <Accordion items={mockItems} flush />
      );
      
      const accordion = container.querySelector('.accordion');
      expect(accordion).toHaveClass('accordion-flush');
    });

    it('renders accordion items with correct Bootstrap structure', () => {
      const { container } = renderWithProviders(<Accordion items={mockItems} />);
      
      const items = container.querySelectorAll('.accordion-item');
      expect(items).toHaveLength(3);
      
      items.forEach(item => {
        expect(item.querySelector('.accordion-header')).toBeInTheDocument();
        expect(item.querySelector('.accordion-button')).toBeInTheDocument();
        expect(item.querySelector('.accordion-collapse')).toBeInTheDocument();
        expect(item.querySelector('.accordion-body')).toBeInTheDocument();
      });
    });
  });

  describe('Accordion Interaction', () => {
    it('expands item when header is clicked', async () => {
      const user = userEvent.setup();
      const { getByText, container } = renderWithProviders(<Accordion items={mockItems} />);
      
      const firstHeader = getByText('First Item');
      await user.click(firstHeader);
      
      const firstCollapse = container.querySelector('[data-item-id="item1"] .accordion-collapse');
      expect(firstCollapse).toHaveClass('show');
      expect(getByText('First item content')).toBeVisible();
    });

    it('collapses expanded item when header is clicked again', async () => {
      const user = userEvent.setup();
      const { getByText, container } = renderWithProviders(
        <Accordion items={mockItems} defaultExpanded={['item1']} />
      );
      
      const firstHeader = getByText('First Item');
      await user.click(firstHeader);
      
      const firstCollapse = container.querySelector('[data-item-id="item1"] .accordion-collapse');
      expect(firstCollapse).not.toHaveClass('show');
    });

    it('allows multiple items to be expanded when allowMultiple is true', async () => {
      const user = userEvent.setup();
      const { getByText, container } = renderWithProviders(
        <Accordion items={mockItems} allowMultiple />
      );
      
      await user.click(getByText('First Item'));
      await user.click(getByText('Second Item'));
      
      const firstCollapse = container.querySelector('[data-item-id="item1"] .accordion-collapse');
      const secondCollapse = container.querySelector('[data-item-id="item2"] .accordion-collapse');
      
      expect(firstCollapse).toHaveClass('show');
      expect(secondCollapse).toHaveClass('show');
    });

    it('collapses other items when allowMultiple is false (default)', async () => {
      const user = userEvent.setup();
      const { getByText, container } = renderWithProviders(<Accordion items={mockItems} />);
      
      await user.click(getByText('First Item'));
      await user.click(getByText('Second Item'));
      
      const firstCollapse = container.querySelector('[data-item-id="item1"] .accordion-collapse');
      const secondCollapse = container.querySelector('[data-item-id="item2"] .accordion-collapse');
      
      expect(firstCollapse).not.toHaveClass('show');
      expect(secondCollapse).toHaveClass('show');
    });

    it('does not respond to clicks on disabled items', async () => {
      const user = userEvent.setup();
      const { getByText, container } = renderWithProviders(<Accordion items={mockItems} />);
      
      const disabledHeader = getByText('Third Item');
      await user.click(disabledHeader);
      
      const thirdCollapse = container.querySelector('[data-item-id="item3"] .accordion-collapse');
      expect(thirdCollapse).not.toHaveClass('show');
    });
  });

  describe('Controlled Mode', () => {
    it('respects controlled expanded state', () => {
      const { container } = renderWithProviders(
        <Accordion items={mockItems} expanded={['item1', 'item2']} />
      );
      
      const firstCollapse = container.querySelector('[data-item-id="item1"] .accordion-collapse');
      const secondCollapse = container.querySelector('[data-item-id="item2"] .accordion-collapse');
      const thirdCollapse = container.querySelector('[data-item-id="item3"] .accordion-collapse');
      
      expect(firstCollapse).toHaveClass('show');
      expect(secondCollapse).toHaveClass('show');
      expect(thirdCollapse).not.toHaveClass('show');
    });

    it('calls onToggle when item is clicked', async () => {
      const user = userEvent.setup();
      const onToggle = jest.fn();
      const { getByText } = renderWithProviders(
        <Accordion items={mockItems} onToggle={onToggle} />
      );
      
      await user.click(getByText('First Item'));
      
      expect(onToggle).toHaveBeenCalledWith('item1', true);
    });

    it('calls onToggle with false when expanded item is clicked', async () => {
      const user = userEvent.setup();
      const onToggle = jest.fn();
      const { getByText } = renderWithProviders(
        <Accordion items={mockItems} expanded={['item1']} onToggle={onToggle} />
      );
      
      await user.click(getByText('First Item'));
      
      expect(onToggle).toHaveBeenCalledWith('item1', false);
    });
  });

  describe('Default Expanded State', () => {
    it('expands items specified in defaultExpanded', () => {
      const { container, getByText } = renderWithProviders(
        <Accordion items={mockItems} defaultExpanded={['item1', 'item2']} />
      );
      
      const firstCollapse = container.querySelector('[data-item-id="item1"] .accordion-collapse');
      const secondCollapse = container.querySelector('[data-item-id="item2"] .accordion-collapse');
      
      expect(firstCollapse).toHaveClass('show');
      expect(secondCollapse).toHaveClass('show');
      expect(getByText('First item content')).toBeVisible();
      expect(getByText('Second item content')).toBeVisible();
    });

    it('ignores disabled items in defaultExpanded', () => {
      const { container } = renderWithProviders(
        <Accordion items={mockItems} defaultExpanded={['item3']} />
      );
      
      const thirdCollapse = container.querySelector('[data-item-id="item3"] .accordion-collapse');
      expect(thirdCollapse).not.toHaveClass('show');
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports keyboard navigation with Enter key', async () => {
      const user = userEvent.setup();
      const { getByText, container } = renderWithProviders(<Accordion items={mockItems} />);
      
      const firstButton = getByText('First Item').closest('.accordion-button');
      firstButton?.focus();
      await user.keyboard('{Enter}');
      
      const firstCollapse = container.querySelector('[data-item-id="item1"] .accordion-collapse');
      expect(firstCollapse).toHaveClass('show');
    });

    it('supports keyboard navigation with Space key', async () => {
      const user = userEvent.setup();
      const { getByText, container } = renderWithProviders(<Accordion items={mockItems} />);
      
      const firstButton = getByText('First Item').closest('.accordion-button');
      firstButton?.focus();
      await user.keyboard(' ');
      
      const firstCollapse = container.querySelector('[data-item-id="item1"] .accordion-collapse');
      expect(firstCollapse).toHaveClass('show');
    });

    it('allows tab navigation between accordion items', async () => {
      const user = userEvent.setup();
      const { getByText } = renderWithProviders(<Accordion items={mockItems} />);
      
      const firstButton = getByText('First Item').closest('.accordion-button');
      const secondButton = getByText('Second Item').closest('.accordion-button');
      
      firstButton?.focus();
      expect(firstButton).toHaveFocus();
      
      await user.tab();
      expect(secondButton).toHaveFocus();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes on accordion buttons', () => {
      const { getByText } = renderWithProviders(<Accordion items={mockItems} />);
      
      const firstButton = getByText('First Item').closest('.accordion-button');
      expect(firstButton).toHaveAttribute('aria-expanded', 'false');
      expect(firstButton).toHaveAttribute('aria-controls');
    });

    it('updates ARIA attributes when item is expanded', async () => {
      const user = userEvent.setup();
      const { getByText } = renderWithProviders(<Accordion items={mockItems} />);
      
      const firstButton = getByText('First Item').closest('.accordion-button');
      await user.click(firstButton!);
      
      expect(firstButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('marks disabled items as disabled', () => {
      const { getByText } = renderWithProviders(<Accordion items={mockItems} />);
      
      const disabledButton = getByText('Third Item').closest('.accordion-button');
      expect(disabledButton).toHaveAttribute('disabled');
      expect(disabledButton).toHaveAttribute('aria-disabled', 'true');
    });

    it('has correct heading structure', () => {
      const { container } = renderWithProviders(<Accordion items={mockItems} />);
      
      const headers = container.querySelectorAll('.accordion-header');
      headers.forEach(header => {
        expect(header.tagName).toBe('H2'); // Bootstrap default
      });
    });

    it('properly associates content with headers via IDs', () => {
      const { getByText, container } = renderWithProviders(<Accordion items={mockItems} />);
      
      const firstButton = getByText('First Item').closest('.accordion-button');
      const firstCollapse = container.querySelector('[data-item-id="item1"] .accordion-collapse');
      
      const controlsId = firstButton?.getAttribute('aria-controls');
      expect(firstCollapse).toHaveAttribute('id', controlsId);
    });
  });

  describe('Complex Content', () => {
    it('renders complex header content', () => {
      const complexItems = [
        {
          id: 'complex1',
          header: (
            <div>
              <strong>Complex Header</strong>
              <span className="text-muted ms-2">with subtitle</span>
            </div>
          ),
          content: 'Complex content'
        }
      ];
      
      const { getByText } = renderWithProviders(<Accordion items={complexItems} />);
      
      expect(getByText('Complex Header')).toBeInTheDocument();
      expect(getByText('with subtitle')).toBeInTheDocument();
    });

    it('renders complex body content', async () => {
      const user = userEvent.setup();
      const complexItems = [
        {
          id: 'complex1',
          header: 'FAQ Item',
          content: (
            <div>
              <p>This is a paragraph.</p>
              <ul>
                <li>List item 1</li>
                <li>List item 2</li>
              </ul>
              <button>Action Button</button>
            </div>
          )
        }
      ];
      
      const { getByText } = renderWithProviders(<Accordion items={complexItems} />);
      
      await user.click(getByText('FAQ Item'));
      
      expect(getByText('This is a paragraph.')).toBeVisible();
      expect(getByText('List item 1')).toBeVisible();
      expect(getByText('Action Button')).toBeVisible();
    });
  });

  describe('Edge Cases', () => {
    it('handles items with duplicate IDs gracefully', () => {
      const duplicateItems = [
        { id: 'duplicate', header: 'First', content: 'First content' },
        { id: 'duplicate', header: 'Second', content: 'Second content' }
      ];
      
      const { getByText } = renderWithProviders(<Accordion items={duplicateItems} />);
      
      // Should render both items
      expect(getByText('First')).toBeInTheDocument();
      expect(getByText('Second')).toBeInTheDocument();
    });

    it('handles null/undefined content gracefully', () => {
      const nullContentItems = [
        { id: 'null1', header: 'Null Content', content: null },
        { id: 'undefined1', header: 'Undefined Content', content: undefined }
      ];
      
      const { getByText } = renderWithProviders(<Accordion items={nullContentItems} />);
      
      expect(getByText('Null Content')).toBeInTheDocument();
      expect(getByText('Undefined Content')).toBeInTheDocument();
    });

    it('forwards HTML attributes correctly', () => {
      const { container } = renderWithProviders(
        <Accordion 
          items={mockItems}
          id="custom-accordion"
          role="tablist"
          aria-label="FAQ Accordion"
        />
      );
      
      const accordion = container.querySelector('#custom-accordion');
      expect(accordion).toBeInTheDocument();
      expect(accordion).toHaveAttribute('role', 'tablist');
      expect(accordion).toHaveAttribute('aria-label', 'FAQ Accordion');
    });

    it('renders FAQ example with real-world content', async () => {
      const user = userEvent.setup();
      const faqItems = [
        {
          id: 'faq1',
          header: 'What is Capital Gains Tax?',
          content: 'Capital Gains Tax is a tax on the profit when you sell something that has increased in value.'
        },
        {
          id: 'faq2',
          header: 'How do I calculate my tax liability?',
          content: 'Upload your trading data and our calculator will automatically compute your CGT liability using HMRC rules.'
        }
      ];
      
      const { getByText } = renderWithProviders(
        <Accordion items={faqItems} bordered flush />
      );
      
      expect(getByText('What is Capital Gains Tax?')).toBeInTheDocument();
      
      await user.click(getByText('What is Capital Gains Tax?'));
      expect(getByText('Capital Gains Tax is a tax on the profit when you sell something that has increased in value.')).toBeVisible();
    });
  });
});