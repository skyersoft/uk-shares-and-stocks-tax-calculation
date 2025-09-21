import React from 'react';
import { renderWithProviders } from '../../__tests__/utils/test-utils';
import userEvent from '@testing-library/user-event';
import { Tabs } from './Tabs';

// Test utils
describe('Test Utils', () => {
  it('should export render function', () => {
    expect(renderWithProviders).toBeDefined();
  });

  it('should export userEvent', () => {
    expect(userEvent).toBeDefined();
  });
});

describe('Tabs Component', () => {
  const mockItems = [
    {
      id: 'tab1',
      label: 'First Tab',
      content: 'First tab content'
    },
    {
      id: 'tab2',
      label: 'Second Tab',
      content: 'Second tab content'
    },
    {
      id: 'tab3',
      label: 'Third Tab',
      content: 'Third tab content',
      disabled: true
    }
  ];

  describe('Basic Rendering', () => {
    it('renders tabs with items', () => {
      const { getByText } = renderWithProviders(<Tabs items={mockItems} />);
      
      expect(getByText('First Tab')).toBeInTheDocument();
      expect(getByText('Second Tab')).toBeInTheDocument();
      expect(getByText('Third Tab')).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      const { container } = renderWithProviders(
        <Tabs items={mockItems} className="custom-tabs" />
      );
      
      const tabs = container.querySelector('.nav-tabs');
      expect(tabs?.closest('.tabs-container')).toHaveClass('custom-tabs');
    });

    it('renders with data-testid', () => {
      const { getByTestId } = renderWithProviders(
        <Tabs items={mockItems} data-testid="test-tabs" />
      );
      
      expect(getByTestId('test-tabs')).toBeInTheDocument();
    });

    it('renders empty tabs gracefully', () => {
      const { container } = renderWithProviders(<Tabs items={[]} />);
      
      const tabList = container.querySelector('.nav');
      expect(tabList).toBeInTheDocument();
      expect(tabList?.children).toHaveLength(0);
    });
  });

  describe('Bootstrap Styling', () => {
    it('applies default tabs styling', () => {
      const { container } = renderWithProviders(<Tabs items={mockItems} />);
      
      const tabList = container.querySelector('.nav');
      expect(tabList).toHaveClass('nav-tabs');
    });

    it('applies pills variant when selected', () => {
      const { container } = renderWithProviders(
        <Tabs items={mockItems} variant="pills" />
      );
      
      const tabList = container.querySelector('.nav');
      expect(tabList).toHaveClass('nav-pills');
    });

    it('applies underline variant when selected', () => {
      const { container } = renderWithProviders(
        <Tabs items={mockItems} variant="underline" />
      );
      
      const tabList = container.querySelector('.nav');
      expect(tabList).toHaveClass('nav-underline');
    });

    it('applies justified styling when enabled', () => {
      const { container } = renderWithProviders(
        <Tabs items={mockItems} justified />
      );
      
      const tabList = container.querySelector('.nav');
      expect(tabList).toHaveClass('nav-justified');
    });

    it('applies vertical styling when enabled', () => {
      const { container } = renderWithProviders(
        <Tabs items={mockItems} vertical />
      );
      
      const tabsContainer = container.querySelector('.tabs-container');
      expect(tabsContainer).toHaveClass('flex-column');
      
      const tabList = container.querySelector('.nav');
      expect(tabList).toHaveClass('flex-column');
    });

    it('renders tab items with correct Bootstrap structure', () => {
      const { container } = renderWithProviders(<Tabs items={mockItems} />);
      
      const tabLinks = container.querySelectorAll('.nav-link');
      expect(tabLinks).toHaveLength(3);
      
      tabLinks.forEach(link => {
        expect(link.closest('.nav-item')).toBeInTheDocument();
      });
    });
  });

  describe('Tab Navigation', () => {
    it('shows first tab as active by default', () => {
      const { getByText, container } = renderWithProviders(<Tabs items={mockItems} />);
      
      const firstTab = getByText('First Tab').closest('.nav-link');
      expect(firstTab).toHaveClass('active');
      
      const firstContent = container.querySelector('.tab-content [data-tab-id="tab1"]');
      expect(firstContent).toHaveClass('show', 'active');
      expect(getByText('First tab content')).toBeVisible();
    });

    it('switches to clicked tab', async () => {
      const user = userEvent.setup();
      const { getByText, container } = renderWithProviders(<Tabs items={mockItems} />);
      
      await user.click(getByText('Second Tab'));
      
      const secondTab = getByText('Second Tab').closest('.nav-link');
      const firstTab = getByText('First Tab').closest('.nav-link');
      
      expect(secondTab).toHaveClass('active');
      expect(firstTab).not.toHaveClass('active');
      
      const secondContent = container.querySelector('.tab-content [data-tab-id="tab2"]');
      const firstContent = container.querySelector('.tab-content [data-tab-id="tab1"]');
      
      expect(secondContent).toHaveClass('show', 'active');
      expect(firstContent).not.toHaveClass('show', 'active');
      expect(getByText('Second tab content')).toBeVisible();
    });

    it('does not respond to clicks on disabled tabs', async () => {
      const user = userEvent.setup();
      const { getByText, container } = renderWithProviders(<Tabs items={mockItems} />);
      
      const disabledTab = getByText('Third Tab').closest('.nav-link');
      await user.click(disabledTab!);
      
      expect(disabledTab).not.toHaveClass('active');
      
      const thirdContent = container.querySelector('.tab-content [data-tab-id="tab3"]');
      expect(thirdContent).not.toHaveClass('show', 'active');
    });

    it('marks disabled tabs correctly', () => {
      const { getByText } = renderWithProviders(<Tabs items={mockItems} />);
      
      const disabledTab = getByText('Third Tab').closest('.nav-link');
      expect(disabledTab).toHaveClass('disabled');
      expect(disabledTab).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('Controlled Mode', () => {
    it('respects controlled active tab', () => {
      const { getByText, container } = renderWithProviders(
        <Tabs items={mockItems} activeTab="tab2" />
      );
      
      const secondTab = getByText('Second Tab').closest('.nav-link');
      expect(secondTab).toHaveClass('active');
      
      const secondContent = container.querySelector('.tab-content [data-tab-id="tab2"]');
      expect(secondContent).toHaveClass('show', 'active');
      expect(getByText('Second tab content')).toBeVisible();
    });

    it('calls onTabChange when tab is clicked', async () => {
      const user = userEvent.setup();
      const onTabChange = jest.fn();
      const { getByText } = renderWithProviders(
        <Tabs items={mockItems} onTabChange={onTabChange} />
      );
      
      await user.click(getByText('Second Tab'));
      
      expect(onTabChange).toHaveBeenCalledWith('tab2');
    });

    it('does not call onTabChange for disabled tabs', async () => {
      const user = userEvent.setup();
      const onTabChange = jest.fn();
      const { getByText } = renderWithProviders(
        <Tabs items={mockItems} onTabChange={onTabChange} />
      );
      
      await user.click(getByText('Third Tab'));
      
      expect(onTabChange).not.toHaveBeenCalled();
    });
  });

  describe('Default Active Tab', () => {
    it('uses defaultActiveTab when specified', () => {
      const { getByText, container } = renderWithProviders(
        <Tabs items={mockItems} defaultActiveTab="tab2" />
      );
      
      const secondTab = getByText('Second Tab').closest('.nav-link');
      expect(secondTab).toHaveClass('active');
      
      const secondContent = container.querySelector('.tab-content [data-tab-id="tab2"]');
      expect(secondContent).toHaveClass('show', 'active');
    });

    it('ignores disabled tab in defaultActiveTab', () => {
      const { getByText, container } = renderWithProviders(
        <Tabs items={mockItems} defaultActiveTab="tab3" />
      );
      
      // Should fall back to first non-disabled tab
      const firstTab = getByText('First Tab').closest('.nav-link');
      expect(firstTab).toHaveClass('active');
      
      const firstContent = container.querySelector('.tab-content [data-tab-id="tab1"]');
      expect(firstContent).toHaveClass('show', 'active');
    });

    it('falls back to first tab when defaultActiveTab is invalid', () => {
      const { getByText, container } = renderWithProviders(
        <Tabs items={mockItems} defaultActiveTab="nonexistent" />
      );
      
      const firstTab = getByText('First Tab').closest('.nav-link');
      expect(firstTab).toHaveClass('active');
      
      const firstContent = container.querySelector('.tab-content [data-tab-id="tab1"]');
      expect(firstContent).toHaveClass('show', 'active');
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports keyboard navigation with Enter key', async () => {
      const user = userEvent.setup();
      const { getByText, container } = renderWithProviders(<Tabs items={mockItems} />);
      
      const secondTab = getByText('Second Tab').closest('.nav-link');
      secondTab?.focus();
      await user.keyboard('{Enter}');
      
      expect(secondTab).toHaveClass('active');
      
      const secondContent = container.querySelector('.tab-content [data-tab-id="tab2"]');
      expect(secondContent).toHaveClass('show', 'active');
    });

    it('supports keyboard navigation with Space key', async () => {
      const user = userEvent.setup();
      const { getByText, container } = renderWithProviders(<Tabs items={mockItems} />);
      
      const secondTab = getByText('Second Tab').closest('.nav-link');
      secondTab?.focus();
      await user.keyboard(' ');
      
      expect(secondTab).toHaveClass('active');
      
      const secondContent = container.querySelector('.tab-content [data-tab-id="tab2"]');
      expect(secondContent).toHaveClass('show', 'active');
    });

    it('supports arrow key navigation', async () => {
      const user = userEvent.setup();
      const { getByText } = renderWithProviders(<Tabs items={mockItems} />);
      
      const firstTab = getByText('First Tab').closest('.nav-link');
      const secondTab = getByText('Second Tab').closest('.nav-link');
      
      firstTab?.focus();
      expect(firstTab).toHaveFocus();
      
      await user.keyboard('{ArrowRight}');
      expect(secondTab).toHaveFocus();
      
      await user.keyboard('{ArrowLeft}');
      expect(firstTab).toHaveFocus();
    });

    it('skips disabled tabs in arrow key navigation', async () => {
      const user = userEvent.setup();
      const { getByText } = renderWithProviders(<Tabs items={mockItems} />);
      
      const secondTab = getByText('Second Tab').closest('.nav-link');
      const firstTab = getByText('First Tab').closest('.nav-link');
      
      secondTab?.focus();
      await user.keyboard('{ArrowRight}'); // Should skip disabled third tab
      expect(firstTab).toHaveFocus(); // Should wrap to first tab
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes on tab buttons', () => {
      const { getByText, container } = renderWithProviders(<Tabs items={mockItems} />);
      
      const firstTab = getByText('First Tab').closest('.nav-link');
      expect(firstTab).toHaveAttribute('role', 'tab');
      expect(firstTab).toHaveAttribute('aria-selected', 'true');
      expect(firstTab).toHaveAttribute('aria-controls');
      
      const secondTab = getByText('Second Tab').closest('.nav-link');
      expect(secondTab).toHaveAttribute('aria-selected', 'false');
    });

    it('updates ARIA attributes when tab is changed', async () => {
      const user = userEvent.setup();
      const { getByText } = renderWithProviders(<Tabs items={mockItems} />);
      
      const firstTab = getByText('First Tab').closest('.nav-link');
      const secondTab = getByText('Second Tab').closest('.nav-link');
      
      await user.click(secondTab!);
      
      expect(firstTab).toHaveAttribute('aria-selected', 'false');
      expect(secondTab).toHaveAttribute('aria-selected', 'true');
    });

    it('has proper tab list role', () => {
      const { container } = renderWithProviders(<Tabs items={mockItems} />);
      
      const tabList = container.querySelector('.nav');
      expect(tabList).toHaveAttribute('role', 'tablist');
    });

    it('has proper tab panel attributes', () => {
      const { container } = renderWithProviders(<Tabs items={mockItems} />);
      
      const tabPanels = container.querySelectorAll('.tab-pane');
      tabPanels.forEach(panel => {
        expect(panel).toHaveAttribute('role', 'tabpanel');
        expect(panel).toHaveAttribute('aria-labelledby');
      });
    });

    it('properly associates tabs with panels via IDs', () => {
      const { getByText, container } = renderWithProviders(<Tabs items={mockItems} />);
      
      const firstTab = getByText('First Tab').closest('.nav-link');
      const firstPanel = container.querySelector('.tab-content [data-tab-id="tab1"]');
      
      const controlsId = firstTab?.getAttribute('aria-controls');
      expect(firstPanel).toHaveAttribute('id', controlsId);
      
      const labelledById = firstPanel?.getAttribute('aria-labelledby');
      expect(firstTab).toHaveAttribute('id', labelledById);
    });
  });

  describe('Fade Animation', () => {
    it('applies fade classes when fade is enabled', () => {
      const { container } = renderWithProviders(
        <Tabs items={mockItems} fade />
      );
      
      const tabPanes = container.querySelectorAll('.tab-pane');
      tabPanes.forEach(pane => {
        expect(pane).toHaveClass('fade');
      });
      
      const activePane = container.querySelector('.tab-pane.active');
      expect(activePane).toHaveClass('show');
    });

    it('does not apply fade classes when fade is disabled', () => {
      const { container } = renderWithProviders(
        <Tabs items={mockItems} fade={false} />
      );
      
      const tabPanes = container.querySelectorAll('.tab-pane');
      tabPanes.forEach(pane => {
        expect(pane).not.toHaveClass('fade');
      });
    });
  });

  describe('Lazy Loading', () => {
    it('renders all content by default', () => {
      const { getByText } = renderWithProviders(<Tabs items={mockItems} />);
      
      // All content should be in DOM even if not visible
      expect(getByText('First tab content')).toBeInTheDocument();
      expect(getByText('Second tab content')).toBeInTheDocument();
      expect(getByText('Third tab content')).toBeInTheDocument();
    });

    it('only renders active tab content when lazy is enabled', async () => {
      const user = userEvent.setup();
      const { getByText, queryByText } = renderWithProviders(
        <Tabs items={mockItems} lazy />
      );
      
      // Only first tab content should be rendered initially
      expect(getByText('First tab content')).toBeInTheDocument();
      expect(queryByText('Second tab content')).not.toBeInTheDocument();
      
      // After clicking second tab, both should be rendered
      await user.click(getByText('Second Tab'));
      expect(getByText('First tab content')).toBeInTheDocument();
      expect(getByText('Second tab content')).toBeInTheDocument();
      expect(queryByText('Third tab content')).not.toBeInTheDocument();
    });
  });

  describe('Complex Content', () => {
    it('renders complex tab labels', () => {
      const complexItems = [
        {
          id: 'complex1',
          label: (
            <span>
              <i className="icon-home"></i>
              <strong>Home</strong>
            </span>
          ),
          content: 'Complex content'
        }
      ];
      
      const { getByText } = renderWithProviders(<Tabs items={complexItems} />);
      
      expect(getByText('Home')).toBeInTheDocument();
      expect(getByText('Complex content')).toBeInTheDocument();
    });

    it('renders complex tab content', async () => {
      const user = userEvent.setup();
      const complexItems = [
        {
          id: 'complex1',
          label: 'Rich Content',
          content: (
            <div>
              <h3>Tab Content</h3>
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
      
      const { getByText } = renderWithProviders(<Tabs items={complexItems} />);
      
      expect(getByText('Tab Content')).toBeVisible();
      expect(getByText('This is a paragraph.')).toBeVisible();
      expect(getByText('List item 1')).toBeVisible();
      expect(getByText('Action Button')).toBeVisible();
    });
  });

  describe('Edge Cases', () => {
    it('handles tabs with duplicate IDs gracefully', () => {
      const duplicateItems = [
        { id: 'duplicate', label: 'First', content: 'First content' },
        { id: 'duplicate', label: 'Second', content: 'Second content' }
      ];
      
      const { getByText } = renderWithProviders(<Tabs items={duplicateItems} />);
      
      // Should render both tabs
      expect(getByText('First')).toBeInTheDocument();
      expect(getByText('Second')).toBeInTheDocument();
    });

    it('handles null/undefined content gracefully', () => {
      const nullContentItems = [
        { id: 'null1', label: 'Null Content', content: null },
        { id: 'undefined1', label: 'Undefined Content', content: undefined }
      ];
      
      const { getByText } = renderWithProviders(<Tabs items={nullContentItems} />);
      
      expect(getByText('Null Content')).toBeInTheDocument();
      expect(getByText('Undefined Content')).toBeInTheDocument();
    });

    it('forwards HTML attributes correctly', () => {
      const { container } = renderWithProviders(
        <Tabs 
          items={mockItems}
          id="custom-tabs"
          role="presentation"
          aria-label="Navigation Tabs"
        />
      );
      
      const tabsContainer = container.querySelector('#custom-tabs');
      expect(tabsContainer).toBeInTheDocument();
      expect(tabsContainer).toHaveAttribute('role', 'presentation');
      expect(tabsContainer).toHaveAttribute('aria-label', 'Navigation Tabs');
    });

    it('renders tax calculation example with real-world content', async () => {
      const user = userEvent.setup();
      const taxItems = [
        {
          id: 'holdings',
          label: 'Holdings',
          content: 'Current stock holdings and positions'
        },
        {
          id: 'dividends',
          label: 'Dividends',
          content: 'Dividend income and tax calculations'
        },
        {
          id: 'disposals',
          label: 'Disposals',
          content: 'Capital gains and losses from stock sales'
        }
      ];
      
      const { getByText } = renderWithProviders(
        <Tabs items={taxItems} variant="pills" justified />
      );
      
      expect(getByText('Holdings')).toBeInTheDocument();
      expect(getByText('Current stock holdings and positions')).toBeVisible();
      
      await user.click(getByText('Disposals'));
      expect(getByText('Capital gains and losses from stock sales')).toBeVisible();
    });
  });
});