import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A flexible Input component with Bootstrap styling, validation states, and comprehensive type support.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search', 'date', 'time', 'datetime-local'],
      description: 'Input type'
    },
    size: {
      control: 'select', 
      options: ['sm', 'md', 'lg'],
      description: 'Input size'
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the input is disabled'
    },
    required: {
      control: 'boolean',
      description: 'Whether the input is required'
    },
    readOnly: {
      control: 'boolean',
      description: 'Whether the input is read-only'
    },
    isValid: {
      control: 'select',
      options: [undefined, true, false],
      description: 'Validation state'
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text'
    },
    defaultValue: {
      control: 'text',
      description: 'Default value for uncontrolled input'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic Input Stories
export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const WithValue: Story = {
  args: {
    defaultValue: 'Sample text',
    placeholder: 'Enter text...',
  },
};

// Type Variations
export const Email: Story = {
  args: {
    type: 'email',
    placeholder: 'Enter email...',
  },
};

export const Password: Story = {
  args: {
    type: 'password',
    placeholder: 'Enter password...',
  },
};

export const Number: Story = {
  args: {
    type: 'number',
    placeholder: 'Enter number...',
    min: '0',
    max: '100',
  },
};

export const Search: Story = {
  args: {
    type: 'search',
    placeholder: 'Search...',
  },
};

export const Date: Story = {
  args: {
    type: 'date',
  },
};

// Size Variations
export const Small: Story = {
  args: {
    size: 'sm',
    placeholder: 'Small input...',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
    placeholder: 'Medium input...',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    placeholder: 'Large input...',
  },
};

// Validation States
export const Valid: Story = {
  args: {
    placeholder: 'Valid input...',
    isValid: true,
    defaultValue: 'Valid text',
  },
};

export const Invalid: Story = {
  args: {
    placeholder: 'Invalid input...',
    isValid: false,
    defaultValue: 'Invalid text',
  },
};

export const Neutral: Story = {
  args: {
    placeholder: 'Neutral input...',
    isValid: undefined,
    defaultValue: 'Neutral text',
  },
};

// State Variations
export const Disabled: Story = {
  args: {
    placeholder: 'Disabled input...',
    disabled: true,
    defaultValue: 'Cannot edit this',
  },
};

export const ReadOnly: Story = {
  args: {
    placeholder: 'Read-only input...',
    readOnly: true,
    defaultValue: 'Read-only value',
  },
};

export const Required: Story = {
  args: {
    placeholder: 'Required input...',
    required: true,
  },
};

// Tax Calculator Examples
export const SharesQuantity: Story = {
  args: {
    type: 'number',
    placeholder: 'Number of shares...',
    min: '0',
    step: '1',
  },
  parameters: {
    docs: {
      description: {
        story: 'Input for entering number of shares in the tax calculator.'
      }
    }
  }
};

export const PurchasePrice: Story = {
  args: {
    type: 'number',
    placeholder: '0.00',
    min: '0',
    step: '0.01',
  },
  parameters: {
    docs: {
      description: {
        story: 'Input for entering purchase price with decimal support.'
      }
    }
  }
};

export const StockSymbol: Story = {
  args: {
    type: 'text',
    placeholder: 'e.g., AAPL',
    style: { textTransform: 'uppercase' },
  },
  parameters: {
    docs: {
      description: {
        story: 'Input for entering stock symbols, automatically uppercased.'
      }
    }
  }
};

export const TransactionDate: Story = {
  args: {
    type: 'date',
  },
  parameters: {
    docs: {
      description: {
        story: 'Date input for transaction dates in the tax calculator.'
      }
    }
  }
};

// Size Comparison
export const SizeComparison: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '300px' }}>
      <Input size="sm" placeholder="Small input" />
      <Input size="md" placeholder="Medium input" />
      <Input size="lg" placeholder="Large input" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comparison of different input sizes.'
      }
    }
  }
};

// Validation States Comparison
export const ValidationStates: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '300px' }}>
      <Input placeholder="Neutral state" />
      <Input placeholder="Valid state" isValid={true} defaultValue="Valid input" />
      <Input placeholder="Invalid state" isValid={false} defaultValue="Invalid input" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comparison of different validation states.'
      }
    }
  }
};

// Form Layout Example
export const FormExample: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '400px' }}>
      <div>
        <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Full Name *
        </label>
        <Input 
          id="name"
          type="text" 
          placeholder="Enter your full name"
          required
        />
      </div>
      <div>
        <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Email Address *
        </label>
        <Input 
          id="email"
          type="email" 
          placeholder="Enter your email"
          required
        />
      </div>
      <div>
        <label htmlFor="shares" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Number of Shares
        </label>
        <Input 
          id="shares"
          type="number" 
          placeholder="0"
          min="0"
          step="1"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example of inputs used in a form layout with labels.'
      }
    }
  }
};