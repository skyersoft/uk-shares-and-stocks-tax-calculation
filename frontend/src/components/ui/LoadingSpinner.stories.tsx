import type { Meta, StoryObj } from '@storybook/react';
import { LoadingSpinner } from './LoadingSpinner';

const meta: Meta<typeof LoadingSpinner> = {
  title: 'UI Components/Feedback/LoadingSpinner',
  component: LoadingSpinner,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
The LoadingSpinner component provides visual feedback during loading states. Built with Bootstrap spinner utilities, it supports multiple variants, sizes, colors, and positioning options.

## Features
- **Multiple Variants**: Border spinner (default) and grow spinner animations
- **Size Options**: Small, medium (default), and large sizes  
- **Color Themes**: All Bootstrap color variants (primary, secondary, success, danger, warning, info, light, dark)
- **Flexible Positioning**: Centered, inline, and block display options
- **Accessibility**: Proper ARIA attributes and screen reader support
- **Customizable Text**: Custom loading messages and visible labels
- **Bootstrap Integration**: Uses Bootstrap spinner classes and utilities

## Usage
Perfect for indicating loading states during data fetching, form submissions, file uploads, or any asynchronous operations in the tax calculator application.
        `
      }
    }
  },
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Spinner size variant'
    },
    variant: {
      control: { type: 'select' },
      options: ['border', 'grow'],
      description: 'Animation type - border spinner or grow effect'
    },
    color: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'],
      description: 'Bootstrap color theme'
    },
    text: {
      control: { type: 'text' },
      description: 'Screen reader text (hidden visually)'
    },
    label: {
      control: { type: 'text' },
      description: 'Visible label text displayed next to spinner'
    },
    centered: {
      control: { type: 'boolean' },
      description: 'Center the spinner in its container'
    },
    inline: {
      control: { type: 'boolean' },
      description: 'Display spinner inline with other content'
    },
    className: {
      control: { type: 'text' },
      description: 'Additional CSS classes'
    }
  }
};

export default meta;
type Story = StoryObj<typeof LoadingSpinner>;

// Basic Examples
export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Default loading spinner with medium size and border animation.'
      }
    }
  }
};

export const WithLabel: Story = {
  args: {
    label: 'Loading...'
  },
  parameters: {
    docs: {
      description: {
        story: 'Spinner with visible label text displayed next to the animation.'
      }
    }
  }
};

export const Centered: Story = {
  args: {
    centered: true,
    text: 'Processing your request...'
  },
  parameters: {
    docs: {
      description: {
        story: 'Centered spinner useful for full-width loading states.'
      }
    }
  },
  decorators: [
    (Story) => (
      <div style={{ width: '400px', height: '200px', border: '1px dashed #ccc' }}>
        <Story />
      </div>
    )
  ]
};

// Size Variants
export const Sizes: Story = {
  render: () => (
    <div className="d-flex align-items-center gap-4">
      <div className="text-center">
        <LoadingSpinner size="sm" />
        <div className="mt-2 small">Small</div>
      </div>
      <div className="text-center">
        <LoadingSpinner size="md" />
        <div className="mt-2 small">Medium</div>
      </div>
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <div className="mt-2 small">Large</div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Available size variants: small, medium (default), and large.'
      }
    }
  }
};

// Animation Variants
export const Variants: Story = {
  render: () => (
    <div className="d-flex align-items-center gap-4">
      <div className="text-center">
        <LoadingSpinner variant="border" color="primary" />
        <div className="mt-2 small">Border</div>
      </div>
      <div className="text-center">
        <LoadingSpinner variant="grow" color="primary" />
        <div className="mt-2 small">Grow</div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Two animation types: border spinner (rotating border) and grow spinner (pulsing effect).'
      }
    }
  }
};

// Color Variants
export const Colors: Story = {
  render: () => (
    <div className="d-flex flex-wrap gap-3">
      {['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'].map((color) => (
        <div key={color} className="text-center">
          <LoadingSpinner 
            color={color as any} 
            className={color === 'light' ? 'border' : ''}
          />
          <div className="mt-2 small text-capitalize">{color}</div>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All Bootstrap color variants available for theming the spinner.'
      }
    }
  },
  decorators: [
    (Story) => (
      <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
        <Story />
      </div>
    )
  ]
};

// Positioning Examples
export const Positioning: Story = {
  render: () => (
    <div className="vstack gap-4">
      <div>
        <h6>Inline Spinner</h6>
        <p>
          Loading data <LoadingSpinner size="sm" inline text="Loading inline content" /> please wait...
        </p>
      </div>
      
      <div>
        <h6>Block Spinner</h6>
        <LoadingSpinner label="Processing..." />
      </div>
      
      <div style={{ height: '100px', border: '1px dashed #ccc', position: 'relative' }}>
        <h6>Centered Spinner</h6>
        <LoadingSpinner centered label="Loading content..." />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different positioning options: inline with text, block level, and centered in container.'
      }
    }
  }
};

// Tax Calculator Use Cases
export const TaxCalculationLoading: Story = {
  args: {
    text: 'Calculating capital gains tax...',
    label: 'Tax Calculation in Progress',
    color: 'primary',
    size: 'lg',
    centered: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state for tax calculations with appropriate messaging and styling.'
      }
    }
  },
  decorators: [
    (Story) => (
      <div className="card p-4" style={{ width: '400px' }}>
        <div className="card-body text-center">
          <h5 className="card-title mb-4">IBKR Tax Calculator</h5>
          <Story />
          <p className="text-muted mt-3 small">
            This may take a few moments depending on the number of transactions...
          </p>
        </div>
      </div>
    )
  ]
};

export const DataImportLoading: Story = {
  args: {
    text: 'Importing transaction data from CSV file...',
    variant: 'grow',
    color: 'success',
    inline: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state for data import operations with success color theme.'
      }
    }
  },
  decorators: [
    (Story) => (
      <div className="alert alert-info d-flex align-items-center">
        <Story />
        <span className="ms-2">Processing your IBKR data file...</span>
      </div>
    )
  ]
};

export const ReportGenerationLoading: Story = {
  args: {
    text: 'Generating tax report...',
    label: 'Preparing Your Report',
    color: 'warning',
    size: 'md'
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state during report generation with warning color to indicate processing.'
      }
    }
  },
  decorators: [
    (Story) => (
      <div className="card">
        <div className="card-header bg-warning bg-opacity-10">
          <h6 className="card-title mb-0">Tax Report Generator</h6>
        </div>
        <div className="card-body text-center py-5">
          <Story />
          <div className="mt-3">
            <div className="progress" style={{ height: '4px' }}>
              <div className="progress-bar bg-warning" role="progressbar" style={{ width: '65%' }}></div>
            </div>
            <small className="text-muted d-block mt-2">Step 2 of 3: Calculating tax liability</small>
          </div>
        </div>
      </div>
    )
  ]
};

// Advanced Examples
export const MultipleSpinners: Story = {
  render: () => (
    <div className="row g-3">
      <div className="col-md-4">
        <div className="card h-100">
          <div className="card-body text-center">
            <LoadingSpinner color="primary" />
            <h6 className="mt-3">Loading Trades</h6>
            <small className="text-muted">Fetching transaction history...</small>
          </div>
        </div>
      </div>
      <div className="col-md-4">
        <div className="card h-100">
          <div className="card-body text-center">
            <LoadingSpinner color="success" variant="grow" />
            <h6 className="mt-3">Loading Dividends</h6>
            <small className="text-muted">Processing dividend data...</small>
          </div>
        </div>
      </div>
      <div className="col-md-4">
        <div className="card h-100">
          <div className="card-body text-center">
            <LoadingSpinner color="info" size="sm" />
            <h6 className="mt-3">Loading Rates</h6>
            <small className="text-muted">Fetching exchange rates...</small>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Multiple spinners for different loading states in a complex interface.'
      }
    }
  }
};

export const CustomStyling: Story = {
  args: {
    text: 'Custom styled spinner',
    label: 'Custom Theme',
    className: 'custom-spinner',
    style: {
      '--bs-primary': '#6f42c1',
      filter: 'drop-shadow(0 0 0.5rem rgba(111, 66, 193, 0.5))'
    } as any
  },
  parameters: {
    docs: {
      description: {
        story: 'Example of custom styling with CSS custom properties and effects.'
      }
    }
  },
  decorators: [
    (Story) => (
      <div>
        <style>{`
          .custom-spinner {
            --bs-primary-rgb: 111, 66, 193;
          }
        `}</style>
        <Story />
      </div>
    )
  ]
};

// Interactive Playground
export const Playground: Story = {
  args: {
    size: 'md',
    variant: 'border',
    color: 'primary',
    text: 'Loading...',
    label: '',
    centered: false,
    inline: false
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive playground to experiment with all LoadingSpinner properties. Use the controls panel to customize the component.'
      }
    }
  }
};