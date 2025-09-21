import type { Meta, StoryObj } from '@storybook/react';
import { Select } from './Select';

const sampleOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
];

const stockSymbols = [
  { value: 'AAPL', label: 'Apple Inc. (AAPL)' },
  { value: 'MSFT', label: 'Microsoft Corporation (MSFT)' },
  { value: 'GOOGL', label: 'Alphabet Inc. (GOOGL)' },
  { value: 'AMZN', label: 'Amazon.com Inc. (AMZN)' },
  { value: 'TSLA', label: 'Tesla Inc. (TSLA)' },
];

const currencies = [
  { value: 'USD', label: 'US Dollar (USD)' },
  { value: 'GBP', label: 'British Pound (GBP)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'CAD', label: 'Canadian Dollar (CAD)' },
  { value: 'AUD', label: 'Australian Dollar (AUD)' },
];

const countries = [
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
];

const optionsWithDisabled = [
  { value: 'available1', label: 'Available Option 1' },
  { value: 'disabled1', label: 'Disabled Option 1', disabled: true },
  { value: 'available2', label: 'Available Option 2' },
  { value: 'disabled2', label: 'Disabled Option 2', disabled: true },
  { value: 'available3', label: 'Available Option 3' },
];

const meta: Meta<typeof Select> = {
  title: 'UI/Select',
  component: Select,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A flexible Select component with Bootstrap styling, validation states, and comprehensive option support.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    options: {
      description: 'Array of options for the select dropdown'
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Select size'
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the select is disabled'
    },
    required: {
      control: 'boolean',
      description: 'Whether the select is required'
    },
    multiple: {
      control: 'boolean',
      description: 'Whether multiple selections are allowed'
    },
    isValid: {
      control: 'select',
      options: [undefined, true, false],
      description: 'Validation state'
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text for empty option'
    },
    defaultValue: {
      control: 'text',
      description: 'Default selected value for uncontrolled select'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic Select Stories
export const Default: Story = {
  args: {
    options: sampleOptions,
  },
};

export const WithPlaceholder: Story = {
  args: {
    options: sampleOptions,
    placeholder: 'Choose an option...',
  },
};

export const WithSelectedValue: Story = {
  args: {
    options: sampleOptions,
    defaultValue: 'option2',
  },
};

// Size Variations
export const Small: Story = {
  args: {
    options: sampleOptions,
    size: 'sm',
    placeholder: 'Small select...',
  },
};

export const Medium: Story = {
  args: {
    options: sampleOptions,
    size: 'md',
    placeholder: 'Medium select...',
  },
};

export const Large: Story = {
  args: {
    options: sampleOptions,
    size: 'lg',
    placeholder: 'Large select...',
  },
};

// Validation States
export const Valid: Story = {
  args: {
    options: sampleOptions,
    placeholder: 'Valid select...',
    isValid: true,
    defaultValue: 'option1',
  },
};

export const Invalid: Story = {
  args: {
    options: sampleOptions,
    placeholder: 'Invalid select...',
    isValid: false,
    defaultValue: 'option1',
  },
};

export const Neutral: Story = {
  args: {
    options: sampleOptions,
    placeholder: 'Neutral select...',
    isValid: undefined,
    defaultValue: 'option1',
  },
};

// State Variations
export const Disabled: Story = {
  args: {
    options: sampleOptions,
    placeholder: 'Disabled select...',
    disabled: true,
    defaultValue: 'option1',
  },
};

export const Required: Story = {
  args: {
    options: sampleOptions,
    placeholder: 'Required select...',
    required: true,
  },
};

export const WithDisabledOptions: Story = {
  args: {
    options: optionsWithDisabled,
    placeholder: 'Some options are disabled...',
  },
};

export const Multiple: Story = {
  args: {
    options: sampleOptions,
    multiple: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Select with multiple selection enabled. Hold Ctrl/Cmd to select multiple options.'
      }
    }
  }
};

// Tax Calculator Examples
export const StockSymbolSelect: Story = {
  args: {
    options: stockSymbols,
    placeholder: 'Select a stock...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Example select for choosing stock symbols in the tax calculator.'
      }
    }
  }
};

export const CurrencySelect: Story = {
  args: {
    options: currencies,
    placeholder: 'Select currency...',
    defaultValue: 'USD',
  },
  parameters: {
    docs: {
      description: {
        story: 'Example select for choosing currencies in the tax calculator.'
      }
    }
  }
};

export const CountrySelect: Story = {
  args: {
    options: countries,
    placeholder: 'Select country...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Example select for choosing countries for tax residence purposes.'
      }
    }
  }
};

// Size Comparison
export const SizeComparison: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '300px' }}>
      <Select options={sampleOptions} size="sm" placeholder="Small select" />
      <Select options={sampleOptions} size="md" placeholder="Medium select" />
      <Select options={sampleOptions} size="lg" placeholder="Large select" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comparison of different select sizes.'
      }
    }
  }
};

// Validation States Comparison
export const ValidationStates: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '300px' }}>
      <Select options={sampleOptions} placeholder="Neutral state" />
      <Select options={sampleOptions} placeholder="Valid state" isValid={true} defaultValue="option1" />
      <Select options={sampleOptions} placeholder="Invalid state" isValid={false} defaultValue="option1" />
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

// Form Integration Example
export const TaxCalculatorSelects: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '400px' }}>
      <div>
        <label htmlFor="stock" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Stock Symbol *
        </label>
        <Select 
          id="stock"
          options={stockSymbols}
          placeholder="Select stock..."
          required
        />
      </div>
      
      <div>
        <label htmlFor="currency" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Base Currency *
        </label>
        <Select 
          id="currency"
          options={currencies}
          placeholder="Select currency..."
          defaultValue="USD"
          required
        />
      </div>
      
      <div>
        <label htmlFor="country" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Tax Residence
        </label>
        <Select 
          id="country"
          options={countries}
          placeholder="Select country..."
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example of selects used in the tax calculator application with labels.'
      }
    }
  }
};

// Advanced Usage
export const MixedOptionTypes: Story = {
  args: {
    options: [
      { value: 1, label: 'Numeric Value 1' },
      { value: '2', label: 'String Value 2' },
      { value: 3.14, label: 'Float Value 3.14' },
      { value: 'text', label: 'Text Value' },
    ],
    placeholder: 'Mixed value types...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Select with mixed value types (numbers and strings).'
      }
    }
  }
};

export const LongOptionsList: Story = {
  args: {
    options: [
      ...stockSymbols,
      { value: 'META', label: 'Meta Platforms Inc. (META)' },
      { value: 'NFLX', label: 'Netflix Inc. (NFLX)' },
      { value: 'NVDA', label: 'NVIDIA Corporation (NVDA)' },
      { value: 'AMD', label: 'Advanced Micro Devices (AMD)' },
      { value: 'INTC', label: 'Intel Corporation (INTC)' },
      { value: 'CSCO', label: 'Cisco Systems Inc. (CSCO)' },
      { value: 'ORCL', label: 'Oracle Corporation (ORCL)' },
    ],
    placeholder: 'Many stock options...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Select with a longer list of options to test scrolling behavior.'
      }
    }
  }
};