// Simple test to verify TypeScript AppLayout works
import { render, screen } from '@testing-library/react';
import AppLayout from './AppLayout';

describe('AppLayout TypeScript', () => {
  it('renders without crashing', () => {
    render(
      <AppLayout>
        <div>Test content</div>
      </AppLayout>
    );
    
    expect(screen.getByRole('banner')).toBeTruthy();
    expect(screen.getByRole('main')).toBeTruthy();
    expect(screen.getByRole('contentinfo')).toBeTruthy();
  });
});