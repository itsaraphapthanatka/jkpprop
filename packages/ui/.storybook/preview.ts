// Theme CSS variables (handoff tokens) + Tailwind utilities for stories.
import '@jkp/tokens/css';
import './preview.css';

import type { Preview } from '@storybook/react';

const preview: Preview = {
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'surface',
      values: [
        { name: 'surface', value: '#F9F8F5' },
        { name: 'card', value: '#FFFFFF' },
        { name: 'dark', value: '#0A0E0C' },
      ],
    },
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/i },
    },
    a11y: { test: 'todo' },
  },
};

export default preview;
