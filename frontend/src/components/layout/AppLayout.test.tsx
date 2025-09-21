// Tests for AppLayout component following TDD principles
import React from 'react';
import { renderWithProviders, testAccessibility } from '../../__tests__/utils/test-utils';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppLayout from './AppLayout';
import type { AppLayoutProps } from '../../types/index';

describe('AppLayout', () => {
  const defaultProps = {
    children: <div data-testid="main-content">Test Content</div>
  };

  describe('Basic Rendering', () => {
    it('renders main content area', () => {
      renderWithProviders(<AppLayout {...defaultProps} />);
      
      expect(screen.getByTestId('main-content')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders navigation bar', () => {
      renderWithProviders(<AppLayout {...defaultProps} />);
      
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByLabelText(/main navigation/i)).toBeInTheDocument();
    });

    it('renders footer', () => {
      renderWithProviders(<AppLayout {...defaultProps} />);
      
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
      expect(screen.getByText(/© 2024 CGT Tax Calculator/i)).toBeInTheDocument();
    });

    it('has correct semantic structure', () => {
      renderWithProviders(<AppLayout {...defaultProps} />);
      
      // Check semantic HTML structure
      expect(screen.getByRole('banner')).toBeInTheDocument(); // header
      expect(screen.getByRole('navigation')).toBeInTheDocument(); // nav
      expect(screen.getByRole('main')).toBeInTheDocument(); // main
      expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // footer
    });
  });

  describe('Navigation', () => {
    it('displays all main navigation items', () => {
      renderWithProviders(<AppLayout {...defaultProps} />);
      
      const nav = screen.getByRole('navigation');
      expect(within(nav).getByText(/calculator/i)).toBeInTheDocument();
      expect(within(nav).getByText(/guide/i)).toBeInTheDocument();
      expect(within(nav).getByText(/help/i)).toBeInTheDocument();
      expect(within(nav).getByText(/about/i)).toBeInTheDocument();
    });

    it('shows brand/logo link', () => {
      renderWithProviders(<AppLayout {...defaultProps} />);
      
      const brandLink = screen.getByRole('link', { name: /CGT Tax Calculator/i });
      expect(brandLink).toBeInTheDocument();
      expect(brandLink).toHaveAttribute('href', '/');
    });

    it('highlights active navigation item', () => {
      renderWithProviders(<AppLayout {...defaultProps} currentPath="/calculator" />);
      
      // Find the navigation link within the desktop nav specifically
      const desktopNav = screen.getByTestId('desktop-nav');
      const calculatorLink = within(desktopNav).getByRole('link', { name: 'Calculator' });
      expect(calculatorLink).toHaveClass('active');
    });
  });

  describe('Mobile Navigation', () => {
    it('renders mobile hamburger menu button', () => {
      renderWithProviders(<AppLayout {...defaultProps} />);
      
      const mobileToggle = screen.getByRole('button', { name: /toggle navigation/i });
      expect(mobileToggle).toBeInTheDocument();
      expect(mobileToggle).toHaveAttribute('aria-expanded', 'false');
    });

    it('toggles mobile menu when hamburger is clicked', async () => {
      const { user } = renderWithProviders(<AppLayout {...defaultProps} />);
      
      const mobileToggle = screen.getByRole('button', { name: /toggle navigation/i });
      
      // Initially collapsed
      expect(mobileToggle).toHaveAttribute('aria-expanded', 'false');
      
      // Click to expand
      await user.click(mobileToggle);
      expect(mobileToggle).toHaveAttribute('aria-expanded', 'true');
      
      // Click to collapse
      await user.click(mobileToggle);
      expect(mobileToggle).toHaveAttribute('aria-expanded', 'false');
    });

    it('shows mobile navigation menu items when expanded', async () => {
      const { user } = renderWithProviders(<AppLayout {...defaultProps} />);
      
      const mobileToggle = screen.getByRole('button', { name: /toggle navigation/i });
      await user.click(mobileToggle);
      
      // Check that navigation items are visible
      const mobileNav = screen.getByTestId('mobile-nav-menu');
      expect(mobileNav).toBeVisible();
      expect(within(mobileNav).getByText(/calculator/i)).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('applies correct CSS classes for responsive layout', () => {
      const { container } = renderWithProviders(<AppLayout {...defaultProps} />);
      
      // Check for Bootstrap responsive classes
      const header = container.querySelector('header');
      expect(header).toHaveClass('navbar');
      
      const mainContent = screen.getByRole('main');
      expect(mainContent).toHaveClass('container-fluid');
    });

    it('handles different screen sizes appropriately', () => {
      renderWithProviders(<AppLayout {...defaultProps} />);
      
      // Desktop navigation should be visible
      const desktopNav = screen.getByTestId('desktop-nav');
      expect(desktopNav).toBeInTheDocument();
      
      // Mobile toggle should be present but may be hidden via CSS
      const mobileToggle = screen.getByRole('button', { name: /toggle navigation/i });
      expect(mobileToggle).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('passes accessibility audit', async () => {
      const { container } = renderWithProviders(<AppLayout {...defaultProps} />);
      await testAccessibility(container);
    });

    it('has proper ARIA labels', () => {
      renderWithProviders(<AppLayout {...defaultProps} />);
      
      expect(screen.getByLabelText(/main navigation/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /toggle navigation/i })).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const { user } = renderWithProviders(<AppLayout {...defaultProps} />);
      
      // Tab through navigation items
      await user.tab();
      expect(screen.getByRole('link', { name: /CGT Tax Calculator/i })).toHaveFocus();
      
      // Skip hamburger button (only visible on mobile) and go to first nav link
      await user.tab();
      await user.tab();
      const desktopNav = screen.getByTestId('desktop-nav');
      const calculatorLink = within(desktopNav).getByRole('link', { name: 'Calculator' });
      expect(calculatorLink).toHaveFocus();
    });

    it('has proper heading hierarchy', () => {
      renderWithProviders(<AppLayout {...defaultProps} />);
      
      // Should have brand as h1 or proper heading structure
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });
  });

  describe('Footer', () => {
    it('displays copyright information', () => {
      renderWithProviders(<AppLayout {...defaultProps} />);
      
      expect(screen.getByText(/© 2024 CGT Tax Calculator/i)).toBeInTheDocument();
    });

    it('displays footer navigation links', () => {
      renderWithProviders(<AppLayout {...defaultProps} />);
      
      const footer = screen.getByRole('contentinfo');
      expect(within(footer).getByText(/privacy policy/i)).toBeInTheDocument();
      expect(within(footer).getByText(/terms of service/i)).toBeInTheDocument();
      expect(within(footer).getByText(/contact/i)).toBeInTheDocument();
    });

    it('footer links are functional', () => {
      renderWithProviders(<AppLayout {...defaultProps} />);
      
      const privacyLink = screen.getByRole('link', { name: /privacy policy/i });
      expect(privacyLink).toHaveAttribute('href', '/privacy');
      
      const termsLink = screen.getByRole('link', { name: /terms of service/i });
      expect(termsLink).toHaveAttribute('href', '/terms');
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner when isLoading prop is true', () => {
      renderWithProviders(<AppLayout {...defaultProps} isLoading={true} />);
      
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByLabelText(/loading/i)).toBeInTheDocument();
    });

    it('hides main content when loading', () => {
      renderWithProviders(<AppLayout {...defaultProps} isLoading={true} />);
      
      const mainContent = screen.queryByTestId('main-content');
      expect(mainContent).not.toBeInTheDocument();
    });
  });

  describe('Error Boundary', () => {
    it('displays error message when child component throws', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      renderWithProviders(
        <AppLayout>
          <ThrowError />
        </AppLayout>
      );
      
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });
});