import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { About } from './About';

describe('About', () => {
  it('renders page heading', () => {
    render(<About />);
    
    expect(screen.getByRole('heading', { name: /about/i })).toBeInTheDocument();
  });

  it('displays mission statement', () => {
    render(<About />);
    
    expect(screen.getByRole('heading', { name: /our mission/i })).toBeInTheDocument();
    expect(screen.getByText(/simplify uk capital gains tax/i)).toBeInTheDocument();
  });

  it('shows key features section', () => {
    render(<About />);
    
    expect(screen.getByText(/key features/i)).toBeInTheDocument();
    expect(screen.getByText(/accurate calculations/i)).toBeInTheDocument();
    expect(screen.getByText(/multiple file formats/i)).toBeInTheDocument();
    expect(screen.getByText(/detailed reports/i)).toBeInTheDocument();
  });

  it('displays team information', () => {
    render(<About />);
    
    expect(screen.getByRole('heading', { name: /our team/i })).toBeInTheDocument();
    expect(screen.getByText(/tax experts/i)).toBeInTheDocument();
    expect(screen.getByText(/software engineers/i)).toBeInTheDocument();
  });

  it('shows technology stack', () => {
    render(<About />);
    
    expect(screen.getByText(/technology/i)).toBeInTheDocument();
    expect(screen.getByText(/react/i)).toBeInTheDocument();
    expect(screen.getByText(/typescript/i)).toBeInTheDocument();
  });

  it('includes contact information', () => {
    render(<About />);
    
    expect(screen.getByText(/get in touch/i)).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<About className="custom-about" />);
    
    expect(container.firstChild).toHaveClass('about-page', 'custom-about');
  });

  it('renders FAQ section', () => {
    render(<About />);
    
    expect(screen.getByText(/frequently asked questions/i)).toBeInTheDocument();
    expect(screen.getByText(/how accurate are the calculations/i)).toBeInTheDocument();
    expect(screen.getByText(/what file formats/i)).toBeInTheDocument();
  });

  it('displays security and privacy information', () => {
    render(<About />);
    
    expect(screen.getByText(/security & privacy/i)).toBeInTheDocument();
    expect(screen.getByText(/your data remains private/i)).toBeInTheDocument();
    expect(screen.getByText(/local processing/i)).toBeInTheDocument();
  });

  it('shows version and last updated information', () => {
    render(<About />);
    
    expect(screen.getByText(/version/i)).toBeInTheDocument();
    expect(screen.getByText(/last updated/i)).toBeInTheDocument();
  });
});