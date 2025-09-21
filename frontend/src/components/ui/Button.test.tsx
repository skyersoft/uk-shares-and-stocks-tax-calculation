import React from 'react';
import { renderWithProviders } from '../../__tests__/utils/test-utils';
import { Button } from './Button';

describe('Button', () => {
  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      const { getByRole } = renderWithProviders(<Button>Click me</Button>);
      
      const button = getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Click me');
      expect(button).toHaveClass('btn', 'btn-primary');
      expect(button).not.toBeDisabled();
    });

    it('renders with custom className', () => {
      const { getByRole } = renderWithProviders(
        <Button className="custom-class">Test</Button>
      );
      
      const button = getByRole('button');
      expect(button).toHaveClass('btn', 'btn-primary', 'custom-class');
    });

    it('renders with data-testid', () => {
      const { getByTestId } = renderWithProviders(
        <Button data-testid="test-button">Test</Button>
      );
      
      expect(getByTestId('test-button')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    const variants = [
      'primary', 'secondary', 'success', 'danger', 'warning', 
      'info', 'light', 'dark', 'link', 'outline-primary', 'outline-secondary'
    ] as const;

    variants.forEach(variant => {
      it(`renders ${variant} variant correctly`, () => {
        const { getByRole } = renderWithProviders(
          <Button variant={variant}>Test</Button>
        );
        
        const button = getByRole('button');
        expect(button).toHaveClass(`btn-${variant}`);
      });
    });
  });

  describe('Sizes', () => {
    it('renders small size', () => {
      const { getByRole } = renderWithProviders(
        <Button size="sm">Small</Button>
      );
      
      expect(getByRole('button')).toHaveClass('btn-sm');
    });

    it('renders medium size (default)', () => {
      const { getByRole } = renderWithProviders(
        <Button size="md">Medium</Button>
      );
      
      const button = getByRole('button');
      expect(button).not.toHaveClass('btn-sm', 'btn-lg');
    });

    it('renders large size', () => {
      const { getByRole } = renderWithProviders(
        <Button size="lg">Large</Button>
      );
      
      expect(getByRole('button')).toHaveClass('btn-lg');
    });
  });

  describe('States', () => {
    it('renders disabled state', () => {
      const { getByRole } = renderWithProviders(
        <Button disabled>Disabled</Button>
      );
      
      const button = getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled');
    });

    it('renders loading state', () => {
      const { getByRole, getByTestId } = renderWithProviders(
        <Button loading>Loading</Button>
      );
      
      const button = getByRole('button');
      expect(button).toBeDisabled();
      expect(getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('hides text when loading', () => {
      const { getByRole } = renderWithProviders(
        <Button loading>Click me</Button>
      );
      
      const button = getByRole('button');
      expect(button).not.toHaveTextContent('Click me');
    });
  });

  describe('Button Types', () => {
    it('renders submit type', () => {
      const { getByRole } = renderWithProviders(
        <Button type="submit">Submit</Button>
      );
      
      expect(getByRole('button')).toHaveAttribute('type', 'submit');
    });

    it('renders reset type', () => {
      const { getByRole } = renderWithProviders(
        <Button type="reset">Reset</Button>
      );
      
      expect(getByRole('button')).toHaveAttribute('type', 'reset');
    });

    it('defaults to button type', () => {
      const { getByRole } = renderWithProviders(
        <Button>Default</Button>
      );
      
      expect(getByRole('button')).toHaveAttribute('type', 'button');
    });
  });

  describe('Click Handling', () => {
    it('handles click events', async () => {
      const handleClick = jest.fn();
      const { getByRole, user } = renderWithProviders(
        <Button onClick={handleClick}>Click me</Button>
      );
      
      const button = getByRole('button');
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledWith(expect.any(Object));
    });

    it('does not handle clicks when disabled', async () => {
      const handleClick = jest.fn();
      const { getByRole, user } = renderWithProviders(
        <Button onClick={handleClick} disabled>Disabled</Button>
      );
      
      const button = getByRole('button');
      await user.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('does not handle clicks when loading', async () => {
      const handleClick = jest.fn();
      const { getByRole, user } = renderWithProviders(
        <Button onClick={handleClick} loading>Loading</Button>
      );
      
      const button = getByRole('button');
      await user.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Icon Support', () => {
    it('renders with icon on left (default)', () => {
      const { getByRole, getByTestId } = renderWithProviders(
        <Button icon="fa-home">Home</Button>
      );
      
      const button = getByRole('button');
      const icon = getByTestId('button-icon');
      
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('fa', 'fa-home');
      expect(button.firstChild).toBe(icon);
    });

    it('renders with icon on right', () => {
      const { getByRole, getByTestId } = renderWithProviders(
        <Button icon="fa-arrow-right" iconPosition="right">Next</Button>
      );
      
      const button = getByRole('button');
      const icon = getByTestId('button-icon');
      
      expect(icon).toBeInTheDocument();
      expect(button.lastChild).toBe(icon);
    });

    it('renders icon-only button', () => {
      const { getByRole, getByTestId } = renderWithProviders(
        <Button icon="fa-close" />
      );
      
      const button = getByRole('button');
      const icon = getByTestId('button-icon');
      
      expect(icon).toBeInTheDocument();
      expect(button).toHaveTextContent('');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      const { getByRole } = renderWithProviders(
        <Button disabled>Disabled Button</Button>
      );
      
      const button = getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('has proper ARIA attributes when loading', () => {
      const { getByRole } = renderWithProviders(
        <Button loading>Loading Button</Button>
      );
      
      const button = getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('supports focus', () => {
      const { getByRole } = renderWithProviders(
        <Button>Focusable</Button>
      );
      
      const button = getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });
  });
});