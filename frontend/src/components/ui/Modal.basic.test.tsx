import React from 'react';
import { render, screen } from '@testing-library/react';
import { Modal } from './Modal';

describe('Modal Component - Basic', () => {
  test('renders modal when isOpen is true', () => {
    render(
      <Modal isOpen={true} title="Test Modal">
        Test content
      </Modal>
    );
    
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  test('does not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} title="Test Modal">
        Test content
      </Modal>
    );
    
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
    expect(screen.queryByText('Test content')).not.toBeInTheDocument();
  });
});