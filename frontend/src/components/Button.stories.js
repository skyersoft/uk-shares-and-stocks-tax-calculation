import { Button } from './Button';

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Components/Button',
  component: Button,
  parameters: {
    // Optional parameter to center the component in the Canvas
    layout: 'centered',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/react/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    backgroundColor: { control: 'color' },
    size: {
      control: { type: 'select' },
      options: ['small', 'medium', 'large'],
    },
    onClick: { action: 'clicked' },
  },
};

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args
export const Primary = {
  args: {
    primary: true,
    label: 'Calculate Tax',
  },
};

export const Secondary = {
  args: {
    label: 'Cancel',
  },
};

export const Large = {
  args: {
    size: 'large',
    label: 'Upload File',
    primary: true,
  },
};

export const Small = {
  args: {
    size: 'small',
    label: 'Delete',
  },
};

export const Loading = {
  args: {
    primary: true,
    label: 'Processing...',
    loading: true,
  },
};

export const Disabled = {
  args: {
    label: 'Disabled Button',
    disabled: true,
  },
};

export const WithIcon = {
  args: {
    primary: true,
    label: 'Download',
    icon: '📥',
  },
};