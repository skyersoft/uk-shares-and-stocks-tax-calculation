import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A comprehensive Button component with Bootstrap styling, multiple variants, sizes, loading states, and icon support.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark', 'link', 'outline-primary', 'outline-secondary'],
      description: 'Button styling variant'
    },
    size: {
      control: 'select', 
      options: ['sm', 'md', 'lg'],
      description: 'Button size'
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled'
    },
    loading: {
      control: 'boolean',
      description: 'Whether the button is in loading state'
    },
    type: {
      control: 'select',
      options: ['button', 'submit', 'reset'],
      description: 'Button type attribute'
    },
    icon: {
      control: 'text',
      description: 'FontAwesome icon class (e.g., "fa-home")'
    },
    iconPosition: {
      control: 'select',
      options: ['left', 'right'],
      description: 'Position of the icon relative to text'
    },
    onClick: { action: 'clicked' }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic Button Stories
export const Primary: Story = {
  args: {
    children: 'Primary Button',
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondary Button',
    variant: 'secondary',
  },
};

export const Success: Story = {
  args: {
    children: 'Success Button',
    variant: 'success',
  },
};

export const Danger: Story = {
  args: {
    children: 'Danger Button',
    variant: 'danger',
  },
};

// Size Variations
export const Small: Story = {
  args: {
    children: 'Small Button',
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    children: 'Medium Button',
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    children: 'Large Button',
    size: 'lg',
  },
};

// State Variations
export const Disabled: Story = {
  args: {
    children: 'Disabled Button',
    disabled: true,
  },
};

export const Loading: Story = {
  args: {
    children: 'Loading Button',
    loading: true,
  },
};

// Icon Variations
export const WithIconLeft: Story = {
  args: {
    children: 'Calculate Tax',
    icon: 'fa-calculator',
    iconPosition: 'left',
  },
};

export const WithIconRight: Story = {
  args: {
    children: 'Next Step',
    icon: 'fa-arrow-right',
    iconPosition: 'right',
  },
};

export const IconOnly: Story = {
  args: {
    icon: 'fa-times',
    'data-testid': 'close-button'
  },
  parameters: {
    docs: {
      description: {
        story: 'Button with only an icon, no text content.'
      }
    }
  }
};

// Outline Variants
export const OutlinePrimary: Story = {
  args: {
    children: 'Outline Primary',
    variant: 'outline-primary',
  },
};

export const OutlineSecondary: Story = {
  args: {
    children: 'Outline Secondary',
    variant: 'outline-secondary',
  },
};

// Link Variant
export const Link: Story = {
  args: {
    children: 'Link Button',
    variant: 'link',
  },
};

// Interactive Examples
export const InteractiveExample: Story = {
  args: {
    children: 'Calculate CGT',
    variant: 'primary',
    size: 'lg',
    icon: 'fa-calculator',
  },
  parameters: {
    docs: {
      description: {
        story: 'An example of how the button might be used in the CGT Tax Calculator application.'
      }
    }
  }
};

// All Variants Showcase
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="success">Success</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="warning">Warning</Button>
      <Button variant="info">Info</Button>
      <Button variant="light">Light</Button>
      <Button variant="dark">Dark</Button>
      <Button variant="link">Link</Button>
      <Button variant="outline-primary">Outline Primary</Button>
      <Button variant="outline-secondary">Outline Secondary</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Showcase of all available button variants.'
      }
    }
  }
};

// Size Comparison
export const SizeComparison: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comparison of different button sizes.'
      }
    }
  }
};