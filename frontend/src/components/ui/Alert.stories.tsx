import type { Meta, StoryObj } from '@storybook/react';
import { Alert } from './Alert';

const meta: Meta<typeof Alert> = {
  title: 'UI/Alert',
  component: Alert,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Alert component for displaying important messages with Bootstrap styling, dismissible functionality, and icon support.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'],
      description: 'Alert styling variant'
    },
    title: {
      control: 'text',
      description: 'Alert title (optional)'
    },
    icon: {
      control: 'text',
      description: 'FontAwesome icon class (e.g., "fa-info-circle")'
    },
    dismissible: {
      control: 'boolean',
      description: 'Whether the alert can be dismissed'
    },
    className: {
      control: 'text',
      description: 'Custom CSS class'
    },
    onDismiss: { action: 'dismissed' }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic Alert Stories
export const Info: Story = {
  args: {
    variant: 'info',
    children: 'This is an informational alert message.',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'This is a success alert message.',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    children: 'This is a warning alert message.',
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'This is a danger alert message.',
  },
};

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'This is a primary alert message.',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'This is a secondary alert message.',
  },
};

export const Light: Story = {
  args: {
    variant: 'light',
    children: 'This is a light alert message.',
  },
};

export const Dark: Story = {
  args: {
    variant: 'dark',
    children: 'This is a dark alert message.',
  },
};

// Alert with Title
export const WithTitle: Story = {
  args: {
    variant: 'info',
    title: 'Information',
    children: 'This alert has a title that stands out from the message content.',
  },
};

// Alert with Icon
export const WithIcon: Story = {
  args: {
    variant: 'success',
    icon: 'fa-check-circle',
    children: 'This alert includes an icon to enhance the visual message.',
  },
};

// Alert with Title and Icon
export const WithTitleAndIcon: Story = {
  args: {
    variant: 'warning',
    title: 'Important Notice',
    icon: 'fa-exclamation-triangle',
    children: 'This alert has both a title and an icon for maximum impact.',
  },
};

// Dismissible Alerts
export const Dismissible: Story = {
  args: {
    variant: 'info',
    dismissible: true,
    children: 'This alert can be dismissed by clicking the close button.',
  },
};

export const DismissibleWithTitle: Story = {
  args: {
    variant: 'success',
    title: 'Well done!',
    dismissible: true,
    children: 'You successfully completed the task. This alert can be dismissed.',
  },
};

export const DismissibleComplete: Story = {
  args: {
    variant: 'success',
    title: 'Success!',
    icon: 'fa-check-circle',
    dismissible: true,
    children: 'This dismissible alert has a title, icon, and close button.',
  },
};

// Tax Calculator Examples
export const CalculationSuccess: Story = {
  args: {
    variant: 'success',
    title: 'Calculation Complete',
    icon: 'fa-calculator',
    dismissible: true,
    children: 'Your capital gains tax calculation has been completed successfully. You can view the results below.',
  },
  parameters: {
    docs: {
      description: {
        story: 'Example alert shown when tax calculation is completed successfully.'
      }
    }
  }
};

export const ValidationError: Story = {
  args: {
    variant: 'danger',
    title: 'Validation Error',
    icon: 'fa-exclamation-circle',
    children: 'Please correct the following errors before proceeding with the calculation.',
  },
  parameters: {
    docs: {
      description: {
        story: 'Example alert shown when form validation fails.'
      }
    }
  }
};

export const DataImportWarning: Story = {
  args: {
    variant: 'warning',
    title: 'Data Import Warning',
    icon: 'fa-exclamation-triangle',
    dismissible: true,
    children: 'Some transactions were not imported due to formatting issues. Please review the data and try again.',
  },
  parameters: {
    docs: {
      description: {
        story: 'Example alert shown when importing transaction data with warnings.'
      }
    }
  }
};

export const TaxYearInfo: Story = {
  args: {
    variant: 'info',
    title: 'Tax Year Information',
    icon: 'fa-info-circle',
    children: 'Calculations are based on the UK tax year (6 April to 5 April). Ensure your transaction dates fall within the correct tax year.',
  },
  parameters: {
    docs: {
      description: {
        story: 'Example informational alert about tax year considerations.'
      }
    }
  }
};

// Complex Content Examples
export const ComplexContent: Story = {
  args: {
    variant: 'warning',
    title: 'Important Information',
    icon: 'fa-info-circle',
    dismissible: true,
    children: (
      <>
        <p><strong>Please note:</strong> This calculation is for informational purposes only.</p>
        <ul>
          <li>Consult a tax professional for official advice</li>
          <li>Tax laws may have changed since this tool was last updated</li>
          <li>Individual circumstances may affect calculations</li>
        </ul>
        <p>For more information, visit the <a href="#" onClick={(e) => e.preventDefault()}>HMRC website</a>.</p>
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Example alert with complex HTML content including lists and links.'
      }
    }
  }
};

// All Variants Showcase
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '600px' }}>
      <Alert variant="primary">Primary alert message</Alert>
      <Alert variant="secondary">Secondary alert message</Alert>
      <Alert variant="success" icon="fa-check">Success alert with icon</Alert>
      <Alert variant="danger" icon="fa-times">Danger alert with icon</Alert>
      <Alert variant="warning" icon="fa-exclamation-triangle">Warning alert with icon</Alert>
      <Alert variant="info" icon="fa-info-circle">Info alert with icon</Alert>
      <Alert variant="light">Light alert message</Alert>
      <Alert variant="dark">Dark alert message</Alert>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Showcase of all available alert variants with and without icons.'
      }
    }
  }
};

// Dismissible Variants
export const DismissibleVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '600px' }}>
      <Alert variant="success" dismissible title="Success" icon="fa-check">
        Operation completed successfully!
      </Alert>
      <Alert variant="warning" dismissible title="Warning" icon="fa-exclamation-triangle">
        Please review the information carefully.
      </Alert>
      <Alert variant="danger" dismissible title="Error" icon="fa-times-circle">
        An error occurred while processing your request.
      </Alert>
      <Alert variant="info" dismissible title="Information" icon="fa-info-circle">
        Here's some helpful information for you.
      </Alert>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Examples of dismissible alerts with titles and icons.'
      }
    }
  }
};

// Usage in Forms
export const FormAlerts: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '500px' }}>
      <Alert variant="danger" icon="fa-exclamation-circle">
        <strong>Form Validation Failed:</strong> Please correct the errors below before submitting.
      </Alert>
      
      <div style={{ padding: '1rem', border: '1px solid #dee2e6', borderRadius: '0.375rem' }}>
        <p>Sample form would go here...</p>
      </div>
      
      <Alert variant="info" icon="fa-lightbulb">
        <strong>Tip:</strong> Use the auto-import feature to quickly add your transaction data from CSV files.
      </Alert>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Examples of how alerts might be used in form contexts.'
      }
    }
  }
};