import type { Meta, StoryObj } from '@storybook/react';
import { FormField } from './FormField';
import { Input } from './Input';

const meta: Meta<typeof FormField> = {
  title: 'UI/FormField',
  component: FormField,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A FormField wrapper component that provides label, error display, help text, and proper accessibility attributes for form inputs.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Field label text'
    },
    required: {
      control: 'boolean',
      description: 'Whether the field is required'
    },
    error: {
      control: 'text',
      description: 'Error message to display'
    },
    helpText: {
      control: 'text',
      description: 'Help text to display below the input'
    },
    id: {
      control: 'text',
      description: 'Custom ID for the field (auto-generated if not provided)'
    },
    className: {
      control: 'text',
      description: 'Custom CSS class for the container'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic FormField Stories
export const Default: Story = {
  args: {
    label: 'Default Field',
    children: <Input placeholder="Enter text..." />
  },
};

export const WithoutLabel: Story = {
  args: {
    children: <Input placeholder="Field without label..." />
  },
};

export const Required: Story = {
  args: {
    label: 'Required Field',
    required: true,
    children: <Input placeholder="This field is required..." />
  },
};

export const WithHelpText: Story = {
  args: {
    label: 'Field with Help',
    helpText: 'This is some helpful information about this field.',
    children: <Input placeholder="Enter value..." />
  },
};

export const WithError: Story = {
  args: {
    label: 'Field with Error',
    error: 'This field is required and cannot be empty.',
    children: <Input placeholder="Enter value..." />
  },
};

export const RequiredWithError: Story = {
  args: {
    label: 'Required Field',
    required: true,
    error: 'Please enter a valid email address.',
    children: <Input type="email" placeholder="Enter email..." />
  },
};

export const WithHelpAndError: Story = {
  args: {
    label: 'Complex Field',
    required: true,
    helpText: 'Enter a strong password with at least 8 characters.',
    error: 'Password must contain at least one uppercase letter.',
    children: <Input type="password" placeholder="Enter password..." />
  },
};

// Different Input Types
export const EmailField: Story = {
  args: {
    label: 'Email Address',
    required: true,
    helpText: 'We\'ll never share your email with anyone else.',
    children: <Input type="email" placeholder="Enter email..." />
  },
};

export const NumberField: Story = {
  args: {
    label: 'Quantity',
    helpText: 'Enter the number of shares to purchase.',
    children: <Input type="number" placeholder="0" min="1" step="1" />
  },
};

export const DateField: Story = {
  args: {
    label: 'Transaction Date',
    required: true,
    children: <Input type="date" />
  },
};

export const PasswordField: Story = {
  args: {
    label: 'Password',
    required: true,
    helpText: 'Password must be at least 8 characters long.',
    children: <Input type="password" placeholder="Enter password..." />
  },
};

// Size Variations
export const SmallInput: Story = {
  args: {
    label: 'Small Input',
    children: <Input size="sm" placeholder="Small input..." />
  },
};

export const LargeInput: Story = {
  args: {
    label: 'Large Input',
    children: <Input size="lg" placeholder="Large input..." />
  },
};

// Tax Calculator Examples
export const SharesQuantityField: Story = {
  args: {
    label: 'Number of Shares',
    required: true,
    helpText: 'Enter the total number of shares for this transaction.',
    children: <Input type="number" placeholder="0" min="1" step="1" />
  },
  parameters: {
    docs: {
      description: {
        story: 'Example field for entering number of shares in the tax calculator.'
      }
    }
  }
};

export const PurchasePriceField: Story = {
  args: {
    label: 'Purchase Price per Share',
    required: true,
    helpText: 'Enter the price paid per share in your base currency.',
    children: <Input type="number" placeholder="0.00" min="0" step="0.01" />
  },
  parameters: {
    docs: {
      description: {
        story: 'Example field for entering purchase price in the tax calculator.'
      }
    }
  }
};

export const StockSymbolField: Story = {
  args: {
    label: 'Stock Symbol',
    required: true,
    helpText: 'Enter the ticker symbol (e.g., AAPL, MSFT).',
    children: <Input type="text" placeholder="e.g., AAPL" style={{ textTransform: 'uppercase' }} />
  },
  parameters: {
    docs: {
      description: {
        story: 'Example field for entering stock symbols in the tax calculator.'
      }
    }
  }
};

export const TransactionDateField: Story = {
  args: {
    label: 'Transaction Date',
    required: true,
    helpText: 'Select the date when the transaction occurred.',
    children: <Input type="date" />
  },
  parameters: {
    docs: {
      description: {
        story: 'Example field for selecting transaction dates in the tax calculator.'
      }
    }
  }
};

// Error States Examples
export const ValidationErrors: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '400px' }}>
      <FormField
        label="Required Field"
        required
        error="This field is required."
      >
        <Input placeholder="Enter value..." />
      </FormField>
      
      <FormField
        label="Email Validation"
        error="Please enter a valid email address."
      >
        <Input type="email" placeholder="Enter email..." />
      </FormField>
      
      <FormField
        label="Number Validation"
        error="Value must be greater than 0."
      >
        <Input type="number" placeholder="0" />
      </FormField>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Examples of form fields with various validation errors.'
      }
    }
  }
};

// Form Layout Example
export const LoginForm: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '400px' }}>
      <FormField
        label="Username"
        required
        helpText="Enter your username or email address."
      >
        <Input type="text" placeholder="Username or email" />
      </FormField>
      
      <FormField
        label="Password"
        required
        helpText="Password must be at least 8 characters."
      >
        <Input type="password" placeholder="Enter password" />
      </FormField>
      
      <FormField
        helpText="We'll remember your login for 30 days."
      >
        <label className="form-check">
          <input type="checkbox" className="form-check-input" />
          <span className="form-check-label">Remember me</span>
        </label>
      </FormField>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example of a complete login form using FormField components.'
      }
    }
  }
};

// Tax Calculator Form Example
export const TaxCalculatorForm: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '500px' }}>
      <FormField
        label="Stock Symbol"
        required
        helpText="Enter the ticker symbol for the stock."
      >
        <Input type="text" placeholder="e.g., AAPL" style={{ textTransform: 'uppercase' }} />
      </FormField>
      
      <div style={{ display: 'flex', gap: '1rem' }}>
        <FormField
          label="Shares"
          required
          helpText="Number of shares"
        >
          <Input type="number" placeholder="0" min="1" step="1" />
        </FormField>
        
        <FormField
          label="Price per Share"
          required
          helpText="Purchase price"
        >
          <Input type="number" placeholder="0.00" min="0" step="0.01" />
        </FormField>
      </div>
      
      <FormField
        label="Purchase Date"
        required
        helpText="When did you purchase these shares?"
      >
        <Input type="date" />
      </FormField>
      
      <FormField
        label="Sale Date"
        helpText="Leave empty if you haven't sold yet."
      >
        <Input type="date" />
      </FormField>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example of a form for entering stock transaction data in the tax calculator.'
      }
    }
  }
};